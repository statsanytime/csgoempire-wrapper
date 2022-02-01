import CSGOEmpire from "../CSGOEmpire";
import Item from "./Item";

export default class DepositItem extends Item {
    asset_id: number;
    deposit_id?: number;
    context_id: number;
    customname: String;
    defindex: number;
    description_type: String;
    inspect_key: String;
    invalid: String;
    killeaterscoretype: String;
    killeatervalue: number;
    name_color: String;
    origin: String;
    paintwear: number;
    position: String;
    quality: number;
    rarity: String;
    type: String;

    constructor(data, csgoempireInstance: CSGOEmpire) {
        super(data, csgoempireInstance);

        this.asset_id = data.asset_id;
        this.context_id = data.context_id;
        this.customname = data.customname;
        this.defindex = data.defindex;
        this.description_type = data.description_type;
        this.inspect_key = data.inspect_key;
        this.invalid = data.invalid;
        this.killeaterscoretype = data.killeaterscoretype;
        this.killeatervalue = data.killeatervalue;
        this.name_color = data.name_color;
        this.origin = data.origin;
        this.paintwear = data.paintwear;
        this.position = data.position;
        this.quality = data.quality;
        this.rarity = data.rarity;
        this.type = data.type;
        this.deposit_id = data.deposit_id;
    }

    async deposit(custom_price_percentage: number = 0) {
        if (custom_price_percentage) {
            this.custom_price_percentage = custom_price_percentage;
        }

        let deposit = await this.csgoempireInstance.makeDeposit(this);

        if (deposit.success) {
            this.deposit_id = deposit.id;

            return deposit;
        }
    }

    depositForValue(value: number) {
        let custom_price_percentage = ((value / this.market_value) - 1) * 100;

        return this.deposit(Math.round(custom_price_percentage));
    }

    cancel() {
        return this.csgoempireInstance.cancelDeposit(this.deposit_id);
    }

    sellNow() {
        return this.csgoempireInstance.sellDepositNow(this.deposit_id);
    }
}
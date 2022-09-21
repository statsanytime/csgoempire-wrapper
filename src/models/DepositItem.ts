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
    deposit_value: number;
    deposit_percentage: number;

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

    get base_price() {
        return this.market_value / (1 + (this.custom_price_percentage / 100));
    }

    async deposit() {
        let deposit = await this.csgoempireInstance.makeDeposit(this);

        if (deposit.success) {
            this.deposit_id = deposit.id;

            return deposit;
        }
    }

    depositForValue(value: number) {
        this.setDepositValue(value);

        return this.deposit();
    }

    setDepositValue(value: number) {
        this.deposit_value = value;

        return this;
    }

    setDepositPercentage(percentage: number) {
        this.deposit_value = this.base_price * (1 + (percentage / 100));
        this.deposit_percentage = percentage;

        return this;
    }

    cancel() {
        return this.csgoempireInstance.cancelDeposit(this.deposit_id);
    }

    sellNow() {
        return this.csgoempireInstance.sellDepositNow(this.deposit_id);
    }

    cancellable() {
        // Item is in processing state and auction has ended OR no bids have been placed
        return this.status == 2 && (this.auction_ends_at < new Date() || this.auction_number_of_bids == 0);
    }
}
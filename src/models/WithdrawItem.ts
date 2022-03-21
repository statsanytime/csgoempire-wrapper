import CSGOEmpire from "../CSGOEmpire";
import Item from "./Item";

export default class WithdrawItem extends Item {
    custom_name: String;
    name_color: String;
    published_at: Date;

    constructor(data, csgoempireInstance: CSGOEmpire) {
        super(data, csgoempireInstance);

        this.custom_name = data.custom_name;
        this.name_color = data.name_color;
        this.published_at = new Date(data.published_at);
    }

    withdraw() {
        return this.csgoempireInstance.makeWithdrawal(this.id);
    }

    bid(amount?: number) {
        if (!amount) {
            amount = this.auction_highest_bid * 1.01;

            // Round to the nearest cent
            amount = Math.ceil(amount * 100) / 100;
        }

        return this.csgoempireInstance.placeBid(this.id, amount);
    }
}
import CSGOEmpire from "../CSGOEmpire";
import Item from "./Item";

export default class WithdrawItem extends Item {
    auction_auto_withdraw_failed: Boolean;
    auction_ends_at: Date;
    auction_highest_bid: number;
    auction_highest_bidder: number;
    auction_number_of_bids: number;
    custom_name: String;
    name_color: String;
    published_at: Date;

    constructor(data, csgoempireInstance: CSGOEmpire) {
        super(data, csgoempireInstance);

        this.auction_auto_withdraw_failed = data.auction_auto_withdraw_failed;
        this.auction_ends_at = new Date(data.auction_ends_at);
        this.auction_highest_bid = data.auction_highest_bid / 100;
        this.auction_highest_bidder = data.auction_highest_bidder;
        this.auction_number_of_bids = data.auction_number_of_bids;
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
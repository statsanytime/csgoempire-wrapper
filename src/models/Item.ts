import CSGOEmpire from "../CSGOEmpire";
import { EventEmitter } from 'events';

export default class Item extends EventEmitter {
    app_id: number;
    auction_auto_withdraw_failed: Boolean;
    auction_ends_at: Date;
    auction_highest_bid: number;
    auction_highest_bidder: number;
    auction_number_of_bids: number;
    icon_url: String;
    id: number;
    market_name: String;
    market_value: number;
    name: String;
    updated_at: Date;
    paint_index: number;
    paint_seed: number;
    wear: number;
    is_commodity: Boolean;
    custom_price_percentage: number;
    tradable: Boolean;
    tradelock: Boolean;
    preview_id: String;
    price_is_unreliable: Boolean;
    status: number;

    csgoempireInstance: CSGOEmpire;

    constructor(data: any, csgoempireInstance: CSGOEmpire) {
        super();

        this.csgoempireInstance = csgoempireInstance;

        this.assignData(data);

        if (this.csgoempireInstance.connectToSocket) {
            this.listenForUpdates();
        }
    }

    assignData(data: any) {
        this.app_id = data.app_id;
        this.auction_auto_withdraw_failed = data.auction_auto_withdraw_failed;
        this.auction_ends_at = new Date(data.auction_ends_at * 1000);
        this.auction_highest_bid = data.auction_highest_bid / 100;
        this.auction_highest_bidder = data.auction_highest_bidder;
        this.auction_number_of_bids = data.auction_number_of_bids;
        this.icon_url = data.icon_url;
        this.id = data.id;
        this.market_name = data.market_name;
        this.market_value = data.market_value / 100;
        this.name = data.name;
        this.updated_at = new Date(data.updated_at);
        this.paint_index = data.paint_index;
        this.paint_seed = data.paint_seed;
        this.wear = data.wear;
        this.is_commodity = data.is_commodity;
        this.custom_price_percentage = data.custom_price_percentage;
        this.tradable = data.tradable;
        this.tradelock = data.tradelock;
        this.preview_id = data.preview_id;
        this.price_is_unreliable = data.price_is_unreliable;
        this.status = data.status;
    }

    listenForUpdates() {
        this.csgoempireInstance.tradingSocket.on('updated_item', (data: any) => {
            if (data.id === this.id) {
                this.assignData(data);

                this.emit('updated', data);
            }
        });
    }

    get market_value_cents() {
        return this.market_value * 100;
    }
}
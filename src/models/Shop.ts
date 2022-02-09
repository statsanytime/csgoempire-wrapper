import { EventEmitter } from "events";
import CSGOEmpire from "../CSGOEmpire";
import WithdrawItem from "./WithdrawItem";

export default class Shop extends EventEmitter {
    items: WithdrawItem[];
    csgoempireInstance: CSGOEmpire;
    addNewItems: boolean;

    constructor(items: WithdrawItem[], csgoempireInstance: CSGOEmpire, addNewItems: boolean) {
        super();

        this.items = items;
        this.csgoempireInstance = csgoempireInstance;
        this.addNewItems = addNewItems;

        if (this.csgoempireInstance.connectToSocket) {
            this.listenForEvents();
        }
    }

    listenForEvents() {
        this.csgoempireInstance.tradingSocket.on('new_item', (data: any) => {
            let item = new WithdrawItem(data, this.csgoempireInstance);

            if (this.addNewItems) {
                this.items.push(item);
            }

            this.emit('new-item', item);
        });

        this.csgoempireInstance.tradingSocket.on('deleted_item', (itemId: number) => {
            this.items = this.items.filter((item: WithdrawItem) => item.id !== itemId);
        })
    }
}
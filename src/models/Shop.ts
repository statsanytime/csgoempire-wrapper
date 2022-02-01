import CSGOEmpire from "../CSGOEmpire";
import WithdrawItem from "./WithdrawItem";

export default class Shop {
    items: WithdrawItem[];
    csgoempireInstance: CSGOEmpire;

    constructor(items: WithdrawItem[], csgoempireInstance: CSGOEmpire) {
        this.items = items;
        this.csgoempireInstance = csgoempireInstance;

        if (this.csgoempireInstance.socket) {
            this.listenForEvents();
        }
    }

    listenForEvents() {
        this.csgoempireInstance.socket.on('deleted_item', (itemId: number) => {
            this.items = this.items.filter((item: WithdrawItem) => item.id !== itemId);
        })
    }
}
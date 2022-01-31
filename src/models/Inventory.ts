import DepositItem from "./DepositItem.js";

export default class Inventory {
    items: DepositItem[];
    updatedAt: Date;

    constructor(items: DepositItem[], updatedAt: Date) {
        this.items = items;
        this.updatedAt = updatedAt;
    }
}
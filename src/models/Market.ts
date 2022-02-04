import { EventEmitter } from 'events';
import CSGOEmpire from "../CSGOEmpire";
import Selection from "./Selection";

export default class Market extends EventEmitter {
    id: number;
    name: string;
    winner: number;
    settled_at: Date;
    template: string;
    status: string;
    type: string;
    game_position: number;
    created_at: Date;
    updated_at: Date;
    selections: Selection[];

    csgoempireInstance: CSGOEmpire;

    constructor(data: any, csgoempireInstance: CSGOEmpire) {
        super();

        this.csgoempireInstance = csgoempireInstance;

        this.assignData(data);

        if (this.csgoempireInstance.connectToSocket) {
            this.listenForUpdates();
        }
    }

    listenForUpdates() {
        this.csgoempireInstance.matchbettingSocket.on('market_updated', (data: any) => {
            if (data.id === this.id) {
                Object.keys(data).forEach((key: string) => {
                    this[key] = data[key];
                });

                this.emit('updated', data);
            }
        });
    }

    assignData(data: any) {
        this.id = data.id;
        this.name = data.name;
        this.winner = data.winner;
        this.settled_at = new Date(data.settled_at);
        this.template = data.template;
        this.status = data.status;
        this.type = data.type;
        this.game_position = data.game_position;
        this.created_at = new Date(data.created_at);
        this.updated_at = new Date(data.updated_at);

        this.selections = data.selections.map(selection_data => {
            let selection = new Selection(selection_data, this.csgoempireInstance);

            selection.on('odds-updated', () => this.emit('odds-updated', selection));

            return selection;
        });
    }
}
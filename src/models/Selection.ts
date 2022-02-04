import { EventEmitter } from 'events';
import CSGOEmpire from "../CSGOEmpire";

export default class Selection extends EventEmitter {
    id: number;
    name: string;
    odds: number;
    position: number;
    result: string;
    is_winner: boolean;
    created_at: Date;
    updated_at: Date;

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
        this.csgoempireInstance.matchbettingSocket.on('selection_updated', (data: any) => {
            let prevOdds = this.odds;

            if (data.id === this.id) {
                Object.keys(data).forEach((key: string) => {
                    this[key] = data[key];
                });

                this.emit('updated', data);

                if (data.odds && data.odds !== prevOdds) {
                    this.emit('odds-updated', data.odds);
                }
            }
        });
    }

    assignData(data: any) {
        this.id = data.id;
        this.name = data.name;
        this.odds = data.odds;
        this.position = data.position;
        this.result = data.result;
        this.is_winner = data.is_winner;
        this.created_at = new Date(data.created_at);
        this.updated_at = new Date(data.updated_at);
    }
}
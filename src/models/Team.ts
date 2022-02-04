import CSGOEmpire from "../CSGOEmpire";
import { EventEmitter } from 'events';

export default class Team extends EventEmitter {
    id: number;
    name: string;
    slug: string;
    logo: string;
    created_at: Date;
    updated_at: Date;
    source: number;

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
        this.csgoempireInstance.matchbettingSocket.on('match_updated', (data: any) => {
            if (data.id === this.id) {
                Object.keys(data).forEach((key: string) => {
                    this[key] = data[key];
                });

                this.emit('updated', this);
            }
        });
    }

    assignData(data: any) {
        this.id = data.id;
        this.name = data.name;
        this.slug = data.slug;
        this.logo = data.logo;
        this.created_at = data.created_at;
        this.updated_at = data.updated_at;
        this.source = data.source;
    }
}
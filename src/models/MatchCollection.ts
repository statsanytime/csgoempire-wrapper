import { EventEmitter } from "events";
import CSGOEmpire from "../CSGOEmpire";
import Match from "./Match";

export default class MatchCollection extends EventEmitter {
    matches: Match[];
    csgoempireInstance: CSGOEmpire;

    constructor(matches: Match[], csgoempireInstance: CSGOEmpire) {
        super();

        this.matches = matches;
        this.csgoempireInstance = csgoempireInstance;

        if (this.csgoempireInstance.connectToSocket) {
            this.listenForEvents();
        }
    }

    listenForEvents() {
        this.csgoempireInstance.matchbettingSocket.on('match_created', (data: any) => {
            let match = new Match(data, this.csgoempireInstance);

            this.matches.push(match);
            this.emit('match-created', match);
        });
    }
}
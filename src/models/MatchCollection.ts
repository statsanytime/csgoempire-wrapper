import { EventEmitter } from "events";
import CSGOEmpire from "../CSGOEmpire";
import Match from "./Match";

export default class MatchCollection extends EventEmitter {
    matches: Match[];
    fetchedPages: number[];
    totalMatches: number;
    perPage: number;
    csgoempireInstance: CSGOEmpire;

    constructor(pagination: any, csgoempireInstance: CSGOEmpire) {
        super();

        this.matches = pagination.data.map((match: Object) => new Match(match, csgoempireInstance));
        this.fetchedPages = [pagination.current_page];
        this.totalMatches = pagination.total;
        this.perPage = pagination.per_page;
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

    async fetchRemainingMatches() {
        let totalPages = Math.ceil(this.totalMatches / this.perPage);
        let promises = [];

        for (let i = 1; i <= totalPages; i++) {
            if (this.fetchedPages.includes(i)) {
                continue;
            }

            promises.push(this.csgoempireInstance.getMatches(i, this.perPage));
        }

        let collections = await Promise.all(promises);

        collections.forEach((collection: MatchCollection) => {
            this.matches = this.matches.concat(collection.matches);
            this.fetchedPages = this.fetchedPages.concat(collection.fetchedPages);
        });

        return this;
    }
}
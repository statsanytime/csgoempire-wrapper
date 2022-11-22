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

        this.fetchedPages = [pagination.current_page];
        this.totalMatches = pagination.total;
        this.perPage = pagination.per_page;
        this.csgoempireInstance = csgoempireInstance;

        this.matches = Object.values(pagination.data.matches).map((match: Object) => this.unflattenMatch(match, pagination.data));

        if (this.csgoempireInstance.connectToSocket) {
            this.listenForEvents();
        }
    }

    unflattenMatch(match: any, data: any): Match {
        let markets = Object.values(data.markets).filter((market: any) => market.match_id === match.id).map((market: any) => {
            let selections = Object.values(data.selections).filter((selection: any) => selection.market_id === market.id);

            return {
                ...market,
                selections
            };
        });

        let teams = Object.values(data.teams).filter((team: any) => {
            return team.id === match.team1_id || team.id === match.team2_id;
        });

        return new Match({
            match,
            teams,
            markets,
        }, this.csgoempireInstance);
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
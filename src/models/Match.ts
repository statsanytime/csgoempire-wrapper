import CSGOEmpire from "../CSGOEmpire";
import { EventEmitter } from 'events';
import Team from "./Team";
import Market from "./Market";

export default class Match extends EventEmitter {
    id: number;
    game: string;
    status: string;
    format: string;
    event: string;
    additional_info: string;
    team1_id: number;
    team2_id: number;
    team1_scores: number;
    team2_scores: number;
    winner_team_id: number;
    live_available: boolean;
    live_link: string;
    cancelled_at: Date;
    start_at: Date;
    finished_at: Date;
    settled_at: Date;
    reason_for_cancellation: string;
    created_at: Date;
    updated_at: Date;
    match_url: string;
    primary_market_id: number;
    teams: Team[];
    markets: Market[];

    csgoempireInstance: CSGOEmpire;

    constructor({ match, teams, markets }: any, csgoempireInstance: CSGOEmpire) {
        super();

        this.csgoempireInstance = csgoempireInstance;

        this.assignData(match);

        this.teams = teams.map((team: any) => new Team(team, this.csgoempireInstance));

        this.markets = markets.map((market: Object) => new Market(market, this.csgoempireInstance));

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

        this.csgoempireInstance.matchbettingSocket.on('market_created', (data: any) => {
            if (data.match_id == this.id) {
                let market = new Market(data, this.csgoempireInstance);

                this.markets.push(market);
                this.emit('market-created', market);
            }
        })
    }

    assignData(data: any) {
        this.id = data.id;
        this.game = data.game;
        this.status = data.status;
        this.format = data.format;
        this.event = data.event;
        this.additional_info = data.additional_info;
        this.team1_id = data.team1_id;
        this.team2_id = data.team2_id;
        this.team1_scores = data.team1_scores;
        this.team2_scores = data.team2_scores;
        this.winner_team_id = data.winner_team_id;
        this.live_available = data.live_available;
        this.live_link = data.live_link;
        this.cancelled_at = new Date(data.cancelled_at);
        this.start_at = new Date(data.start_at);
        this.finished_at = new Date(data.finished_at);
        this.settled_at = new Date(data.settled_at);
        this.reason_for_cancellation = data.reason_for_cancellation;
        this.created_at = new Date(data.created_at);
        this.updated_at = new Date(data.updated_at);
        this.match_url = data.match_url;
        this.primary_market_id = data.primary_market_id;
    }
}
import axios, { AxiosInstance, AxiosRequestConfig } from "axios";
import io, { Socket } from 'socket.io-client';
import 'dotenv/config';

import Item from './models/Item';
import WithdrawItem from './models/WithdrawItem';
import DepositItem from './models/DepositItem';
import Inventory from "./models/Inventory";
import Shop from "./models/Shop";
import Match from "./models/Match";
import MatchCollection from "./models/MatchCollection";

type WithdrawalFilterOptions = {
    page?: number;
    per_page?: number;
    price_max_above?: number;
    sort?: String;
    order?: String;
    auction?: 'yes'|'no';
}

type Sockets = {
    trading?: Socket;
    matchbetting?: Socket;
}

type CSGOEmpireOptions = {
    baseApiUrl?: string;
    tradeSocketUrl?: string;
    matchSocketUrl?: string;
    connectToSocket?: boolean;
    origin?: string;
}

export default class CSGOEmpire {
    private apiKey: string;
    public baseApiUrl: string;
    public tradeSocketUrl: string;
    public matchSocketUrl: string;
    public axios: AxiosInstance;
    public sockets: Sockets;
    public connectToSocket: boolean;

    constructor(apiKey: string = null, options: CSGOEmpireOptions = {}) {
        const origin = options.origin ?? process.env.CSGOEMPIRE_WRAPPER_ORIGIN ?? 'csgoempire.com';

        options = {
            connectToSocket: true,
            baseApiUrl: `https://${origin}/api/v2`,
            tradeSocketUrl: `wss://trade.${origin}/trade`,
            matchSocketUrl: `wss://roulette.${origin}/matchbetting`,
            ...options,
        };

        this.apiKey = apiKey;
        this.baseApiUrl = options.baseApiUrl;
        this.tradeSocketUrl = options.tradeSocketUrl;
        this.matchSocketUrl = options.matchSocketUrl;
        this.connectToSocket = options.connectToSocket;

        this.axios = axios.create({
            baseURL: this.baseApiUrl,
            headers: {
                ...(this.apiKey && { 'Authorization': `Bearer ${this.apiKey}` }),
                'Content-Type': 'application/json'
            }
        });

        if (this.connectToSocket) {
            this.sockets = {};
        }
    }

    get tradingSocket() {
        if (this.sockets.trading) {
            return this.sockets.trading;
        }

        return this.connectAndAuthenticateSocket('trading', this.tradeSocketUrl, 'Trading');
    }

    get matchbettingSocket() {
        if (this.sockets.matchbetting) {
            return this.sockets.matchbetting;
        }

        return this.connectAndAuthenticateSocket('matchbetting', this.matchSocketUrl, 'Matchbetting');
    }

    connectAndAuthenticateSocket(key: string, url: string, name: string = key) {
        console.log(`👋 Connecting to ${name} socket...`);

        this.sockets[key] = io(url, {
            transports: ['websocket'],
            path: '/s',
            reconnection: true,
            reconnectionDelay: 1000,
            reconnectionDelayMax: 60000,
            extraHeaders: {
                "User-Agent": "Node.js Bot using API-key",
            },
        });

        this.sockets[key].on('error', (err) => console.error(err));
        this.sockets[key].on('connect_error', (err) => console.error(`There was an error connecting to the ${name} socket`, err));

        this.sockets[key].on('connect', async () => {
            if (this.apiKey) {
                console.log(`⚡️ ${name} socket connected. Authenticating...`);

                let metadata = await this.getSocketMetadata();

                this.sockets[key].emit('identify', {
                    uid: metadata.user.id,
                    model: metadata.user,
                    authorizationToken: metadata.socket_token,
                    signature: metadata.socket_signature
                });
            } else {
                console.log(`✅ ${name} socket connected.`);
            }
        });

        this.sockets[key].on('disconnect', () => {
            console.log(`🚨 ${name} socket disconnected.`);
        });

        this.sockets[key].on('reconnect', () => {
            console.log(`🎉 ${name} socket reconnected.`);
        });

        this.sockets[key].on('init', (data) => {
            if (data?.authenticated) {
                console.log(`✅ ${name} socket authenticated`);
            }
        });

        return this.sockets[key];
    }

    async getSocketMetadata() {
        let res = await this.get('/metadata/socket');

        return res.data;
    }

    async get(url: string, config?: AxiosRequestConfig<any>) {
        try {
            return await this.axios.get(url, config);
        } catch (err) {
            if (err.response?.data?.message) {
                throw new Error(err.response.data.message);
            }

            throw err;
        }
    }

    async post(url: string, data?: any, config?: AxiosRequestConfig<any>) {
        try {
            return await this.axios.post(url, data, config);
        } catch (err) {
            if (err.response?.data?.message) {
                throw new Error(err.response.data.message);
            }
            
            throw err;
        }
    }

    cancelDeposit(depositId: number) {
        return this.cancelDeposits([depositId])[depositId];
    }

    async cancelDeposits(depositIds: number[]) {
        const res = await this.post('/trading/deposit/cancel', {
            ids: depositIds,
        });

        return res.data;
    }

    makeDeposit(item: DepositItem) {
        return this.makeDeposits([item]);
    }

    async makeDeposits(items: DepositItem[]) {
        try {
            const res = await this.post(`/trading/deposit`, {
                items: items.map((item: DepositItem) => {
                    if (item.deposit_value) {
                        return {
                            id: item.id,
                            coin_value: item.deposit_value * 100,
                        };
                    }

                    if (item.deposit_percentage && item.deposit_value) {
                        return {
                            id: item.id,
                            custom_price_percentage: item.deposit_percentage,
                            coin_value: item.deposit_value,
                        };
                    }

                    throw new Error('You must provide either set a deposit value or both a deposit value and a deposit percentage for each item before it can be deposited.');
                }),
            });
    
            return res.data.deposits;
        } catch (err) {
            if (err.response?.data?.message) {
                throw new Error(err.response.data.message);
            }

            throw err;
        }
    }

    async makeWithdrawal(itemId: number, amount: number) {
        const res = await this.post(`/trading/deposit/${itemId}/withdraw`, {
            coin_value: Math.round(amount * 100),
        });

        return res.data;
    }

    async placeBid(itemId: number, amount: number) {
        const res = await this.post(`/trading/deposit/${itemId}/bid`, {
            bid_value: Math.round(amount * 100),
        });

        return res.data;
    }

    async queryWithdrawItems(options?: WithdrawalFilterOptions, addNewItems: boolean = false) {
        const res = await this.get('/trading/items', {
            params: {
                per_page: 160,
                page: 1,
                price_max_above: 15,
                sort: 'desc',
                order: 'market_value',
                ...options || {},
            }
        });

        return new Shop(
            res.data.data.map((item: Object) => new WithdrawItem(item, this)),
            this,
            addNewItems,
        );
    }

    async getInventory(include_untradable = true) {
        const res = await this.get('/trading/user/inventory', {
            params: {
                invalid: include_untradable ? 'yes' : 'no',
            }
        });

        return new Inventory(
            res.data.data.map((item: Object) => new DepositItem(item, this)),
            new Date(res.data.updatedAt),
        );
    }

    async getActiveTrades() {
        const res = await this.get('/trading/user/trades');

        return {
            deposits: res.data.data.deposits.map((deposit: any) => new DepositItem({
                ...deposit.item,
                market_value: deposit.item.market_value * 100,
                deposit_id: deposit.id,
                auction_highest_bid: deposit.metadata?.auction_highest_bid,
                auction_highest_bidder: deposit.metadata?.auction_highest_bidder,
                auction_number_of_bids: deposit.metadata?.auction_number_of_bids,
                auction_ends_at: deposit.metadata?.auction_ends_at,
                auction_auto_withdraw_failed: deposit.metadata?.auction_auto_withdraw_failed,
                status: deposit.status,
            }, this)),

            withdrawals: res.data.data.withdrawals.map((withdrawal: any) => new WithdrawItem({
                ...withdrawal.item,
                auction_highest_bid: withdrawal.metadata?.auction_highest_bid,
                auction_highest_bidder: withdrawal.metadata?.auction_highest_bidder,
                auction_number_of_bids: withdrawal.metadata?.auction_number_of_bids,
                auction_ends_at: withdrawal.metadata?.auction_ends_at,
                auction_auto_withdraw_failed: withdrawal.metadata?.auction_auto_withdraw_failed,
                status: withdrawal.status,
            }, this)),
        };
    }

    async getActiveAuctions() {
        const res = await this.get('/trading/user/auctions');

        return res.data.active_auctions.map((item: Object) => new WithdrawItem(item, this));
    }

    async updateSettings(settings: { steam_api_key?: string, trade_url: string }) {
        const res = await this.post('/trading/user/settings', settings);

        return res.data;
    }

    async sellDepositNow(itemId: number) {
        const res = await this.post(`/trading/deposit/${itemId}/sell`);

        return res.data;
    }

    async getMatches(page: number = 1, per_page: number = 100): Promise<MatchCollection> {
        const res = await this.get('/match-betting/flattened', {
            params: {
                page,
                per_page,
            }
        });

        return new MatchCollection(
            res.data,
            this,
        );
    }

    async getAllMatches(): Promise<MatchCollection> {
        let collection = await this.getMatches(1);

        await collection.fetchRemainingMatches();

        return collection;
    }
}
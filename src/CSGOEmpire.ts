import axios, { AxiosInstance, AxiosRequestConfig } from "axios";
import io, { Socket } from 'socket.io-client';

import Item from './models/Item';
import WithdrawItem from './models/WithdrawItem';
import DepositItem from './models/DepositItem';
import Inventory from "./models/Inventory";
import Shop from "./models/Shop";

type WithdrawalFilters = {
    page: number;
    per_page: number;
    price_max_above: number;
    sort: String;
    order: String;
    auction?: 'yes'|'no';
}

type CSGOEmpireOptions = {
    baseApiUrl?: string;
    tradeSocketUrl?: string;
    connectToSocket?: boolean;
}

export default class CSGOEmpire {
    private apiKey: string;
    public baseApiUrl: string;
    public tradeSocketUrl: string;
    public axios: AxiosInstance;
    public socket: Socket;

    constructor(apiKey: string, options: CSGOEmpireOptions = {}) {
        options = {
            connectToSocket: true,
            baseApiUrl: 'https://csgoempire.com/api/v2',
            tradeSocketUrl: 'wss://trade.csgoempire.com/trade',
            ...options,
        };

        this.apiKey = apiKey;
        this.baseApiUrl = options.baseApiUrl;
        this.tradeSocketUrl = options.tradeSocketUrl;

        this.axios = axios.create({
            baseURL: this.baseApiUrl,
            headers: {
                'Authorization': `Bearer ${this.apiKey}`,
                'Content-Type': 'application/json'
            }
        });

        if (options.connectToSocket) {
            this.establishSocketConnection();
        }
    }

    establishSocketConnection() {
        console.log('👋 Connecting to socket...');

        this.socket = io(this.tradeSocketUrl, {
            transports: ['websocket'],
            path: '/s',
            reconnection: true,
            reconnectionDelay: 1000,
            reconnectionDelayMax: 60000,
            extraHeaders: {
                "User-Agent": "Node.js Bot using API-key",
            },
        });

        this.socket.on('connect', () => {
            console.log('✅ Socket connected');
            this.authenticateSocket();
        });

        this.socket.on('error', (err) => console.error(err));
        this.socket.on('connect_error', (err) => console.error('There was an error connecting to the socket', err));
    }

    async authenticateSocket() {
        console.log('⚡️ Authenticating socket...');

        let metadata_res = await this.get('/metadata/socket');
        let metadata = metadata_res.data;

        this.socket.emit('identify', {
            uid: metadata.user.id,
            model: metadata.user,
            authorizationToken: metadata.socket_token,
            signature: metadata.socket_signature
        });

        console.log('✅ Socket authenticated');
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

    async cancelDeposit(itemId: number) {
        const res = await this.post(`/trading/deposit/${itemId}/cancel`);

        return res.data;
    }

    async makeDeposit(item: Item) {
        try {
            const res = await this.post(`/trading/deposit`, {
                items: [{
                    id: item.id,
                    custom_price_percentage: item.custom_price_percentage,
                    coin_value: item.market_value_cents,
                }]
            });
    
            return res.data.deposits;
        } catch (err) {
            if (err.response?.data?.message) {
                throw new Error(err.response.data.message);
            }

            throw err;
        }
    }

    async makeWithdrawal(itemId: number) {
        const res = await this.post(`/trading/deposit/${itemId}/withdraw`);

        return res.data;
    }

    async placeBid(itemId: number, amount: number) {
        const res = await this.post(`/trading/deposit/${itemId}/bid`, {
            bid_value: Math.round(amount * 100),
        });

        return res.data;
    }

    async queryWithdrawItems(options: WithdrawalFilters = { per_page: 160, page: 1, price_max_above: 15, sort: 'desc', order: 'market_value' }) {
        const res = await this.get('/trading/items', {
            params: options
        });

        return new Shop(
            res.data.data.map((item: Object) => new WithdrawItem(item, this)),
            this,
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
            deposits: res.data.deposits.map((item: Object) => new DepositItem(item, this)),
            withdrawals: res.data.withdrawals.map((item: Object) => new WithdrawItem(item, this)),
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
}
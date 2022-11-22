# Intuitive CSGOEmpire Wrapper
Easy-to-use package for interacting with the CSGOEmpire Trading API.

### Issues & Questions
Feel free to create a discussion in the repository if you've got a question. Any issues should be reported in the issues tab directly.

## Installation

```bash
npm install csgoempire-wrapper
```

## Getting Started

### Signing in and establishing socket connection

```js
// CommonJS
const { CSGOEmpire } = require('csgoempire-wrapper');

// ES6
import { CSGOEmpire } from 'csgoempire-wrapper';

// API-key can be created on https://csgoempire.com/trading/apikey
const account = new CSGOEmpire('YOUR_API_KEY');
```

On top of this, it's also possible to customize the account further by passing in a configuration object. These are the default options, but they can be customized as needed.
```js
new CSGOEmpire('YOUR_API_KEY', {
    connectToSocket: true,
    baseApiUrl: 'https://csgoempire.com/api/v2',
    tradeSocketUrl: 'wss://trade.csgoempire.com/trade',
    matchSocketUrl: 'wss://roulette.csgoempire.com/matchbetting',
})
```

## Usage

### Deposits

#### Making a deposit

```js
// Retrieve inventory
const inventory = await account.getInventory();

// Find the first item with a price above 10 coins
let item = inventory.items.find(item => item.market_value > 10);

// Deposit it for +25%
item.setDepositPercentage(25).deposit();
```

#### Cancel deposit

```js
// Cancel pending deposit
item.cancel();
```

#### Force sell deposit (during auction)

```js
// Sell to highest bidder
item.sellNow();
```

### Withdrawals
#### Making a withdrawal

```js
// Retrieve 160 first items on withdrawal page (automatically synced with websocket)
const shop = await account.queryWithdrawItems();

// Attempt to withdraw the first item on the page
shop.items[0].withdraw();
```

#### Placing a bid

```js
// Retrieve 160 first items on withdrawal page (automatically synced with websocket)
const shop = await account.queryWithdrawItems();

// Automatically places a bid for 1% higher than the current price
shop.items[0].bid();
```

### Get active trades
Returns an object containing DepositItems and WithdrawItems.

```js
// Retrive all active deposits/withdrawals
const trades = await account.getActiveTrades();

/* trades = {
    deposits: DepositItem[],
    withdrawals: WithdrawItem[],
} */
```

### Get active auctions
Returns an array of DepositItem objects.

```js
// Retrive all active deposits/withdrawals
const auctions = await account.getActiveAuctions();

// auctions = DepositItem[]
```

### Get upcoming and running matches
Returns an array of Match objects.

```js
// Retrive all active deposits/withdrawals
const matches = await account.getMatches();

// matches = Match[]
```

### Update tradelink & Steam API-key

```js
account.updateSettings({
    steam_api_key: 'YOUR_STEAM_API_KEY',
    trade_url: 'https://steamcommunity.com/tradeoffer/new/?partner=YOUR_STEAM_ID&token=YOUR_TRADELINK_TOKEN'
});
```

## Contributing
Pull requests are welcome! Please do your best to keep the code + commits clean and readable though.

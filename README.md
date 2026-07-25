# Repverse

Repverse is an explorer for the Stacks (STX) ecosystem — look up any wallet by
its BNS name or address to see NFTs, holdings, stacking rewards, and
transaction history. Compare wallets side by side, run a stake calculator,
and convert crypto in real time.

Built with **Express + EJS** (server-rendered, Linear-inspired dark UI),
**MongoDB** for accounts/watchlists, **Google OAuth** and **Stacks wallet
connect** for auth.

## 1. Install dependencies

```bash
npm install
```

## 2. Configure environment

Copy `.env.example` to `.env` and fill in the values:

```bash
cp .env.example .env
```

- `MONGODB_URI` — a local or Atlas MongoDB connection string. The app boots
  even without one connected, but auth/watchlist features need it.
- `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` — from the
  [Google Cloud Console](https://console.cloud.google.com/apis/credentials).
  Set the authorized redirect URI to match `GOOGLE_CALLBACK_URL`.
- `CMC_API_KEY` — a free key from [CoinMarketCap's API](https://coinmarketcap.com/api/)
  to power the `/converter` page with live rates. Without it, the converter UI
  still loads but shows a "not configured" message instead of live numbers.

## 3. Run it

```bash
npm start
# or, for auto-reload during development:
npm run dev
```

Visit `http://localhost:3000`.

## Project structure

```
server.js              — app entry point
config/db.js            — MongoDB connection
config/passport.js      — Google OAuth strategy
middleware/auth.js       — session/auth helpers
models/User.js           — Google + wallet accounts, watchlists
models/WalletLookup.js    — lookup cache/history
routes/                  — auth, pages, explorer, converter routes
services/stacksService.js — Stacks blockchain + BNS API calls
services/converterService.js — CoinMarketCap conversion calls
views/                   — EJS templates (Linear-style dark UI)
public/css/style.css      — design system + all page styles
public/js/main.js         — wallet connect, converter, calculator, copy-to-clipboard
public/img/               — logo mark, lockup, favicon (SVG)
```

## Notes on data sources

- Chain data (balances, NFTs, transactions, BNS) comes from the public
  [Hiro Stacks API](https://docs.hiro.so/api) — no key required.
- Currency conversion comes from the
  [CoinMarketCap API](https://coinmarketcap.com/api/) (same data source
  behind coinmarketcap.com/converter), which needs a free API key.
- Wallet connect uses [Stacks Connect](https://docs.hiro.so/stacks-connect),
  compatible with Leather, Xverse, and other Stacks wallets. It's loaded
  from a CDN only when someone clicks "Connect wallet."

## Design

- **Logo**: an orbiting-node ring around a monogram "R" — a nod to exploring
  a "verse" of wallets, in `public/img/logo-mark.svg` / `logo-lockup.svg` /
  `favicon.svg`.
- **Fade-in logo**: applied via the `.fade-in-logo` class (see `style.css`)
  on the nav and footer brand marks on every page.
- **UI**: dark, restrained, Linear-inspired — Inter for UI text, JetBrains
  Mono for addresses/data, a single violet accent (`#7B61FF`).

# Market Dashboard Skill

## Overview
Build a crypto market dashboard with CoinGecko API, tabs, pagination, search, favorites, and Bitcoin.com News.

## API Route: /api/market

```typescript
// Key points:
// - 5-minute server-side cache
// - CoinGecko /coins/markets endpoint
// - Stale fallback if API fails
// - Always return 200 with stable JSON
// - Use AbortController (not AbortSignal.timeout)

const ids = 'bitcoin,ethereum,verse-bitcoin,polygon-ecosystem-token';
const url = `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=100&page=1&sparkline=false&price_change_percentage=24h,7d`;

// Response shape:
{
  ok: boolean;
  source: 'coingecko';
  cached: boolean;
  stale: boolean;
  lastUpdated: string;
  page: number;
  perPage: number;
  total: number;
  hasMore: boolean;
  coins: CoinMarket[];
  error?: string;
}
```

## CoinGecko IDs (verified)
- Bitcoin: `bitcoin`
- Ethereum: `ethereum`
- VERSE: `verse-bitcoin` (NOT `verse`)
- POL/Polygon: `polygon-ecosystem-token` (NOT `matic-network`)

## Market UI Features
- Tabs: All Coins, Gainers, Losers, Favorites
- Search filter by name/symbol
- View More pagination (10 initial, +10 per click)
- Star toggle for favorites (localStorage)
- Desktop table + Mobile cards
- Stale/cache indicator
- Refresh button

## API Route: /api/news
```typescript
// Fetch Bitcoin.com News RSS
const res = await fetch('https://news.bitcoin.com/feed/');
// Parse XML, extract items
// Cache for 10 minutes
// Fallback: empty items with error message
```

## Verified Links
- CoinGecko: https://api.coingecko.com/api/v3/coins/markets
- Bitcoin.com News: https://news.bitcoin.com/
- Bitcoin.com News RSS: https://news.bitcoin.com/feed/
- POL docs: https://docs.polygon.technology/pos/concepts/tokens/pol
- VERSE DEX: https://verse.bitcoin.com/

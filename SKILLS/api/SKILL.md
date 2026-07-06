# API Routes Skill

## Overview
Server-side API routes for market data and news with caching and fallback.

## /api/market
```typescript
// src/app/api/market/route.ts
// - Fetch CoinGecko /coins/markets
// - 5-minute server cache
// - AbortController for timeout (not AbortSignal.timeout)
// - Stale fallback if API fails
// - Always return 200 with stable JSON
// - Normalize response to CoinMarket type
```

## /api/news
```typescript
// src/app/api/news/route.ts
// - Fetch Bitcoin.com News RSS feed
// - Parse XML with regex (no heavy parser needed)
// - 10-minute cache
// - Return { source, items: [{title, url, date, description}] }
// - Fallback: empty items with error message
```

## Key Patterns
- Never return non-JSON error to client
- Always have fallback data (even if prices are 0)
- Use `export const runtime = 'nodejs'` for server routes
- Use `export const dynamic = 'force-dynamic'` for dynamic data
- Cache in module-level variable (not Redis for small projects)

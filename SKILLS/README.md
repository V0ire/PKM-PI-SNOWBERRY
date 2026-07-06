# VERSE Website Skills Package

Complete knowledge base for building a premium Web3 landing page + Academy + Market dashboard.

## Structure

```
academy/          — Academy/docs-style learning platform
market/           — CoinGecko market dashboard with pagination
3d/               — React Three Fiber hero scene + orbiting coins
scroll-stories/   — Annotated orbital infographic scroll stories
wallet/           — Wagmi wallet connect + profile/XP system
api/              — Next.js API routes (market, news)
components/       — Shared UI components (TiltCard, MagneticButton, etc)
hooks/            — Custom React hooks (viewport, visibility, reduced motion)
deployment/       — Vercel deployment + GitHub push
```

## Tech Stack

- Next.js 15 (App Router)
- React 19
- TypeScript
- Tailwind CSS 3
- Framer Motion
- React Three Fiber + Drei
- Wagmi + Viem
- React Markdown + remark-gfm
- Lucide React icons

## Key Patterns

1. **No credentials in code** — use env vars for API keys
2. **Server-side API routes** — market/news fetched server-side with cache
3. **Viewport-aware animation** — pause offscreen, respect reduced-motion
4. **Mobile-first responsive** — compact mode for mobile, sticky for desktop
5. **Wallet-gated quizzes** — learning materials public, quiz requires wallet

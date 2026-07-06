# Wallet Connect Skill

## Overview
Implement wallet connection with Wagmi + Viem, profile/XP system, and Polygon network support.

## Dependencies
```bash
npm install wagmi viem @tanstack/react-query
```

## Web3Provider
```typescript
import { createConfig, http, WagmiProvider } from 'wagmi';
import { injected, walletConnect } from 'wagmi/connectors';
import { polygon } from '@/lib/chains';

const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || '';

const config = createConfig({
  chains: [polygon],
  connectors: [
    injected({ shimDisconnect: true }),
    ...(projectId ? [walletConnect({ projectId, showQrModal: true })] : []),
  ],
  transports: { [polygon.id]: http('https://polygon-rpc.com') },
});
```

## Chain Config
```typescript
// src/lib/chains.ts
import { defineChain } from 'viem';

export const polygon = defineChain({
  id: 137,
  name: 'Polygon',
  nativeCurrency: { name: 'POL', symbol: 'POL', decimals: 18 },
  rpcUrls: { default: { http: ['https://polygon-rpc.com'] } },
  blockExplorers: { default: { name: 'Polygonscan', url: 'https://polygonscan.com' } },
});
```

## WalletModal (via React Portal)
```typescript
import { createPortal } from 'react-dom';

// Render modal directly on document.body to avoid fixed-position bugs
// z-[9999], bg-black/80 backdrop-blur-xl
// Bottom sheet on mobile, centered on desktop
```

## Profile Panel
- Connected address (short format)
- Network status (Polygon ✓ or Switch button)
- XP total + level + progress bar
- Lessons completed + quizzes passed + streak
- MAX badge if all complete
- Copy address, View on Polygonscan, Disconnect

## XP System
```typescript
const XP_READ_LESSON = 20;
const XP_PASS_QUIZ = 100;
const LEVELS = [0, 200, 500, 900, 1400, 2000, 2700, 3500, 4400, 5400];

// Progress events for live UI updates
export function emitProgressUpdated(payload) {
  window.dispatchEvent(new CustomEvent('verse:progress-updated', { detail: payload }));
}
```

## Verified Links
- MetaMask: https://metamask.io/download/
- OKX Wallet: https://www.okx.com/download
- Bitget Wallet: https://web3.bitget.com/
- Rabby: https://rabby.io/
- Coinbase Wallet: https://www.coinbase.com/wallet
- Polygon docs: https://docs.polygon.technology/
- Wagmi guide: https://wagmi.sh/react/guides/connect-wallet
- Reown AppKit: https://docs.reown.com/appkit/next/core/installation

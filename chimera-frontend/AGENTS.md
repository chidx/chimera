## Project: Chimera Frontend

Decentralized AI agent marketplace on Monad testnet. Users register AI agents as NFTs, compose multi-agent "Chimeras", fund missions with USDC, track reputation, and license agents as franchises.

## Tech Stack

- **Next.js 16.2.4** (App Router) + **React 19** + **TypeScript**
- **Tailwind CSS v4** — no config file, uses CSS `@import "tailwindcss"` + `@theme inline` blocks
- **wagmi v2** + **viem v2** — Ethereum hooks, custom Monad Testnet chain (chain ID 10143)
- **RainbowKit v2** — wallet connection UI
- **TanStack React Query v5** — all data fetching (staleTime: 60s default)
- **Framer Motion v12** — animations
- **Ably v2** — real-time mission updates (per-mission channels)

## Architecture

**All page components are `'use client'`** because the root layout (`src/app/layout.tsx`) uses `useState` for `QueryClient` and wraps everything in `WagmiProvider`. React Server Components are not used — all data fetching happens client-side via React Query.

## Environment Variables

| Variable | Purpose |
|---|---|
| `NEXT_PUBLIC_API_URL` | Backend API base URL |
| `NEXT_PUBLIC_WALLETCONNECT_ID` | WalletConnect project ID |
| `NEXT_PUBLIC_ABLY_KEY` | Ably real-time messaging key |

## Backend API Endpoints

Base URL: `NEXT_PUBLIC_API_URL`

| Endpoint | Method | Purpose |
|---|---|---|
| `/api/marketplace` | GET | Agent listings (pageSize, domain, category, minReputation, maxPrice) |
| `/api/leaderboard/agents` | GET | Top 20 agents by reputation |
| `/api/leaderboard/chimeras` | GET | Top 10 chimera compositions |
| `/api/missions/:id` | GET | Single mission details |
| `/api/missions` | POST | Create mission (auth required) |
| `/api/agents/:tokenId/identity` | GET | Agent identity + capabilities |
| `/api/agents/metadata` | POST | Upload agent metadata to IPFS (auth required) |
| `/api/capabilities` | GET | List capabilities (domain, category filters) |
| `/api/capabilities/resolve` | POST | Resolve capability IDs to definitions |
| `/api/builders/:address/royalties` | GET | Builder royalty earnings (auth required) |
| `/api/auth/nonce` | POST | SIWE nonce generation |
| `/api/auth/verify` | POST | SIWE signature verification |

## Smart Contract Addresses

Defined in wagmi config and used via viem. Key contracts:
- `CHIMERA_REGISTRY` — agent NFT registry (ERC-721 upgradeable)
- `MISSION_VAULT` — mission creation and reward distribution
- `FRANCHISE_LICENSE` — franchise licensing marketplace
- `AGENT_COMPOSER` — chimera composition (combine 2-5 agents)
- `REPUTATION_REGISTRY` — agent reputation tracking (ERC-8004)

## Routes

| Path | Purpose |
|---|---|
| `/` | Homepage — hero, how-it-works, featured agents, top compositions, compose CTA, franchise teaser |
| `/marketplace` | Agent marketplace with filters (domain, category, reputation, price) |
| `/leaderboard` | Agent and chimera rankings (tabbed) |
| `/builder` | Agent minting flow |
| `/compose` | Chimera composition — combine agents into multi-agent entity |
| `/mission/new` | Mission creation wizard (auth-gated) |
| `/mission/[id]` | Mission details and management |
| `/royalties` | Royalty earnings dashboard (auth-gated) |

## Key Patterns

### Data Fetching
All API calls use `useQuery` from TanStack React Query. Pattern:
```ts
const API_URL = process.env.NEXT_PUBLIC_API_URL ?? '';
const { data, isLoading, isError } = useQuery<ResponseType>({
  queryKey: ['query-key', ...deps],
  queryFn: async () => {
    const res = await fetch(`${API_URL}/endpoint`);
    if (!res.ok) throw new Error('Failed');
    return res.json();
  },
  staleTime: 60_000,
});
```

### Authentication
`AuthGate` component wraps protected routes — renders full-screen wallet connect + SIWE prompt. The homepage and marketplace are public (no `AuthGate`). For non-blocking wallet prompts, use `useAccount()` from wagmi + `ConnectButton` from RainbowKit directly.

### Styling Conventions
- Dark theme: `bg-gray-950` backgrounds, `text-white` text, `border-white/10` borders
- Primary action: `bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700`
- Cards: `bg-white/5 border border-white/10 rounded-xl`
- Skeleton loading: `animate-pulse` with `bg-white/10` shapes
- Fonts: Geist Sans (`--font-geist-sans`) and Geist Mono (`--font-geist-mono`)

### Animation Patterns (Framer Motion)
- Entry: `initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}`
- Scroll reveal: `whileInView={{ ... }} viewport={{ once: true }}`
- Hover: `whileHover={{ scale: 1.03 }}` on cards, `whileHover={{ scale: 1.04 }}` on buttons
- Continuous: `animate={{ ... }} transition={{ repeat: Infinity }}`

### Agent Categories
Six categories with icons and gradient colors: `perceiver` (🔭 blue), `analyzer` (📊 purple), `executor` (⚡ yellow), `orchestrator` (🎯 green), `validator` (🛡️ red), `communicator` (📡 pink). Defined in `src/hooks/useCapabilities.ts`.

### `useSearchParams` in Next.js 16
Pages using `useSearchParams()` must be wrapped in a `<Suspense>` boundary. Export a wrapper component that renders `<Suspense><Page /></Suspense>` as the default export, and rename the page function.

### AgentCard Props
```ts
interface AgentCardProps {
  tokenId: number;
  name: string;
  capabilityIds: string[];
  reputationScore: number;
  tasksCompleted: number;
  winRate: number;
  pricePerTask: string;
  franchiseOpen: boolean;
  onClick?: () => void;
}
```
The `/api/marketplace` endpoint returns agents in this shape. The `/api/leaderboard/agents` endpoint does NOT include `name`, `winRate`, or `pricePerTask`.

## Component Map

### Shared Components (`src/components/`)
- `AgentCard.tsx` — agent listing card with gradient, stats, capability badges
- `AuthGate.tsx` — full-screen auth wall (wallet connect + SIWE)
- `MissionFeed.tsx` — real-time Ably-powered feed for a single mission (requires `missionId` prop)
- `MissionTypeSelector.tsx` — mission type selection UI
- `RewardSplitChart.tsx` — SVG donut chart for reward distribution

### Homepage Components (`src/components/home/`)
- `HeroSection.tsx` — headline, CTAs, background, stats
- `HeroBackground.tsx` — floating orbs + grid overlay
- `HeroStats.tsx` — live stats from API
- `HowItWorks.tsx` — three-step explainer
- `FeaturedAgents.tsx` — top 4 agents from marketplace
- `HomeMissionFeed.tsx` — top chimeras from leaderboard
- `ComposeCTA.tsx` — chimera composition call-to-action
- `FranchiseTeaser.tsx` — franchise marketplace preview
- `HomeFooter.tsx` — connect wallet banner + links

### Hooks (`src/hooks/`)
- `useCapabilities.ts` — capability resolution, category colors/icons
- `useAgentRegistry.ts` — ChimeraRegistry contract interactions
- `useMissionVault.ts` — mission creation/completion contract interactions
- `useFranchise.ts` — franchise licensing contract interactions

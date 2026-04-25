@AGENTS.md

## Changelog

### 2026-04-25 — Homepage
Replaced Next.js placeholder homepage with full landing page:
- Hero section with animated floating orbs background, live stats, two CTAs
- How It Works — three-step explainer with scroll-reveal
- Featured Agents — top 4 from marketplace API, reuses `AgentCard`
- Top Compositions — chimeras from leaderboard API
- Compose CTA — pulsing glow card for chimera composition
- Franchise Teaser — franchise-open agents from marketplace, section auto-hides if empty
- HomeFooter — conditional wallet connect banner via `useAccount()` + `ConnectButton`
- Fixed pre-existing build error: wrapped `/marketplace` in `<Suspense>` for `useSearchParams()`

New files: `src/components/home/{HeroSection,HeroBackground,HeroStats,HowItWorks,FeaturedAgents,HomeMissionFeed,ComposeCTA,FranchiseTeaser,HomeFooter}.tsx`
Modified: `src/app/page.tsx`, `src/app/marketplace/page.tsx`

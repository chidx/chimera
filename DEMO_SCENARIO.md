# Chimera Hackathon Demo Scenario

## Overview

**Demo theme**: "The AI Agent Economy on-chain"

**Target duration**: 8-10 minutes (live demo) + 2 min Q&A

**Persona**: You're a DeFi analyst who needs to monitor, research, and act on market opportunities -- but you can't watch the markets 24/7. You hire a team of specialized AI agents to work together autonomously.

---

## Prerequisites Checklist

Before going on stage, verify all of these pass:

| # | Check | How to Verify |
|---|-------|---------------|
| 1 | Docker infra running | `docker compose ps` -- postgres, redis, nats all healthy |
| 2 | Database migrated | Tables exist in postgres (connect via Adminer on :8080) |
| 3 | Contracts deployed on Monad testnet | Addresses in `deploy-result.txt` match across all `.env` files |
| 4 | Ponder indexer running and synced | No errors in ponder logs, block cursor advancing |
| 5 | Backend API healthy | `curl http://localhost:3001/api/health` returns 200 |
| 6 | Frontend running | `http://localhost:3000` loads without errors |
| 7 | Agent worker running | No errors in chimera-agents terminal |
| 8 | Wallet funded with testnet ETH + USDC | Wallet has enough for all transactions (mint testnet tokens if needed) |
| 9 | Testnet explorer tab open | For showing on-chain verification |
| 10 | Pre-seeded data | At least 3 agents registered, 1 chimera composed, 1 mission completed |

---

## Demo Script

### Step 1 -- The Hook (30 seconds)

**What you do**: Open the frontend. Show the leaderboard page first.

**What you say**:
> "AI agents are the next wave of on-chain users. But today every agent is siloed -- it does one thing and dies. Chimera lets you compose specialized AI agents into autonomous teams that execute complex on-chain missions together, tracked on-chain with real money."

**Expectation**:
- Frontend loads at `localhost:3000`
- Leaderboard shows pre-seeded agents with reputation scores
- UI is visually clean (Tailwind styling, no broken images)

**Fallback**: If frontend won't load, show the smart contracts in the testnet explorer and explain the architecture from there.

---

### Step 2 -- Browse the Agent Marketplace (45 seconds)

**What you do**: Navigate to the marketplace page. Show agent cards with domains, capabilities, and reputation.

**What you say**:
> "This is the agent marketplace. Each agent is an ERC-721 NFT with a reputation score, defined capabilities, and an on-chain identity. Think of them as autonomous workers you can hire."

**Expectation**:
- Marketplace page renders with at least 3 agent cards
- Each card shows: name, domain/category, reputation score, price
- Filtering works (click a domain filter, agents re-render)
- Agent detail view loads when clicking an agent card

**Pre-seeded agents to have ready**:
1. **Sentry** -- Domain: DeFi, Capability: "monitor price feeds and detect anomalies"
2. **Analyst** -- Domain: Research, Capability: "analyze on-chain data and generate reports"
3. **Executor** -- Domain: Trading, Capability: "execute trades based on analyzed signals"

---

### Step 3 -- Compose a Chimera (60 seconds)

**What you do**: Navigate to the Composer page. Select Sentry + Analyst + Executor. Create a composition called "DeFi Watchdog".

**What you say**:
> "The real power is composition. I pick a Sentry to monitor, an Analyst to research, and an Executor to act. Together they form a Chimera -- a multi-agent system that's more capable than any single agent."

**What happens on-chain**:
- `AgentComposer.composeAgents()` called
- New ERC-721 minted representing the Chimera
- Events emitted: `ChimeraComposed(agentIds[], chimeraTokenId)`

**Expectation**:
- Composer UI allows selecting 2-5 agents from registered agents
- Confirmation shows the combined capabilities
- Transaction submits and confirms on Monad testnet
- Chimera NFT appears in the user's wallet / portfolio
- Ponder indexes the event and it appears in the UI

**Fallback**: If on-chain compose fails due to gas/nonce, show the contract interaction in the testnet explorer and explain what happened.

---

### Step 4 -- Fund and Launch a Mission (90 seconds)

**What you do**: Navigate to Mission creation. Define a mission: "Monitor ETH/USDC price, alert on 5% swings, and execute a hedge if Analyst confirms." Set a USDC budget. Assign the DeFi Watchdog Chimera.

**What you say**:
> "Now I fund a mission with real USDC locked in the MissionVault. The Chimera executes autonomously. If the Sentry detects a price swing, it hands off to the Analyst, who decides whether to act, and passes to the Executor. All communication is on-chain via AgentMessenger."

**What happens on-chain**:
1. `MissionVault.createMission()` -- locks USDC from wallet
2. Mission state emitted on-chain: `MissionCreated(missionId, chimeraId, budget)`
3. Agent worker picks up the mission from the backend queue
4. LangGraph workflow executes: resolve -> sense -> reason -> decide -> act
5. Inter-agent messages emitted: `MessageSent(fromAgent, toAgent, messageType, content)`

**Expectation**:
- Mission creation form works (title, description, budget input)
- USDC approval + deposit transaction confirms
- Mission appears in "My Missions" with status "Active"
- Real-time updates appear via Ably (mission status changes in the UI without refresh)
- Agent messages appear in the mission detail timeline
- Testnet explorer shows the transaction history

**Fallback**: If real-time updates aren't working, refresh the page to show progress. If agent execution fails, show the LangGraph workflow logs in the agents terminal and explain the agent reasoning chain.

---

### Step 5 -- Watch the Agents Work (60 seconds)

**What you do**: Zoom into the mission detail page. Show the agent handoff timeline. Highlight messages flowing between agents.

**What you say**:
> "Watch the agents coordinate. The Sentry detected an anomaly. It messaged the Analyst. The Analyst researched the on-chain data and recommended a hedge. The Executor is now waiting for confirmation. Every message, every decision -- it's all on-chain, auditable, trustless."

**Expectation**:
- Mission timeline shows agent handoffs in order
- Each message has: sender agent, receiver agent, message type, timestamp
- Agent status indicators update (idle -> working -> completed)
- At least one agent message shows actual analysis content (from OpenAI)

**What to point out**:
- The handoff mechanism (AgentMessenger contract events)
- The structured decision format (agent output parsed into action items)
- The reputation update that happens after task completion

---

### Step 6 -- Mission Completion & Rewards (45 seconds)

**What you do**: Show the mission reaching "Completed" status. Navigate to the agent's reputation page to show the score increase. Show the reward distribution.

**What you say**:
> "Mission complete. Each agent's reputation is updated based on performance -- quality, speed, accuracy. The USDC rewards are distributed through the MissionVault. And now these agents are more valuable on the marketplace because they have a track record."

**What happens on-chain**:
- `MissionVault.completeMission()` -- distributes USDC to agent owners
- `ReputationRegistry.updateScore()` -- updates each agent's metrics
- Events: `MissionCompleted(missionId)`, `ReputationUpdated(agentId, newScore)`

**Expectation**:
- Mission status changes to "Completed"
- Agent reputation scores increase on the leaderboard
- Reward amounts visible in the mission summary
- Wallet balance updated (if applicable)

---

### Step 7 -- The Franchise Pitch (45 seconds)

**What you do**: Navigate to an agent's detail page. Click "Open for Franchise". Explain the model.

**What you say**:
> "Here's the flywheel. I built these agents. I can open them for franchising -- other builders can license my agents and deploy them in their own missions. They get capable agents, I earn royalties. It's the App Store model, but for autonomous AI agents."

**What happens on-chain**:
- `FranchiseLicense.openForFranchise(agentId, licenseFee, royaltyBPS)`
- Other users can call `FranchiseLicense.purchaseLicense(agentId)` to license the agent
- Original builder receives royalties on mission earnings from licensed agents

**Expectation**:
- Agent detail page shows "Open for Franchise" button (or equivalent)
- Franchise terms are visible (license fee, royalty percentage)
- If time permits, show a second wallet purchasing a license

---

### Step 8 -- On-Chain Verification (30 seconds)

**What you do**: Open Monad testnet explorer. Show the transaction history for the demo wallet.

**What you say**:
> "Everything is on-chain. Agent registration, composition, mission funding, agent communication, rewards -- fully transparent, fully auditable. No black boxes."

**What to show in the explorer**:
- Agent NFT mint transactions
- Chimera composition transaction
- MissionVault USDC deposit
- AgentMessenger message events
- Reputation update events

**Expectation**:
- Testnet explorer is accessible and transactions are indexed
- Events are decoded and readable
- Timestamps match the demo timeline

---

### Step 9 -- Summary / Close (30 seconds)

**What you say**:
> "Chimera is the infrastructure for the on-chain AI agent economy. Register agents, compose them into teams, fund missions, track reputation, and franchise your best agents. Built on Monad for speed, on-chain for trust, with AI agents that actually do useful work together."

**Key numbers to mention** (prepare these beforehand):
- Average gas cost per mission
- Agent message latency (on-chain vs. traditional)
- Number of agents registered (pre-seeded)
- Total missions completed (pre-seeded)

---

## Post-Demo Q&A Preparation

### Likely questions and prepared answers:

| Question | Key Point |
|----------|-----------|
| "How is this different from AutoGPT / CrewAI?" | On-chain coordination, real money incentives, auditable agent communication, composable ownership via NFTs |
| "Why Monad?" | High throughput for agent message volume, low gas for frequent transactions, EVM compatibility |
| "What prevents malicious agents?" | Reputation system penalizes bad actors, franchise model creates skin in the game, mission budgets are escrowed |
| "How do agents make decisions?" | LangGraph workflow: resolve -> sense -> reason (LLM) -> decide (structured output) -> act (on-chain tx or message) |
| "Can agents hold funds?" | MissionVault holds USDC in escrow, agents request actions but don't hold funds directly |
| "What's the monetization?" | Mission fees, franchise licensing royalties, agent NFT marketplace |
| "Is this production-ready?" | Running on Monad testnet, contracts are upgradeable (UUPS), production deployment needs mainnet + audit |

---

## Risk Mitigation

### Critical failures and recovery plans:

| Failure | Recovery |
|---------|----------|
| Frontend won't build/load | Use testnet explorer to walk through transactions, show contracts directly |
| Agent worker crashes | Show pre-recorded logs/screenshots of agent execution, explain the LangGraph architecture |
| Transaction fails | Explain what should happen, show the contract code for the specific function |
| Real-time updates broken | Refresh the page manually, mention Ably as the transport layer |
| Testnet is down | Switch to local Anvil fork, pre-deploy contracts locally |
| Database connection fails | Restart docker services, show the schema as evidence of data layer |
| OpenAI API errors | Use cached responses, explain the agent reasoning architecture |

---

## Demo Environment Quick-Start

```bash
# 1. Infrastructure
docker compose up -d

# 2. Database migrations
psql -h localhost -U chimera -d chimera -f migrations/001_initial_schema.sql
psql -h localhost -U chimera -d chimera -f migrations/002_seed_capabilities.sql

# 3. Contracts (if not already deployed)
cd chimera-contracts
source .env && forge script script/Deploy.s.sol --rpc-url $RPC_URL --broadcast

# 4. Indexer
cd ponder && npm install && npm run dev

# 5. Backend
cd chimera-backend && npm install && npm run dev

# 6. Agent worker
cd chimera-agents && pip install -r requirements.txt && python runner.py

# 7. Frontend
cd chimera-frontend && npm install && npm run dev
```

---

## Scoring Cheat Sheet (if judges use standard criteria)

| Criteria | How Chimera hits it |
|----------|-------------------|
| **Innovation** | First on-chain multi-agent composition framework with NFT-based agent identity |
| **Technical Complexity** | 6 upgradeable contracts, LangGraph agent engine, real-time indexer, full-stack app |
| **Design / UX** | Clean marketplace UI, real-time mission tracking, agent composition visual tool |
| **Practicality** | Agents perform real work (DeFi monitoring, research, execution) with real incentives |
| **Web3 Integration** | Deeply integrated -- not just payments, but agent identity, communication, and reputation all on-chain |
| **Monad-Specific** | Leverages Monad's throughput for high-frequency agent messages, built for the Monad ecosystem |
| **Wow Factor** | Live agents coordinating on-chain with real-time handoffs and USDC rewards |

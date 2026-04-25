-- The chain allows the same `agentWallet` on multiple token IDs; `walletToTokenId` is only a
-- latest-index map. A UNIQUE(agent_wallet) on this table then blocks Ponder when mirroring
-- multiple AgentMinted events (or seed + on-chain) with the same wallet.
ALTER TABLE agents DROP CONSTRAINT IF EXISTS agents_agent_wallet_key;

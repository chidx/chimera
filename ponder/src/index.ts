import { ponder } from "@/generated";
import { Pool } from "pg";
import {
  agent,
  agentCapability,
  reputationFeedback,
  mission,
  messageLog,
} from "../ponder.schema";
import { ChimeraRegistryAbi } from "../abis/ChimeraRegistry";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

const AGENT_NAME_MAX = 100;

/** Resolve ipfs:// or return http(s) URL for node fetch (same as Pinata gateway in chimera-backend). */
function toMetadataFetchUrl(uri: string): string | null {
  const u = uri.trim();
  if (!u) return null;
  if (u.startsWith("http://") || u.startsWith("https://")) return u;
  if (u.startsWith("ipfs://")) {
    const path = u.replace(/^ipfs:\/\//, "");
    const gateway = (process.env.PINATA_GATEWAY || "https://ipfs.io").replace(/\/$/, "");
    return `${gateway}/ipfs/${path}`;
  }
  return null;
}

/** Load ERC-8004 / Pinata JSON from token URI; used to fill public.agents.name. */
async function fetchDisplayNameFromAgentUri(uri: string): Promise<string> {
  const url = toMetadataFetchUrl(uri);
  if (!url) return "";
  const ac = new AbortController();
  const t = setTimeout(() => ac.abort(), 12_000);
  try {
    const res = await fetch(url, {
      signal: ac.signal,
      headers: { accept: "application/json" },
    });
    if (!res.ok) {
      console.warn("[Ponder] agent metadata non-OK", { uri, url, status: res.status });
      return "";
    }
    const data = (await res.json()) as { name?: unknown };
    if (typeof data.name === "string") {
      const s = data.name.trim();
      if (s) return s.slice(0, AGENT_NAME_MAX);
    }
  } catch (e) {
    console.error("[Ponder] agent metadata fetch failed", { uri, url, e });
  } finally {
    clearTimeout(t);
  }
  return "";
}

/** Normalize bytes32 to lowercase 0x + 64 hex (matches public.capability_definitions.id). */
function formatCapabilityId(capabilityId: `0x${string}` | string): string {
  return String(capabilityId).toLowerCase();
}

ponder.on("ChimeraRegistry:AgentMinted", async ({ event, context }) => {
  const { tokenId, creator, agentWallet } = event.args;

  // Write to ponder's managed tables
  await context.db
    .insert(agent)
    .values({
      id: tokenId,
      creator,
      agentWallet,
      createdAt: event.block.timestamp,
      reputation: 0,
      tasksDone: 0,
    })
    .onConflictDoUpdate({ creator, agentWallet });

  // Fetch agentURI from contract and sync to backend's public.agents table
  let agentUri = "";
  try {
    agentUri = await context.client.readContract({
      address: process.env.CHIMERA_REGISTRY_ADDRESS as `0x${string}`,
      abi: ChimeraRegistryAbi,
      functionName: "getAgentURI",
      args: [tokenId],
    });
  } catch {
    // URI fetch is best-effort; proceed with empty string
  }

  const displayName = agentUri ? await fetchDisplayNameFromAgentUri(agentUri) : "";

  // Upsert on token_id only. Do not enforce unique(agent_wallet): the contract can mint multiple
  // token IDs for the same agentWallet (walletToTokenId is overwritten, identities still hold the address).
  await pool.query(
    `INSERT INTO agents (token_id, creator, agent_wallet, name, agent_uri, staked_amount, reputation, tasks_done, win_rate, price, franchise_open, created_at, is_active)
     VALUES ($1, $2, $3, $4, $5, 0, 0, 0, 0, 0, FALSE, to_timestamp($6), TRUE)
     ON CONFLICT (token_id) DO UPDATE SET
       creator      = EXCLUDED.creator,
       agent_wallet = EXCLUDED.agent_wallet,
       agent_uri    = CASE WHEN EXCLUDED.agent_uri <> '' THEN EXCLUDED.agent_uri ELSE agents.agent_uri END,
       name         = CASE WHEN EXCLUDED.name <> '' THEN EXCLUDED.name ELSE agents.name END`,
    [
      tokenId.toString(),
      creator.toLowerCase(),
      agentWallet.toLowerCase(),
      displayName,
      agentUri,
      Number(event.block.timestamp),
    ]
  );
});

ponder.on("ChimeraRegistry:FranchiseOpened", async ({ event }) => {
  const { tokenId } = event.args;
  try {
    await pool.query(`UPDATE agents SET franchise_open = true WHERE token_id = $1`, [Number(tokenId)]);
  } catch (err) {
    console.error("[Ponder] agents franchise_open update failed:", err, { tokenId: Number(tokenId) });
  }
});

ponder.on("ChimeraRegistry:CapabilityGranted", async ({ event, context }) => {
  const { tokenId, capabilityId } = event.args;
  const id = `${tokenId}-${capabilityId}`;

  await context.db
    .insert(agentCapability)
    .values({
      id,
      tokenId,
      capabilityId,
      revoked: false,
      grantedAt: event.block.timestamp,
    })
    .onConflictDoUpdate({ revoked: false, grantedAt: event.block.timestamp });

  // Mirror into public.agent_capabilities (marketplace and APIs JOIN this table; seed was the only source before).
  const capHex = formatCapabilityId(capabilityId);
  const tid = Number(tokenId);
  try {
    await pool.query(
      `INSERT INTO agent_capabilities (token_id, capability_id, revoked, granted_at)
       VALUES ($1, $2, false, to_timestamp($3))
       ON CONFLICT (token_id, capability_id) DO UPDATE SET
         revoked = false,
         granted_at = EXCLUDED.granted_at`,
      [tid, capHex, Number(event.block.timestamp)]
    );
  } catch (err) {
    console.error(
      "[Ponder] agent_capabilities insert failed (capability may be missing from capability_definitions):",
      err,
      { tokenId: tid, capabilityId: capHex }
    );
  }
});

ponder.on("ChimeraRegistry:CapabilityRevoked", async ({ event, context }) => {
  const { tokenId, capabilityId } = event.args;
  const id = `${tokenId}-${capabilityId}`;

  await context.db
    .update(agentCapability, { id })
    .set({ revoked: true });

  try {
    await pool.query(
      `UPDATE agent_capabilities SET revoked = true
       WHERE token_id = $1 AND capability_id = $2`,
      [Number(tokenId), formatCapabilityId(capabilityId)]
    );
  } catch (err) {
    console.error("[Ponder] agent_capabilities revoke update failed:", err);
  }
});

ponder.on("ReputationRegistry:FeedbackSubmitted", async ({ event, context }) => {
  const { agentTokenId, submitter, score, taskRef, evidenceURI } = event.args;
  const id = `${agentTokenId}-${event.transaction.hash}-${event.log.logIndex}`;

  await context.db.insert(reputationFeedback).values({
    id,
    agentTokenId,
    submitter,
    score,
    taskRef,
    evidenceURI,
    timestamp: event.block.timestamp,
  });
});

ponder.on("MissionVault:MissionCompleted", async ({ event, context }) => {
  const { missionId, earned } = event.args;

  await context.db
    .insert(mission)
    .values({ id: missionId, status: "completed", earned })
    .onConflictDoUpdate({ status: "completed", earned });
});

ponder.on("AgentMessenger:AgentMessageLogged", async ({ event, context }) => {
  const { logId, missionId, fromTokenId, toTokenId, messageType, payloadHash, timestamp } =
    event.args;

  await context.db.insert(messageLog).values({
    id: logId,
    missionId,
    fromTokenId,
    toTokenId,
    messageType,
    payloadHash,
    timestamp,
  });
});

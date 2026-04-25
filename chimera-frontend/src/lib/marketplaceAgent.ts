/**
 * The marketplace API may return different field names (camelCase vs. mixed)
 * and minor versions omit some columns. This layer maps everything into one
 * shape the UI can rely on.
 */

export function pickNumeric(...values: unknown[]): number | undefined {
  for (const v of values) {
    if (v === null || v === undefined) continue;
    if (typeof v === 'boolean') continue;
    const n = Number(v);
    if (!Number.isNaN(n)) return n;
  }
  return undefined;
}

export interface MarketplaceFranchiseTerms {
  pricePerTask: string;
  royaltyPercent: number;
}

export interface MarketplaceAgent {
  tokenId: number;
  name: string;
  capabilityIds: string[];
  reputationScore: number;
  tasksCompleted: number;
  /** `null` when the API does not return a success-rate field */
  winRate: number | null;
  /** USDC per task (alias of `price`; same string for API compatibility) */
  pricePerTask: string;
  price: string;
  franchiseOpen: boolean;
  franchiseTerms?: MarketplaceFranchiseTerms;
  domain?: string | null;
  category?: string | null;
  agentWallet?: string;
  agentUri?: string;
  capabilityLabels?: string[];
}

function formatPriceForUi(raw: unknown): string {
  if (raw === null || raw === undefined) return '—';
  const s = String(raw).trim();
  if (s === '') return '—';
  const n = Number(s);
  if (Number.isNaN(n)) return s;
  if (n === 0) return '0';
  return s.includes('.') ? s : n.toString();
}

export function normalizeMarketplaceAgent(raw: unknown): MarketplaceAgent {
  const r = raw as Record<string, unknown>;
  const tokenId = pickNumeric(r.tokenId, r.token_id) ?? 0;
  const nameRaw = r.name;
  const name =
    typeof nameRaw === 'string' && nameRaw.trim() !== ''
      ? nameRaw.trim()
      : `Agent #${tokenId}`;

  const reputationScore =
    pickNumeric(r.reputationScore, r.reputation, r.reputation_score) ?? 0;
  const tasksCompleted =
    pickNumeric(r.tasksCompleted, r.tasksDone, r.tasks_done) ?? 0;
  const hasWinInPayload = 'winRate' in r || 'win_rate' in r;
  const w = pickNumeric(r.winRate, r.win_rate);
  const winRate: number | null = hasWinInPayload ? (w !== undefined ? w : 0) : null;

  const capIds = r.capabilityIds ?? r.capability_ids;
  const capabilityIds = Array.isArray(capIds) ? (capIds as string[]) : [];

  // Backend sends `price` + `pricePerTask`; other surfaces may use taskPrice / usdcPerTask.
  const priceNum = pickNumeric(
    r.pricePerTask,
    r.price,
    r.price_per_task,
    r.taskPrice,
    r.task_price,
    r.usdcPerTask,
    r.usdc_per_task,
  );
  // Do not default missing price to 0 — that reads as a real $0 task on the card.
  const priceStr = formatPriceForUi(priceNum);

  const capLabels = r.capabilityLabels ?? r.capability_labels;
  const capabilityLabels = Array.isArray(capLabels) ? (capLabels as string[]) : undefined;

  const ft = r.franchiseTerms ?? r.franchise_terms;
  let franchiseTerms: MarketplaceFranchiseTerms | undefined;
  if (ft && typeof ft === 'object' && !Array.isArray(ft)) {
    const t = ft as Record<string, unknown>;
    const pp = t.pricePerTask ?? t.price_per_task;
    const rp = t.royaltyPercent ?? t.royalty_percent;
    if (pp !== undefined || rp !== undefined) {
      franchiseTerms = {
        pricePerTask: String(pp ?? ''),
        royaltyPercent: pickNumeric(rp) ?? 0,
      };
    }
  }

  return {
    tokenId,
    name,
    capabilityIds,
    reputationScore,
    tasksCompleted,
    winRate,
    price: priceStr,
    pricePerTask: priceStr,
    franchiseOpen: Boolean(r.franchiseOpen ?? r.franchise_open),
    franchiseTerms,
    domain: (r.domain as string | null | undefined) ?? null,
    category: (r.category as string | null | undefined) ?? null,
    agentWallet: r.agentWallet != null ? String(r.agentWallet) : r.agent_wallet != null ? String(r.agent_wallet) : undefined,
    agentUri: r.agentUri != null ? String(r.agentUri) : r.agent_uri != null ? String(r.agent_uri) : undefined,
    capabilityLabels,
  };
}

export interface MarketplaceListPayload {
  agents: MarketplaceAgent[];
  total: number;
  page: number;
  pageSize: number;
  limit: number;
}

export function parseMarketplaceResponse(json: unknown): MarketplaceListPayload {
  const o = json as Record<string, unknown>;
  const rawAgents = Array.isArray(o.agents) ? o.agents : [];
  return {
    agents: rawAgents.map(normalizeMarketplaceAgent),
    total: Number(o.total ?? 0) || 0,
    page: Math.max(1, Number(o.page ?? 1) || 1),
    pageSize: Number(
      o.pageSize ?? o.page_size ?? o.limit ?? 20,
    ) || 20,
    limit: Number(o.limit ?? 20) || 20,
  };
}

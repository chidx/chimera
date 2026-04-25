import { Hono } from 'hono';
import { query } from '../lib/db';

const marketplace = new Hono();

marketplace.get('/', async (c) => {
  const capabilityId = c.req.query('capabilityId');
  const domain = c.req.query('domain');
  const category = c.req.query('category');
  const minReputation = c.req.query('minReputation');
  const maxPrice = c.req.query('maxPrice');
  const franchiseOnly = c.req.query('franchiseOnly');
  const page = Math.max(1, parseInt(c.req.query('page') ?? '1', 10));
  const limit = Math.min(100, Math.max(1, parseInt(c.req.query('limit') ?? '20', 10)));
  const offset = (page - 1) * limit;

  const conditions: string[] = [
    'a.is_active = TRUE',
    'ac.revoked = FALSE',
  ];
  if (franchiseOnly === '1' || franchiseOnly === 'true') {
    conditions.push('a.franchise_open = TRUE');
  }
  const params: any[] = [];

  if (capabilityId) {
    params.push(capabilityId);
    conditions.push(`ac.capability_id = $${params.length}`);
  }

  if (domain) {
    params.push(domain);
    conditions.push(`cd.domain = $${params.length}`);
  }

  if (category) {
    params.push(category);
    conditions.push(`cd.category = $${params.length}`);
  }

  if (minReputation) {
    params.push(Number(minReputation));
    conditions.push(`a.reputation >= $${params.length}`);
  }

  if (maxPrice) {
    params.push(Number(maxPrice));
    conditions.push(`a.price <= $${params.length}`);
  }

  const where = `WHERE ${conditions.join(' AND ')}`;

  const baseFrom = `
    FROM agents a
    JOIN agent_capabilities ac ON ac.token_id = a.token_id
    JOIN capability_definitions cd ON cd.id = ac.capability_id
  `;

  const countRows = await query<{ count: string }>(
    `SELECT COUNT(DISTINCT a.token_id) AS count ${baseFrom} ${where}`,
    params
  );
  const total = parseInt(countRows[0].count, 10);

  params.push(limit);
  const limitParam = `$${params.length}`;
  params.push(offset);
  const offsetParam = `$${params.length}`;

  const agentRows = await query<{
    token_id: string;
    agent_wallet: string;
    agent_uri: string;
    name: string;
    reputation: number;
    tasks_done: number;
    win_rate: number;
    price: string;
    franchise_open: boolean;
  }>(
    `SELECT DISTINCT ON (a.reputation, a.token_id)
       a.token_id, a.agent_wallet, a.agent_uri, a.name, a.reputation, a.tasks_done, a.win_rate, a.price, a.franchise_open
     ${baseFrom}
     ${where}
     ORDER BY a.reputation DESC, a.token_id
     LIMIT ${limitParam} OFFSET ${offsetParam}`,
    params
  );

  if (agentRows.length === 0) {
    return c.json({ agents: [], total, page, limit });
  }

  const tokenIds = agentRows.map((a) => a.token_id);

  const capRows = await query<{
    token_id: string;
    capability_id: string;
    label: string;
    domain: string | null;
    category: string | null;
  }>(
    `SELECT ac.token_id, ac.capability_id, cd.label, cd.domain, cd.category
     FROM agent_capabilities ac
     JOIN capability_definitions cd ON cd.id = ac.capability_id
     WHERE ac.token_id = ANY($1) AND ac.revoked = FALSE`,
    [tokenIds]
  );

  const capsByToken = new Map<string, typeof capRows>();
  for (const row of capRows) {
    if (!capsByToken.has(row.token_id)) capsByToken.set(row.token_id, []);
    capsByToken.get(row.token_id)!.push(row);
  }

  const agents = agentRows.map((a) => {
    const caps = capsByToken.get(a.token_id) ?? [];
    const priceStr = a.price != null ? String(a.price) : '0';
    const tid = Number(a.token_id);
    return {
      tokenId: tid,
      agentWallet: a.agent_wallet,
      agentUri: a.agent_uri,
      name: a.name,
      reputationScore: a.reputation,
      tasksCompleted: a.tasks_done,
      reputation: a.reputation,
      tasksDone: a.tasks_done,
      winRate: a.win_rate,
      price: priceStr,
      pricePerTask: priceStr,
      franchiseOpen: a.franchise_open,
      capabilityIds: caps.map((cap) => cap.capability_id),
      capabilityLabels: caps.map((cap) => cap.label),
      domain: caps[0]?.domain ?? null,
      category: caps[0]?.category ?? null,
    };
  });

  return c.json({ agents, total, page, limit });
});

export default marketplace;

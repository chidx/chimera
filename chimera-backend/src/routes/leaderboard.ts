import { Hono } from 'hono';
import { query } from '../lib/db';
import { requireAuth } from '../middleware/auth';

const leaderboard = new Hono();

leaderboard.get('/agents', async (c) => {
  const rows = await query<{
    token_id: number;
    reputation: number;
    tasks_done: number;
    franchise_open: boolean;
    capability_label: string | null;
    category: string | null;
  }>(`
    SELECT * FROM (
      SELECT DISTINCT ON (a.token_id)
        a.token_id, a.reputation, a.tasks_done, a.franchise_open,
        cd.label AS capability_label, cd.category
      FROM agents a
      LEFT JOIN agent_capabilities ac ON ac.token_id = a.token_id AND ac.revoked = FALSE
      LEFT JOIN capability_definitions cd ON cd.id = ac.capability_id
      WHERE a.is_active = TRUE
      ORDER BY a.token_id
    ) sub
    ORDER BY reputation DESC
    LIMIT 20
  `);

  return c.json({
    agents: rows.map((r, i) => ({
      rank: i + 1,
      tokenId: r.token_id,
      capabilityLabel: r.capability_label,
      category: r.category,
      reputation: r.reputation,
      tasksDone: r.tasks_done,
      franchiseOpen: r.franchise_open,
    })),
  });
});

leaderboard.get('/chimeras', async (c) => {
  const rows = await query<{
    agent_token_ids: number[];
    total_missions: string;
    total_tasks: string;
    win_rate: string;
  }>(`
    SELECT
      m.agent_token_ids,
      COUNT(DISTINCT m.id) AS total_missions,
      COUNT(at.id) AS total_tasks,
      CASE
        WHEN COUNT(at.id) > 0
        THEN ROUND(
          COUNT(at.id) FILTER (WHERE at.success = TRUE)::numeric / COUNT(at.id) * 100, 1
        )
        ELSE 0
      END AS win_rate
    FROM missions m
    LEFT JOIN agent_tasks at ON at.mission_id::text = m.id
    WHERE m.status = 'completed'
    GROUP BY m.agent_token_ids
    HAVING COUNT(at.id) > 0
    ORDER BY win_rate DESC, total_missions DESC
    LIMIT 10
  `);

  return c.json({
    chimeras: rows.map((r, i) => ({
      rank: i + 1,
      name: `Chimera [${r.agent_token_ids.join(', ')}]`,
      agentTokenIds: r.agent_token_ids,
      totalMissions: Number(r.total_missions),
      winRate: Number(r.win_rate),
    })),
  });
});

export const builders = new Hono();

builders.get('/:address/royalties', requireAuth, async (c) => {
  const address = c.get('wallet');

  const agentRows = await query<{
    token_id: number;
    total_earned: string;
    this_week_earned: string;
  }>(`
    SELECT
      unnested.token_id,
      SUM(m.budget::numeric * unnested.royalty_bps / 10000) AS total_earned,
      SUM(
        CASE WHEN m.created_at >= NOW() - INTERVAL '7 days'
          THEN m.budget::numeric * unnested.royalty_bps / 10000
          ELSE 0
        END
      ) AS this_week_earned
    FROM missions m
    CROSS JOIN LATERAL (
      SELECT t1.val AS token_id, t3.val AS royalty_bps
      FROM unnest(m.agent_token_ids) WITH ORDINALITY t1(val, ord)
           JOIN unnest(m.agent_creators) WITH ORDINALITY t2(val, ord) USING (ord)
           JOIN unnest(m.royalty_bps) WITH ORDINALITY t3(val, ord) USING (ord)
      WHERE t2.val = $1
    ) AS unnested
    WHERE m.status = 'completed'
    GROUP BY unnested.token_id
  `, [address]);

  if (agentRows.length === 0) {
    return c.json({ totalEarned: '0', thisWeek: '0', agents: [], chart: [] });
  }

  const tokenIds = agentRows.map((r) => r.token_id);

  const capRows = await query<{
    token_id: number;
    capability_label: string | null;
    category: string | null;
  }>(`
    SELECT DISTINCT ON (a.token_id) a.token_id, cd.label AS capability_label, cd.category
    FROM agents a
    LEFT JOIN agent_capabilities ac ON ac.token_id = a.token_id AND ac.revoked = FALSE
    LEFT JOIN capability_definitions cd ON cd.id = ac.capability_id
    WHERE a.token_id = ANY($1)
    ORDER BY a.token_id
  `, [tokenIds]);

  const capByToken = new Map(capRows.map((r) => [r.token_id, r]));

  const chartRows = await query<{ week: string; earned: string }>(`
    SELECT
      TO_CHAR(DATE_TRUNC('week', m.created_at), 'YYYY-MM-DD') AS week,
      SUM(m.budget::numeric * unnested.royalty_bps / 10000) AS earned
    FROM missions m
    CROSS JOIN LATERAL (
      SELECT t3.val AS royalty_bps
      FROM unnest(m.agent_token_ids) WITH ORDINALITY t1(val, ord)
           JOIN unnest(m.agent_creators) WITH ORDINALITY t2(val, ord) USING (ord)
           JOIN unnest(m.royalty_bps) WITH ORDINALITY t3(val, ord) USING (ord)
      WHERE t2.val = $1
    ) AS unnested
    WHERE m.status = 'completed'
      AND m.created_at >= NOW() - INTERVAL '8 weeks'
    GROUP BY DATE_TRUNC('week', m.created_at)
    ORDER BY week
  `, [address]);

  const totalEarned = agentRows.reduce((s, r) => s + Number(r.total_earned), 0);
  const thisWeek = agentRows.reduce((s, r) => s + Number(r.this_week_earned), 0);

  return c.json({
    totalEarned: totalEarned.toFixed(6),
    thisWeek: thisWeek.toFixed(6),
    agents: agentRows.map((r) => {
      const cap = capByToken.get(r.token_id);
      return {
        tokenId: r.token_id,
        capabilityLabel: cap?.capability_label ?? null,
        category: cap?.category ?? null,
        totalEarned: Number(r.total_earned).toFixed(6),
        thisWeek: Number(r.this_week_earned).toFixed(6),
      };
    }),
    chart: chartRows.map((r) => ({ week: r.week, earned: Number(r.earned) })),
  });
});

export default leaderboard;

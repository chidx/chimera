import { Hono } from 'hono';
import { keccak256, toBytes } from 'viem';
import { query } from '../lib/db';
import { requireAuth } from '../middleware/auth';

const capabilities = new Hono();

capabilities.get('/', async (c) => {
  const domain = c.req.query('domain');
  const category = c.req.query('category');

  const conditions: string[] = [];
  const params: any[] = [];

  if (domain) {
    params.push(domain);
    conditions.push(`domain = $${params.length}`);
  }
  if (category) {
    params.push(category);
    conditions.push(`category = $${params.length}`);
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  const rows = await query(`SELECT * FROM capability_definitions ${where}`, params);

  return c.json(rows);
});

capabilities.post('/', requireAuth, async (c) => {
  const { label, description, domain, category } = await c.req.json<{
    label: string;
    description: string;
    domain?: string;
    category?: string;
  }>();

  const id = keccak256(toBytes(label));

  await query(
    `INSERT INTO capability_definitions (id, label, description, domain, category)
     VALUES ($1, $2, $3, $4, $5)
     ON CONFLICT DO NOTHING`,
    [id, label, description, domain ?? null, category ?? null]
  );

  return c.json({ id, label, description, domain, category }, 201);
});

capabilities.post('/resolve', async (c) => {
  const { ids } = await c.req.json<{ ids: string[] }>();
  const rows = await query('SELECT * FROM capability_definitions WHERE id = ANY($1)', [ids]);
  return c.json(rows);
});

export default capabilities;

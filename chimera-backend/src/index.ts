import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { logger } from 'hono/logger';
import agents from './routes/agents';
import auth from './routes/auth';
import capabilities from './routes/capabilities';
import leaderboard, { builders } from './routes/leaderboard';
import marketplace from './routes/marketplace';
import missions from './routes/missions';

const app = new Hono();

app.use(logger());

app.route('/api/agents', agents);
app.route('/api/auth', auth);
app.route('/api/builders', builders);
app.route('/api/capabilities', capabilities);
app.route('/api/leaderboard', leaderboard);
app.route('/api/marketplace', marketplace);
app.route('/api/missions', missions);

app.get('/health', (c) => c.json({ ok: true }));

const port = Number(process.env.PORT ?? 3000);

serve({ fetch: app.fetch, port }, () => {
  console.log(`chimera-backend listening on port ${port}`);
});

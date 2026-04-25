import { Hono } from 'hono';
import { deleteCookie, getCookie, setCookie } from 'hono/cookie';
import { SiweMessage } from 'siwe';
import redis from '../lib/redis';

const auth = new Hono();

auth.post('/nonce', async (c) => {
  const nonce = crypto.randomUUID().replace(/-/g, '');
  await redis.set(`nonce:${nonce}`, '1', 'EX', 300);
  return c.json({ nonce });
});

auth.post('/verify', async (c) => {
  const { message, signature } = await c.req.json<{ message: string; signature: string }>();

  const siweMessage = new SiweMessage(message);
  const { data: fields, success, error } = await siweMessage.verify({ signature });

  if (!success) {
    return c.json({ error: error?.type ?? 'Verification failed' }, 400);
  }

  const nonceKey = `nonce:${fields.nonce}`;
  const nonceExists = await redis.get(nonceKey);
  if (!nonceExists) {
    return c.json({ error: 'Invalid or expired nonce' }, 400);
  }
  await redis.del(nonceKey);

  const sessionPayload = Buffer.from(JSON.stringify({ address: fields.address })).toString('base64');
  setCookie(c, 'chimera-session', sessionPayload, {
    httpOnly: true,
    sameSite: 'Strict',
    path: '/',
  });

  return c.json({ address: fields.address });
});

auth.get('/session', async (c) => {
  const cookie = getCookie(c, 'chimera-session');
  if (!cookie) {
    return c.json({ authenticated: false });
  }
  try {
    const decoded = Buffer.from(cookie, 'base64').toString('utf-8');
    const session = JSON.parse(decoded) as { address: string };
    if (!session.address) {
      return c.json({ authenticated: false });
    }
    return c.json({ authenticated: true, address: session.address });
  } catch {
    return c.json({ authenticated: false });
  }
});

auth.delete('/session', async (c) => {
  deleteCookie(c, 'chimera-session', { path: '/' });
  return c.json({ authenticated: false });
});

export default auth;

import { createMiddleware } from 'hono/factory';
import { getCookie } from 'hono/cookie';

type Variables = {
  wallet: string;
};

export const requireAuth = createMiddleware<{ Variables: Variables }>(async (c, next) => {
  const cookie = getCookie(c, 'chimera-session');

  if (!cookie) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  try {
    const decoded = Buffer.from(cookie, 'base64').toString('utf-8');
    const session = JSON.parse(decoded) as { address: string };

    if (!session.address) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    c.set('wallet', session.address);
    await next();
  } catch {
    return c.json({ error: 'Unauthorized' }, 401);
  }
});

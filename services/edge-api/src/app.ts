import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { registerPasskeyRoutes } from './features/passkeys.js';
import { registerPasswordRoutes } from './features/password.js';
import { registerSocialRoutes } from './features/social.js';
import { getBearerToken, getSession, sessions } from './state.js';
import { deleteZitadelSession } from './zitadel.js';

export function createApp() {
  const app = new Hono();

  app.use('*', logger());
  app.use(
    '*',
    cors({
      origin: '*',
      allowHeaders: ['Authorization', 'Content-Type'],
      allowMethods: ['GET', 'POST', 'OPTIONS'],
    })
  );

  app.get('/health', (c) =>
    c.json({
      ok: true,
      service: 'zitadel-custom-auth-bff',
    })
  );

  registerPasswordRoutes(app);
  registerPasskeyRoutes(app);
  registerSocialRoutes(app);

  app.get('/auth/me', (c) => {
    const session = getSession(c.req.header('Authorization'));

    if (!session) {
      return c.json({ message: 'Unauthorized.' }, 401);
    }

    return c.json({ user: session.user });
  });

  app.post('/auth/logout', (c) => {
    const token = getBearerToken(c.req.header('Authorization'));

    if (token) {
      const session = sessions.get(token);
      sessions.delete(token);

      if (session) {
        deleteZitadelSession(session.zitadelSessionId, session.zitadelSessionToken).catch((error) => {
          console.warn(error instanceof Error ? error.message : 'Could not terminate ZITADEL session.');
        });
      }
    }

    return c.json({ ok: true });
  });

  return app;
}

export const app = createApp();

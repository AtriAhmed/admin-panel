import { serve } from '@hono/node-server';
import { app } from './app.js';
import { config } from './config.js';

serve(
  {
    fetch: app.fetch,
    hostname: config.host,
    port: config.port,
  },
  (info) => {
    console.log(`BFF listening on http://${info.address}:${info.port}`);
  }
);

// Pour API — Fastify server
import Fastify from 'fastify';
import cors from '@fastify/cors';
import rateLimit from '@fastify/rate-limit';
import { authPlugin } from './middleware/auth.js';
import { healthRoutes } from './routes/health.js';
import { spiritsRoutes } from './routes/spirits.js';
import { scanRoutes } from './routes/scan.js';
import { searchRoutes } from './routes/search.js';
import { usersRoutes } from './routes/users.js';
import { collectionsRoutes } from './routes/collections.js';
import { wishlistsRoutes } from './routes/wishlists.js';
import { ratingsRoutes } from './routes/ratings.js';
import { submissionsRoutes } from './routes/submissions.js';

const fastify = Fastify({
  logger: {
    level: process.env.NODE_ENV === 'production' ? 'warn' : 'info',
  },
});

async function start() {
  await fastify.register(cors, {
    origin: process.env.CORS_ORIGIN ?? '*',
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  });

  await fastify.register(rateLimit, {
    max: 200,
    timeWindow: '1 minute',
  });

  await fastify.register(authPlugin);

  // Routes
  await fastify.register(healthRoutes);
  await fastify.register(spiritsRoutes, { prefix: '/api' });
  await fastify.register(scanRoutes, { prefix: '/api' });
  await fastify.register(searchRoutes, { prefix: '/api' });
  await fastify.register(usersRoutes, { prefix: '/api' });
  await fastify.register(collectionsRoutes, { prefix: '/api' });
  await fastify.register(wishlistsRoutes, { prefix: '/api' });
  await fastify.register(ratingsRoutes, { prefix: '/api' });
  await fastify.register(submissionsRoutes, { prefix: '/api' });

  const port = Number(process.env.PORT ?? 3000);
  const host = process.env.HOST ?? '0.0.0.0';

  await fastify.listen({ port, host });
  console.log(`Pour API listening on ${host}:${port}`);
}

start().catch((err) => {
  console.error(err);
  process.exit(1);
});

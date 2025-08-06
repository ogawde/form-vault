import Fastify from 'fastify';
import cors from '@fastify/cors';
import rateLimit from '@fastify/rate-limit';
import jwt from '@fastify/jwt';
import { env } from './config/env';
import { registerAuthRoutes } from './routes/auth.routes';
import { authMiddleware } from './middleware/auth.middleware';

const app = Fastify({
  logger: true,
});

app.register(cors, {
  origin: true,
  credentials: true,
});

app.register(rateLimit, {
  max: 100,
  timeWindow: '1 minute',
});

app.register(jwt, {
  secret: env.JWT_SECRET,
});

app.decorate('authenticate', async function (request: any, reply: any) {
  await authMiddleware(request, reply);
});


app.get('/health', async (request, reply) => {
  return { status: 'ok', timestamp: new Date().toISOString() };
});

app.register(registerAuthRoutes);


const start = async () => {
  try {
    await app.listen({ port: env.PORT, host: '0.0.0.0' });
    app.log.info(`Server listening on http://localhost:${env.PORT}`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
};

start();

declare module 'fastify' {
  interface FastifyInstance {
    authenticate: any;
  }
}


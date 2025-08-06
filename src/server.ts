import Fastify from 'fastify';
import cors from '@fastify/cors';
import jwt from '@fastify/jwt';
import rateLimit from '@fastify/rate-limit';
import { config } from 'dotenv';

config();

const fastify = Fastify({
    logger: true
});


const start = async () => {
    try {
        await fastify.register(cors, {
            origin: true,
            credentials: true
        });

        await fastify.register(jwt, {
            secret: 'secret-key'
        });


        await fastify.register(rateLimit, {
            max: 100,
            timeWindow: '15 minutes'
        });


        fastify.get('/health', async (request, reply) => {
            return { status: 'ok', timestamp: new Date().toISOString() };
        });


        fastify.get('/', async (request, reply) => {
            return { message: 'FormVault API is started successfully' };
        });

        const port = Number(process.env.PORT) || 3000;
        const host = process.env.HOST || '0.0.0.0';

        await fastify.listen({ port, host });

    } catch (err) {
        fastify.log.error(err);
        process.exit(1);
    }
};

start();
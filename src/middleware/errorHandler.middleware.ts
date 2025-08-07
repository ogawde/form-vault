import { FastifyInstance, FastifyError } from 'fastify';
import { ZodError } from 'zod';

export const registerErrorHandler = (app: FastifyInstance) => {
  app.setErrorHandler((error: FastifyError, request, reply) => {
    if (error instanceof ZodError) {
      reply.code(400).send({
        success: false,
        error: 'Validation error',
        details: error.errors.map(err => ({
          path: err.path.join('.'),
          message: err.message,
        })),
      });
      return;
    }

    const statusCode = error.statusCode || 500;
    const message = error.message || 'Internal server error';

    if (statusCode >= 500) {
      app.log.error(error);
    } else {
      app.log.warn(error);
    }

    reply.code(statusCode).send({
      success: false,
      error: message,
    });
  });

  app.setNotFoundHandler((request, reply) => {
    reply.code(404).send({
      success: false,
      error: 'Route not found',
    });
  });
};


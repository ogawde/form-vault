export interface FastifyUser {
  id: string;
  email: string;
  name: string | null;
}

declare module 'fastify' {
  interface FastifyRequest {
    user?: FastifyUser;
  }
}

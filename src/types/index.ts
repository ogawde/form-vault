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

export interface PaginationParams {
  page: number;
  limit: number;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}


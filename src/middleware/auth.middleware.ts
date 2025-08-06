import { FastifyRequest, FastifyReply } from 'fastify';
import { prisma } from '../config/database';

export const authMiddleware = async (
  request: FastifyRequest,
  reply: FastifyReply
) => {
  try {
    const token = request.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      reply.code(401).send({
        success: false,
        error: 'No token provided',
      });
      return;
    }

    const decoded = await request.jwtVerify();
    const userId = (decoded as any).id;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
      },
    });

    if (!user) {
      reply.code(401).send({
        success: false,
        error: 'Invalid token',
      });
      return;
    }

    request.user = user;
  } catch (error) {
    reply.code(401).send({
      success: false,
      error: 'Invalid or expired token',
    });
  }
};


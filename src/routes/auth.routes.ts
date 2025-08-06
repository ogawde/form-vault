import { FastifyInstance } from 'fastify';
import { registerUser, loginUser } from '../services/auth.service';
import { registerSchema, loginSchema } from '../schemas/auth.schema';

export const registerAuthRoutes = async (app: FastifyInstance) => {
  app.post('/api/auth/register', async (request, reply) => {
    const validated = registerSchema.parse(request.body);
    
    const sanitized = {
      email: validated.email.trim().toLowerCase(),
      password: validated.password,
      name: validated.name ? validated.name.trim() : undefined,
    };

    try {
      const result = await registerUser(sanitized);

      reply.code(201).send({
        success: true,
        data: result,
      });
    } catch (error: any) {
      if (error.message === 'Email already exists') {
        reply.code(409).send({
          success: false,
          error: 'Email already exists',
        });
        return;
      }
      throw error;
    }
  });

  app.post('/api/auth/login', async (request, reply) => {
    const validated = loginSchema.parse(request.body);
    
    const sanitized = {
      email: validated.email.trim().toLowerCase(),
      password: validated.password,
    };

    try {
      const result = await loginUser(sanitized);

      reply.code(200).send({
        success: true,
        data: result,
      });
    } catch (error: any) {
      if (error.message === 'Invalid email or password') {
        reply.code(401).send({
          success: false,
          error: 'Invalid email or password',
        });
        return;
      }
      throw error;
    }
  });
};


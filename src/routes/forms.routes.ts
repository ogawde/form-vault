import { FastifyInstance } from 'fastify';
import {
  createForm,
  getFormsByUserId,
  getFormById,
  updateForm,
  deleteForm,
} from '../services/form.service';
import { createFormSchema, updateFormSchema, listFormsSchema } from '../schemas/form.schema';
import type { FastifyUser } from '../types';

export const registerFormRoutes = async (app: FastifyInstance) => {
  app.post('/api/forms', { preHandler: [app.authenticate] }, async (request, reply) => {
    if (!request.user) {
      reply.code(401).send({ success: false, error: 'Unauthorized' });
      return;
    }

    const validated = createFormSchema.parse(request.body);

    const user = request.user as FastifyUser;
    const form = await createForm({
      name: validated.name,
      description: validated.description ?? undefined,
      redirectUrl: validated.redirectUrl ?? undefined,
      notificationEmail: validated.notificationEmail ?? undefined,
      allowedOrigins: validated.allowedOrigins ?? undefined,
      userId: user.id,
    });

    reply.code(201).send({
      success: true,
      data: {
        ...form,
        endpoint: `${process.env.API_BASE_URL || 'http://localhost:3000'}/s/${form.id}`,
      },
    });
  });

  app.get('/api/forms', { preHandler: [app.authenticate] }, async (request, reply) => {
    if (!request.user) {
      reply.code(401).send({ success: false, error: 'Unauthorized' });
      return;
    }

    const query = listFormsSchema.parse(request.query);

    const user = request.user as FastifyUser;
    const result = await getFormsByUserId(
      user.id,
      query.page,
      query.limit,
      query.sortBy,
      query.order
    );

    const formsWithEndpoint = (result.forms as Array<{ id: string }>).map(form => ({
      ...form,
      endpoint: `${process.env.API_BASE_URL || 'http://localhost:3000'}/s/${form.id}`,
    }));

    reply.code(200).send({
      success: true,
      data: {
        forms: formsWithEndpoint,
        pagination: result.pagination,
      },
    });
  });

  app.get('/api/forms/:formId', { preHandler: [app.authenticate] }, async (request, reply) => {
    if (!request.user) {
      reply.code(401).send({ success: false, error: 'Unauthorized' });
      return;
    }

    const { formId } = request.params as { formId: string };
    const user = request.user as FastifyUser;

    try {
      const form = await getFormById(formId, user.id);

      if (!form) {
        reply.code(404).send({
          success: false,
          error: 'Form not found',
        });
        return;
      }

      reply.code(200).send({
        success: true,
        data: {
          ...form,
          endpoint: `${process.env.API_BASE_URL || 'http://localhost:3000'}/s/${form.id}`,
        },
      });
    } catch (error: any) {
      if (error.message === 'Forbidden: You do not own this form') {
        reply.code(403).send({
          success: false,
          error: 'Forbidden: You do not own this form',
        });
        return;
      }
      throw error;
    }
  });

  app.patch('/api/forms/:formId', { preHandler: [app.authenticate] }, async (request, reply) => {
    if (!request.user) {
      reply.code(401).send({ success: false, error: 'Unauthorized' });
      return;
    }

    const { formId } = request.params as { formId: string };
    const validated = updateFormSchema.parse(request.body);
    const user = request.user as FastifyUser;

    const updateData: any = {};
    if (validated.name) updateData.name = validated.name;
    if (validated.description !== undefined) {
      updateData.description = validated.description ? validated.description : null;
    }
    if (validated.redirectUrl !== undefined) {
      updateData.redirectUrl = validated.redirectUrl ? validated.redirectUrl : null;
    }
    if (validated.notificationEmail !== undefined) {
      updateData.notificationEmail = validated.notificationEmail ? validated.notificationEmail : null;
    }
    if (validated.allowedOrigins) updateData.allowedOrigins = validated.allowedOrigins;
    if (validated.isActive !== undefined) updateData.isActive = validated.isActive;

    try {
      const form = await updateForm(formId, user.id, updateData);

      reply.code(200).send({
        success: true,
        data: {
          ...form,
          endpoint: `${process.env.API_BASE_URL || 'http://localhost:3000'}/s/${form.id}`,
        },
      });
    } catch (error: any) {
      if (error.message === 'Form not found') {
        reply.code(404).send({
          success: false,
          error: 'Form not found',
        });
        return;
      }
      if (error.message === 'Forbidden: You do not own this form') {
        reply.code(403).send({
          success: false,
          error: 'Forbidden: You do not own this form',
        });
        return;
      }
      throw error;
    }
  });

  app.delete('/api/forms/:formId', { preHandler: [app.authenticate] }, async (request, reply) => {
    if (!request.user) {
      reply.code(401).send({ success: false, error: 'Unauthorized' });
      return;
    }

    const { formId } = request.params as { formId: string };
    const user = request.user as FastifyUser;

    try {
      await deleteForm(formId, user.id);

      reply.code(200).send({
        success: true,
        message: 'Form and all submissions deleted successfully',
      });
    } catch (error: any) {
      if (error.message === 'Form not found') {
        reply.code(404).send({
          success: false,
          error: 'Form not found',
        });
        return;
      }
      if (error.message === 'Forbidden: You do not own this form') {
        reply.code(403).send({
          success: false,
          error: 'Forbidden: You do not own this form',
        });
        return;
      }
      throw error;
    }
  });
};


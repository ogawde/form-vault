import { FastifyInstance } from 'fastify';
import {
  createSubmission,
  getSubmissionsByFormId,
  getSubmissionById,
  deleteSubmission,
  exportSubmissions,
} from '../services/submission.service';
import {
  getFormByIdPublic,
} from '../services/form.service';
import { listSubmissionsSchema, exportSubmissionsSchema } from '../schemas/submission.schema';
import type { FastifyUser } from '../types';

export const registerSubmissionRoutes = async (app: FastifyInstance) => {
  app.post('/s/:formId', async (request, reply) => {
    const { formId } = request.params as { formId: string };

    const form = await getFormByIdPublic(formId);

    if (!form) {
      reply.code(404).send({
        success: false,
        error: 'Form not found',
      });
      return;
    }

    if (!form.isActive) {
      reply.code(403).send({
        success: false,
        error: 'Form is not active',
      });
      return;
    }

    const allowedOrigins = form.allowedOrigins as string[] | null;
    
    if (allowedOrigins && allowedOrigins.length > 0) {
      const origin = request.headers.origin || request.headers.referer;
      const isAllowed = allowedOrigins.some(allowedOrigin => 
        origin?.includes(allowedOrigin)
      );
      
      if (!isAllowed) {
        reply.code(403).send({
          success: false,
          error: 'Origin not allowed',
        });
        return;
      }
    }

    const data = request.body as Record<string, any>;
    const ipAddress = (request.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || 
                     (request.socket.remoteAddress as string);
    const uaHeader = request.headers['user-agent'];
    const userAgent = Array.isArray(uaHeader) ? uaHeader[0] : uaHeader;
    const refHeader = request.headers.referer || request.headers.referrer;
    const referrer = Array.isArray(refHeader) ? refHeader[0] : refHeader;

    try {
      const submission = await createSubmission({
        formId,
        data,
        ipAddress,
        userAgent,
        referrer,
      });

      const acceptHeader = request.headers.accept || '';
      const wantsJson = acceptHeader.includes('application/json');

      if (form.redirectUrl) {
        reply.redirect(form.redirectUrl, 303);
        return;
      }

      if (wantsJson) {
        reply.code(201).send({
          success: true,
          message: 'Submission received successfully',
          submissionId: submission.id,
        });
      } else {
        reply.code(201).header('Content-Type', 'text/html').send(`
          <!DOCTYPE html>
          <html>
            <head>
              <title>Submission Successful</title>
              <style>
                body {
                  font-family: system-ui, -apple-system, sans-serif;
                  display: flex;
                  justify-content: center;
                  align-items: center;
                  min-height: 100vh;
                  margin: 0;
                  background: white;
                  color: black;
                }
                .container {
                  text-align: center;
                  padding: 2rem;
                }
                h1 { color: black; }
                p { color: #666; }
              </style>
            </head>
            <body>
              <div class="container">
                <h1>✓ Submission Successful</h1>
                <p>Thank you! Your form has been submitted successfully.</p>
              </div>
            </body>
          </html>
        `);
      }
    } catch (error) {
      throw error;
    }
  });

  app.get('/api/forms/:formId/submissions', { preHandler: [app.authenticate] }, async (request, reply) => {
    if (!request.user) {
      reply.code(401).send({ success: false, error: 'Unauthorized' });
      return;
    }

    const { formId } = request.params as { formId: string };
    const query = listSubmissionsSchema.parse(request.query);

    try {
      const user = request.user as FastifyUser;
      const result = await getSubmissionsByFormId(
        formId,
        user.id,
        query.page,
        query.limit,
        query.sortBy,
        query.order,
        query.search,
        query.startDate,
        query.endDate
      );

      reply.code(200).send({
        success: true,
        data: result,
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

  app.get('/api/forms/:formId/submissions/:submissionId', { preHandler: [app.authenticate] }, async (request, reply) => {
    if (!request.user) {
      reply.code(401).send({ success: false, error: 'Unauthorized' });
      return;
    }

    const { formId, submissionId } = request.params as { formId: string; submissionId: string };

    try {
      const user = request.user as FastifyUser;
      const submission = await getSubmissionById(submissionId, formId, user.id);

      if (!submission) {
        reply.code(404).send({
          success: false,
          error: 'Submission not found',
        });
        return;
      }

      reply.code(200).send({
        success: true,
        data: submission,
      });
    } catch (error: any) {
      if (error.message === 'Submission does not belong to this form' || 
          error.message === 'Forbidden: You do not own this form') {
        reply.code(403).send({
          success: false,
          error: error.message,
        });
        return;
      }
      throw error;
    }
  });

  app.delete('/api/forms/:formId/submissions/:submissionId', { preHandler: [app.authenticate] }, async (request, reply) => {
    if (!request.user) {
      reply.code(401).send({ success: false, error: 'Unauthorized' });
      return;
    }

    const { formId, submissionId } = request.params as { formId: string; submissionId: string };

    try {
      const user = request.user as FastifyUser;
      await deleteSubmission(submissionId, formId, user.id);

      reply.code(200).send({
        success: true,
        message: 'Submission deleted successfully',
      });
    } catch (error: any) {
      if (error.message === 'Submission not found') {
        reply.code(404).send({
          success: false,
          error: 'Submission not found',
        });
        return;
      }
      if (error.message === 'Submission does not belong to this form' || 
          error.message === 'Forbidden: You do not own this form') {
        reply.code(403).send({
          success: false,
          error: error.message,
        });
        return;
      }
      throw error;
    }
  });

  app.get('/api/forms/:formId/export', { preHandler: [app.authenticate] }, async (request, reply) => {
    if (!request.user) {
      reply.code(401).send({ success: false, error: 'Unauthorized' });
      return;
    }

    const { formId } = request.params as { formId: string };
    const query = exportSubmissionsSchema.parse(request.query);

    try {
      const user = request.user as FastifyUser;
      const data = await exportSubmissions(
        formId,
        user.id,
        query.format,
        query.startDate,
        query.endDate
      );

      const timestamp = new Date().toISOString().split('T')[0];
      const filename = `form-${formId}-${timestamp}.${query.format}`;
      const contentType = query.format === 'json' ? 'application/json' : 'text/csv';

      reply
        .code(200)
        .header('Content-Type', contentType)
        .header('Content-Disposition', `attachment; filename="${filename}"`)
        .send(data);
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


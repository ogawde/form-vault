import { z } from 'zod';

export const createFormSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name must be less than 100 characters'),
  description: z.string().max(500, 'Description must be less than 500 characters').optional(),
  redirectUrl: z.string().url('Invalid URL format').optional(),
  notificationEmail: z.string().email('Invalid email format').optional(),
  allowedOrigins: z.array(z.string().url('Invalid URL format')).optional(),
});

export const updateFormSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name must be less than 100 characters').optional(),
  description: z.string().max(500, 'Description must be less than 500 characters').optional().nullable(),
  redirectUrl: z.string().url('Invalid URL format').optional().nullable(),
  notificationEmail: z.string().email('Invalid email format').optional().nullable(),
  allowedOrigins: z.array(z.string().url('Invalid URL format')).optional(),
  isActive: z.boolean().optional(),
});

export const listFormsSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
  sortBy: z.enum(['createdAt', 'name', 'submissionCount']).default('createdAt'),
  order: z.enum(['asc', 'desc']).default('desc'),
});

export type CreateFormInput = z.infer<typeof createFormSchema>;
export type UpdateFormInput = z.infer<typeof updateFormSchema>;
export type ListFormsQuery = z.infer<typeof listFormsSchema>;


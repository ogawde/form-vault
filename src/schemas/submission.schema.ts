import { z } from 'zod';

export const listSubmissionsSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  sortBy: z.enum(['createdAt']).default('createdAt'),
  order: z.enum(['asc', 'desc']).default('desc'),
  search: z.string().optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
});

export const exportSubmissionsSchema = z.object({
  format: z.enum(['csv', 'json']).default('csv'),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
});

export type ListSubmissionsQuery = z.infer<typeof listSubmissionsSchema>;
export type ExportSubmissionsQuery = z.infer<typeof exportSubmissionsSchema>;


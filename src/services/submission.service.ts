import { prisma } from '../config/database';

interface CreateSubmissionInput {
  formId: string;
  data: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  referrer?: string;
}

export const createSubmission = async (input: CreateSubmissionInput) => {
  const [submission] = await prisma.$transaction([
    prisma.submission.create({
      data: {
        formId: input.formId,
        data: input.data,
        ipAddress: input.ipAddress,
        userAgent: input.userAgent,
        referrer: input.referrer,
      },
    }),
    prisma.form.update({
      where: { id: input.formId },
      data: {
        submissionCount: {
          increment: 1,
        },
      },
    }),
  ]);

  return submission;
};

export const getSubmissionsByFormId = async (
  formId: string,
  userId: string,
  page: number = 1,
  limit: number = 20,
  sortBy: string = 'createdAt',
  order: 'asc' | 'desc' = 'desc',
  search?: string,
  startDate?: string,
  endDate?: string
) => {
  const form = await prisma.form.findUnique({
    where: { id: formId },
  });

  if (!form) {
    throw new Error('Form not found');
  }

  if (form.userId !== userId) {
    throw new Error('Forbidden: You do not own this form');
  }

  const skip = (page - 1) * limit;
  const orderBy: any = { [sortBy]: order };

  const where: any = { formId };

  if (startDate || endDate) {
    where.createdAt = {};
    if (startDate) where.createdAt.gte = new Date(startDate);
    if (endDate) where.createdAt.lte = new Date(endDate);
  }

  const [submissions, total] = await Promise.all([
    prisma.submission.findMany({
      where,
      skip,
      take: limit,
      orderBy,
    }),
    prisma.submission.count({ where }),
  ]);

  let filteredSubmissions = submissions;

  if (search) {
    const searchLower = search.toLowerCase();
    filteredSubmissions = submissions.filter(submission => {
      const dataStr = JSON.stringify(submission.data).toLowerCase();
      return dataStr.includes(searchLower);
    });
  }

  return {
    submissions: filteredSubmissions,
    pagination: {
      page,
      limit,
      total: search ? filteredSubmissions.length : total,
      totalPages: Math.ceil((search ? filteredSubmissions.length : total) / limit),
    },
  };
};

export const getSubmissionById = async (submissionId: string, formId: string, userId: string) => {
  const submission = await prisma.submission.findUnique({
    where: { id: submissionId },
  });

  if (!submission) {
    return null;
  }

  if (submission.formId !== formId) {
    throw new Error('Submission does not belong to this form');
  }

  const form = await prisma.form.findUnique({
    where: { id: formId },
  });

  if (!form || form.userId !== userId) {
    throw new Error('Forbidden: You do not own this form');
  }

  return submission;
};

export const deleteSubmission = async (submissionId: string, formId: string, userId: string) => {
  const submission = await prisma.submission.findUnique({
    where: { id: submissionId },
  });

  if (!submission) {
    throw new Error('Submission not found');
  }

  if (submission.formId !== formId) {
    throw new Error('Submission does not belong to this form');
  }

  const form = await prisma.form.findUnique({
    where: { id: formId },
  });

  if (!form || form.userId !== userId) {
    throw new Error('Forbidden: You do not own this form');
  }

  await prisma.$transaction([
    prisma.submission.delete({
      where: { id: submissionId },
    }),
    prisma.form.update({
      where: { id: formId },
      data: {
        submissionCount: {
          decrement: 1,
        },
      },
    }),
  ]);

  return true;
};

export const exportSubmissions = async (
  formId: string,
  userId: string,
  format: 'csv' | 'json' = 'csv',
  startDate?: string,
  endDate?: string
) => {
  const form = await prisma.form.findUnique({
    where: { id: formId },
  });

  if (!form) {
    throw new Error('Form not found');
  }

  if (form.userId !== userId) {
    throw new Error('Forbidden: You do not own this form');
  }

  const where: any = { formId };
  
  if (startDate || endDate) {
    where.createdAt = {};
    if (startDate) where.createdAt.gte = new Date(startDate);
    if (endDate) where.createdAt.lte = new Date(endDate);
  }

  const submissions = await prisma.submission.findMany({
    where,
    orderBy: { createdAt: 'desc' },
  });

  if (format === 'json') {
    return JSON.stringify(submissions, null, 2);
  }

  if (submissions.length === 0) {
    return 'No submissions found\n';
  }

  const allKeys = new Set<string>();
  submissions.forEach(sub => {
    Object.keys(sub.data as Record<string, any>).forEach(key => {
      allKeys.add(key);
    });
  });

  const keys = Array.from(allKeys).sort();
  const headers = ['ID', 'Created At', 'IP Address', 'User Agent', 'Referrer', ...keys];

  const rows = submissions.map(sub => {
    const data = sub.data as Record<string, any>;
    const values = [
      sub.id,
      sub.createdAt.toISOString(),
      sub.ipAddress || '',
      sub.userAgent || '',
      sub.referrer || '',
      ...keys.map(key => {
        const value = data[key];
        if (value === null || value === undefined) return '';
        const str = String(value);
        return str.includes(',') ? `"${str.replace(/"/g, '""')}"` : str;
      }),
    ];
    return values.join(',');
  });

  return [headers.join(','), ...rows].join('\n');
};


import { nanoid } from 'nanoid';
import { prisma } from '../config/database';

interface CreateFormInput {
  userId: string;
  name: string;
  description?: string;
  redirectUrl?: string;
  notificationEmail?: string;
  allowedOrigins?: string[];
}

interface UpdateFormInput {
  name?: string;
  description?: string;
  redirectUrl?: string;
  notificationEmail?: string;
  allowedOrigins?: string[];
  isActive?: boolean;
}

const generateUniqueFormId = async (): Promise<string> => {
  let id: string;
  let exists = true;
  
  while (exists) {
    id = nanoid(8);
    const form = await prisma.form.findUnique({ where: { id } });
    exists = !!form;
  }
  
  return id!;
};

export const createForm = async (input: CreateFormInput) => {
  const formId = await generateUniqueFormId();
  
  const form = await prisma.form.create({
    data: {
      id: formId,
      userId: input.userId,
      name: input.name,
      description: input.description,
      redirectUrl: input.redirectUrl,
      notificationEmail: input.notificationEmail,
      allowedOrigins: input.allowedOrigins || [],
      isActive: true,
    },
  });

  return form;
};

export const getFormsByUserId = async (
  userId: string,
  page: number = 1,
  limit: number = 10,
  sortBy: string = 'createdAt',
  order: 'asc' | 'desc' = 'desc'
) => {
  const skip = (page - 1) * limit;
  
  const orderBy: any = { [sortBy]: order };
  
  const [forms, total] = await Promise.all([
    prisma.form.findMany({
      where: { userId },
      skip,
      take: limit,
      orderBy,
      select: {
        id: true,
        name: true,
        description: true,
        isActive: true,
        submissionCount: true,
        createdAt: true,
        updatedAt: true,
      },
    }),
    prisma.form.count({ where: { userId } }),
  ]);

  return {
    forms,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

export const getFormById = async (formId: string, userId: string) => {
  const form = await prisma.form.findUnique({
    where: { id: formId },
  });

  if (!form) {
    return null;
  }

  if (form.userId !== userId) {
    throw new Error('Forbidden: You do not own this form');
  }

  const recentSubmissions = await prisma.submission.findMany({
    where: { formId },
    orderBy: { createdAt: 'desc' },
    take: 5,
    select: {
      id: true,
      data: true,
      createdAt: true,
    },
  });

  return {
    ...form,
    recentSubmissions,
  };
};

export const getFormByIdPublic = async (formId: string) => {
  return prisma.form.findUnique({
    where: { id: formId },
  });
};

export const updateForm = async (
  formId: string,
  userId: string,
  input: UpdateFormInput
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

  const updatedForm = await prisma.form.update({
    where: { id: formId },
    data: input,
  });

  return updatedForm;
};

export const deleteForm = async (formId: string, userId: string) => {
  const form = await prisma.form.findUnique({
    where: { id: formId },
  });

  if (!form) {
    throw new Error('Form not found');
  }

  if (form.userId !== userId) {
    throw new Error('Forbidden: You do not own this form');
  }

  await prisma.form.delete({
    where: { id: formId },
  });

  return true;
};


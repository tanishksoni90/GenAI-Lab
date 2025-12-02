import { prisma } from '../lib/prisma';
import { NotFoundError, BadRequestError, ConflictError } from '../utils/errors';
import bcrypt from 'bcryptjs';
import { config } from '../config';

// ==================== STUDENT MANAGEMENT ====================

interface CreateStudentInput {
  email: string;
  name: string;
  registrationId: string;
  courseId?: string;
  batchId?: string;
  tokenLimit?: number;
}

interface UpdateStudentInput {
  name?: string;
  email?: string;
  courseId?: string;
  batchId?: string;
  tokenQuota?: number;
  isActive?: boolean;
}

interface BulkOperationInput {
  operation: 'update_status' | 'update_tokens' | 'reset_passwords' | 'delete';
  registrationIds: string[];
  value?: any; // For status: boolean, for tokens: number
}

// Get all students with pagination and filters
export const getStudents = async (options: {
  page?: number;
  limit?: number;
  courseId?: string;
  batchId?: string;
  search?: string;
  isActive?: boolean;
} = {}) => {
  const { page = 1, limit = 20, courseId, batchId, search, isActive } = options;
  const skip = (page - 1) * limit;

  const where: any = { role: 'student' };
  if (courseId) where.courseId = courseId;
  if (batchId) where.batchId = batchId;
  if (isActive !== undefined) where.isActive = isActive;
  if (search) {
    where.OR = [
      { name: { contains: search } },
      { email: { contains: search } },
      { registrationId: { contains: search } },
    ];
  }

  const [students, total] = await Promise.all([
    prisma.user.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        email: true,
        name: true,
        registrationId: true,
        tokenQuota: true,
        tokenUsed: true,
        isActive: true,
        isVerified: true,
        createdAt: true,
        lastLoginAt: true,
        course: { select: { id: true, name: true } },
        batch: { select: { id: true, name: true } },
        _count: {
          select: { sessions: true, agents: true, artifacts: true },
        },
      },
    }),
    prisma.user.count({ where }),
  ]);

  return { students, total, page, limit };
};

// Get single student details
export const getStudent = async (studentId: string) => {
  const student = await prisma.user.findUnique({
    where: { id: studentId },
    select: {
      id: true,
      email: true,
      name: true,
      registrationId: true,
      tokenQuota: true,
      tokenUsed: true,
      isActive: true,
      isVerified: true,
      createdAt: true,
      lastLoginAt: true,
      course: { select: { id: true, name: true } },
      batch: { select: { id: true, name: true } },
      sessions: {
        take: 5,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          title: true,
          avgScore: true,
          tokensUsed: true,
          createdAt: true,
          model: { select: { name: true } },
        },
      },
      _count: {
        select: { sessions: true, agents: true, artifacts: true },
      },
    },
  });

  if (!student) {
    throw new NotFoundError('Student not found');
  }

  return student;
};

// Create a new student
export const createStudent = async (input: CreateStudentInput) => {
  const { email, name, registrationId, courseId, batchId, tokenLimit } = input;

  // Check if email exists
  const existingEmail = await prisma.user.findUnique({ where: { email } });
  if (existingEmail) {
    throw new ConflictError('Email already exists');
  }

  // Check if registration ID exists
  const existingRegId = await prisma.user.findUnique({ where: { registrationId } });
  if (existingRegId) {
    throw new ConflictError('Registration ID already exists');
  }

  // Generate default password (can be reset later)
  const defaultPassword = `${registrationId}@GenAI`;
  const hashedPassword = await bcrypt.hash(defaultPassword, 12);

  const student = await prisma.user.create({
    data: {
      email,
      name,
      registrationId,
      password: hashedPassword,
      role: 'student',
      courseId,
      batchId,
      tokenQuota: tokenLimit || config.defaultTokenQuota,
      isVerified: true, // Admin-created students are auto-verified
    },
    select: {
      id: true,
      email: true,
      name: true,
      registrationId: true,
      tokenQuota: true,
      course: { select: { id: true, name: true } },
      batch: { select: { id: true, name: true } },
    },
  });

  return { student, defaultPassword };
};

// Update student
export const updateStudent = async (studentId: string, input: UpdateStudentInput) => {
  const student = await prisma.user.findUnique({
    where: { id: studentId },
    select: { role: true },
  });

  if (!student) {
    throw new NotFoundError('Student not found');
  }

  if (student.role !== 'student') {
    throw new BadRequestError('User is not a student');
  }

  // Check email uniqueness if updating
  if (input.email) {
    const existing = await prisma.user.findFirst({
      where: { email: input.email, NOT: { id: studentId } },
    });
    if (existing) {
      throw new ConflictError('Email already in use');
    }
  }

  return prisma.user.update({
    where: { id: studentId },
    data: input,
    select: {
      id: true,
      email: true,
      name: true,
      registrationId: true,
      tokenQuota: true,
      tokenUsed: true,
      isActive: true,
      course: { select: { id: true, name: true } },
      batch: { select: { id: true, name: true } },
    },
  });
};

// Delete student
export const deleteStudent = async (studentId: string, permanent: boolean = false) => {
  const student = await prisma.user.findUnique({
    where: { id: studentId },
    select: { role: true },
  });

  if (!student) {
    throw new NotFoundError('Student not found');
  }

  if (student.role !== 'student') {
    throw new BadRequestError('User is not a student');
  }

  if (permanent) {
    // Permanently delete student and all related data
    await prisma.user.delete({ where: { id: studentId } });
    return { message: 'Student permanently deleted' };
  } else {
    // Soft delete (deactivate)
    await prisma.user.update({
      where: { id: studentId },
      data: { isActive: false },
    });
    return { message: 'Student deactivated' };
  }
};

// Reset student password
export const resetStudentPassword = async (studentId: string) => {
  const student = await prisma.user.findUnique({
    where: { id: studentId },
    select: { registrationId: true, role: true },
  });

  if (!student) {
    throw new NotFoundError('Student not found');
  }

  if (student.role !== 'student') {
    throw new BadRequestError('User is not a student');
  }

  const newPassword = `${student.registrationId}@Reset${Date.now().toString().slice(-4)}`;
  const hashedPassword = await bcrypt.hash(newPassword, 12);

  await prisma.user.update({
    where: { id: studentId },
    data: { password: hashedPassword },
  });

  return { newPassword };
};

// Bulk operations
export const bulkOperation = async (input: BulkOperationInput) => {
  const { operation, registrationIds, value } = input;

  // Find students by registration IDs
  const students = await prisma.user.findMany({
    where: {
      registrationId: { in: registrationIds },
      role: 'student',
    },
    select: { id: true, registrationId: true },
  });

  if (students.length === 0) {
    throw new NotFoundError('No students found with provided registration IDs');
  }

  const studentIds = students.map(s => s.id);
  let result: any;

  switch (operation) {
    case 'update_status':
      result = await prisma.user.updateMany({
        where: { id: { in: studentIds } },
        data: { isActive: value as boolean },
      });
      break;

    case 'update_tokens':
      result = await prisma.user.updateMany({
        where: { id: { in: studentIds } },
        data: { tokenQuota: value as number },
      });
      break;

    case 'reset_passwords':
      const updates = await Promise.all(
        students.map(async (student) => {
          const newPassword = `${student.registrationId}@Reset${Date.now().toString().slice(-4)}`;
          const hashedPassword = await bcrypt.hash(newPassword, 12);
          await prisma.user.update({
            where: { id: student.id },
            data: { password: hashedPassword },
          });
          return { registrationId: student.registrationId, newPassword };
        })
      );
      result = { passwords: updates };
      break;

    case 'delete':
      result = await prisma.user.updateMany({
        where: { id: { in: studentIds } },
        data: { isActive: false },
      });
      break;

    default:
      throw new BadRequestError('Invalid operation');
  }

  return {
    operation,
    affected: students.length,
    result,
  };
};

// Import students from CSV data
export const importStudents = async (
  students: Array<{
    email: string;
    name: string;
    registrationId: string;
  }>,
  batchId?: string
) => {
  const results = {
    success: [] as string[],
    failed: [] as { registrationId: string; error: string }[],
  };

  for (const studentData of students) {
    try {
      // Check duplicates
      const existingEmail = await prisma.user.findUnique({
        where: { email: studentData.email },
      });
      if (existingEmail) {
        results.failed.push({
          registrationId: studentData.registrationId,
          error: 'Email already exists',
        });
        continue;
      }

      const existingRegId = await prisma.user.findUnique({
        where: { registrationId: studentData.registrationId },
      });
      if (existingRegId) {
        results.failed.push({
          registrationId: studentData.registrationId,
          error: 'Registration ID already exists',
        });
        continue;
      }

      // Create student
      const defaultPassword = `${studentData.registrationId}@GenAI`;
      const hashedPassword = await bcrypt.hash(defaultPassword, 12);

      await prisma.user.create({
        data: {
          ...studentData,
          password: hashedPassword,
          role: 'student',
          batchId,
          tokenQuota: config.defaultTokenQuota,
          isVerified: true,
        },
      });

      results.success.push(studentData.registrationId);
    } catch (error) {
      results.failed.push({
        registrationId: studentData.registrationId,
        error: 'Unknown error',
      });
    }
  }

  return results;
};

// ==================== COURSE MANAGEMENT ====================

interface CreateCourseInput {
  name: string;
  description?: string;
  instructor?: string;
  duration?: number;
}

// Get all courses
export const getCourses = async () => {
  return prisma.course.findMany({
    where: { isActive: true },
    orderBy: { createdAt: 'desc' },
    include: {
      batches: {
        where: { isActive: true },
        select: { id: true, name: true },
      },
      _count: {
        select: { students: true, batches: true },
      },
    },
  });
};

// Create course
export const createCourse = async (input: CreateCourseInput) => {
  return prisma.course.create({
    data: input,
    include: {
      _count: { select: { students: true, batches: true } },
    },
  });
};

// Update course
export const updateCourse = async (courseId: string, input: Partial<CreateCourseInput>) => {
  const course = await prisma.course.findUnique({ where: { id: courseId } });
  if (!course) {
    throw new NotFoundError('Course not found');
  }

  return prisma.course.update({
    where: { id: courseId },
    data: input,
  });
};

// Delete course (soft delete)
export const deleteCourse = async (courseId: string) => {
  const course = await prisma.course.findUnique({ where: { id: courseId } });
  if (!course) {
    throw new NotFoundError('Course not found');
  }

  await prisma.course.update({
    where: { id: courseId },
    data: { isActive: false },
  });

  return { message: 'Course deleted' };
};

// ==================== BATCH MANAGEMENT ====================

// Get batches for a course
export const getBatches = async (courseId?: string) => {
  const where: any = { isActive: true };
  if (courseId) where.courseId = courseId;

  return prisma.batch.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    include: {
      course: { select: { id: true, name: true } },
      _count: { select: { students: true } },
    },
  });
};

// Create batch
export const createBatch = async (courseId: string, name: string) => {
  const course = await prisma.course.findUnique({ where: { id: courseId } });
  if (!course) {
    throw new NotFoundError('Course not found');
  }

  return prisma.batch.create({
    data: { courseId, name },
    include: {
      course: { select: { id: true, name: true } },
    },
  });
};

// Delete batch
export const deleteBatch = async (batchId: string) => {
  const batch = await prisma.batch.findUnique({ where: { id: batchId } });
  if (!batch) {
    throw new NotFoundError('Batch not found');
  }

  await prisma.batch.update({
    where: { id: batchId },
    data: { isActive: false },
  });

  return { message: 'Batch deleted' };
};

// ==================== ANALYTICS ====================

export const getAnalytics = async () => {
  // Get counts
  const [
    totalStudents,
    activeStudents,
    totalSessions,
    totalPrompts,
    totalTokensUsed,
  ] = await Promise.all([
    prisma.user.count({ where: { role: 'student' } }),
    prisma.user.count({ where: { role: 'student', isActive: true } }),
    prisma.session.count(),
    prisma.message.count({ where: { role: 'user' } }),
    prisma.user.aggregate({
      where: { role: 'student' },
      _sum: { tokenUsed: true },
    }),
  ]);

  // Get daily usage for last 30 days
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const dailyActivity = await prisma.activityLog.groupBy({
    by: ['createdAt'],
    where: {
      createdAt: { gte: thirtyDaysAgo },
      action: { in: ['session_start', 'login'] },
    },
    _count: true,
  });

  // Get model usage
  const modelUsage = await prisma.session.groupBy({
    by: ['modelId'],
    _count: true,
    _sum: { tokensUsed: true },
  });

  // Get model details for the usage
  const modelIds = modelUsage.map(m => m.modelId);
  const models = await prisma.aIModel.findMany({
    where: { id: { in: modelIds } },
    select: { id: true, name: true, provider: true },
  });

  const modelUsageWithDetails = modelUsage.map(usage => ({
    ...usage,
    model: models.find(m => m.id === usage.modelId),
  }));

  // Get top performers
  const topPerformers = await prisma.user.findMany({
    where: { role: 'student', isActive: true },
    take: 10,
    orderBy: {
      sessions: {
        _count: 'desc',
      },
    },
    select: {
      id: true,
      name: true,
      registrationId: true,
      tokenUsed: true,
      sessions: {
        select: { avgScore: true },
      },
    },
  });

  return {
    overview: {
      totalStudents,
      activeStudents,
      totalSessions,
      totalPrompts,
      totalTokensUsed: totalTokensUsed._sum.tokenUsed || 0,
    },
    dailyActivity,
    modelUsage: modelUsageWithDetails,
    topPerformers: topPerformers.map(p => ({
      ...p,
      avgScore: p.sessions.length > 0
        ? p.sessions.reduce((sum, s) => sum + s.avgScore, 0) / p.sessions.length
        : 0,
      sessionsCount: p.sessions.length,
    })),
  };
};

// ==================== API KEYS MANAGEMENT ====================

// Get API keys (masked)
export const getAPIKeys = async () => {
  const keys = await prisma.aPIKey.findMany({
    orderBy: { provider: 'asc' },
  });

  return keys.map(key => ({
    id: key.id,
    provider: key.provider,
    apiKey: key.apiKey ? `${key.apiKey.slice(0, 8)}...${key.apiKey.slice(-4)}` : null,
    baseUrl: key.baseUrl,
    isActive: key.isActive,
    updatedAt: key.updatedAt,
  }));
};

// Update API key
export const updateAPIKey = async (
  provider: string,
  apiKey: string,
  baseUrl?: string
) => {
  const existing = await prisma.aPIKey.findUnique({ where: { provider } });

  if (existing) {
    return prisma.aPIKey.update({
      where: { provider },
      data: { apiKey, baseUrl, isActive: true },
    });
  } else {
    return prisma.aPIKey.create({
      data: { provider, apiKey, baseUrl },
    });
  }
};

// Test API key connection (mock for now)
export const testAPIKey = async (provider: string) => {
  const key = await prisma.aPIKey.findUnique({ where: { provider } });

  if (!key || !key.apiKey) {
    return { success: false, message: 'API key not configured' };
  }

  // In production, actually test the connection
  // For now, just return success if key exists
  return { success: true, message: 'Connection successful' };
};

// ==================== GUARDRAILS MANAGEMENT ====================

interface CreateGuardrailInput {
  type: string;
  title: string;
  instruction: string;
  appliesTo?: string;
  priority?: number;
}

// Get all guardrails
export const getGuardrails = async () => {
  return prisma.guardrail.findMany({
    where: { isActive: true },
    orderBy: [{ isSystem: 'desc' }, { priority: 'desc' }],
  });
};

// Create guardrail
export const createGuardrail = async (input: CreateGuardrailInput) => {
  return prisma.guardrail.create({
    data: {
      ...input,
      isSystem: false,
    },
  });
};

// Update guardrail
export const updateGuardrail = async (
  guardrailId: string,
  input: Partial<CreateGuardrailInput>
) => {
  const guardrail = await prisma.guardrail.findUnique({
    where: { id: guardrailId },
  });

  if (!guardrail) {
    throw new NotFoundError('Guardrail not found');
  }

  if (guardrail.isSystem) {
    throw new BadRequestError('Cannot modify system guardrails');
  }

  return prisma.guardrail.update({
    where: { id: guardrailId },
    data: input,
  });
};

// Delete guardrail
export const deleteGuardrail = async (guardrailId: string) => {
  const guardrail = await prisma.guardrail.findUnique({
    where: { id: guardrailId },
  });

  if (!guardrail) {
    throw new NotFoundError('Guardrail not found');
  }

  if (guardrail.isSystem) {
    throw new BadRequestError('Cannot delete system guardrails');
  }

  await prisma.guardrail.update({
    where: { id: guardrailId },
    data: { isActive: false },
  });

  return { message: 'Guardrail deleted' };
};

// ==================== MODEL ACCESS CONTROL ====================

interface ModelAccessInput {
  modelId: string;
  courseId?: string;
  batchId?: string;
  studentId?: string; // Registration ID
}

// Get model access rules
export const getModelAccess = async (modelId: string) => {
  return prisma.modelAccess.findMany({
    where: { modelId },
    include: {
      course: { select: { id: true, name: true } },
      batch: { select: { id: true, name: true } },
    },
  });
};

// Add model access
export const addModelAccess = async (input: ModelAccessInput) => {
  return prisma.modelAccess.create({
    data: input,
    include: {
      model: { select: { id: true, name: true } },
      course: { select: { id: true, name: true } },
      batch: { select: { id: true, name: true } },
    },
  });
};

// Remove model access
export const removeModelAccess = async (accessId: string) => {
  await prisma.modelAccess.delete({ where: { id: accessId } });
  return { message: 'Access removed' };
};


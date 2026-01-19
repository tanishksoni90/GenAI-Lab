import { prisma } from '../lib/prisma';
import { NotFoundError, BadRequestError, ConflictError } from '../utils/errors';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { config } from '../config';
import { clearApiKeyCache } from './ai.service';
import { getModelPricing, pricingUtils, PRICING_CONFIG } from '../config/pricing';
import { encrypt, decrypt, maskSensitiveValue } from '../utils/encryption';
import { logAdminAction } from '../utils/audit';

// ==================== HELPER FUNCTIONS ====================

/**
 * Generate a secure random password
 * Format: 3 random words + 2 digits + 1 special char
 * Example: "Tiger$Oak9Blue2!" or "River#Sun4Moon7@"
 */
function generateSecurePassword(): string {
  // Word lists for memorable but secure passwords
  const adjectives = ['Red', 'Blue', 'Green', 'Gold', 'Silver', 'Dark', 'Bright', 'Swift', 'Bold', 'Calm'];
  const nouns = ['Tiger', 'Eagle', 'River', 'Storm', 'Cloud', 'Stone', 'Flame', 'Ocean', 'Moon', 'Star'];
  const specials = ['!', '@', '#', '$', '%', '&', '*'];
  
  // Generate cryptographically secure random selections
  const randomBytes = crypto.randomBytes(6);
  
  const adj = adjectives[randomBytes[0] % adjectives.length];
  const noun1 = nouns[randomBytes[1] % nouns.length];
  const noun2 = nouns[randomBytes[2] % nouns.length];
  const digit1 = randomBytes[3] % 10;
  const digit2 = randomBytes[4] % 10;
  const special = specials[randomBytes[5] % specials.length];
  
  // Combine into a strong but memorable password
  // Format: Adjective + Special + Noun + Digit + Noun + Digit + Special
  return `${adj}${special}${noun1}${digit1}${noun2}${digit2}!`;
}

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

// Maximum pagination limit to prevent memory issues
const MAX_PAGE_LIMIT = 100;

// Get all students with pagination and filters
export const getStudents = async (options: {
  page?: number;
  limit?: number;
  courseId?: string;
  batchId?: string;
  search?: string;
  isActive?: boolean;
} = {}) => {
  // Enforce maximum limit to prevent memory issues
  const { page = 1, courseId, batchId, search, isActive } = options;
  const limit = Math.min(options.limit || 20, MAX_PAGE_LIMIT);
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

  const [studentsRaw, total] = await Promise.all([
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
        sessions: {
          select: { avgScore: true, agentId: true },
        },
        _count: {
          select: { agents: true, artifacts: true },
        },
      },
    }),
    prisma.user.count({ where }),
  ]);

  // Calculate average score and separate session counts for each student
  const students = studentsRaw.map(student => {
    const sessionsWithScore = student.sessions.filter(s => s.avgScore !== null);
    const avgScore = sessionsWithScore.length > 0
      ? sessionsWithScore.reduce((sum, s) => sum + (s.avgScore || 0), 0) / sessionsWithScore.length
      : null;
    
    // Separate model sessions (agentId = null) from agent sessions (agentId != null)
    const modelSessionsCount = student.sessions.filter(s => s.agentId === null).length;
    const agentSessionsCount = student.sessions.filter(s => s.agentId !== null).length;
    
    // Remove sessions array from response, just return counts and avgScore
    const { sessions, ...rest } = student;
    return { 
      ...rest, 
      avgScore,
      _count: {
        ...rest._count,
        sessions: modelSessionsCount, // Model sessions only for backward compatibility
        modelSessions: modelSessionsCount,
        agentSessions: agentSessionsCount,
      }
    };
  });

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
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          title: true,
          avgScore: true,
          tokensUsed: true,
          createdAt: true,
          agentId: true,
          model: { select: { name: true } },
        },
      },
      _count: {
        select: { agents: true, artifacts: true },
      },
    },
  });

  if (!student) {
    throw new NotFoundError('Student not found');
  }

  // Separate model sessions from agent sessions
  const modelSessions = student.sessions.filter(s => s.agentId === null);
  const agentSessions = student.sessions.filter(s => s.agentId !== null);

  return {
    ...student,
    // Return only last 5 model sessions for recent activity display
    sessions: modelSessions.slice(0, 5).map(({ agentId, ...rest }) => rest),
    // Return only last 5 agent sessions
    agentSessions: agentSessions.slice(0, 5).map(({ agentId, ...rest }) => rest),
    _count: {
      ...student._count,
      sessions: modelSessions.length, // Model sessions only for backward compatibility
      modelSessions: modelSessions.length,
      agentSessions: agentSessions.length,
    },
  };
};

// Create a new student
export const createStudent = async (input: CreateStudentInput, adminUserId?: string) => {
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

  // Generate secure random password (NOT predictable from user data)
  const defaultPassword = generateSecurePassword();
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

  // Audit log: student creation
  if (adminUserId) {
    await logAdminAction(adminUserId, 'admin_create_student', {
      targetUserId: student.id,
      targetUserEmail: student.email,
      targetUserRegistrationId: student.registrationId,
      tokenQuota: student.tokenQuota,
    });
  }

  return { student, defaultPassword };
};

// Update student
export const updateStudent = async (studentId: string, input: UpdateStudentInput, adminUserId?: string) => {
  const student = await prisma.user.findUnique({
    where: { id: studentId },
    select: { role: true, email: true, registrationId: true, tokenQuota: true, isActive: true },
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

  // Track changes for audit log
  const changes: Record<string, { from: unknown; to: unknown }> = {};
  if (input.tokenQuota !== undefined && input.tokenQuota !== student.tokenQuota) {
    changes.tokenQuota = { from: student.tokenQuota, to: input.tokenQuota };
  }
  if (input.isActive !== undefined && input.isActive !== student.isActive) {
    changes.isActive = { from: student.isActive, to: input.isActive };
  }
  if (input.email !== undefined && input.email !== student.email) {
    changes.email = { from: student.email, to: input.email };
  }

  const updatedStudent = await prisma.user.update({
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

  // Audit log: student update
  if (adminUserId && Object.keys(changes).length > 0) {
    await logAdminAction(adminUserId, 'admin_update_student', {
      targetUserId: studentId,
      targetUserEmail: student.email,
      targetUserRegistrationId: student.registrationId,
      changes,
    });
  }

  return updatedStudent;
};

// Delete student
export const deleteStudent = async (studentId: string, permanent: boolean = false, adminUserId?: string) => {
  const student = await prisma.user.findUnique({
    where: { id: studentId },
    select: { role: true, email: true, registrationId: true },
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
    
    // Audit log: permanent deletion
    if (adminUserId) {
      await logAdminAction(adminUserId, 'admin_delete_student', {
        targetUserId: studentId,
        targetUserEmail: student.email,
        targetUserRegistrationId: student.registrationId,
        permanent: true,
      });
    }
    
    return { message: 'Student permanently deleted' };
  } else {
    // Soft delete (deactivate)
    await prisma.user.update({
      where: { id: studentId },
      data: { isActive: false },
    });
    
    // Audit log: soft deletion
    if (adminUserId) {
      await logAdminAction(adminUserId, 'admin_delete_student', {
        targetUserId: studentId,
        targetUserEmail: student.email,
        targetUserRegistrationId: student.registrationId,
        permanent: false,
      });
    }
    
    return { message: 'Student deactivated' };
  }
};

// Reset student password
export const resetStudentPassword = async (studentId: string, adminUserId?: string) => {
  const student = await prisma.user.findUnique({
    where: { id: studentId },
    select: { registrationId: true, role: true, email: true },
  });

  if (!student) {
    throw new NotFoundError('Student not found');
  }

  if (student.role !== 'student') {
    throw new BadRequestError('User is not a student');
  }

  // Generate a secure random password
  const newPassword = generateSecurePassword();
  const hashedPassword = await bcrypt.hash(newPassword, 12);

  await prisma.user.update({
    where: { id: studentId },
    data: { 
      password: hashedPassword,
      mustChangePassword: true, // Force password change on next login
    },
  });

  // Audit log: password reset
  if (adminUserId) {
    await logAdminAction(adminUserId, 'admin_reset_password', {
      targetUserId: studentId,
      targetUserEmail: student.email,
      targetUserRegistrationId: student.registrationId,
    });
  }

  return { newPassword };
};

// Bulk operations
export const bulkOperation = async (input: BulkOperationInput, adminUserId?: string) => {
  const { operation, registrationIds, value } = input;

  // Find students by registration IDs
  const students = await prisma.user.findMany({
    where: {
      registrationId: { in: registrationIds },
      role: 'student',
    },
    select: { id: true, registrationId: true, email: true },
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
          // Generate a secure random password for each student
          const newPassword = generateSecurePassword();
          const hashedPassword = await bcrypt.hash(newPassword, 12);
          await prisma.user.update({
            where: { id: student.id },
            data: { 
              password: hashedPassword,
              mustChangePassword: true, // Force password change on next login
            },
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

  // Audit log: bulk operation
  if (adminUserId) {
    await logAdminAction(adminUserId, 'admin_bulk_operation', {
      operation,
      affectedCount: students.length,
      registrationIds: students.map(s => s.registrationId),
      value: operation !== 'reset_passwords' ? value : '[REDACTED]',
    });
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

      // Create student with secure random password
      const defaultPassword = generateSecurePassword();
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

  // Soft delete the course and all its batches in a transaction
  await prisma.$transaction([
    // Soft delete all batches belonging to this course
    prisma.batch.updateMany({
      where: { courseId },
      data: { isActive: false },
    }),
    // Soft delete the course
    prisma.course.update({
      where: { id: courseId },
      data: { isActive: false },
    }),
  ]);

  return { message: 'Course and its batches deleted' };
};

// ==================== BATCH MANAGEMENT ====================

// Get batches for a course
export const getBatches = async (courseId?: string) => {
  const where: any = { 
    isActive: true,
    // Only return batches where the course is also active
    course: { isActive: true }
  };
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
  // Calculate date boundaries
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfWeek = new Date(startOfToday);
  startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay()); // Start of week (Sunday)
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  // Get total counts (all time / monthly)
  const [
    totalStudents,
    activeStudents,
    totalSessions,
    totalPrompts,
    totalTokensUsed,
    totalComparisonSessions,
    totalComparisonTokens,
    totalBudgetUsed,
  ] = await Promise.all([
    prisma.user.count({ where: { role: 'student' } }),
    prisma.user.count({ where: { role: 'student', isActive: true } }),
    prisma.session.count({ where: { agentId: null } }), // Only model sessions
    prisma.message.count({ where: { role: 'user' } }),
    prisma.user.aggregate({
      where: { role: 'student' },
      _sum: { tokenUsed: true },
    }),
    prisma.comparisonSession.count(),
    prisma.comparisonSession.aggregate({
      _sum: { totalTokensUsed: true },
    }),
    prisma.user.aggregate({
      where: { role: 'student' },
      _sum: { budgetUsed: true },
    }),
  ]);

  // Get all sessions with REAL input/output token data and cost
  const allSessions = await prisma.session.findMany({
    select: { 
      modelId: true, 
      inputTokens: true,
      outputTokens: true,
      tokensUsed: true, 
      totalCost: true,
      createdAt: true,
    },
  });

  // Get all comparison sessions with REAL input/output token data and cost
  const allComparisonSessions = await prisma.comparisonSession.findMany({
    select: { 
      totalInputTokens: true,
      totalOutputTokens: true,
      totalTokensUsed: true,
      totalCost: true,
      createdAt: true,
    },
  });

  // Helper function to sum REAL costs from sessions (no more estimation!)
  const sumSessionCosts = (sessions: { totalCost: number }[]) => {
    return sessions.reduce((total, session) => total + (session.totalCost || 0), 0);
  };

  const sumComparisonCosts = (sessions: { totalCost: number }[]) => {
    return sessions.reduce((total, session) => total + (session.totalCost || 0), 0);
  };

  // Calculate REAL costs from sessions (using stored totalCost, not estimation)
  const totalSessionCost = sumSessionCosts(allSessions);
  const totalComparisonCost = sumComparisonCosts(allComparisonSessions);
  const totalCost = totalSessionCost + totalComparisonCost;

  // Calculate costs by time period (regular sessions) - REAL data
  const dailySessionsForCost = allSessions.filter(s => s.createdAt >= startOfToday);
  const weeklySessionsForCost = allSessions.filter(s => s.createdAt >= startOfWeek);
  const monthlySessionsForCost = allSessions.filter(s => s.createdAt >= startOfMonth);

  const dailyComparisonForCost = allComparisonSessions.filter(s => s.createdAt >= startOfToday);
  const weeklyComparisonForCost = allComparisonSessions.filter(s => s.createdAt >= startOfWeek);
  const monthlyComparisonForCost = allComparisonSessions.filter(s => s.createdAt >= startOfMonth);

  const dailyCost = sumSessionCosts(dailySessionsForCost) + sumComparisonCosts(dailyComparisonForCost);
  const weeklyCost = sumSessionCosts(weeklySessionsForCost) + sumComparisonCosts(weeklyComparisonForCost);
  const monthlyCost = sumSessionCosts(monthlySessionsForCost) + sumComparisonCosts(monthlyComparisonForCost);

  // Get comparison tokens by time period
  const dailyComparisonTokens = allComparisonSessions
    .filter(s => s.createdAt >= startOfToday)
    .reduce((sum, s) => sum + s.totalTokensUsed, 0);
  const weeklyComparisonTokens = allComparisonSessions
    .filter(s => s.createdAt >= startOfWeek)
    .reduce((sum, s) => sum + s.totalTokensUsed, 0);
  const monthlyComparisonTokens = allComparisonSessions
    .filter(s => s.createdAt >= startOfMonth)
    .reduce((sum, s) => sum + s.totalTokensUsed, 0);

  // Get daily active users (users who logged in or had activity today)
  const dailyActiveUsers = await prisma.user.count({
    where: {
      role: 'student',
      isActive: true,
      OR: [
        { lastLoginAt: { gte: startOfToday } },
        { sessions: { some: { createdAt: { gte: startOfToday } } } },
      ],
    },
  });

  // Get weekly active users
  const weeklyActiveUsers = await prisma.user.count({
    where: {
      role: 'student',
      isActive: true,
      OR: [
        { lastLoginAt: { gte: startOfWeek } },
        { sessions: { some: { createdAt: { gte: startOfWeek } } } },
      ],
    },
  });

  // Get monthly active users
  const monthlyActiveUsers = await prisma.user.count({
    where: {
      role: 'student',
      isActive: true,
      OR: [
        { lastLoginAt: { gte: startOfMonth } },
        { sessions: { some: { createdAt: { gte: startOfMonth } } } },
      ],
    },
  });

  // Get model sessions by time period (agentId is null)
  const [dailySessions, weeklySessions, monthlySessions] = await Promise.all([
    prisma.session.count({ where: { createdAt: { gte: startOfToday }, agentId: null } }),
    prisma.session.count({ where: { createdAt: { gte: startOfWeek }, agentId: null } }),
    prisma.session.count({ where: { createdAt: { gte: startOfMonth }, agentId: null } }),
  ]);

  // Get prompts by time period
  const [dailyPrompts, weeklyPrompts, monthlyPrompts] = await Promise.all([
    prisma.message.count({ where: { role: 'user', createdAt: { gte: startOfToday } } }),
    prisma.message.count({ where: { role: 'user', createdAt: { gte: startOfWeek } } }),
    prisma.message.count({ where: { role: 'user', createdAt: { gte: startOfMonth } } }),
  ]);

  // Get tokens used by time period (from sessions)
  const [dailyTokens, weeklyTokens, monthlyTokens] = await Promise.all([
    prisma.session.aggregate({
      where: { createdAt: { gte: startOfToday } },
      _sum: { tokensUsed: true },
    }),
    prisma.session.aggregate({
      where: { createdAt: { gte: startOfWeek } },
      _sum: { tokensUsed: true },
    }),
    prisma.session.aggregate({
      where: { createdAt: { gte: startOfMonth } },
      _sum: { tokensUsed: true },
    }),
  ]);

  // Get agents created by time period
  const [dailyAgents, weeklyAgents, monthlyAgents, totalAgents] = await Promise.all([
    prisma.agent.count({ where: { createdAt: { gte: startOfToday } } }),
    prisma.agent.count({ where: { createdAt: { gte: startOfWeek } } }),
    prisma.agent.count({ where: { createdAt: { gte: startOfMonth } } }),
    prisma.agent.count(),
  ]);

  // Get daily usage for last 30 days (for charts)
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

  // Get top performers (ordered by model sessions, not total sessions)
  const topPerformers = await prisma.user.findMany({
    where: { role: 'student', isActive: true },
    take: 10,
    select: {
      id: true,
      name: true,
      registrationId: true,
      tokenUsed: true,
      sessions: {
        select: { avgScore: true, agentId: true },
      },
    },
  });

  // Sort by model sessions count (sessions without agentId)
  const sortedTopPerformers = topPerformers
    .map(p => {
      const modelSessions = p.sessions.filter(s => s.agentId === null);
      const agentSessions = p.sessions.filter(s => s.agentId !== null);
      return {
        ...p,
        modelSessionsCount: modelSessions.length,
        agentSessionsCount: agentSessions.length,
        avgScore: modelSessions.length > 0
          ? modelSessions.reduce((sum, s) => sum + (s.avgScore || 0), 0) / modelSessions.length
          : 0,
        sessionsCount: modelSessions.length, // For backward compatibility
      };
    })
    .sort((a, b) => b.modelSessionsCount - a.modelSessionsCount)
    .slice(0, 10);

  return {
    overview: {
      totalStudents,
      activeStudents,
      totalSessions,
      totalComparisonSessions,
      totalPrompts,
      totalTokensUsed: totalTokensUsed._sum.tokenUsed || 0,
      totalAgents,
    },
    // Time-based analytics
    activeUsers: {
      daily: dailyActiveUsers,
      weekly: weeklyActiveUsers,
      monthly: monthlyActiveUsers,
    },
    sessions: {
      daily: dailySessions,
      weekly: weeklySessions,
      monthly: monthlySessions,
    },
    prompts: {
      daily: dailyPrompts,
      weekly: weeklyPrompts,
      monthly: monthlyPrompts,
    },
    tokensUsed: {
      daily: (dailyTokens._sum.tokensUsed || 0) + dailyComparisonTokens,
      weekly: (weeklyTokens._sum.tokensUsed || 0) + weeklyComparisonTokens,
      monthly: (monthlyTokens._sum.tokensUsed || 0) + monthlyComparisonTokens,
      // Breakdown
      sessions: {
        daily: dailyTokens._sum.tokensUsed || 0,
        weekly: weeklyTokens._sum.tokensUsed || 0,
        monthly: monthlyTokens._sum.tokensUsed || 0,
      },
      comparisons: {
        daily: dailyComparisonTokens,
        weekly: weeklyComparisonTokens,
        monthly: monthlyComparisonTokens,
        total: totalComparisonTokens._sum.totalTokensUsed || 0,
      },
    },
    agentsCreated: {
      total: totalAgents,
      daily: dailyAgents,
      weekly: weeklyAgents,
      monthly: monthlyAgents,
    },
    // Cost analytics - all values in USD (universal standard)
    // Now using REAL tracked costs, not estimations
    costs: {
      currency: 'USD',
      // Actual tracked costs from user budgetUsed (most accurate)
      total: Math.round((totalBudgetUsed._sum.budgetUsed || 0) * 10000) / 10000,
      // REAL costs by period (from stored session/comparison costs)
      daily: Math.round(dailyCost * 10000) / 10000,
      weekly: Math.round(weeklyCost * 10000) / 10000,
      monthly: Math.round(monthlyCost * 10000) / 10000,
      // Breakdown by source
      breakdown: {
        sessions: Math.round(totalSessionCost * 10000) / 10000,
        comparisons: Math.round(totalComparisonCost * 10000) / 10000,
      },
      // INR equivalents for display (using configurable exchange rate)
      inrEquivalent: {
        exchangeRate: PRICING_CONFIG.USD_TO_INR,
        total: Math.round(pricingUtils.usdToInr(totalBudgetUsed._sum.budgetUsed || 0) * 100) / 100,
        daily: Math.round(pricingUtils.usdToInr(dailyCost) * 100) / 100,
        weekly: Math.round(pricingUtils.usdToInr(weeklyCost) * 100) / 100,
        monthly: Math.round(pricingUtils.usdToInr(monthlyCost) * 100) / 100,
      },
    },
    dailyActivity,
    modelUsage: modelUsageWithDetails,
    topPerformers: sortedTopPerformers.map(({ sessions, ...rest }) => rest),
  };
};

// ==================== API KEYS MANAGEMENT ====================

// Get API keys (masked)
export const getAPIKeys = async () => {
  // Define default providers that should always be shown
  const defaultProviders = ['openai', 'google', 'anthropic', 'elevenlabs', 'groq', 'mistral'];
  
  const keys = await prisma.aPIKey.findMany({
    orderBy: { provider: 'asc' },
  });

  // Create a map of existing keys
  const keyMap = new Map(keys.map(k => [k.provider.toLowerCase(), k]));
  
  // Get all unique providers (defaults + any custom ones from DB)
  const allProviders = new Set([
    ...defaultProviders,
    ...keys.map(k => k.provider.toLowerCase())
  ]);
  
  // Return all providers with masked keys
  return Array.from(allProviders).map(provider => {
    const key = keyMap.get(provider);
    const isDefault = defaultProviders.includes(provider);
    
    if (key) {
      // Decrypt the API key to check if it exists, then mask it for display
      const decryptedKey = key.apiKey ? decrypt(key.apiKey) : null;
      const hasValidKey = decryptedKey && decryptedKey.length > 0;
      
      return {
        id: key.id,
        provider: key.provider,
        // Show masked version of decrypted key
        apiKey: hasValidKey ? maskSensitiveValue(decryptedKey) : null,
        baseUrl: key.baseUrl,
        isActive: key.isActive && hasValidKey,
        isDefault,
        updatedAt: key.updatedAt,
      };
    }
    // Provider not in DB yet (only for defaults)
    return {
      id: `temp-${provider}`,
      provider,
      apiKey: null,
      baseUrl: null,
      isActive: false,
      isDefault,
      updatedAt: null,
    };
  });
};

// Update API key
export const updateAPIKey = async (
  provider: string,
  apiKey: string,
  baseUrl?: string
) => {
  const existing = await prisma.aPIKey.findUnique({ where: { provider } });

  // Encrypt the API key before storing
  const encryptedApiKey = encrypt(apiKey);

  let result;
  if (existing) {
    result = await prisma.aPIKey.update({
      where: { provider },
      data: { apiKey: encryptedApiKey, baseUrl, isActive: true },
    });
  } else {
    result = await prisma.aPIKey.create({
      data: { provider, apiKey: encryptedApiKey, baseUrl },
    });
  }
  
  // Clear the API key cache so the new key is used immediately
  clearApiKeyCache(provider);
  
  return result;
};

// Delete API key (only for custom providers)
export const deleteAPIKey = async (provider: string) => {
  const defaultProviders = ['openai', 'google', 'anthropic', 'elevenlabs', 'groq', 'mistral'];
  
  if (defaultProviders.includes(provider.toLowerCase())) {
    throw new BadRequestError('Cannot delete default providers. You can only clear their API key.');
  }
  
  const existing = await prisma.aPIKey.findUnique({ where: { provider } });
  if (!existing) {
    throw new NotFoundError('Provider not found');
  }
  
  await prisma.aPIKey.delete({ where: { provider } });
  return { message: 'Provider deleted successfully' };
};

// Test API key connection
export const testAPIKey = async (provider: string) => {
  const key = await prisma.aPIKey.findUnique({ where: { provider } });

  if (!key || !key.apiKey) {
    return { success: false, message: 'API key not configured' };
  }

  try {
    // Test the API key by making a minimal request to the provider
    const baseUrl = key.baseUrl;
    
    switch (provider.toLowerCase()) {
      case 'openai': {
        const url = baseUrl || 'https://api.openai.com/v1';
        const response = await fetch(`${url}/models`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${key.apiKey}`,
          },
        });
        if (!response.ok) {
          const error = await response.json().catch(() => ({})) as { error?: { message?: string } };
          return { success: false, message: error.error?.message || `HTTP ${response.status}` };
        }
        return { success: true, message: 'OpenAI connection successful' };
      }
      
      case 'anthropic': {
        // Anthropic doesn't have a simple test endpoint, so we validate the key format
        if (!key.apiKey.startsWith('sk-ant-')) {
          return { success: false, message: 'Invalid Anthropic API key format' };
        }
        return { success: true, message: 'Anthropic key format valid' };
      }
      
      case 'google': {
        // Google AI Studio key validation
        if (key.apiKey.length < 20) {
          return { success: false, message: 'Invalid Google API key format' };
        }
        return { success: true, message: 'Google key format valid' };
      }
      
      case 'groq': {
        const url = baseUrl || 'https://api.groq.com/openai/v1';
        const response = await fetch(`${url}/models`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${key.apiKey}`,
          },
        });
        if (!response.ok) {
          return { success: false, message: `Groq API error: HTTP ${response.status}` };
        }
        return { success: true, message: 'Groq connection successful' };
      }
      
      case 'mistral': {
        const url = baseUrl || 'https://api.mistral.ai/v1';
        const response = await fetch(`${url}/models`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${key.apiKey}`,
          },
        });
        if (!response.ok) {
          return { success: false, message: `Mistral API error: HTTP ${response.status}` };
        }
        return { success: true, message: 'Mistral connection successful' };
      }
      
      case 'elevenlabs': {
        const url = baseUrl || 'https://api.elevenlabs.io/v1';
        const response = await fetch(`${url}/user`, {
          method: 'GET',
          headers: {
            'xi-api-key': key.apiKey,
          },
        });
        if (!response.ok) {
          return { success: false, message: `ElevenLabs API error: HTTP ${response.status}` };
        }
        return { success: true, message: 'ElevenLabs connection successful' };
      }
      
      default:
        // For unknown providers, just validate key exists and has reasonable length
        if (key.apiKey.length < 10) {
          return { success: false, message: 'API key seems too short' };
        }
        return { success: true, message: 'API key configured' };
    }
  } catch (error: any) {
    return { success: false, message: error.message || 'Connection failed' };
  }
};

// ==================== GUARDRAILS MANAGEMENT ====================

interface CreateGuardrailInput {
  type: string;
  title: string;
  instruction: string;
  appliesTo?: string;
  priority?: number;
  enabled?: boolean;
}

// Get all guardrails
export const getGuardrails = async () => {
  const guardrails = await prisma.guardrail.findMany({
    orderBy: [{ isSystem: 'desc' }, { priority: 'desc' }],
  });
  
  // Map isActive to enabled for frontend compatibility
  return guardrails.map(g => ({
    ...g,
    enabled: g.isActive,
  }));
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

  // Map enabled to isActive
  const { enabled, ...rest } = input;
  
  // System guardrails can only have isActive toggled
  if (guardrail.isSystem) {
    if (enabled !== undefined) {
      return prisma.guardrail.update({
        where: { id: guardrailId },
        data: { isActive: enabled },
      });
    }
    throw new BadRequestError('Cannot modify system guardrails');
  }
  
  const updateData: any = { ...rest };
  if (enabled !== undefined) {
    updateData.isActive = enabled;
  }

  return prisma.guardrail.update({
    where: { id: guardrailId },
    data: updateData,
  });
};

// Delete guardrail
export const deleteGuardrail = async (guardrailId: string) => {
  const guardrail = await prisma.guardrail.findUnique({
    where: { id: guardrailId },
    include: {
      agentGuardrails: {
        select: { id: true },
      },
    },
  });

  if (!guardrail) {
    throw new NotFoundError('Guardrail not found');
  }

  if (guardrail.isSystem) {
    throw new BadRequestError('Cannot delete system guardrails');
  }

  // Use transaction to delete AgentGuardrail records first, then the guardrail
  // This is necessary because the foreign key constraint is RESTRICT (default)
  await prisma.$transaction(async (tx) => {
    // First, remove all AgentGuardrail associations
    if (guardrail.agentGuardrails.length > 0) {
      await tx.agentGuardrail.deleteMany({
        where: { guardrailId },
      });
    }

    // Then delete the guardrail itself
    await tx.guardrail.delete({
      where: { id: guardrailId },
    });
  });

  return { message: 'Guardrail deleted' };
};

// ==================== AI MODEL MANAGEMENT ====================

// Get all models for admin (including inactive)
export const getAllModelsAdmin = async () => {
  return prisma.aIModel.findMany({
    orderBy: [{ provider: 'asc' }, { name: 'asc' }],
  });
};

interface CreateModelInput {
  name: string;
  provider: string;
  modelId: string;
  category: string;
  description?: string;
  inputCost?: number;
  outputCost?: number;
  maxTokens?: number;
  isActive?: boolean;
}

// Create a new AI model
export const createModel = async (input: CreateModelInput) => {
  // Check if model already exists
  const existing = await prisma.aIModel.findUnique({
    where: { provider_modelId: { provider: input.provider, modelId: input.modelId } },
  });
  
  if (existing) {
    throw new ConflictError('A model with this provider and model ID already exists');
  }
  
  return prisma.aIModel.create({
    data: {
      name: input.name,
      provider: input.provider,
      modelId: input.modelId,
      category: input.category,
      description: input.description || null,
      inputCost: input.inputCost || 0,
      outputCost: input.outputCost || 0,
      maxTokens: input.maxTokens || 4096,
      isActive: input.isActive ?? false, // Default to inactive
    },
  });
};

// Delete a model
export const deleteModel = async (modelId: string) => {
  const model = await prisma.aIModel.findUnique({ where: { id: modelId } });
  
  if (!model) {
    throw new NotFoundError('Model not found');
  }
  
  // Check if model has sessions
  const sessionCount = await prisma.session.count({ where: { modelId } });
  if (sessionCount > 0) {
    throw new BadRequestError(`Cannot delete model with ${sessionCount} existing sessions. Deactivate it instead.`);
  }
  
  await prisma.aIModel.delete({ where: { id: modelId } });
  return { message: 'Model deleted successfully' };
};

interface UpdateModelInput {
  isActive?: boolean;
  maxTokens?: number;
  description?: string;
}

// Update model settings
export const updateModel = async (modelId: string, input: UpdateModelInput) => {
  const model = await prisma.aIModel.findUnique({ where: { id: modelId } });
  
  if (!model) {
    throw new NotFoundError('Model not found');
  }
  
  return prisma.aIModel.update({
    where: { id: modelId },
    data: input,
  });
};

// Toggle model active state
export const toggleModelActive = async (modelId: string) => {
  const model = await prisma.aIModel.findUnique({ where: { id: modelId } });
  
  if (!model) {
    throw new NotFoundError('Model not found');
  }
  
  return prisma.aIModel.update({
    where: { id: modelId },
    data: { isActive: !model.isActive },
  });
};

// Test model connection
export const testModel = async (modelId: string) => {
  const model = await prisma.aIModel.findUnique({ where: { id: modelId } });
  
  if (!model) {
    throw new NotFoundError('Model not found');
  }
  
  // Check if API key is configured for the provider
  const apiKey = await prisma.aPIKey.findUnique({ 
    where: { provider: model.provider.toLowerCase() } 
  });
  
  if (!apiKey || !apiKey.apiKey || !apiKey.isActive) {
    return { 
      success: false, 
      message: `API key not configured for ${model.provider}. Please configure it in API Keys section.` 
    };
  }
  
  try {
    // Attempt a minimal API call based on provider
    switch (model.provider.toLowerCase()) {
      case 'openai': {
        const response = await fetch(apiKey.baseUrl || 'https://api.openai.com/v1/models', {
          method: 'GET',
          headers: { 'Authorization': `Bearer ${apiKey.apiKey}` },
        });
        if (!response.ok) {
          return { success: false, message: `OpenAI API error: ${response.status}` };
        }
        // Check if the specific model exists
        const data = await response.json() as { data?: Array<{ id: string }> };
        const modelExists = data.data?.some((m) => m.id === model.modelId);
        if (!modelExists) {
          return { success: false, message: `Model ${model.modelId} not found in your OpenAI account` };
        }
        return { success: true, message: `Model ${model.name} is ready to use` };
      }
      
      case 'anthropic': {
        // Anthropic doesn't have a model list endpoint, validate key format
        if (!apiKey.apiKey.startsWith('sk-ant-')) {
          return { success: false, message: 'Invalid Anthropic API key format' };
        }
        return { success: true, message: `Model ${model.name} is ready to use (key validated)` };
      }
      
      case 'google': {
        // Google AI key format validation
        if (apiKey.apiKey.length < 20) {
          return { success: false, message: 'Invalid Google API key format' };
        }
        return { success: true, message: `Model ${model.name} is ready to use (key validated)` };
      }
      
      case 'groq': {
        const response = await fetch(apiKey.baseUrl || 'https://api.groq.com/openai/v1/models', {
          method: 'GET',
          headers: { 'Authorization': `Bearer ${apiKey.apiKey}` },
        });
        if (!response.ok) {
          return { success: false, message: `Groq API error: ${response.status}` };
        }
        return { success: true, message: `Model ${model.name} is ready to use` };
      }
      
      case 'mistral': {
        const response = await fetch(apiKey.baseUrl || 'https://api.mistral.ai/v1/models', {
          method: 'GET',
          headers: { 'Authorization': `Bearer ${apiKey.apiKey}` },
        });
        if (!response.ok) {
          return { success: false, message: `Mistral API error: ${response.status}` };
        }
        return { success: true, message: `Model ${model.name} is ready to use` };
      }
      
      case 'elevenlabs': {
        const response = await fetch(apiKey.baseUrl || 'https://api.elevenlabs.io/v1/user', {
          method: 'GET',
          headers: { 'xi-api-key': apiKey.apiKey },
        });
        if (!response.ok) {
          return { success: false, message: `ElevenLabs API error: ${response.status}` };
        }
        return { success: true, message: `Model ${model.name} is ready to use` };
      }
      
      default:
        return { success: true, message: `Model ${model.name} configured (provider not verified)` };
    }
  } catch (error: any) {
    return { success: false, message: `Connection failed: ${error.message}` };
  }
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

// ==================== SETTINGS MANAGEMENT ====================

interface UpdateSettingsInput {
  // Token settings
  defaultTokenQuota?: number;
  autoRefill?: boolean;
  lowBalanceAlert?: boolean;
  hardLimitEnforcement?: boolean;
  lowBalanceThreshold?: number;
  // Guardrails settings
  maxTokensPerRequest?: number;
  maxRequestsPerMinute?: number;
  aiIntentDetection?: boolean;
  strictMode?: boolean;
}

// Get settings (create default if not exists)
export const getSettings = async () => {
  let settings = await prisma.settings.findUnique({
    where: { id: 'default' },
  });

  // Create default settings if not exists
  if (!settings) {
    settings = await prisma.settings.create({
      data: {
        id: 'default',
        defaultTokenQuota: 100000,
        autoRefill: false,
        lowBalanceAlert: false,
        hardLimitEnforcement: true,
        lowBalanceThreshold: 10,
        maxTokensPerRequest: 2000,
        maxRequestsPerMinute: 15,
        aiIntentDetection: true,
        strictMode: false,
      },
    });
  }

  return settings;
};

// Update settings
export const updateSettings = async (input: UpdateSettingsInput) => {
  // Ensure settings exist first
  await getSettings();

  const settings = await prisma.settings.update({
    where: { id: 'default' },
    data: {
      ...(input.defaultTokenQuota !== undefined && { defaultTokenQuota: input.defaultTokenQuota }),
      ...(input.autoRefill !== undefined && { autoRefill: input.autoRefill }),
      ...(input.lowBalanceAlert !== undefined && { lowBalanceAlert: input.lowBalanceAlert }),
      ...(input.hardLimitEnforcement !== undefined && { hardLimitEnforcement: input.hardLimitEnforcement }),
      ...(input.lowBalanceThreshold !== undefined && { lowBalanceThreshold: input.lowBalanceThreshold }),
      ...(input.maxTokensPerRequest !== undefined && { maxTokensPerRequest: input.maxTokensPerRequest }),
      ...(input.maxRequestsPerMinute !== undefined && { maxRequestsPerMinute: input.maxRequestsPerMinute }),
      ...(input.aiIntentDetection !== undefined && { aiIntentDetection: input.aiIntentDetection }),
      ...(input.strictMode !== undefined && { strictMode: input.strictMode }),
    },
  });

  return settings;
};

// Fix users who have exceeded their token quota (cap tokenUsed at tokenQuota)
export const fixExceededQuotas = async () => {
  // First, get the count of users to fix (for reporting)
  const exceededUsers = await prisma.$queryRaw<Array<{ count: number }>>`
    SELECT COUNT(*) as count FROM User WHERE tokenUsed > tokenQuota
  `;
  const countToFix = exceededUsers[0]?.count || 0;

  // Use raw query to compare and update columns (Prisma doesn't support column-to-column comparison)
  const result = await prisma.$executeRaw`
    UPDATE User 
    SET tokenUsed = tokenQuota, updatedAt = datetime('now')
    WHERE tokenUsed > tokenQuota
  `;

  return {
    message: `Fixed ${result} user(s) with exceeded quotas`,
    fixedCount: Number(result),
    foundCount: Number(countToFix),
  };
};

// Get users with exceeded quotas (for display purposes)
export const getExceededQuotaUsers = async () => {
  const users = await prisma.$queryRaw<Array<{
    id: string;
    email: string;
    name: string;
    tokenUsed: number;
    tokenQuota: number;
    exceeded: number;
  }>>`
    SELECT id, email, name, tokenUsed, tokenQuota, (tokenUsed - tokenQuota) as exceeded
    FROM User 
    WHERE tokenUsed > tokenQuota
  `;

  return users;
};


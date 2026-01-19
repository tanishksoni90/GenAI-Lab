import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { prisma } from '../lib/prisma';
import { config } from '../config';
import { BadRequestError, NotFoundError, ConflictError } from '../utils/errors';
import { logAdminAction } from '../utils/audit';

// ==================== INVITE TOKEN CONFIGURATION ====================
const INVITE_TOKEN_EXPIRY_HOURS = 48; // Token valid for 48 hours
const INVITE_TOKEN_LENGTH = 32; // 32 bytes = 64 hex characters

// ==================== INTERFACES ====================

interface InviteResult {
  userId: string;
  email: string;
  name: string;
  registrationId: string | null;
  inviteLink: string;
  expiresAt: Date;
}

interface BulkInviteResult {
  success: InviteResult[];
  failed: Array<{ registrationId: string; error: string }>;
  alreadySetup: string[]; // Users who already have passwords set
}

// ==================== TOKEN GENERATION ====================

/**
 * Generate a cryptographically secure invite token
 */
const generateInviteToken = (): string => {
  return crypto.randomBytes(INVITE_TOKEN_LENGTH).toString('hex');
};

/**
 * Calculate token expiry date
 */
const getTokenExpiry = (): Date => {
  return new Date(Date.now() + INVITE_TOKEN_EXPIRY_HOURS * 60 * 60 * 1000);
};

/**
 * Build the invite link URL
 */
const buildInviteLink = (token: string): string => {
  // Use frontend URL from config
  const baseUrl = config.frontendUrl.split(',')[0].trim(); // Use first URL if multiple
  return `${baseUrl}/setup-account?token=${token}`;
};

// ==================== INVITE OPERATIONS ====================

/**
 * Generate invite for a single student
 * Creates/updates invite token and returns the invite link
 */
export const generateInvite = async (
  studentId: string, 
  adminUserId?: string
): Promise<InviteResult> => {
  // Find the student
  const student = await prisma.user.findUnique({
    where: { id: studentId },
    select: {
      id: true,
      email: true,
      name: true,
      registrationId: true,
      role: true,
      isVerified: true,
      inviteToken: true,
    },
  });

  if (!student) {
    throw new NotFoundError('Student not found');
  }

  if (student.role !== 'student') {
    throw new BadRequestError('User is not a student');
  }

  // Generate new token
  const token = generateInviteToken();
  const expiresAt = getTokenExpiry();

  // Upsert invite token (replace existing if any)
  await prisma.inviteToken.upsert({
    where: { userId: studentId },
    create: {
      token,
      userId: studentId,
      expiresAt,
    },
    update: {
      token,
      expiresAt,
      usedAt: null, // Reset usedAt if resending
    },
  });

  // Audit log
  if (adminUserId) {
    await logAdminAction(adminUserId, 'admin_generate_invite', {
      targetUserId: studentId,
      targetUserEmail: student.email,
      expiresAt: expiresAt.toISOString(),
    });
  }

  return {
    userId: student.id,
    email: student.email,
    name: student.name,
    registrationId: student.registrationId,
    inviteLink: buildInviteLink(token),
    expiresAt,
  };
};

/**
 * Generate invites for multiple students (bulk operation)
 */
export const generateBulkInvites = async (
  registrationIds: string[],
  adminUserId?: string
): Promise<BulkInviteResult> => {
  const results: BulkInviteResult = {
    success: [],
    failed: [],
    alreadySetup: [],
  };

  // Find all students by registration IDs
  const students = await prisma.user.findMany({
    where: {
      registrationId: { in: registrationIds },
      role: 'student',
    },
    select: {
      id: true,
      email: true,
      name: true,
      registrationId: true,
      isVerified: true,
      inviteToken: {
        select: { usedAt: true },
      },
    },
  });

  // Track which IDs were found
  const foundRegIds = new Set(students.map(s => s.registrationId));
  
  // Mark not found IDs as failed
  for (const regId of registrationIds) {
    if (!foundRegIds.has(regId)) {
      results.failed.push({ registrationId: regId, error: 'Student not found' });
    }
  }

  // Process each student
  for (const student of students) {
    try {
      // Check if already set up (token was used)
      if (student.inviteToken?.usedAt) {
        results.alreadySetup.push(student.registrationId!);
        continue;
      }

      // Generate invite
      const token = generateInviteToken();
      const expiresAt = getTokenExpiry();

      await prisma.inviteToken.upsert({
        where: { userId: student.id },
        create: {
          token,
          userId: student.id,
          expiresAt,
        },
        update: {
          token,
          expiresAt,
          usedAt: null,
        },
      });

      results.success.push({
        userId: student.id,
        email: student.email,
        name: student.name,
        registrationId: student.registrationId,
        inviteLink: buildInviteLink(token),
        expiresAt,
      });
    } catch (error) {
      results.failed.push({
        registrationId: student.registrationId!,
        error: 'Failed to generate invite',
      });
    }
  }

  // Audit log for bulk operation
  if (adminUserId && results.success.length > 0) {
    await logAdminAction(adminUserId, 'admin_bulk_generate_invites', {
      totalRequested: registrationIds.length,
      successCount: results.success.length,
      failedCount: results.failed.length,
      alreadySetupCount: results.alreadySetup.length,
    });
  }

  return results;
};

/**
 * Validate an invite token
 * Returns user info if token is valid
 */
export const validateInviteToken = async (token: string) => {
  const invite = await prisma.inviteToken.findUnique({
    where: { token },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          name: true,
          registrationId: true,
          isActive: true,
        },
      },
    },
  });

  if (!invite) {
    throw new BadRequestError('Invalid or expired invite link');
  }

  if (invite.usedAt) {
    throw new BadRequestError('This invite link has already been used. Please login with your password.');
  }

  if (invite.expiresAt < new Date()) {
    throw new BadRequestError('This invite link has expired. Please contact your administrator for a new link.');
  }

  if (!invite.user.isActive) {
    throw new BadRequestError('Your account has been deactivated. Please contact your administrator.');
  }

  return {
    userId: invite.user.id,
    email: invite.user.email,
    name: invite.user.name,
    registrationId: invite.user.registrationId,
    expiresAt: invite.expiresAt,
  };
};

/**
 * Setup account - Set password using invite token
 * This is the endpoint students use to set their initial password
 */
export const setupAccount = async (token: string, password: string) => {
  // Validate token first
  const invite = await prisma.inviteToken.findUnique({
    where: { token },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          name: true,
          registrationId: true,
          role: true,
          isActive: true,
        },
      },
    },
  });

  if (!invite) {
    throw new BadRequestError('Invalid or expired invite link');
  }

  if (invite.usedAt) {
    throw new BadRequestError('This invite link has already been used. Please login with your password.');
  }

  if (invite.expiresAt < new Date()) {
    throw new BadRequestError('This invite link has expired. Please contact your administrator for a new link.');
  }

  if (!invite.user.isActive) {
    throw new BadRequestError('Your account has been deactivated. Please contact your administrator.');
  }

  // Hash the new password
  const hashedPassword = await bcrypt.hash(password, 12);

  // Update user and mark token as used in a transaction
  await prisma.$transaction([
    prisma.user.update({
      where: { id: invite.user.id },
      data: {
        password: hashedPassword,
        isVerified: true,
        mustChangePassword: false,
        passwordChangedAt: new Date(),
      },
    }),
    prisma.inviteToken.update({
      where: { id: invite.id },
      data: { usedAt: new Date() },
    }),
    prisma.activityLog.create({
      data: {
        userId: invite.user.id,
        action: 'account_setup',
        details: JSON.stringify({ 
          method: 'invite_link',
          timestamp: new Date().toISOString(),
        }),
      },
    }),
  ]);

  return {
    message: 'Account setup successful! You can now login with your email and password.',
    email: invite.user.email,
  };
};

/**
 * Get invite status for a student
 */
export const getInviteStatus = async (studentId: string) => {
  const student = await prisma.user.findUnique({
    where: { id: studentId },
    select: {
      id: true,
      email: true,
      name: true,
      registrationId: true,
      isVerified: true,
      inviteToken: {
        select: {
          token: true,
          expiresAt: true,
          usedAt: true,
          createdAt: true,
        },
      },
    },
  });

  if (!student) {
    throw new NotFoundError('Student not found');
  }

  const invite = student.inviteToken;
  
  let status: 'not_invited' | 'pending' | 'expired' | 'completed';
  
  if (!invite) {
    status = 'not_invited';
  } else if (invite.usedAt) {
    status = 'completed';
  } else if (invite.expiresAt < new Date()) {
    status = 'expired';
  } else {
    status = 'pending';
  }

  return {
    userId: student.id,
    email: student.email,
    name: student.name,
    registrationId: student.registrationId,
    status,
    inviteLink: invite && status === 'pending' ? buildInviteLink(invite.token) : null,
    expiresAt: invite?.expiresAt || null,
    usedAt: invite?.usedAt || null,
    createdAt: invite?.createdAt || null,
  };
};

/**
 * Resend invite (generates new token)
 */
export const resendInvite = async (studentId: string, adminUserId?: string) => {
  return generateInvite(studentId, adminUserId);
};

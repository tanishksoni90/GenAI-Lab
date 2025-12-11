import bcrypt from 'bcryptjs';
import jwt, { SignOptions } from 'jsonwebtoken';
import { prisma } from '../lib/prisma';
import { config } from '../config';
import { 
  BadRequestError, 
  UnauthorizedError, 
  ConflictError,
  NotFoundError 
} from '../utils/errors';
import type { 
  RegisterInput, 
  LoginInput, 
  AdminRegisterInput 
} from '../validators/auth.validator';

interface TokenPayload {
  userId: string;
  email: string;
  role: string;
  name: string;
}

interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

interface AuthResponse {
  user: {
    id: string;
    email: string;
    name: string;
    role: string;
    registrationId?: string | null;
    tokenQuota: number;
    tokenUsed: number;
    mustChangePassword?: boolean;
  };
  tokens: AuthTokens;
}

// Generate JWT tokens
const generateTokens = (payload: TokenPayload): AuthTokens => {
  const accessToken = jwt.sign(
    payload, 
    config.jwt.secret, 
    { expiresIn: config.jwt.expiresIn } as SignOptions
  );
  
  const refreshToken = jwt.sign(
    payload, 
    config.jwt.refreshSecret, 
    { expiresIn: config.jwt.refreshExpiresIn } as SignOptions
  );
  
  return { accessToken, refreshToken };
};

// Hash password
const hashPassword = async (password: string): Promise<string> => {
  return bcrypt.hash(password, 12);
};

// Compare password
const comparePassword = async (password: string, hash: string): Promise<boolean> => {
  return bcrypt.compare(password, hash);
};

// Register a new student
export const registerStudent = async (input: RegisterInput): Promise<AuthResponse> => {
  const { email, password, name, registrationId } = input;
  
  // Check if email already exists
  const existingEmail = await prisma.user.findUnique({ where: { email } });
  if (existingEmail) {
    throw new ConflictError('Email already registered');
  }
  
  // Check if registration ID already exists
  const existingRegId = await prisma.user.findUnique({ where: { registrationId } });
  if (existingRegId) {
    throw new ConflictError('Registration ID already in use');
  }
  
  // Hash password
  const hashedPassword = await hashPassword(password);
  
  // Create user
  const user = await prisma.user.create({
    data: {
      email,
      password: hashedPassword,
      name,
      registrationId,
      role: 'student',
      tokenQuota: config.defaultTokenQuota,
    },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      registrationId: true,
      tokenQuota: true,
      tokenUsed: true,
    },
  });
  
  // Generate tokens
  const tokens = generateTokens({
    userId: user.id,
    email: user.email,
    role: user.role,
    name: user.name,
  });
  
  // Log activity
  await prisma.activityLog.create({
    data: {
      userId: user.id,
      action: 'register',
      details: JSON.stringify({ method: 'student_registration' }),
    },
  });
  
  return { user, tokens };
};

// Register a new admin
export const registerAdmin = async (input: AdminRegisterInput): Promise<AuthResponse> => {
  const { email, password, name, adminCode } = input;
  
  // Verify admin code (in production, this should be more secure)
  const validAdminCode = process.env.ADMIN_REGISTRATION_CODE || 'GENAI_ADMIN_2025';
  if (adminCode !== validAdminCode) {
    throw new UnauthorizedError('Invalid admin registration code');
  }
  
  // Check if email already exists
  const existingEmail = await prisma.user.findUnique({ where: { email } });
  if (existingEmail) {
    throw new ConflictError('Email already registered');
  }
  
  // Hash password
  const hashedPassword = await hashPassword(password);
  
  // Create admin user
  const user = await prisma.user.create({
    data: {
      email,
      password: hashedPassword,
      name,
      role: 'admin',
      isVerified: true, // Admins are auto-verified
      tokenQuota: 0, // Admins don't need token quota
    },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      registrationId: true,
      tokenQuota: true,
      tokenUsed: true,
    },
  });
  
  // Generate tokens
  const tokens = generateTokens({
    userId: user.id,
    email: user.email,
    role: user.role,
    name: user.name,
  });
  
  // Log activity
  await prisma.activityLog.create({
    data: {
      userId: user.id,
      action: 'register',
      details: JSON.stringify({ method: 'admin_registration' }),
    },
  });
  
  return { user, tokens };
};

// Login user
export const login = async (input: LoginInput): Promise<AuthResponse> => {
  const { email, password } = input;
  
  // Find user
  const user = await prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      password: true,
      registrationId: true,
      tokenQuota: true,
      tokenUsed: true,
      isActive: true,
      mustChangePassword: true,
    },
  });
  
  if (!user) {
    throw new UnauthorizedError('Invalid email or password');
  }
  
  if (!user.isActive) {
    throw new UnauthorizedError('Account is deactivated. Please contact admin.');
  }
  
  // Verify password
  const isValidPassword = await comparePassword(password, user.password);
  if (!isValidPassword) {
    throw new UnauthorizedError('Invalid email or password');
  }
  
  // Update last login
  await prisma.user.update({
    where: { id: user.id },
    data: { lastLoginAt: new Date() },
  });
  
  // Generate tokens
  const tokens = generateTokens({
    userId: user.id,
    email: user.email,
    role: user.role,
    name: user.name,
  });
  
  // Log activity
  await prisma.activityLog.create({
    data: {
      userId: user.id,
      action: 'login',
      details: JSON.stringify({ timestamp: new Date().toISOString() }),
    },
  });
  
  // Remove password from response
  const { password: _, mustChangePassword, ...userWithoutPassword } = user;
  
  return { 
    user: userWithoutPassword,
    tokens,
    mustChangePassword: mustChangePassword || false,
  };
};

// Refresh access token
export const refreshAccessToken = async (refreshToken: string): Promise<AuthTokens> => {
  try {
    const decoded = jwt.verify(refreshToken, config.jwt.refreshSecret) as TokenPayload;
    
    // Verify user still exists and is active
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, email: true, role: true, name: true, isActive: true },
    });
    
    if (!user || !user.isActive) {
      throw new UnauthorizedError('User not found or inactive');
    }
    
    // Generate new tokens
    return generateTokens({
      userId: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
    });
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError || error instanceof jwt.TokenExpiredError) {
      throw new UnauthorizedError('Invalid or expired refresh token');
    }
    throw error;
  }
};

// Get current user profile
export const getCurrentUser = async (userId: string) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      registrationId: true,
      tokenQuota: true,
      tokenUsed: true,
      isVerified: true,
      createdAt: true,
      lastLoginAt: true,
      course: {
        select: { id: true, name: true },
      },
      batch: {
        select: { id: true, name: true },
      },
    },
  });
  
  if (!user) {
    throw new NotFoundError('User not found');
  }
  
  return user;
};

// Update user profile
export const updateProfile = async (
  userId: string, 
  data: { name?: string; email?: string }
) => {
  if (data.email) {
    const existing = await prisma.user.findFirst({
      where: { email: data.email, NOT: { id: userId } },
    });
    if (existing) {
      throw new ConflictError('Email already in use');
    }
  }
  
  return prisma.user.update({
    where: { id: userId },
    data,
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      registrationId: true,
    },
  });
};

// Change password (requires current password)
export const changePassword = async (
  userId: string,
  currentPassword: string,
  newPassword: string
) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { password: true },
  });
  
  if (!user) {
    throw new NotFoundError('User not found');
  }
  
  const isValid = await comparePassword(currentPassword, user.password);
  if (!isValid) {
    throw new BadRequestError('Current password is incorrect');
  }
  
  const hashedPassword = await hashPassword(newPassword);
  
  await prisma.user.update({
    where: { id: userId },
    data: { 
      password: hashedPassword,
      mustChangePassword: false, // Clear the flag after password change
    },
  });
  
  return { message: 'Password changed successfully' };
};

// Set new password (for forced password change after admin reset)
// This doesn't require current password but verifies the user has mustChangePassword flag
export const setNewPassword = async (
  userId: string,
  newPassword: string
) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { mustChangePassword: true },
  });
  
  if (!user) {
    throw new NotFoundError('User not found');
  }
  
  if (!user.mustChangePassword) {
    throw new BadRequestError('Password change not required. Use the regular change password option.');
  }
  
  const hashedPassword = await hashPassword(newPassword);
  
  await prisma.user.update({
    where: { id: userId },
    data: { 
      password: hashedPassword,
      mustChangePassword: false,
    },
  });
  
  return { message: 'Password set successfully' };
};


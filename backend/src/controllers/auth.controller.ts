import { Request, Response, NextFunction } from 'express';
import * as authService from '../services/auth.service';
import { sendSuccess, sendCreated } from '../utils/response';
import type { 
  RegisterInput, 
  LoginInput, 
  AdminRegisterInput,
  RefreshTokenInput 
} from '../validators/auth.validator';

// Student registration
export const register = async (
  req: Request<{}, {}, RegisterInput>,
  res: Response,
  next: NextFunction
) => {
  try {
    const result = await authService.registerStudent(req.body);
    return sendCreated(res, result, 'Registration successful');
  } catch (error) {
    next(error);
  }
};

// Admin registration
export const registerAdmin = async (
  req: Request<{}, {}, AdminRegisterInput>,
  res: Response,
  next: NextFunction
) => {
  try {
    const result = await authService.registerAdmin(req.body);
    return sendCreated(res, result, 'Admin registration successful');
  } catch (error) {
    next(error);
  }
};

// Login (both student and admin)
export const login = async (
  req: Request<{}, {}, LoginInput>,
  res: Response,
  next: NextFunction
) => {
  try {
    const result = await authService.login(req.body);
    return sendSuccess(res, result, 'Login successful');
  } catch (error) {
    next(error);
  }
};

// Refresh token
export const refreshToken = async (
  req: Request<{}, {}, RefreshTokenInput>,
  res: Response,
  next: NextFunction
) => {
  try {
    const tokens = await authService.refreshAccessToken(req.body.refreshToken);
    return sendSuccess(res, { tokens }, 'Token refreshed successfully');
  } catch (error) {
    next(error);
  }
};

// Get current user profile
export const getProfile = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const user = await authService.getCurrentUser(req.user!.id);
    return sendSuccess(res, { user });
  } catch (error) {
    next(error);
  }
};

// Update profile
export const updateProfile = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const user = await authService.updateProfile(req.user!.id, req.body);
    return sendSuccess(res, { user }, 'Profile updated successfully');
  } catch (error) {
    next(error);
  }
};

// Change password
export const changePassword = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const result = await authService.changePassword(req.user!.id, currentPassword, newPassword);
    return sendSuccess(res, result);
  } catch (error) {
    next(error);
  }
};

// Logout (client-side token removal, but we can log it)
export const logout = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // In a more complex setup, you might invalidate the token server-side
    // For now, logout is handled client-side by removing the token
    return sendSuccess(res, null, 'Logged out successfully');
  } catch (error) {
    next(error);
  }
};


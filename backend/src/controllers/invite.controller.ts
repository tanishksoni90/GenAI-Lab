import { Request, Response, NextFunction } from 'express';
import * as inviteService from '../services/invite.service';
import { sendSuccess } from '../utils/response';

// ==================== ADMIN ENDPOINTS ====================

/**
 * Generate invite for a single student
 * POST /api/admin/students/:id/invite
 */
export const generateInvite = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const adminUserId = req.user?.id;
    const result = await inviteService.generateInvite(req.params.id, adminUserId);
    return sendSuccess(res, result, 'Invite generated successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Generate invites for multiple students
 * POST /api/admin/students/bulk-invite
 */
export const bulkGenerateInvites = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const adminUserId = req.user?.id;
    const { registrationIds } = req.body;
    const result = await inviteService.generateBulkInvites(registrationIds, adminUserId);
    return sendSuccess(res, result, 'Bulk invites generated');
  } catch (error) {
    next(error);
  }
};

/**
 * Get invite status for a student
 * GET /api/admin/students/:id/invite-status
 */
export const getInviteStatus = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const result = await inviteService.getInviteStatus(req.params.id);
    return sendSuccess(res, result);
  } catch (error) {
    next(error);
  }
};

/**
 * Resend invite for a student
 * POST /api/admin/students/:id/resend-invite
 */
export const resendInvite = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const adminUserId = req.user?.id;
    const result = await inviteService.resendInvite(req.params.id, adminUserId);
    return sendSuccess(res, result, 'Invite resent successfully');
  } catch (error) {
    next(error);
  }
};

// ==================== PUBLIC ENDPOINTS ====================

/**
 * Validate an invite token (check if it's valid before showing password form)
 * GET /api/auth/validate-invite?token=xxx
 */
export const validateInviteToken = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { token } = req.query;
    if (!token || typeof token !== 'string') {
      return sendSuccess(res, { valid: false }, 'Token is required', 400);
    }
    const result = await inviteService.validateInviteToken(token);
    return sendSuccess(res, { valid: true, ...result });
  } catch (error) {
    next(error);
  }
};

/**
 * Setup account - Set password using invite token
 * POST /api/auth/setup-account
 */
export const setupAccount = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { token, password } = req.body;
    const result = await inviteService.setupAccount(token, password);
    return sendSuccess(res, result, result.message);
  } catch (error) {
    next(error);
  }
};

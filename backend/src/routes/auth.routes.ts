import { Router } from 'express';
import { z } from 'zod';
import * as authController from '../controllers/auth.controller';
import * as inviteController from '../controllers/invite.controller';
import { validate } from '../middleware/validate';
import { authenticate } from '../middleware/auth';
import { 
  loginSchema, 
  adminRegisterSchema,
  refreshTokenSchema 
} from '../validators/auth.validator';

const router = Router();

// ==================== PUBLIC ROUTES ====================

// Login (the only public auth endpoint for students)
router.post('/login', validate(loginSchema), authController.login);
router.post('/refresh-token', validate(refreshTokenSchema), authController.refreshToken);

// Admin registration (requires admin code)
router.post('/admin/register', validate(adminRegisterSchema), authController.registerAdmin);

// Invite/Account Setup endpoints (for Magic Link flow)
router.get('/validate-invite', inviteController.validateInviteToken);
router.post('/setup-account', validate(z.object({
  body: z.object({
    token: z.string().min(1, 'Token is required'),
    password: z.string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
      .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
      .regex(/[0-9]/, 'Password must contain at least one number')
      .regex(/[!@#$%^&*()_+\-=\[\]{}|;:',.<>?]/, 'Password must contain at least one special character'),
  }),
})), inviteController.setupAccount);

// ==================== PROTECTED ROUTES ====================

router.get('/me', authenticate, authController.getProfile);
router.put('/me', authenticate, authController.updateProfile);
router.post('/change-password', authenticate, authController.changePassword);
router.post('/set-new-password', authenticate, authController.setNewPassword); // For forced password change
router.post('/logout', authenticate, authController.logout);

// NOTE: Public registration (/register) has been REMOVED
// Students are now invited by admin and set their password via /setup-account

export default router;


import { Router } from 'express';
import * as authController from '../controllers/auth.controller';
import { validate } from '../middleware/validate';
import { authenticate } from '../middleware/auth';
import { 
  registerSchema, 
  loginSchema, 
  adminRegisterSchema,
  refreshTokenSchema 
} from '../validators/auth.validator';

const router = Router();

// Public routes
router.post('/register', validate(registerSchema), authController.register);
router.post('/admin/register', validate(adminRegisterSchema), authController.registerAdmin);
router.post('/login', validate(loginSchema), authController.login);
router.post('/refresh-token', validate(refreshTokenSchema), authController.refreshToken);

// Protected routes
router.get('/me', authenticate, authController.getProfile);
router.put('/me', authenticate, authController.updateProfile);
router.post('/change-password', authenticate, authController.changePassword);
router.post('/logout', authenticate, authController.logout);

export default router;


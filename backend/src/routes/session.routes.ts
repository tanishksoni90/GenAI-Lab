import { Router } from 'express';
import * as sessionController from '../controllers/session.controller';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { z } from 'zod';

const router = Router();

// Validation schemas
const createSessionSchema = z.object({
  body: z.object({
    modelId: z.string().uuid('Invalid model ID'),
    agentId: z.string().uuid('Invalid agent ID').optional(),
  }),
});

const sendMessageSchema = z.object({
  body: z.object({
    content: z.string().min(1, 'Message content is required').max(10000, 'Message too long'),
  }),
});

const updateTitleSchema = z.object({
  body: z.object({
    title: z.string().min(1, 'Title is required').max(200, 'Title too long'),
  }),
});

// All routes require authentication
router.use(authenticate);

// Sessions CRUD
router.post('/', validate(createSessionSchema), sessionController.createSession);
router.get('/', sessionController.getUserSessions);
router.get('/:id', sessionController.getSession);
router.patch('/:id', validate(updateTitleSchema), sessionController.updateSessionTitle);
router.post('/:id/end', sessionController.endSession);

// Messages
router.get('/:id/messages', sessionController.getSessionMessages);
router.post('/:id/messages', validate(sendMessageSchema), sessionController.sendMessage);
router.post('/:id/messages/stream', validate(sendMessageSchema), sessionController.sendMessageStreaming);

export default router;


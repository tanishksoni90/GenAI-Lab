import { Router } from 'express';
import * as chatbotController from '../controllers/chatbot.controller';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { z } from 'zod';

const router = Router();

// Validation schemas
const createChatbotSchema = z.object({
  body: z.object({
    name: z.string().min(1, 'Name is required').max(100, 'Name too long'),
    description: z.string().max(500, 'Description too long').optional(),
    modelId: z.string().uuid('Invalid model ID'),
    behaviorPrompt: z.string().max(5000, 'Behavior prompt too long').optional(),
    strictMode: z.boolean().optional(),
    knowledgeBase: z.array(z.string()).optional(),
    guardrailIds: z.array(z.string().uuid()).optional(),
  }),
});

// Reusable param schema for :id routes
const idParamSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid chatbot ID'),
  }),
});

const updateChatbotSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid chatbot ID'),
  }),
  body: z.object({
    name: z.string().min(1, 'Name is required').max(100, 'Name too long').optional(),
    description: z.string().max(500, 'Description too long').optional(),
    modelId: z.string().uuid('Invalid model ID').optional(),
    behaviorPrompt: z.string().max(5000, 'Behavior prompt too long').optional(),
    strictMode: z.boolean().optional(),
    knowledgeBase: z.array(z.string()).optional(),
    guardrailIds: z.array(z.string().uuid()).optional(),
  }),
});

// All routes require authentication
router.use(authenticate);

// Guardrails (for chatbot creation)
router.get('/guardrails', chatbotController.getAvailableGuardrails);

// Chatbots CRUD
router.post('/', validate(createChatbotSchema), chatbotController.createChatbot);
router.get('/', chatbotController.getUserChatbots);
router.get('/:id', validate(idParamSchema), chatbotController.getChatbot);
router.put('/:id', validate(updateChatbotSchema), chatbotController.updateChatbot);
router.delete('/:id', validate(idParamSchema), chatbotController.deleteChatbot);

// Chatbot stats
router.get('/:id/stats', validate(idParamSchema), chatbotController.getChatbotStats);

export default router;

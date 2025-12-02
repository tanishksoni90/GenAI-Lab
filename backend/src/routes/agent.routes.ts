import { Router } from 'express';
import * as agentController from '../controllers/agent.controller';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { z } from 'zod';

const router = Router();

// Validation schemas
const createAgentSchema = z.object({
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

const updateAgentSchema = z.object({
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

// Guardrails (for agent creation)
router.get('/guardrails', agentController.getAvailableGuardrails);

// Agents CRUD
router.post('/', validate(createAgentSchema), agentController.createAgent);
router.get('/', agentController.getUserAgents);
router.get('/:id', agentController.getAgent);
router.put('/:id', validate(updateAgentSchema), agentController.updateAgent);
router.delete('/:id', agentController.deleteAgent);

// Agent stats
router.get('/:id/stats', agentController.getAgentStats);

export default router;


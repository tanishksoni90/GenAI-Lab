import { Router } from 'express';
import * as artifactController from '../controllers/artifact.controller';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { z } from 'zod';

const router = Router();

// Validation schemas
const createArtifactSchema = z.object({
  body: z.object({
    sessionId: z.string().uuid('Invalid session ID'),
    type: z.enum(['text', 'code', 'image', 'audio']),
    title: z.string().max(200).optional(),
    content: z.string().min(1, 'Content is required'),
    modelUsed: z.string().optional(),
    score: z.number().min(0).max(100).optional(),
  }),
});

// All routes require authentication
router.use(authenticate);

// Artifacts CRUD
router.post('/', validate(createArtifactSchema), artifactController.createArtifact);
router.get('/', artifactController.getUserArtifacts);
router.get('/:id', artifactController.getArtifact);
router.post('/:id/bookmark', artifactController.toggleBookmark);
router.delete('/:id', artifactController.deleteArtifact);

export default router;


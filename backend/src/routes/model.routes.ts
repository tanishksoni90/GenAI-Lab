import { Router } from 'express';
import * as modelController from '../controllers/model.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Get all models
router.get('/', modelController.getAllModels);

// Get model by ID
router.get('/:id', modelController.getModel);

// Get models by category
router.get('/category/:category', modelController.getModelsByCategory);

// Get usage stats
router.get('/stats/usage', modelController.getModelUsageStats);

export default router;


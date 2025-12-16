import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import * as comparisonController from '../controllers/comparison.controller';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Get available categories
router.get('/categories', comparisonController.getCategories);

// Get models by category
router.get('/models/:category', comparisonController.getModelsByCategory);

// Start a comparison exchange (creates session/exchange, returns IDs)
router.post('/start-exchange', comparisonController.startExchange);

// Run a single model comparison (called independently for each model)
router.post('/run-model', comparisonController.runSingleModel);

// Stream a single model's response (SSE)
router.post('/stream-model', comparisonController.streamSingleModel);

// Compare multiple models (legacy - waits for all)
router.post('/compare', comparisonController.compareModels);

// Get user's comparison sessions
router.get('/sessions', comparisonController.getUserSessions);

// Get session details
router.get('/sessions/:sessionId', comparisonController.getSessionDetails);

// Delete session
router.delete('/sessions/:sessionId', comparisonController.deleteSession);

export default router;

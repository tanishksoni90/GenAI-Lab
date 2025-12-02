import { Request, Response, NextFunction } from 'express';
import * as aiService from '../services/ai.service';
import { sendSuccess } from '../utils/response';

// Get all models
export const getAllModels = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const models = await aiService.getAllModels();
    return sendSuccess(res, { models });
  } catch (error) {
    next(error);
  }
};

// Get model by ID
export const getModel = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const model = await aiService.getModelById(req.params.id);
    return sendSuccess(res, { model });
  } catch (error) {
    next(error);
  }
};

// Get models by category
export const getModelsByCategory = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const category = req.params.category;
    const models = await aiService.getModelsByCategory(category);
    return sendSuccess(res, { models, category });
  } catch (error) {
    next(error);
  }
};

// Get model usage stats for current user
export const getModelUsageStats = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const stats = await aiService.getModelUsageStats(req.user!.id);
    return sendSuccess(res, { stats });
  } catch (error) {
    next(error);
  }
};


import { Request, Response, NextFunction } from 'express';
import * as chatbotService from '../services/chatbot.service';
import { sendSuccess, sendCreated, sendNoContent } from '../utils/response';

// Create a new chatbot
export const createChatbot = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const chatbot = await chatbotService.createChatbot(req.user!.id, req.body);
    return sendCreated(res, { chatbot }, 'Chatbot created successfully');
  } catch (error) {
    next(error);
  }
};

// Get chatbot by ID
export const getChatbot = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const chatbot = await chatbotService.getChatbot(req.params.id, req.user!.id);
    return sendSuccess(res, { chatbot });
  } catch (error) {
    next(error);
  }
};

// Get user's chatbots
export const getUserChatbots = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const chatbots = await chatbotService.getUserChatbots(req.user!.id);
    return sendSuccess(res, { chatbots });
  } catch (error) {
    next(error);
  }
};

// Update chatbot
export const updateChatbot = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const chatbot = await chatbotService.updateChatbot(req.params.id, req.user!.id, req.body);
    return sendSuccess(res, { chatbot }, 'Chatbot updated successfully');
  } catch (error) {
    next(error);
  }
};

// Delete chatbot
export const deleteChatbot = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    await chatbotService.deleteChatbot(req.params.id, req.user!.id);
    return sendNoContent(res);
  } catch (error) {
    next(error);
  }
};

// Get chatbot stats
export const getChatbotStats = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const stats = await chatbotService.getChatbotStats(req.params.id, req.user!.id);
    return sendSuccess(res, { stats });
  } catch (error) {
    next(error);
  }
};

// Get available guardrails
export const getAvailableGuardrails = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const guardrails = await chatbotService.getAvailableGuardrails();
    return sendSuccess(res, { guardrails });
  } catch (error) {
    next(error);
  }
};

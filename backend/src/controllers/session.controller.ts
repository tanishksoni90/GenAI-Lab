import { Request, Response, NextFunction } from 'express';
import * as sessionService from '../services/session.service';
import { sendSuccess, sendCreated, sendPaginated } from '../utils/response';

// Create a new session
export const createSession = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { modelId, agentId } = req.body;
    const session = await sessionService.createSession(req.user!.id, modelId, agentId);
    return sendCreated(res, { session }, 'Session created successfully');
  } catch (error) {
    next(error);
  }
};

// Get session by ID
export const getSession = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const session = await sessionService.getSession(req.params.id, req.user!.id);
    return sendSuccess(res, { session });
  } catch (error) {
    next(error);
  }
};

// Get user's sessions
export const getUserSessions = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const modelId = req.query.modelId as string | undefined;
    const agentId = req.query.agentId as string | undefined;

    const result = await sessionService.getUserSessions(req.user!.id, {
      page,
      limit,
      modelId,
      agentId,
    });

    return sendPaginated(res, result.sessions, result.page, result.limit, result.total);
  } catch (error) {
    next(error);
  }
};

// Send a message in a session
export const sendMessage = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { content } = req.body;
    const result = await sessionService.sendMessage(req.params.id, req.user!.id, content);
    return sendSuccess(res, result, 'Message sent successfully');
  } catch (error) {
    next(error);
  }
};

// Get session messages
export const getSessionMessages = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const messages = await sessionService.getSessionMessages(req.params.id, req.user!.id);
    return sendSuccess(res, { messages });
  } catch (error) {
    next(error);
  }
};

// Update session title
export const updateSessionTitle = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { title } = req.body;
    const session = await sessionService.updateSessionTitle(req.params.id, req.user!.id, title);
    return sendSuccess(res, { session }, 'Session title updated');
  } catch (error) {
    next(error);
  }
};

// End session
export const endSession = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const session = await sessionService.endSession(req.params.id, req.user!.id);
    return sendSuccess(res, { session }, 'Session ended');
  } catch (error) {
    next(error);
  }
};


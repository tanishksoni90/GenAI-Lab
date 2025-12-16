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

// Send a message with streaming response
export const sendMessageStreaming = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { content } = req.body;
    const sessionId = req.params.id;
    const userId = req.user!.id;

    // Set SSE headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('Access-Control-Allow-Origin', '*');

    // Send start event
    res.write(`data: ${JSON.stringify({ type: 'start' })}\n\n`);

    // Stream response
    const result = await sessionService.sendMessageStreaming(
      sessionId,
      userId,
      content,
      (chunk: string, done: boolean) => {
        if (done) {
          return;
        }
        res.write(`data: ${JSON.stringify({ type: 'chunk', content: chunk })}\n\n`);
      }
    );

    // Send done event with full result including token usage and cost
    res.write(`data: ${JSON.stringify({
      type: 'done',
      userMessage: result.userMessage,
      assistantMessage: result.assistantMessage,
      tokensUsed: result.tokensUsed,
      inputTokens: result.inputTokens,
      outputTokens: result.outputTokens,
      cost: result.cost,
      isMock: result.isMock,
    })}\n\n`);

    res.end();
  } catch (error: any) {
    // Send error event
    res.write(`data: ${JSON.stringify({
      type: 'error',
      error: error.message || 'An error occurred',
    })}\n\n`);
    res.end();
  }
};


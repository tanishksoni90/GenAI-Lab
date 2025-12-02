import { Request, Response, NextFunction } from 'express';
import * as agentService from '../services/agent.service';
import { sendSuccess, sendCreated, sendNoContent } from '../utils/response';

// Create a new agent
export const createAgent = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const agent = await agentService.createAgent(req.user!.id, req.body);
    return sendCreated(res, { agent }, 'Agent created successfully');
  } catch (error) {
    next(error);
  }
};

// Get agent by ID
export const getAgent = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const agent = await agentService.getAgent(req.params.id, req.user!.id);
    return sendSuccess(res, { agent });
  } catch (error) {
    next(error);
  }
};

// Get user's agents
export const getUserAgents = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const agents = await agentService.getUserAgents(req.user!.id);
    return sendSuccess(res, { agents });
  } catch (error) {
    next(error);
  }
};

// Update agent
export const updateAgent = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const agent = await agentService.updateAgent(req.params.id, req.user!.id, req.body);
    return sendSuccess(res, { agent }, 'Agent updated successfully');
  } catch (error) {
    next(error);
  }
};

// Delete agent
export const deleteAgent = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    await agentService.deleteAgent(req.params.id, req.user!.id);
    return sendNoContent(res);
  } catch (error) {
    next(error);
  }
};

// Get agent stats
export const getAgentStats = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const stats = await agentService.getAgentStats(req.params.id, req.user!.id);
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
    const guardrails = await agentService.getAvailableGuardrails();
    return sendSuccess(res, { guardrails });
  } catch (error) {
    next(error);
  }
};


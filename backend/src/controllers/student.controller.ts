import { Request, Response, NextFunction } from 'express';
import * as studentService from '../services/student.service';
import { sendSuccess } from '../utils/response';

// Get dashboard stats
export const getDashboard = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const stats = await studentService.getDashboardStats(req.user!.id);
    return sendSuccess(res, stats);
  } catch (error) {
    next(error);
  }
};

// Get recent sessions
export const getRecentSessions = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const limit = parseInt(req.query.limit as string) || 10;
    const sessions = await studentService.getRecentSessions(req.user!.id, limit);
    return sendSuccess(res, { sessions });
  } catch (error) {
    next(error);
  }
};

// Get leaderboard
export const getLeaderboard = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const type = (req.query.type as 'institutional' | 'course') || 'institutional';
    const courseId = req.query.courseId as string | undefined;
    const limit = parseInt(req.query.limit as string) || 20;
    
    const leaderboard = await studentService.getLeaderboard(type, courseId, limit);
    return sendSuccess(res, { leaderboard, type });
  } catch (error) {
    next(error);
  }
};

// Get course rank
export const getCourseRank = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const rank = await studentService.getCourseRank(req.user!.id);
    return sendSuccess(res, rank);
  } catch (error) {
    next(error);
  }
};

// Get activity calendar
export const getActivityCalendar = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const calendar = await studentService.getActivityCalendar(req.user!.id);
    return sendSuccess(res, calendar);
  } catch (error) {
    next(error);
  }
};


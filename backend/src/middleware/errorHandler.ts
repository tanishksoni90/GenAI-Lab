import { Request, Response, NextFunction } from 'express';
import { AppError, ValidationError } from '../utils/errors';
import { sendError } from '../utils/response';
import { config } from '../config';

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
): Response => {
  // Log error in development
  if (config.isDev) {
    console.error('Error:', err);
  }

  // Handle known operational errors
  if (err instanceof AppError) {
    if (err instanceof ValidationError) {
      return sendError(res, err.message, err.statusCode, err.errors);
    }
    return sendError(res, err.message, err.statusCode);
  }

  // Handle Prisma errors
  if (err.name === 'PrismaClientKnownRequestError') {
    const prismaError = err as any;
    
    // Unique constraint violation
    if (prismaError.code === 'P2002') {
      const field = prismaError.meta?.target?.[0] || 'field';
      return sendError(res, `A record with this ${field} already exists`, 409);
    }
    
    // Record not found
    if (prismaError.code === 'P2025') {
      return sendError(res, 'Record not found', 404);
    }
  }

  // Handle JWT errors
  if (err.name === 'JsonWebTokenError') {
    return sendError(res, 'Invalid token', 401);
  }
  
  if (err.name === 'TokenExpiredError') {
    return sendError(res, 'Token expired', 401);
  }

  // Handle unknown errors
  const message = config.isDev ? err.message : 'Internal server error';
  return sendError(res, message, 500);
};

// 404 handler for undefined routes
export const notFoundHandler = (
  req: Request,
  res: Response,
  _next: NextFunction
): Response => {
  return sendError(res, `Route ${req.method} ${req.originalUrl} not found`, 404);
};


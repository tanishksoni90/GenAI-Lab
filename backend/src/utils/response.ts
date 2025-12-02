import { Response } from 'express';

interface SuccessResponse<T> {
  success: true;
  data: T;
  message?: string;
}

interface ErrorResponse {
  success: false;
  error: string;
  errors?: Record<string, string[]>;
}

interface PaginatedResponse<T> {
  success: true;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export const sendSuccess = <T>(
  res: Response, 
  data: T, 
  message?: string, 
  statusCode: number = 200
): Response => {
  const response: SuccessResponse<T> = {
    success: true,
    data,
    ...(message && { message }),
  };
  return res.status(statusCode).json(response);
};

export const sendCreated = <T>(
  res: Response, 
  data: T, 
  message: string = 'Created successfully'
): Response => {
  return sendSuccess(res, data, message, 201);
};

export const sendError = (
  res: Response, 
  error: string, 
  statusCode: number = 500,
  errors?: Record<string, string[]>
): Response => {
  const response: ErrorResponse = {
    success: false,
    error,
    ...(errors && { errors }),
  };
  return res.status(statusCode).json(response);
};

export const sendPaginated = <T>(
  res: Response,
  data: T[],
  page: number,
  limit: number,
  total: number
): Response => {
  const response: PaginatedResponse<T> = {
    success: true,
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
  return res.status(200).json(response);
};

export const sendNoContent = (res: Response): Response => {
  return res.status(204).send();
};


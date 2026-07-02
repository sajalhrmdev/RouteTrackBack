import { Response } from 'express';
import { ApiResponse, PaginatedResult } from '../types';

export function sendSuccess<T>(res: Response, data?: T, message?: string, statusCode = 200): void {
  const response: ApiResponse<T> = {
    success: true,
    message,
    data,
  };
  res.status(statusCode).json(response);
}

export function sendError(res: Response, error: string, statusCode = 500, errors?: Record<string, string[]>): void {
  const response: ApiResponse = {
    success: false,
    error,
    errors,
  };
  res.status(statusCode).json(response);
}

export function sendPaginated<T>(res: Response, result: PaginatedResult<T>, message?: string): void {
  const response = {
    success: true,
    message,
    ...result,
  };
  res.status(200).json(response);
}

export function sendCreated<T>(res: Response, data?: T, message?: string): void {
  sendSuccess(res, data, message, 201);
}

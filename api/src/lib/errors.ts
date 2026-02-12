/**
 * Error Handling Middleware
 *
 * Provides standardized error handling with error codes and responses.
 */

import type { Request, Response, NextFunction } from 'express';
import { logger } from './logger.js';

/**
 * Standard error codes
 */
export enum ErrorCode {
  // General errors (1000-1999)
  INTERNAL_ERROR = 1000,
  INVALID_REQUEST = 1001,
  NOT_FOUND = 1002,
  METHOD_NOT_ALLOWED = 1003,
  RATE_LIMIT_EXCEEDED = 1004,

  // Validation errors (2000-2999)
  VALIDATION_ERROR = 2000,
  MISSING_REQUIRED_FIELD = 2001,
  INVALID_FORMAT = 2002,

  // LLM errors (3000-3999)
  LLM_UNAVAILABLE = 3000,
  LLM_TIMEOUT = 3001,
  LLM_QUOTA_EXCEEDED = 3002,
  LLM_INVALID_RESPONSE = 3003,

  // Database errors (4000-4999)
  DATABASE_ERROR = 4000,
  VECTOR_SEARCH_FAILED = 4001,

  // Authentication errors (5000-5999)
  UNAUTHORIZED = 5000,
  FORBIDDEN = 5001,
}

/**
 * HTTP status code mapping
 */
const statusCodeMap: Record<ErrorCode, number> = {
  [ErrorCode.INTERNAL_ERROR]: 500,
  [ErrorCode.INVALID_REQUEST]: 400,
  [ErrorCode.NOT_FOUND]: 404,
  [ErrorCode.METHOD_NOT_ALLOWED]: 405,
  [ErrorCode.RATE_LIMIT_EXCEEDED]: 429,

  [ErrorCode.VALIDATION_ERROR]: 400,
  [ErrorCode.MISSING_REQUIRED_FIELD]: 400,
  [ErrorCode.INVALID_FORMAT]: 400,

  [ErrorCode.LLM_UNAVAILABLE]: 503,
  [ErrorCode.LLM_TIMEOUT]: 504,
  [ErrorCode.LLM_QUOTA_EXCEEDED]: 429,
  [ErrorCode.LLM_INVALID_RESPONSE]: 502,

  [ErrorCode.DATABASE_ERROR]: 500,
  [ErrorCode.VECTOR_SEARCH_FAILED]: 500,

  [ErrorCode.UNAUTHORIZED]: 401,
  [ErrorCode.FORBIDDEN]: 403,
};

/**
 * Application error class
 */
export class AppError extends Error {
  constructor(
    public code: ErrorCode,
    message: string,
    public details?: unknown
  ) {
    super(message);
    this.name = 'AppError';
    Error.captureStackTrace(this, this.constructor);
  }

  /**
   * Get HTTP status code for this error
   */
  get statusCode(): number {
    return statusCodeMap[this.code] || 500;
  }

  /**
   * Check if this is a client error (4xx)
   */
  get isClientError(): boolean {
    return this.statusCode >= 400 && this.statusCode < 500;
  }

  /**
   * Check if this is a server error (5xx)
   */
  get isServerError(): boolean {
    return this.statusCode >= 500;
  }
}

/**
 * Error response format
 */
interface ErrorResponse {
  success: false;
  error: {
    code: ErrorCode;
    message: string;
    details?: unknown;
    requestId?: string;
  };
}

/**
 * Error handler middleware
 */
export const errorHandlerMiddleware = (
  err: Error | AppError,
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  const requestId = (req as RequestWithId).id || 'unknown';

  // Handle AppError
  if (err instanceof AppError) {
    const errorResponse: ErrorResponse = {
      success: false,
      error: {
        code: err.code,
        message: err.message,
        details: err.details,
        requestId,
      },
    };

    // Log server errors with stack
    if (err.isServerError) {
      logger.error({
        type: 'app_error',
        requestId,
        code: err.code,
        message: err.message,
        details: err.details,
        stack: err.stack,
      }, `AppError: ${err.message}`);
    } else {
      // Log client errors at warn level
      logger.warn({
        type: 'client_error',
        requestId,
        code: err.code,
        message: err.message,
      }, `ClientError: ${err.message}`);
    }

    res.status(err.statusCode).json(errorResponse);
    return;
  }

  // Handle unknown errors
  logger.error({
    type: 'unknown_error',
    requestId,
    error: err.message,
    stack: err.stack,
  }, `Unknown Error: ${err.message}`);

  const errorResponse: ErrorResponse = {
    success: false,
    error: {
      code: ErrorCode.INTERNAL_ERROR,
      message: 'An unexpected error occurred',
      requestId,
    },
  };

  res.status(500).json(errorResponse);
};

/**
 * 404 Not Found handler
 */
export const notFoundHandler = (
  req: Request,
  res: Response
): void => {
  const requestId = (req as RequestWithId).id || 'unknown';

  const errorResponse: ErrorResponse = {
    success: false,
    error: {
      code: ErrorCode.NOT_FOUND,
      message: `Route not found: ${req.method} ${req.url}`,
      requestId,
    },
  };

  res.status(404).json(errorResponse);
};

/**
 * Async handler wrapper to catch errors
 */
export const asyncHandler = (
  fn: (req: Request, res: Response, next: NextFunction) => Promise<void>
) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

import type { RequestWithId } from './requestTracing.js';

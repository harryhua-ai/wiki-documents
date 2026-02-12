/**
 * Request Tracing Middleware
 *
 * Adds unique request ID to each incoming request for distributed tracing.
 */

import { v4 as uuidv4 } from 'uuid';
import { logger } from './logger.js';
import type { Request, Response, NextFunction } from 'express';

export interface RequestWithId extends Request {
  id: string;
}

/**
 * Request ID middleware - adds unique ID to each request
 */
export const requestIdMiddleware = (
  req: RequestWithId,
  res: Response,
  next: NextFunction
): void => {
  // Generate or use existing request ID
  req.id = (req.headers['x-request-id'] as string) || uuidv4();

  // Add request ID to response header
  res.setHeader('X-Request-ID', req.id);

  next();
};

/**
 * Request logging middleware - logs all incoming requests
 */
export const requestLoggingMiddleware = (
  req: RequestWithId,
  res: Response,
  next: NextFunction
): void => {
  const startTime = Date.now();

  // Log request
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    const { method, url, ip } = req;
    const { statusCode } = res;

    logger.info({
      type: 'http_request',
      requestId: req.id,
      method,
      url,
      ip,
      status: statusCode,
      duration: `${duration}ms`,
      userAgent: req.headers['user-agent'],
    }, `${method} ${url} ${statusCode} - ${duration}ms`);
  });

  next();
};

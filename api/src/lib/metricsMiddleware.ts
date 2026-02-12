/**
 * Metrics Middleware
 *
 * Automatically collects Prometheus metrics for HTTP requests.
 */

import type { Request, Response, NextFunction } from 'express';
import { httpRequestDuration, httpRequestsTotal } from './metrics.js';

/**
 * Normalizes route path to avoid high cardinality labels
 * (e.g., /api/users/123 -> /api/users/:id)
 */
const normalizeRoute = (req: Request): string => {
  // Use req.route.path if available (Express internal), otherwise fallback to req.path
  // This helps group dynamic routes like /api/chat/:sessionId
  if (req.route && req.route.path) {
    return req.baseUrl + req.route.path;
  }

  // Basic normalization for common patterns if route info is missing
  return req.path
    .replace(/\/([a-f0-9-]{36})/g, '/:uuid') // UUIDs
    .replace(/\/(\d+)/g, '/:id');            // Numeric IDs
};

export const metricsMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  const start = process.hrtime();

  // Listen for response finish
  res.on('finish', () => {
    const diff = process.hrtime(start);
    const durationSeconds = diff[0] + diff[1] / 1e9;
    const route = normalizeRoute(req);
    const method = req.method;
    const statusCode = res.statusCode.toString();

    // Record duration histogram
    httpRequestDuration.labels(method, route, statusCode).observe(durationSeconds);

    // Record request counter
    httpRequestsTotal.labels(method, route, statusCode).inc();
  });

  next();
};

/**
 * Structured Logging Utility
 *
 * Provides pino-based structured logging for the application.
 */

import pino from 'pino';
import { env } from '../config/index.js';

// Log level mapping
type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'fatal';

// Child logger with context
interface LoggerWithContext {
  (level: LogLevel, msg: string, ...args: unknown[]): void;
  debug(msg: string, ...args: unknown[]): void;
  info(msg: string, ...args: unknown[]): void;
  warn(msg: string, ...args: unknown[]): void;
  error(msg: string, ...args: unknown[]): void;
  fatal(msg: string, ...args: unknown[]): void;
}

/**
 * Create pino logger instance
 */
const baseLogger = pino({
  level: env.NODE_ENV === 'production' ? 'info' : 'debug',
  formatters: {
    level: (label) => {
      return { level: label };
    },
  },
  timestamp: pino.stdTimeFunctions.isoTime,
  // Redact sensitive data
  redact: {
    paths: ['req.headers.authorization', 'req.query.api_key', 'res.body.api_key'],
    remove: true,
  },
});

/**
 * Create child logger with request context
 */
export const withRequest = (reqId: string, context?: Record<string, unknown>): LoggerWithContext => {
  const child = baseLogger.child({
    requestId: reqId,
    ...context,
  });
  return child as unknown as LoggerWithContext;
};

/**
 * Create module-specific logger
 */
export const createLogger = (module: string): LoggerWithContext => {
  const child = baseLogger.child({ module });
  return child as unknown as LoggerWithContext;
};

/**
 * Default logger for general use
 */
export const logger = baseLogger;

/**
 * Transport for development (pretty print)
 */
export const devTransport = {
  target: 'pino-pretty',
  options: {
    colorize: true,
    translateTime: 'HH:MM:ss',
    ignore: 'pid,hostname',
  },
};

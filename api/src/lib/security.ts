import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import type { Express } from 'express';
import { logger } from './logger.js';

/**
 * Configure security middleware for the application
 */
export function configureSecurity(app: Express) {
  // 1. Set security HTTP headers
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'"], // Adjust as needed
        imgSrc: ["'self'", "data:", "https:"],
        connectSrc: ["'self'", "https://api.openai.com"], // Allow external API calls if needed from client (usually handled by backend proxy though)
      },
    },
    crossOriginEmbedderPolicy: false, // Often causes issues with images/resources
  }));

  logger.info('Security headers configured');
}

/**
 * General API rate limiter
 * 100 requests per 15 minutes
 */
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Too many requests, please try again later.'
  },
  handler: (_req, res, _next, options) => {
    logger.warn({ ip: _req.ip }, 'Rate limit exceeded');
    res.status(options.statusCode).send(options.message);
  }
});

/**
 * Stricter rate limiter for LLM/Chat endpoints to control costs
 * 20 requests per hour
 */
export const chatLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 50, // 50 messages per hour per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Chat limit exceeded. Please wait a while before sending more messages.'
  },
  handler: (_req, res, _next, options) => {
    logger.warn({ ip: _req.ip }, 'Chat rate limit exceeded');
    res.status(options.statusCode).send(options.message);
  }
});

/**
 * Feedback endpoint limiter
 * Prevent spamming feedback
 */
export const feedbackLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10,
  message: {
    error: 'Too many feedback submissions.'
  }
});

import express from 'express';
import cors from 'cors';
import { serverConfig } from './config/index.js';
import { handleChat, healthCheck as chatHealthCheck } from './routes/chat.js';
import { handleFeedback, getFeedbackStats } from './routes/feedback.js';
import { handleConfig } from './routes/config.js';
import { vectorStore } from './services/rag.js';
import { requestIdMiddleware, requestLoggingMiddleware } from './lib/requestTracing.js';
import { errorHandlerMiddleware, notFoundHandler } from './lib/errors.js';
import { logger } from './lib/logger.js';
import { configureSecurity, apiLimiter, chatLimiter, feedbackLimiter } from './lib/security.js';
import { shutdownLangfuse } from './lib/langfuse.js';

import { register } from './lib/metrics.js';
import { metricsMiddleware } from './lib/metricsMiddleware.js';

// ============================================================================
// Initialize Vector Store
// ============================================================================

// Load vector store on startup (async initialization)
vectorStore.initialize().catch((error) => {
  logger.error({ type: 'startup_error', error: String(error) }, 'Failed to load vector store');
});

// ============================================================================
// Express App Setup
// ============================================================================

const app = express();

// Request ID middleware (must be first)
app.use(requestIdMiddleware as any);

// Security Headers (Helmet)
configureSecurity(app as any);

// Metrics middleware (before logging to capture all requests)
app.use(metricsMiddleware as any);

// Prometheus metrics endpoint
app.get('/metrics', async (_req, res) => {
  try {
    res.set('Content-Type', register.contentType);
    res.end(await register.metrics());
  } catch (err) {
    res.status(500).end(err);
  }
});

// Request logging middleware
app.use(requestLoggingMiddleware as any);

// CORS configuration
app.use(
  cors({
    origin: serverConfig.corsOrigin,
    credentials: true,
  })
);

// Body parser for JSON
app.use(express.json({ limit: '10kb' }));

// Apply general rate limiting to all API routes
app.use('/api/', apiLimiter);

// ============================================================================
// Health Check
// ============================================================================

app.get('/health', chatHealthCheck);

// ============================================================================
// API Routes
// ============================================================================

// GET /api/config - Public configuration
app.get('/api/config', handleConfig);

// POST /api/chat - Main chat endpoint with SSE streaming (Strict rate limit)
app.post('/api/chat', chatLimiter, handleChat);

// POST /api/feedback - Feedback submission (Strict rate limit)
app.post('/api/feedback', feedbackLimiter, handleFeedback);

// GET /api/feedback/stats - Feedback statistics (optional, could be admin-only)
app.get('/api/feedback/stats', getFeedbackStats);

// ============================================================================
// Error Handling
// ============================================================================

// 404 handler (must be before error handler)
app.use(notFoundHandler);

// Global error handler (must be last)
app.use(errorHandlerMiddleware);

// ============================================================================
// Server Startup
// ============================================================================

const server = app.listen(serverConfig.port, serverConfig.host, () => {
  logger.info({
    type: 'startup',
    port: serverConfig.port,
    host: serverConfig.host,
    env: serverConfig.nodeEnv,
  }, `Server listening on ${serverConfig.host}:${serverConfig.port}`);

  // Console startup banner
  console.log(`
╔══════════════════════════════════════════════════════════════╗
║                                                              ║
║   CamThink Wiki Ask AI API Server                           ║
║                                                              ║
║   Status: Running                                            ║
║   Environment: ${serverConfig.nodeEnv.padEnd(40)}║
║   URL: http://${serverConfig.host}:${serverConfig.port}${' '.repeat(35)}║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝

  Available endpoints:
    GET  /health              - Health check
    GET  /api/config          - Public configuration
    POST /api/chat            - Chat with SSE streaming
    POST /api/feedback        - Submit feedback
    GET  /api/feedback/stats  - Feedback statistics

  Press Ctrl+C to stop
`);
});

// ============================================================================
// Graceful Shutdown
// ============================================================================

const shutdown = async (signal: string) => {
  logger.info({ type: 'shutdown', signal }, `Received ${signal}, shutting down gracefully...`);

  // Shutdown Langfuse client first to flush traces
  try {
    await shutdownLangfuse();
    logger.info('Langfuse client shutdown complete');
  } catch (error) {
    logger.error({ error }, 'Error shutting down Langfuse');
  }

  server.close(() => {
    logger.info('Server closed successfully');
    process.exit(0);
  });

  // Force shutdown after 10 seconds
  const timeout = setTimeout(() => {
    logger.error('Forced shutdown after timeout');
    process.exit(1);
  }, 10000);

  // Clear timeout if shutdown completes
  server.on('close', () => {
    clearTimeout(timeout);
  });
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

// Handle uncaught errors
process.on('uncaughtException', (err) => {
  logger.error({
    type: 'uncaught_exception',
    error: err.message,
    stack: err.stack,
  }, 'Uncaught exception');
  shutdown('uncaughtException');
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error({
    type: 'unhandled_rejection',
    reason: String(reason),
    promise: String(promise),
  }, 'Unhandled promise rejection');
});

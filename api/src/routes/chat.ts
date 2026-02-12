import { z } from 'zod';
import type { Request, Response } from 'express';
import { createHash } from 'crypto';
import { generateAnswer } from '../services/rag.js';
import {
  getOrCreateSession,
  getSessionHistory,
  addMessage,
  updateCacheHistory,
} from '../services/history.js';
import {
  setupSSEHeaders,
  sendSSEEvent,
  isResponseWritable,
  createErrorEvent,
  startKeepAlive,
  stopKeepAlive,
} from '../lib/sse.js';
import { ErrorCodes, APIError } from '../types/index.js';
import { securityConfig } from '../config/index.js';

// ============================================================================
// Validation Schema
// ============================================================================

const chatRequestSchema = z.object({
  session_id: z.string().uuid().optional(),
  message: z.string().min(1).max(2000),
  language: z.enum(['en', 'zh-Hans']).default('en'),
  history: z
    .array(
      z.object({
        role: z.enum(['user', 'assistant', 'system']),
        content: z.string(),
      })
    )
    .optional(),
});

// ============================================================================
// POST /api/chat
// ============================================================================

export const handleChat = async (req: Request, res: Response): Promise<void> => {
  let keepAliveId: NodeJS.Timeout | null = null;

  try {
    // Validate request body
    const body = chatRequestSchema.parse(req.body);

    // Setup SSE
    setupSSEHeaders(res);
    keepAliveId = startKeepAlive(res);

    // Extract client IP (anonymized with SHA-256 + salt)
    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    const ipHash = createHash('sha256')
      .update(ip + securityConfig.ipSalt)
      .digest('hex')
      .substring(0, 16);

    // Get or create session
    const session = await getOrCreateSession(body.session_id, ipHash, body.language);

    // Get conversation history
    const history = body.history || getSessionHistory(session.id);

    // Store user message
    addMessage(session.id, 'user', body.message);

    let fullResponse = '';
    let sources: any[] = [];

    try {
      // Stream the RAG response
      for await (const event of generateAnswer(body.message, body.language, history, session.id)) {
        // Check if connection is still alive
        if (!isResponseWritable(res)) {
          console.log('Client disconnected, stopping stream');
          return;
        }

        if (event.type === 'chunk') {
          fullResponse += event.data.content;
          sendSSEEvent(res, { type: 'chunk', content: event.data.content });
        } else if (event.type === 'sources') {
          sources = event.data.sources;
          sendSSEEvent(res, { type: 'sources', sources });
        } else if (event.type === 'tool_call') {
          sendSSEEvent(res, {
            type: 'tool_call',
            tool: event.data.tool,
            status: event.data.status,
            message: event.data.message,
          });
        } else if (event.type === 'tool_result') {
          sendSSEEvent(res, {
            type: 'tool_result',
            tool: event.data.tool,
            data: event.data.data,
            status: event.data.status,
          });
        } else {
          sendSSEEvent(res, event.data);
        }
      }

      // Store assistant message
      addMessage(session.id, 'assistant', fullResponse, sources, {
        session_id: session.id,
        language: body.language,
      });

      // Update cache
      const updatedHistory = [
        ...history,
        { role: 'user' as const, content: body.message },
        { role: 'assistant' as const, content: fullResponse },
      ];
      updateCacheHistory(session.id, updatedHistory);

      // Send done event
      sendSSEEvent(res, {
        type: 'done',
      });
    } catch (error) {
      console.error('Error during RAG generation:', error);

      if (isResponseWritable(res)) {
        sendSSEEvent(
          res,
          createErrorEvent(
            error instanceof Error ? error.message : 'Failed to generate response',
            ErrorCodes.LLM_ERROR
          )
        );
        sendSSEEvent(res, { type: 'done' });
      }
    }
  } catch (error) {
    console.error('Chat endpoint error:', error);

    if (isResponseWritable(res)) {
      if (error instanceof z.ZodError) {
        sendSSEEvent(
          res,
          createErrorEvent('Invalid request: ' + error.errors[0].message, ErrorCodes.INVALID_REQUEST)
        );
      } else if (error instanceof APIError) {
        sendSSEEvent(res, createErrorEvent(error.message, error.code));
      } else {
        sendSSEEvent(
          res,
          createErrorEvent(
            error instanceof Error ? error.message : 'Internal server error',
            ErrorCodes.INTERNAL_ERROR
          )
        );
      }
      sendSSEEvent(res, { type: 'done' });
    }
  } finally {
    if (keepAliveId) {
      stopKeepAlive(keepAliveId);
    }
    // Ensure response is ended
    if (isResponseWritable(res)) {
      res.end();
    }
  }
};

// ============================================================================
// SSE Connection Handler
// ============================================================================

/**
 * Handle client disconnect
 */
export const handleDisconnect = (_req: Request, res: Response): void => {
  console.log(`Client disconnected from chat endpoint`);
  res.end();
};

// ============================================================================
// Health Check
// ============================================================================

export const healthCheck = async (_req: Request, res: Response): Promise<void> => {
  try {
    // Import health check dynamically to avoid circular dependency
    const { healthCheck: llmHealthCheck } = await import('../services/llm.js');
    const { getVectorStoreStats } = await import('../services/rag.js');
    const { getSessionStats } = await import('../services/history.js');

    const [llmHealth, vectorStats, sessionStats] = await Promise.all([
      llmHealthCheck(),
      getVectorStoreStats(),
      Promise.resolve(getSessionStats()),
    ]);

    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      services: {
        llm: llmHealth.primary ? 'connected' : 'disconnected',
        fallbacks: llmHealth.fallbacks.map((f) => (f ? 'connected' : 'disconnected')),
        vectorStore: {
          status: 'connected',
          documents: vectorStats.documentCount,
        },
        sessions: sessionStats,
      },
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error instanceof Error ? error.message : 'Health check failed',
    });
  }
};

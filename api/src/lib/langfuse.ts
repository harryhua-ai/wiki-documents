import { Langfuse } from 'langfuse';
import { env } from '../config/index.js';

// ============================================================================
// Langfuse Client Configuration
// ============================================================================

let langfuseClient: Langfuse | null = null;

/**
 * Initialize Langfuse client (lazy loading)
 */
export const getLangfuseClient = (): Langfuse | null => {
  if (langfuseClient) {
    return langfuseClient;
  }

  if (!env.LANGFUSE_PUBLIC_KEY || !env.LANGFUSE_SECRET_KEY) {
    return null;
  }

  try {
    langfuseClient = new Langfuse({
      publicKey: env.LANGFUSE_PUBLIC_KEY,
      secretKey: env.LANGFUSE_SECRET_KEY,
      baseUrl: env.LANGFUSE_BASE_URL,
      flushAt: 10,
      flushInterval: 1000,
    });

    console.log('[Langfuse] Client initialized successfully');
    return langfuseClient;
  } catch (error) {
    console.error('[Langfuse] Failed to initialize client:', error);
    return null;
  }
};

/**
 * Shutdown Langfuse client gracefully
 */
export const shutdownLangfuse = async (): Promise<void> => {
  if (langfuseClient) {
    try {
      await langfuseClient.flushAsync();
      await langfuseClient.shutdownAsync();
      console.log('[Langfuse] Client shutdown complete');
    } catch (error) {
      console.error('[Langfuse] Error during shutdown:', error);
    }
  }
};

// ============================================================================
// Trace Management Helpers
// ============================================================================

export const createTrace = (
  name: string,
  userId?: string,
  metadata?: Record<string, unknown>
) => {
  const client = getLangfuseClient();
  if (!client) {
    return null;
  }

  const trace = client.trace({
    name,
    userId,
    metadata: {
      ...metadata,
      timestamp: new Date().toISOString(),
    },
  });

  return trace;
};

export const createSpan = (
  trace: ReturnType<Langfuse['trace']> | null,
  name: string
) => {
  if (!trace) return null;

  const span = trace.span({
    name,
  });

  return span;
};

export const scoreTrace = (
  trace: ReturnType<Langfuse['trace']> | null,
  score: number,
  comment?: string
) => {
  if (!trace) return;

  try {
    // @ts-ignore - Langfuse SDK types may not match exactly
    trace.score({
      name: 'quality',
      value: score,
      comment,
    });
  } catch (error) {
    console.error('[Langfuse] Failed to score trace:', error);
  }
};

export const updateTraceMetadata = (
  trace: ReturnType<Langfuse['trace']> | null,
  metadata: Record<string, unknown>
) => {
  if (!trace) return;

  try {
    trace.update({
      metadata,
    });
  } catch (error) {
    console.error('[Langfuse] Failed to update trace metadata:', error);
  }
};

// ============================================================================
// LLM Operation Tracking Helpers
// ============================================================================

export interface LLMGenerationParams {
  model: string;
  temperature?: number;
  maxTokens?: number;
  prompt: string;
  completion?: string;
  latencyMs?: number;
  tokensUsed?: {
    prompt: number;
    completion: number;
    total: number;
  };
  provider?: string;
}

export const trackLLMGeneration = (
  name: string,
  params: LLMGenerationParams,
  userId?: string
) => {
  const client = getLangfuseClient();
  if (!client) {
    return { trace: null, generation: null };
  }

  const trace = client.trace({
    name,
    userId,
    metadata: {
      model: params.model,
      provider: params.provider || 'unknown',
      temperature: params.temperature,
      maxTokens: params.maxTokens,
      latencyMs: params.latencyMs,
    },
  });

  // @ts-ignore - Langfuse SDK types may not match exactly
  const generation = trace.generation({
    model: params.model,
    modelParameters: {
      temperature: params.temperature || 0.3,
      maxTokens: params.maxTokens || 2048,
    },
    input: params.prompt,
    output: params.completion || '',
    startTime: new Date(),
    completionStartTime: new Date(Date.now() - (params.latencyMs || 0)),
    endTime: new Date(),
  });

  if (params.tokensUsed) {
    generation.update({
      // @ts-ignore
      usage: {
        promptTokens: params.tokensUsed.prompt || 0,
        completionTokens: params.tokensUsed.completion || 0,
        totalTokens: params.tokensUsed.total || 0,
      },
    });
  }

  return { trace, generation };
};

// ============================================================================
// Error Tracking
// ============================================================================

export const trackError = (
  trace: ReturnType<Langfuse['trace']> | null,
  errorMessage: string,
  errorDetails?: Record<string, unknown>
) => {
  if (!trace) return;

  try {
    trace.update({
      metadata: {
        error: errorMessage,
        ...errorDetails,
        level: 'error',
      },
    });
  } catch (error) {
    console.error('[Langfuse] Failed to track error:', error);
  }
};

export default getLangfuseClient;

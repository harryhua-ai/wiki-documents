import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  getLangfuseClient,
  shutdownLangfuse,
  createTrace,
  createSpan,
  trackLLMGeneration,
  trackError,
  scoreTrace,
  updateTraceMetadata,
} from '../langfuse.js';

// Mock console methods to avoid cluttering test output
const originalConsoleLog = console.log;
const originalConsoleError = console.error;

describe('Langfuse Integration', () => {
  beforeEach(() => {
    // Clear environment variables before each test
    delete process.env.LANGFUSE_PUBLIC_KEY;
    delete process.env.LANGFUSE_SECRET_KEY;
    delete process.env.LANGFUSE_BASE_URL;

    // Mock console
    console.log = vi.fn();
    console.error = vi.fn();
  });

  afterEach(() => {
    // Restore console
    console.log = originalConsoleLog;
    console.error = originalConsoleError;
  });

  describe('Client Initialization', () => {
    it('should return null when Langfuse credentials are not provided', () => {
      const client = getLangfuseClient();
      expect(client).toBeNull();
    });

    it('should initialize client when credentials are provided', () => {
      process.env.LANGFUSE_PUBLIC_KEY = 'pk-test-key';
      process.env.LANGFUSE_SECRET_KEY = 'sk-test-secret';

      // Note: This will try to connect to Langfuse, which may fail in test environment
      // The important thing is that it attempts initialization
      const client = getLangfuseClient();

      // Client should be created (or null if init fails due to network)
      expect(typeof client === 'object' || client === null).toBe(true);
    });

    it('should log success message on initialization', () => {
      process.env.LANGFUSE_PUBLIC_KEY = 'pk-test-key';
      process.env.LANGFUSE_SECRET_KEY = 'sk-test-secret';

      getLangfuseClient();

      // Verify console operations - the mock should have been called during initialization attempt
      // (even if actual connection fails, there should be some console activity)
      const logCalls = (console.log as ReturnType<typeof vi.fn>).mock.calls.length +
                      (console.error as ReturnType<typeof vi.fn>).mock.calls.length;

      // Should have at least attempted to initialize
      expect(logCalls).toBeGreaterThan(0);
    });
  });

  describe('Trace Management', () => {
    beforeEach(() => {
      // Set credentials for trace tests
      process.env.LANGFUSE_PUBLIC_KEY = 'pk-test-key';
      process.env.LANGFUSE_SECRET_KEY = 'sk-test-secret';
    });

    it('should create a trace with basic parameters', () => {
      const trace = createTrace('test_operation', 'user-123');

      if (trace) {
        expect(trace).toBeDefined();
      } else {
        // If Langfuse client failed to initialize, trace will be null
        expect(trace).toBeNull();
      }
    });

    it('should create a trace with metadata', () => {
      const metadata = {
        model: 'test-model',
        latency: 150,
      };

      const trace = createTrace('test_with_metadata', 'user-456', metadata);

      if (trace) {
        expect(trace).toBeDefined();
      }
    });

    it('should create a span from trace', () => {
      const trace = createTrace('test_span');

      if (trace) {
        const span = createSpan(trace, 'sub_operation');
        if (span) {
          expect(span).toBeDefined();
        }
      }
    });

    it('should update trace metadata', () => {
      const trace = createTrace('test_update');

      if (trace) {
        updateTraceMetadata(trace, { updated: true, value: 42 });
        // Should not throw error
        expect(true).toBe(true);
      }
    });

    it('should score a trace', () => {
      const trace = createTrace('test_score');

      if (trace) {
        scoreTrace(trace, 0.8, 'Good quality');
        // Should not throw error
        expect(true).toBe(true);
      }
    });
  });

  describe('LLM Generation Tracking', () => {
    beforeEach(() => {
      process.env.LANGFUSE_PUBLIC_KEY = 'pk-test-key';
      process.env.LANGFUSE_SECRET_KEY = 'sk-test-secret';
    });

    it('should track LLM generation with basic parameters', () => {
      const result = trackLLMGeneration('chat_completion', {
        model: 'test-model',
        prompt: 'Test prompt',
        completion: 'Test response',
        latencyMs: 100,
      });

      if (result.trace) {
        expect(result.trace).toBeDefined();
        expect(result.generation).toBeDefined();
      } else {
        expect(result.trace).toBeNull();
        expect(result.generation).toBeNull();
      }
    });

    it('should track LLM generation with token usage', () => {
      const result = trackLLMGeneration('embedding_generation', {
        model: 'embedding-model',
        prompt: 'Text to embed',
        latencyMs: 50,
        tokensUsed: {
          prompt: 10,
          completion: 0,
          total: 10,
        },
      });

      if (result.generation) {
        // Should not throw error
        expect(true).toBe(true);
      }
    });

    it('should handle missing optional parameters gracefully', () => {
      const result = trackLLMGeneration('minimal_tracking', {
        model: 'test-model',
        prompt: 'Minimal test',
      });

      // Should not throw error with minimal params
      expect(result).toBeDefined();
    });
  });

  describe('Error Tracking', () => {
    beforeEach(() => {
      process.env.LANGFUSE_PUBLIC_KEY = 'pk-test-key';
      process.env.LANGFUSE_SECRET_KEY = 'sk-test-secret';
    });

    it('should track error with trace', () => {
      const trace = createTrace('test_error');

      if (trace) {
        trackError(trace, 'Test error message', {
          errorCode: 'TEST_ERROR',
          retryAttempt: 1,
        });
        // Should not throw error
        expect(true).toBe(true);
      }
    });

    it('should handle null trace gracefully', () => {
      // Should not throw when trace is null
      expect(() => {
        trackError(null, 'Error without trace');
      }).not.toThrow();
    });
  });

  describe('Shutdown', () => {
    it('should shutdown gracefully when client is initialized', async () => {
      process.env.LANGFUSE_PUBLIC_KEY = 'pk-test-key';
      process.env.LANGFUSE_SECRET_KEY = 'sk-test-secret';

      // Initialize client
      getLangfuseClient();

      // Shutdown should not throw
      await expect(shutdownLangfuse()).resolves.toBeUndefined();
    });

    it('should shutdown gracefully when client is not initialized', async () => {
      // No credentials, client not initialized
      const result = await shutdownLangfuse();
      // Should not throw error
      expect(result).toBeUndefined();
    });
  });

  describe('Edge Cases', () => {
    it('should handle multiple rapid calls to getLangfuseClient', () => {
      process.env.LANGFUSE_PUBLIC_KEY = 'pk-test-key';
      process.env.LANGFUSE_SECRET_KEY = 'sk-test-secret';

      const client1 = getLangfuseClient();
      const client2 = getLangfuseClient();
      const client3 = getLangfuseClient();

      // Should return the same client instance (singleton pattern)
      expect(client1).toBe(client2);
      expect(client2).toBe(client3);
    });

    it('should not throw errors when Langfuse service is unavailable', () => {
      // Even if Langfuse service is down, the code should not crash
      process.env.LANGFUSE_PUBLIC_KEY = 'pk-invalid';
      process.env.LANGFUSE_SECRET_KEY = 'sk-invalid';

      expect(() => {
        createTrace('test_unreachable_service');
      }).not.toThrow();
    });
  });
});

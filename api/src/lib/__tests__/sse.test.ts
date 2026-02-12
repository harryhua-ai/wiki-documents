import { describe, it, expect, vi } from 'vitest';
import {
  formatSSEEvent,
  sendSSEEvent,
  endSSEStream,
  createErrorEvent,
  setupSSEHeaders,
  isResponseWritable,
} from '../../lib/sse.js';
import type { SSEEventData } from '../../types/index.js';

describe('SSE Utilities', () => {
  describe('formatSSEEvent', () => {
    it('should format a simple event', () => {
      const data: SSEEventData = { type: 'chunk', content: 'Hello' };
      expect(formatSSEEvent(data)).toBe('data: {"type":"chunk","content":"Hello"}\n\n');
    });

    it('should format event with special characters', () => {
      const data: SSEEventData = { type: 'chunk', content: 'Hello\nWorld' };
      const result = formatSSEEvent(data);
      expect(result).toContain('data: {');
      expect(result).toContain('\n\n');
    });

    it('should format done event', () => {
      const data: SSEEventData = { type: 'done' };
      expect(formatSSEEvent(data)).toBe('data: {"type":"done"}\n\n');
    });
  });

  describe('createErrorEvent', () => {
    it('should create an error event', () => {
      const event = createErrorEvent('Something went wrong', 'INTERNAL_ERROR');
      expect(event).toEqual({
        type: 'error',
        message: 'Something went wrong',
        code: 'INTERNAL_ERROR',
      });
    });

    it('should create error with empty code', () => {
      const event = createErrorEvent('Error', '');
      expect(event.type).toBe('error');
      expect(event.message).toBe('Error');
      expect(event.code).toBe('');
    });
  });

  describe('sendSSEEvent', () => {
    it('should write formatted event to response', () => {
      const mockRes = {
        write: vi.fn(),
      } as any;
      const data: SSEEventData = { type: 'chunk', content: 'test' };

      sendSSEEvent(mockRes, data);

      expect(mockRes.write).toHaveBeenCalledWith('data: {"type":"chunk","content":"test"}\n\n');
    });

    it('should handle write errors gracefully', () => {
      const mockRes = {
        write: vi.fn(() => {
          throw new Error('Write error');
        }),
      } as any;
      const data: SSEEventData = { type: 'chunk', content: 'test' };

      // Should not throw
      expect(() => sendSSEEvent(mockRes, data)).not.toThrow();
    });
  });

  describe('setupSSEHeaders', () => {
    it('should set all required SSE headers', () => {
      const mockRes = {
        setHeader: vi.fn(),
        flushHeaders: vi.fn(),
      } as any;

      setupSSEHeaders(mockRes);

      expect(mockRes.setHeader).toHaveBeenCalledWith('Content-Type', 'text/event-stream');
      expect(mockRes.setHeader).toHaveBeenCalledWith('Cache-Control', 'no-cache, no-transform');
      expect(mockRes.setHeader).toHaveBeenCalledWith('Connection', 'keep-alive');
      expect(mockRes.setHeader).toHaveBeenCalledWith('X-Accel-Buffering', 'no');
      expect(mockRes.flushHeaders).toHaveBeenCalled();
    });
  });

  describe('isResponseWritable', () => {
    it('should return true when response is writable', () => {
      const mockRes = { writable: true, closed: false } as any;
      expect(isResponseWritable(mockRes)).toBe(true);
    });

    it('should return false when response is not writable', () => {
      const mockRes = { writable: false, closed: false } as any;
      expect(isResponseWritable(mockRes)).toBe(false);
    });

    it('should return false when response is closed', () => {
      const mockRes = { writable: true, closed: true } as any;
      expect(isResponseWritable(mockRes)).toBe(false);
    });
  });

  describe('endSSEStream', () => {
    it('should send done event and end response', () => {
      const mockRes = {
        write: vi.fn(),
        end: vi.fn(),
        writable: true,
        closed: false,
      } as any;

      endSSEStream(mockRes);

      expect(mockRes.write).toHaveBeenCalledWith('data: {"type":"done"}\n\n');
      expect(mockRes.end).toHaveBeenCalled();
    });

    it('should not send if response is not writable', () => {
      const mockRes = {
        write: vi.fn(),
        end: vi.fn(),
        writable: false,
        closed: false,
      } as any;

      endSSEStream(mockRes);

      expect(mockRes.write).not.toHaveBeenCalled();
      expect(mockRes.end).not.toHaveBeenCalled();
    });

    it('should handle end errors gracefully', () => {
      const mockRes = {
        write: vi.fn(),
        end: vi.fn(() => {
          throw new Error('End error');
        }),
        writable: true,
        closed: false,
      } as any;

      // Should not throw
      expect(() => endSSEStream(mockRes)).not.toThrow();
    });
  });
});

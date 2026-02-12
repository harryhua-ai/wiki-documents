import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  AppError,
  ErrorCode,
  notFoundHandler,
  asyncHandler,
} from '../../lib/errors.js';

describe('Error Classes', () => {
  describe('AppError', () => {
    it('should create base App error', () => {
      const error = new AppError(ErrorCode.VALIDATION_ERROR, 'Test error');
      expect(error.message).toBe('Test error');
      expect(error.code).toBe(ErrorCode.VALIDATION_ERROR);
      expect(error.statusCode).toBe(400);
      expect(error.name).toBe('AppError');
    });

    it('should be instance of Error', () => {
      const error = new AppError(ErrorCode.INTERNAL_ERROR, 'Test');
      expect(error instanceof Error).toBe(true);
      expect(error instanceof AppError).toBe(true);
    });

    it('should have correct status code for rate limit', () => {
      const error = new AppError(ErrorCode.RATE_LIMIT_EXCEEDED, 'Too many requests');
      expect(error.statusCode).toBe(429);
    });

    it('should identify client errors', () => {
      const error = new AppError(ErrorCode.VALIDATION_ERROR, 'Invalid input');
      expect(error.isClientError).toBe(true);
      expect(error.isServerError).toBe(false);
    });

    it('should identify server errors', () => {
      const error = new AppError(ErrorCode.DATABASE_ERROR, 'DB failed');
      expect(error.isServerError).toBe(true);
      expect(error.isClientError).toBe(false);
    });

    it('should include details', () => {
      const details = { field: 'email', value: 'invalid' };
      const error = new AppError(ErrorCode.INVALID_FORMAT, 'Invalid format', details);
      expect(error.details).toEqual(details);
    });
  });
});

describe('Error Handlers', () => {
  describe('notFoundHandler', () => {
    it('should return 404 error response', () => {
      const mockReq = {
        method: 'GET',
        url: '/api/unknown',
      } as any;

      const mockRes = {
        status: vi.fn(() => mockRes),
        json: vi.fn(),
      } as any;

      notFoundHandler(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: expect.objectContaining({
            code: ErrorCode.NOT_FOUND,
          }),
        })
      );
    });
  });

  describe('asyncHandler', () => {
    it('should catch async errors and pass to next', async () => {
      const mockNext = vi.fn();

      const handler = asyncHandler(async () => {
        throw new Error('Async error');
      });

      const mockReq = {} as any;
      const mockRes = {} as any;

      await handler(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
      expect(mockNext).toHaveBeenCalledWith(expect.objectContaining({
        message: 'Async error',
      }));
    });

    it('should not call next for successful async functions', async () => {
      const mockNext = vi.fn();

      const handler = asyncHandler(async () => {
        // Do nothing
      });

      const mockReq = {} as any;
      const mockRes = {} as any;

      await handler(mockReq, mockRes, mockNext);

      expect(mockNext).not.toHaveBeenCalled();
    });
  });
});

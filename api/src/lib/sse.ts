// SSE (Server-Sent Events) Utility Functions

import type { SSEEventData } from '../types/index.js';

/**
 * Formats an SSE event for sending to the client
 */
export const formatSSEEvent = (data: SSEEventData): string => {
  return `data: ${JSON.stringify(data)}\n\n`;
};

/**
 * Sends an SSE event to a response stream
 */
export const sendSSEEvent = (
  res: any,
  data: SSEEventData
): void => {
  try {
    res.write(formatSSEEvent(data));
  } catch (error) {
    console.error('Error sending SSE event:', error);
  }
};

/**
 * Sets up SSE headers for a response
 */
export const setupSSEHeaders = (res: any): void => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no'); // Disable Nginx buffering
  res.flushHeaders();
};

/**
 * Creates a readable stream from an async generator
 */
export async function* streamFromAsyncGenerator<T>(
  generator: AsyncGenerator<T>
): AsyncIterable<T> {
  yield* generator;
}

/**
 * Checks if a response is still writable
 */
export const isResponseWritable = (res: any): boolean => {
  return res.writable && !res.closed;
};

/**
 * Ends an SSE stream properly
 */
export const endSSEStream = (res: any): void => {
  try {
    if (isResponseWritable(res)) {
      sendSSEEvent(res, { type: 'done' });
      res.end();
    }
  } catch (error) {
    console.error('Error ending SSE stream:', error);
  }
};

/**
 * Creates an SSE event with error details
 */
export const createErrorEvent = (
  message: string,
  code: string
): SSEEventData => {
  return {
    type: 'error',
    message,
    code,
  };
};

/**
 * SSE Keep-alive utility
 * Sends a comment every 30 seconds to keep connection alive
 */
export const startKeepAlive = (res: any, intervalMs: number = 30000): NodeJS.Timeout => {
  return setInterval(() => {
    try {
      res.write(': keep-alive\n\n');
    } catch (error) {
      // Connection probably closed
    }
  }, intervalMs);
};

/**
 * Stops the keep-alive interval
 */
export const stopKeepAlive = (intervalId: NodeJS.Timeout): void => {
  clearInterval(intervalId);
};

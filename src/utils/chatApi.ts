/**
 * Chat API - Backend API communication for Ask AI feature
 *
 * Handles SSE streaming, error handling, and request/response formatting
 */

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface ChatRequest {
  session_id?: string;
  message: string;
  language: 'en' | 'zh-Hans';
  history?: ChatMessage[];
}

export interface SourceReference {
  title: string;
  url: string;
  section?: string;
  excerpt: string;
  score?: number;
}

export type SSEEventType =
  | 'routing'
  | 'progress'
  | 'chunk'
  | 'sources'
  | 'suggestions'
  | 'error'
  | 'done';

export interface SSEEvent {
  type: SSEEventType;
  data?: unknown;
}

export interface ChatResponseCallback {
  onRouting?: (path: 'fast' | 'agent') => void;
  onProgress?: (step: string) => void;
  onChunk?: (content: string) => void;
  onSources?: (sources: SourceReference[]) => void;
  onSuggestions?: (suggestions: string[]) => void;
  onError?: (message: string, code: string) => void;
  onDone?: () => void;
}

/**
 * API base URL - relative path for same-origin requests
 */
const API_BASE = '/api';

/**
 * Send a chat request and handle SSE streaming response
 */
export async function sendChatRequest(
  request: ChatRequest,
  callbacks: ChatResponseCallback,
  signal?: AbortSignal
): Promise<void> {
  const { onRouting, onProgress, onChunk, onSources, onSuggestions, onError, onDone } = callbacks;

  try {
    const response = await fetch(`${API_BASE}/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
      signal,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ code: 'UNKNOWN_ERROR', message: 'Unknown error' }));
      onError?.(errorData.message || `HTTP ${response.status}`, errorData.code || 'HTTP_ERROR');
      return;
    }

    if (!response.body) {
      onError?.('No response body', 'NO_RESPONSE');
      return;
    }

    // Parse SSE stream
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();

      if (done) break;

      buffer += decoder.decode(value, { stream: true });

      // Process complete SSE lines
      const lines = buffer.split('\n\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (!line.trim() || !line.startsWith('data: ')) continue;

        const data = line.slice(6).trim();

        // Handle "[DONE]" sentinel
        if (data === '[DONE]') {
          onDone?.();
          return;
        }

        try {
          const event: SSEEvent = JSON.parse(data);

          switch (event.type) {
            case 'routing':
              onRouting?.((event.data as { path: 'fast' | 'agent' }).path);
              break;

            case 'progress':
              onProgress?.((event.data as { step: string }).step);
              break;

            case 'chunk':
              onChunk?.((event.data as { content: string }).content);
              break;

            case 'sources':
              onSources?.((event.data as { sources: SourceReference[] }).sources);
              break;

            case 'suggestions':
              onSuggestions?.((event.data as { items: string[] }).items);
              break;

            case 'error':
              const errData = event.data as { message: string; code: string };
              onError?.(errData.message, errData.code);
              break;

            case 'done':
              onDone?.();
              break;
          }
        } catch (parseError) {
          console.warn('Failed to parse SSE event:', data, parseError);
        }
      }
    }
  } catch (error) {
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        // Request was aborted, ignore
        return;
      }
      onError?.(error.message, 'NETWORK_ERROR');
    } else {
      onError?.('Unknown error', 'UNKNOWN_ERROR');
    }
  }
}

/**
 * Send feedback for a chat response
 */
export async function sendFeedback(
  conversationId: string,
  messageId: string,
  rating: 'positive' | 'negative',
  comment?: string
): Promise<{ success: boolean }> {
  try {
    const response = await fetch(`${API_BASE}/feedback`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        conversation_id: conversationId,
        message_id: messageId,
        rating,
        comment,
      }),
    });

    if (!response.ok) {
      throw new Error(`Feedback request failed: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Failed to send feedback:', error);
    return { success: false };
  }
}

/**
 * Get suggested questions for the welcome screen
 */
export async function getSuggestedQuestions(language: 'en' | 'zh-Hans' = 'en'): Promise<string[]> {
  try {
    const response = await fetch(`${API_BASE}/config?suggested_questions=1`);

    if (!response.ok) {
      return [];
    }

    const data = await response.json();
    return data.suggested_questions || [];
  } catch (error) {
    console.error('Failed to fetch suggested questions:', error);
    // Return default suggestions
    return language === 'zh-Hans'
      ? [
          '如何快速上手 NG4500？',
          'NE301 支持哪些 AI 模型？',
          'NE101 和 NE301 有什么区别？',
          '如何给 NG4500 刷系统？',
        ]
      : [
          'How to get started with NG4500?',
          'Which AI models does NE301 support?',
          'What is the difference between NE101 and NE301?',
          'How to flash the system on NG4500?',
        ];
  }
}

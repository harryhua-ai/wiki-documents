import { useState, useCallback, useRef, useEffect } from 'react';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import ExecutionEnvironment from '@docusaurus/ExecutionEnvironment';
import { getResponseLanguage } from '../utils/languageDetection';
import { exportChatHistory, ExportFormat } from '../utils/chatExport';

// Types for the chat state and API
export interface MessageSource {
  title: string;
  section?: string;
  url: string;
}

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  sources?: MessageSource[];
  timestamp: number;
  feedback?: 'up' | 'down' | null;
}

export type RoutingPath = 'fast' | 'agent' | 'agent_tools' | null;

export interface ToolCall {
  tool: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  message: string;
  data?: unknown;
}

export interface ChatState {
  isOpen: boolean;
  isLoading: boolean;
  routingPath: RoutingPath;
  agentStep: string | null;
  toolCalls: ToolCall[];
  messages: Message[];
  suggestions: string[];
  streamingContent: string;
  sessionId: string;
}

export interface UseChatReturn extends ChatState {
  sendMessage: (text: string) => Promise<void>;
  submitFeedback: (messageId: string, rating: 'up' | 'down', comment?: string) => Promise<void>;
  resetSession: () => void;
  exportChat: (format: ExportFormat) => void;
  toggleChat: () => void;
  closeChat: () => void;
}

// Export types for components
export type { ToolCall, RoutingPath, ExportFormat };

const STORAGE_KEY = 'askai_session';
const LOCALSTORAGE_OPEN_KEY = 'askai_is_open';
const THROTTLE_MS = 100; // Update UI at most every 100ms during streaming

const generateSessionId = (): string => {
  // Generate a UUID-like string for backend compatibility
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

const createMessage = (role: 'user' | 'assistant', content: string): Message => {
  // Generate UUID for message ID to satisfy backend validation
  let id;
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    id = crypto.randomUUID();
  } else {
    id = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  return {
    id,
    role,
    content,
    timestamp: Date.now(),
  };
};

const getApiBaseUrl = (): string => {
  if (ExecutionEnvironment.canUseDOM) {
    // In development, API runs on port 3001
    // In production, API and web share the same origin
    const isDev = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    if (isDev && window.location.port === '3000') {
      return `${window.location.protocol}//${window.location.hostname}:3001`;
    }
    return window.location.origin;
  }
  return '';
};

// Simple throttle implementation
function throttle<T extends (...args: any[]) => void>(func: T, wait: number): T {
  let timeout: ReturnType<typeof setTimeout> | null = null;
  let previous = 0;

  return ((...args: Parameters<T>) => {
    const now = Date.now();
    const remaining = wait - (now - previous);

    if (remaining <= 0 || remaining > wait) {
      if (timeout) {
        clearTimeout(timeout);
        timeout = null;
      }
      previous = now;
      func(...args);
    } else if (!timeout) {
      timeout = setTimeout(() => {
        previous = Date.now();
        timeout = null;
        func(...args);
      }, remaining);
    }
  }) as T;
}

export const useChat = (): UseChatReturn => {
  const { i18n } = useDocusaurusContext();
  const currentLocale = i18n.currentLocale;

  // Initialize state from local storage (browser only)
  const getInitialMessages = (): Message[] => {
    if (!ExecutionEnvironment.canUseDOM) return [];
    try {
      const item = window.localStorage.getItem(STORAGE_KEY);
      return item ? JSON.parse(item).messages || [] : [];
    } catch {
      return [];
    }
  };

  const getInitialSessionId = (): string => {
    if (!ExecutionEnvironment.canUseDOM) return generateSessionId();
    try {
      const item = window.localStorage.getItem(STORAGE_KEY);
      return item ? JSON.parse(item).sessionId || generateSessionId() : generateSessionId();
    } catch {
      return generateSessionId();
    }
  };

  const getInitialOpenState = (): boolean => {
    if (!ExecutionEnvironment.canUseDOM) return false;
    try {
      const item = window.localStorage.getItem(LOCALSTORAGE_OPEN_KEY);
      return item ? JSON.parse(item) : false;
    } catch {
      return false;
    }
  };

  const [isOpen, setIsOpen] = useState<boolean>(getInitialOpenState);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [routingPath, setRoutingPath] = useState<RoutingPath>(null);
  const [agentStep, setAgentStep] = useState<string | null>(null);
  const [toolCalls, setToolCalls] = useState<ToolCall[]>([]);
  const [messages, setMessages] = useState<Message[]>(getInitialMessages);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [streamingContent, setStreamingContent] = useState<string>('');
  const [sessionId] = useState<string>(getInitialSessionId);

  // Use ref to track the current assistant message being streamed
  const streamingMessageIdRef = useRef<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Ref to accumulate streaming content without triggering re-renders
  const accumulatedContentRef = useRef<string>('');

  // Ref to track if we should save to storage (only when streaming is done)
  const shouldSaveToStorageRef = useRef<boolean>(false);

  // Throttled function to update UI - prevents excessive re-renders
  const updateStreamingUI = useCallback(() => {
    const currentId = streamingMessageIdRef.current;
    const content = accumulatedContentRef.current;

    if (currentId) {
      setStreamingContent(content);
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === currentId
            ? { ...msg, content }
            : msg
        )
      );
    }
  }, []);

  // Create throttled version
  const throttledUpdateUI = useRef(
    throttle(updateStreamingUI, THROTTLE_MS)
  ).current;

  // Persist state changes (browser only) - ONLY when not streaming
  useEffect(() => {
    if (!ExecutionEnvironment.canUseDOM) return;
    // Only save when not actively streaming to avoid storage thrashing
    if (isLoading) return;

    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ sessionId, messages }));
    } catch {
      // Ignore storage errors
    }
  }, [sessionId, messages, isLoading]);

  // Save to storage when streaming completes
  useEffect(() => {
    if (!ExecutionEnvironment.canUseDOM) return;
    if (!isLoading && shouldSaveToStorageRef.current) {
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ sessionId, messages }));
        shouldSaveToStorageRef.current = false;
      } catch {
        // Ignore storage errors
      }
    }
  }, [isLoading, sessionId, messages]);

  useEffect(() => {
    if (!ExecutionEnvironment.canUseDOM) return;
    try {
      window.localStorage.setItem(LOCALSTORAGE_OPEN_KEY, JSON.stringify(isOpen));
    } catch {
      // Ignore storage errors
    }
  }, [isOpen]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort();
    };
  }, []);

  const toggleChat = useCallback(() => {
    setIsOpen((prev) => !prev);
  }, []);

  const closeChat = useCallback(() => {
    setIsOpen(false);
  }, []);

  const resetSession = useCallback(() => {
    setMessages([]);
    setStreamingContent('');
    setRoutingPath(null);
    setAgentStep(null);
    setToolCalls([]);
    setSuggestions([]);
    if (ExecutionEnvironment.canUseDOM) {
      try {
        const newSessionId = generateSessionId();
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ sessionId: newSessionId, messages: [] }));
      } catch {
        // Ignore storage errors
      }
    }
  }, []);

  const exportChat = useCallback((format: ExportFormat) => {
    if (!ExecutionEnvironment.canUseDOM) return;
    exportChatHistory(messages, sessionId, format);
  }, [messages, sessionId]);

  const submitFeedback = useCallback(async (messageId: string, rating: 'up' | 'down', comment?: string) => {
    if (!ExecutionEnvironment.canUseDOM) return;

    try {
      const apiBaseUrl = getApiBaseUrl();
      await fetch(`${apiBaseUrl}/api/feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversation_id: sessionId,
          message_id: messageId,
          rating: rating === 'up' ? 'positive' : 'negative',
          comment,
        }),
      });

      // Update local state optimistically
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === messageId ? { ...msg, feedback: rating } : msg
        )
      );
    } catch (error) {
      // Silently fail on feedback errors
      // eslint-disable-next-line no-console
      console.error('Failed to submit feedback:', error);
    }
  }, [sessionId, currentLocale]);

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || !ExecutionEnvironment.canUseDOM) return;

    // Cancel any ongoing request
    abortControllerRef.current?.abort();
    abortControllerRef.current = new AbortController();

    // Add user message
    const userMessage = createMessage('user', text.trim());
    setMessages((prev) => [...prev, userMessage]);

    // Create placeholder for assistant message
    const assistantMessage = createMessage('assistant', '');
    streamingMessageIdRef.current = assistantMessage.id;
    setMessages((prev) => [...prev, assistantMessage]);

    setIsLoading(true);
    setRoutingPath(null);
    setAgentStep(null);
    setToolCalls([]);
    setSuggestions([]);
    setStreamingContent('');
    accumulatedContentRef.current = '';
    shouldSaveToStorageRef.current = true;

    try {
      const apiBaseUrl = getApiBaseUrl();
      // Detect language from user input for response matching
      const detectedLanguage = getResponseLanguage(text.trim(), currentLocale);

      const response = await fetch(`${apiBaseUrl}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text.trim(),
          sessionId,
          language: detectedLanguage,
        }),
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) {
        if (response.status === 429) {
          throw new Error('You have reached the message limit. Please try again later.');
        }
        throw new Error(`API error: ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error('No response body');

      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (!line.trim() || !line.startsWith('data: ')) continue;

          const data = line.slice(6).trim();

          if (data === '[DONE]') {
            // Only update UI if there's accumulated content to display
            // Don't overwrite messages that were set by other events (e.g., error)
            if (accumulatedContentRef.current) {
              throttledUpdateUI.flush?.() || updateStreamingUI();
            }
            setIsLoading(false);
            setAgentStep(null);
            continue;
          }

          try {
            const event = JSON.parse(data);

            switch (event.type) {
              case 'chunk':
                // Accumulate content in ref (no re-render)
                accumulatedContentRef.current += event.content;
                // Trigger throttled UI update
                throttledUpdateUI();
                break;

              case 'routing':
                setRoutingPath(event.path);
                break;

              case 'progress':
                setAgentStep(event.step);
                break;

              case 'tool_call':
                // Add or update tool call
                setToolCalls((prev) => {
                  const existing = prev.findIndex(t => t.tool === event.tool);
                  const newCall: ToolCall = {
                    tool: event.tool,
                    status: event.status,
                    message: event.message || '',
                  };
                  if (existing >= 0) {
                    const updated = [...prev];
                    updated[existing] = newCall;
                    return updated;
                  }
                  return [...prev, newCall];
                });
                // Also set as agent step for backward compatibility
                setAgentStep(event.message || `Calling ${event.tool}...`);
                break;

              case 'tool_result':
                // Update tool call with result
                setToolCalls((prev) =>
                  prev.map((t) =>
                    t.tool === event.tool
                      ? {
                          ...t,
                          status: event.status === 'success' ? 'completed' : 'failed',
                          data: event.data,
                        }
                      : t
                  )
                );
                break;

              case 'sources':
                // Filter out sources without valid URLs
                const validSources = (event.sources as MessageSource[]).filter(
                  (source: MessageSource) => source.url && source.url.trim() !== ''
                );
                setMessages((prev) =>
                  prev.map((msg) =>
                    msg.id === streamingMessageIdRef.current
                      ? { ...msg, sources: validSources }
                      : msg
                  )
                );
                break;

              case 'suggestions':
                if (event.items && Array.isArray(event.items)) {
                  setSuggestions(event.items);
                }
                break;

              case 'error':
                // Find the last assistant message (the one currently being streamed)
                // and set its content to the error message
                setMessages((prev) => {
                  // Find the last assistant message that has empty content
                  const lastAssistantIndex = prev.findLastIndex(m => m.role === 'assistant' && !m.content);
                  if (lastAssistantIndex === -1) {
                    // Fallback: find any empty assistant message
                    const emptyAssistantIndex = prev.findIndex(m => m.role === 'assistant' && !m.content);
                    if (emptyAssistantIndex === -1) return prev;
                    const updated = [...prev];
                    updated[emptyAssistantIndex] = { ...updated[emptyAssistantIndex], content: `Error: ${event.message}` };
                    return updated;
                  }
                  const updated = [...prev];
                  updated[lastAssistantIndex] = { ...updated[lastAssistantIndex], content: `Error: ${event.message}` };
                  return updated;
                });
                setIsLoading(false);
                setAgentStep(null);
                break;

              default:
                break;
            }
          } catch {
            // Skip invalid JSON
          }
        }
      }
    } catch (error) {
      // Handle aborted request silently
      if ((error as Error).name !== 'AbortError') {
        const errorMessage = error instanceof Error ? error.message : 'Sorry, I encountered an error. Please try again.';

        // Use specific error message for rate limits, otherwise generic
        const displayMessage = errorMessage.includes('message limit')
          ? errorMessage
          : 'Sorry, I encountered an error. Please try again.';

        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === streamingMessageIdRef.current
              ? { ...msg, content: displayMessage }
              : msg
          )
        );
      }
    } finally {
      setIsLoading(false);
      setAgentStep(null);
      streamingMessageIdRef.current = null;
    }
  }, [sessionId, currentLocale, throttledUpdateUI, updateStreamingUI]);

  return {
    isOpen,
    isLoading,
    routingPath,
    agentStep,
    toolCalls,
    messages,
    suggestions,
    streamingContent,
    sessionId,
    sendMessage,
    submitFeedback,
    resetSession,
    exportChat,
    toggleChat,
    closeChat,
  };
};

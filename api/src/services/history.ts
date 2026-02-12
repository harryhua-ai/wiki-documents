import { v4 as uuidv4 } from 'uuid';
import { sessionOps, messageOps } from '../lib/db.js';
import type { ChatMessage, ChatSession } from '../types/index.js';

// ============================================================================
// In-Memory Session Cache (for performance)
// ============================================================================

interface CachedSession {
  session: ChatSession;
  messages: ChatMessage[];
  lastAccessed: Date;
}

const MAX_CACHE_SIZE = 1000; // Maximum number of sessions to cache
const sessionCache = new Map<string, CachedSession>();
const CACHE_TTL_MS = 30 * 60 * 1000; // 30 minutes

/**
 * Clean up expired sessions from cache
 * Also enforces max cache size to prevent DoS via memory exhaustion
 */
const cleanupCache = (): void => {
  const now = new Date();

  // First, remove expired entries
  for (const [id, cached] of sessionCache.entries()) {
    if (now.getTime() - cached.lastAccessed.getTime() > CACHE_TTL_MS) {
      sessionCache.delete(id);
    }
  }

  // If still over limit, remove oldest accessed entries
  if (sessionCache.size > MAX_CACHE_SIZE) {
    const entries = Array.from(sessionCache.entries());
    // Sort by lastAccessed (oldest first)
    entries.sort((a, b) => a[1].lastAccessed.getTime() - b[1].lastAccessed.getTime());

    // Remove oldest entries to get under limit
    const toRemove = sessionCache.size - MAX_CACHE_SIZE;
    for (let i = 0; i < toRemove; i++) {
      sessionCache.delete(entries[i][0]);
    }
  }
};

// Run cleanup every 5 minutes
setInterval(cleanupCache, 5 * 60 * 1000);

// ============================================================================
// Session Management
// ============================================================================

/**
 * Get or create a session
 */
export const getOrCreateSession = async (
  sessionId: string | undefined,
  ipHash: string,
  language: string = 'en'
): Promise<ChatSession> => {
  // If session ID provided, try to get from cache or DB
  if (sessionId) {
    // Check cache first
    const cached = sessionCache.get(sessionId);
    if (cached) {
      cached.lastAccessed = new Date();
      return cached.session;
    }

    // Check database
    const session = sessionOps.findById(sessionId);
    if (session) {
      // Cache it
      const messages = messageOps.findBySessionId(sessionId);
      sessionCache.set(sessionId, {
        session,
        messages: messages.map((m) => ({
          role: m.role,
          content: m.content,
        })),
        lastAccessed: new Date(),
      });
      return session;
    }
  }

  // Create new session
  const newSession = sessionOps.create(ipHash, language);

  // Check cache size before adding
  if (sessionCache.size >= MAX_CACHE_SIZE) {
    cleanupCache();
  }

  sessionCache.set(newSession.id, {
    session: newSession,
    messages: [],
    lastAccessed: new Date(),
  });

  return newSession;
};

/**
 * Get session history
 */
export const getSessionHistory = (sessionId: string): ChatMessage[] => {
  const cached = sessionCache.get(sessionId);
  if (cached) {
    return cached.messages;
  }

  // Load from database
  const messages = messageOps.findBySessionId(sessionId);
  const historyMessages = messages.map((m) => ({
    role: m.role,
    content: m.content,
  }));

  // Update cache
  if (messages.length > 0) {
    const session = sessionOps.findById(sessionId);
    if (session) {
      sessionCache.set(sessionId, {
        session,
        messages: historyMessages,
        lastAccessed: new Date(),
      });
    }
  }

  return historyMessages;
};

/**
 * Add a message to session history
 */
export const addMessage = (
  sessionId: string,
  role: 'user' | 'assistant' | 'system',
  content: string,
  sources?: any[],
  metadata?: any
): void => {
  // Save to database
  messageOps.create(sessionId, role, content, sources, metadata);

  // Update cache
  const cached = sessionCache.get(sessionId);
  if (cached) {
    cached.messages.push({ role, content });
    cached.lastAccessed = new Date();
  }
};

/**
 * Update session cache with new messages (without DB write)
 */
export const updateCacheHistory = (
  sessionId: string,
  messages: ChatMessage[]
): void => {
  const cached = sessionCache.get(sessionId);
  if (cached) {
    cached.messages = messages;
    cached.lastAccessed = new Date();
  }
};

/**
 * Clear session from cache (not DB)
 */
export const clearSessionCache = (sessionId: string): void => {
  sessionCache.delete(sessionId);
};

/**
 * Generate a new session ID
 */
export const generateSessionId = (): string => {
  return uuidv4();
};

/**
 * Validate session ID format
 */
export const isValidSessionId = (id: string): boolean => {
  // Simple UUID v4 validation
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(id);
};

// ============================================================================
// Session Statistics
// ============================================================================

export const getSessionStats = (): {
  activeSessions: number;
  cachedSessions: number;
} => {
  return {
    activeSessions: sessionCache.size,
    cachedSessions: sessionCache.size,
  };
};

/**
 * Get all cached session IDs
 */
export const getCachedSessionIds = (): string[] => {
  return Array.from(sessionCache.keys());
};

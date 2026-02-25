import Database from 'better-sqlite3';
import * as path from 'path';
import * as fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { fileURLToPath } from 'url';
import { dbConfig } from '../config/index.js';
import type { ChatSession, StoredMessage, StoredFeedback, DocIndexStatus } from '../types/index.js';

// Get current directory (ES module compatible)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure data directory exists
const dataDir = path.dirname(dbConfig.path);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Resolve to absolute path
const dbPath = path.resolve(dbConfig.path);
console.log(`[DB] Config path: ${dbConfig.path}`);
console.log(`[DB] Resolved absolute path: ${dbPath}`);
console.log(`[DB] __dirname: ${__dirname}`);

// Create database connection
export const db: any = new Database(dbPath);

// Enable WAL mode for better concurrency
db.pragma('journal_mode = WAL');

// ============================================================================
// Schema Migration
// ============================================================================

const createTables = () => {
  // Chat Sessions Table
  db.exec(`
    CREATE TABLE IF NOT EXISTS chat_sessions (
      id TEXT PRIMARY KEY,
      user_ip_hash TEXT NOT NULL,
      language TEXT NOT NULL DEFAULT 'en',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Chat Messages Table
  db.exec(`
    CREATE TABLE IF NOT EXISTS chat_messages (
      id TEXT PRIMARY KEY,
      session_id TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('user', 'assistant', 'system')),
      content TEXT NOT NULL,
      sources TEXT,
      metadata TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (session_id) REFERENCES chat_sessions(id) ON DELETE CASCADE
    )
  `);

  // Chat Feedback Table
  db.exec(`
    CREATE TABLE IF NOT EXISTS chat_feedback (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      message_id TEXT NOT NULL,
      rating TEXT NOT NULL CHECK(rating IN ('positive', 'negative')),
      comment TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (message_id) REFERENCES chat_messages(id) ON DELETE CASCADE
    )
  `);

  // Document Index Status Table
  db.exec(`
    CREATE TABLE IF NOT EXISTS document_index_status (
      file_path TEXT PRIMARY KEY,
      content_hash TEXT NOT NULL,
      last_indexed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      status TEXT NOT NULL CHECK(status IN ('pending', 'indexed', 'failed', 'deleted'))
    )
  `);

  // Vector Embeddings Table
  db.exec(`
    CREATE TABLE IF NOT EXISTS vector_embeddings (
      id TEXT PRIMARY KEY,
      content TEXT NOT NULL,
      embedding BLOB NOT NULL,
      doc_path TEXT NOT NULL,
      doc_title TEXT NOT NULL,
      doc_url TEXT NOT NULL,
      section_title TEXT,
      product_line TEXT NOT NULL,
      language TEXT NOT NULL,
      tags TEXT,
      content_hash TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Ragas Evaluations Table
  db.exec(`
    CREATE TABLE IF NOT EXISTS rag_evaluations (
      id TEXT PRIMARY KEY,
      session_id TEXT,
      message_id TEXT,
      faithfulness REAL,
      answer_relevancy REAL,
      context_recall REAL,
      context_precision REAL,
      retrieval_latency_ms INTEGER,
      retrieval_count INTEGER,
      retrieval_path TEXT,
      query TEXT,
      generated_answer TEXT,
      retrieved_context TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (session_id) REFERENCES chat_sessions(id) ON DELETE CASCADE,
      FOREIGN KEY (message_id) REFERENCES chat_messages(id) ON DELETE CASCADE
    )
  `);

  // Retrieval Metrics Table
  db.exec(`
    CREATE TABLE IF NOT EXISTS retrieval_metrics (
      id TEXT PRIMARY KEY,
      session_id TEXT,
      message_id TEXT,
      retrieval_method TEXT,
      query_type TEXT,
      vector_search_latency_ms INTEGER,
      bm25_search_latency_ms INTEGER,
      graph_search_latency_ms INTEGER,
      rerank_latency_ms INTEGER,
      total_latency_ms INTEGER,
      vector_results_count INTEGER,
      bm25_results_count INTEGER,
      final_results_count INTEGER,
      avg_similarity_score REAL,
      alpha_value REAL,
      rerank_enabled INTEGER,
      hyde_enabled INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (session_id) REFERENCES chat_sessions(id) ON DELETE CASCADE,
      FOREIGN KEY (message_id) REFERENCES chat_messages(id) ON DELETE CASCADE
    )
  `);

  // Create indexes for better query performance
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_chat_messages_session_id
    ON chat_messages(session_id);

    CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at
    ON chat_messages(created_at);

    CREATE INDEX IF NOT EXISTS idx_chat_feedback_message_id
    ON chat_feedback(message_id);

    CREATE INDEX IF NOT EXISTS idx_document_index_status_status
    ON document_index_status(status);

    CREATE INDEX IF NOT EXISTS idx_vector_embeddings_doc_path
    ON vector_embeddings(doc_path);

    CREATE INDEX IF NOT EXISTS idx_vector_embeddings_language
    ON vector_embeddings(language);

    CREATE INDEX IF NOT EXISTS idx_vector_embeddings_product_line
    ON vector_embeddings(product_line);

    CREATE INDEX IF NOT EXISTS idx_rag_evaluations_session_id
    ON rag_evaluations(session_id);

    CREATE INDEX IF NOT EXISTS idx_rag_evaluations_message_id
    ON rag_evaluations(message_id);

    CREATE INDEX IF NOT EXISTS idx_rag_evaluations_created_at
    ON rag_evaluations(created_at);

    CREATE INDEX IF NOT EXISTS idx_retrieval_metrics_session_id
    ON retrieval_metrics(session_id);

    CREATE INDEX IF NOT EXISTS idx_retrieval_metrics_message_id
    ON retrieval_metrics(message_id);

    CREATE INDEX IF NOT EXISTS idx_retrieval_metrics_created_at
    ON retrieval_metrics(created_at);

    CREATE INDEX IF NOT EXISTS idx_retrieval_metrics_method
    ON retrieval_metrics(retrieval_method);
  `);
};

// Run migration on import
createTables();

// ============================================================================
// Session Operations
// ============================================================================

export const sessionOps = {
  create: (ipHash: string, language: string = 'en'): ChatSession => {
    const id = uuidv4();
    const now = new Date().toISOString();

    const stmt = db.prepare(
      'INSERT INTO chat_sessions (id, user_ip_hash, language, created_at) VALUES (?, ?, ?, ?)'
    );
    stmt.run(id, ipHash, language, now);

    return {
      id,
      user_ip_hash: ipHash,
      language,
      created_at: new Date(now),
    };
  },

  findById: (id: string): ChatSession | null => {
    const stmt = db.prepare('SELECT * FROM chat_sessions WHERE id = ?');
    const row = stmt.get(id) as any;
    if (!row) return null;

    return {
      id: row.id,
      user_ip_hash: row.user_ip_hash,
      language: row.language,
      created_at: new Date(row.created_at),
    };
  },
};

// ============================================================================
// Message Operations
// ============================================================================

export const messageOps = {
  create: (
    sessionId: string,
    role: 'user' | 'assistant' | 'system',
    content: string,
    sources?: any[],
    metadata?: any
  ): StoredMessage => {
    const id = uuidv4();
    const now = new Date().toISOString();

    const stmt = db.prepare(
      'INSERT INTO chat_messages (id, session_id, role, content, sources, metadata, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)'
    );
    stmt.run(
      id,
      sessionId,
      role,
      content,
      sources ? JSON.stringify(sources) : null,
      metadata ? JSON.stringify(metadata) : null,
      now
    );

    return {
      id,
      session_id: sessionId,
      role,
      content,
      sources,
      metadata,
      created_at: new Date(now),
    };
  },

  findBySessionId: (sessionId: string): StoredMessage[] => {
    const stmt = db.prepare(
      'SELECT * FROM chat_messages WHERE session_id = ? ORDER BY created_at ASC'
    );
    const rows = stmt.all(sessionId) as any[];

    return rows.map((row) => ({
      id: row.id,
      session_id: row.session_id,
      role: row.role,
      content: row.content,
      sources: row.sources ? JSON.parse(row.sources) : undefined,
      metadata: row.metadata ? JSON.parse(row.metadata) : undefined,
      created_at: new Date(row.created_at),
    }));
  },

  findById: (id: string): StoredMessage | null => {
    const stmt = db.prepare('SELECT * FROM chat_messages WHERE id = ?');
    const row = stmt.get(id) as any;
    if (!row) return null;

    return {
      id: row.id,
      session_id: row.session_id,
      role: row.role,
      content: row.content,
      sources: row.sources ? JSON.parse(row.sources) : undefined,
      metadata: row.metadata ? JSON.parse(row.metadata) : undefined,
      created_at: new Date(row.created_at),
    };
  },
};

// ============================================================================
// Feedback Operations
// ============================================================================

export const feedbackOps = {
  create: (
    messageId: string,
    rating: 'positive' | 'negative',
    comment?: string
  ): StoredFeedback => {
    const now = new Date().toISOString();

    const stmt = db.prepare(
      'INSERT INTO chat_feedback (message_id, rating, comment, created_at) VALUES (?, ?, ?, ?)'
    );
    const info = stmt.run(messageId, rating, comment || null, now);

    return {
      id: info.lastInsertRowid as number,
      message_id: messageId,
      rating,
      comment,
      created_at: new Date(now),
    };
  },

  findByMessageId: (messageId: string): StoredFeedback[] => {
    const stmt = db.prepare('SELECT * FROM chat_feedback WHERE message_id = ?');
    const rows = stmt.all(messageId) as any[];

    return rows.map((row) => ({
      id: row.id,
      message_id: row.message_id,
      rating: row.rating,
      comment: row.comment,
      created_at: new Date(row.created_at),
    }));
  },

  getStats: (): { positive: number; negative: number; total: number } => {
    const stmt = db.prepare(`
      SELECT
        COUNT(*) as total,
        SUM(CASE WHEN rating = 'positive' THEN 1 ELSE 0 END) as positive,
        SUM(CASE WHEN rating = 'negative' THEN 1 ELSE 0 END) as negative
      FROM chat_feedback
    `);
    const row = stmt.get() as any;

    return {
      total: row.total || 0,
      positive: row.positive || 0,
      negative: row.negative || 0,
    };
  },
};

// ============================================================================
// Document Index Operations
// ============================================================================

export const docIndexOps = {
  upsert: (filePath: string, contentHash: string, status: 'indexed' | 'failed' = 'indexed') => {
    const stmt = db.prepare(`
      INSERT INTO document_index_status (file_path, content_hash, status)
      VALUES (?, ?, ?)
      ON CONFLICT(file_path) DO UPDATE SET
        content_hash = excluded.content_hash,
        status = excluded.status,
        last_indexed_at = CURRENT_TIMESTAMP
    `);
    stmt.run(filePath, contentHash, status);
  },

  getIndexStatus: (filePath: string): DocIndexStatus | null => {
    const stmt = db.prepare('SELECT * FROM document_index_status WHERE file_path = ?');
    const row = stmt.get(filePath) as any;
    if (!row) return null;

    return {
      file_path: row.file_path,
      content_hash: row.content_hash,
      last_indexed_at: new Date(row.last_indexed_at),
      status: row.status,
    };
  },

  getAllPending: (): DocIndexStatus[] => {
    const stmt = db.prepare('SELECT * FROM document_index_status WHERE status = ?');
    const rows = stmt.all('pending') as any[];

    return rows.map((row) => ({
      file_path: row.file_path,
      content_hash: row.content_hash,
      last_indexed_at: new Date(row.last_indexed_at),
      status: row.status,
    }));
  },

  markDeleted: (filePath: string) => {
    const stmt = db.prepare('UPDATE document_index_status SET status = ? WHERE file_path = ?');
    stmt.run('deleted', filePath);
  },
};

// ============================================================================
// Vector Embedding Operations
// ============================================================================

/**
 * Convert Float32Array to Buffer for storage
 */
const float32ArrayToBuffer = (array: number[]): Buffer => {
  const float32 = new Float32Array(array);
  return Buffer.from(float32.buffer);
};

/**
 * Convert Buffer to Float32Array
 */
const bufferToFloat32Array = (buffer: Buffer): number[] => {
  console.log(`[bufferToFloat32Array] Input type: ${buffer.constructor.name}, length: ${buffer.length}, byteLength: ${buffer.byteLength}`);

  const float32 = new Float32Array(buffer.buffer, buffer.byteOffset, buffer.byteLength / 4);
  const result = Array.from(float32);

  console.log(`[bufferToFloat32Array] Output size: ${result.length}, first 5: [${result.slice(0, 5).map(v => v.toFixed(4)).join(', ')}]`);

  return result;
};

export const vectorOps = {
  upsert: (
    id: string,
    content: string,
    embedding: number[],
    metadata: {
      doc_path: string;
      doc_title: string;
      doc_url: string;
      section_title?: string;
      product_line: string;
      language: string;
      tags?: string[];
    },
    contentHash: string
  ) => {
    const stmt = db.prepare(`
      INSERT INTO vector_embeddings (
        id, content, embedding, doc_path, doc_title, doc_url,
        section_title, product_line, language, tags, content_hash
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        content = excluded.content,
        embedding = excluded.embedding,
        doc_title = excluded.doc_title,
        doc_url = excluded.doc_url,
        section_title = excluded.section_title,
        product_line = excluded.product_line,
        language = excluded.language,
        tags = excluded.tags,
        content_hash = excluded.content_hash
    `);
    stmt.run(
      id,
      content,
      float32ArrayToBuffer(embedding),
      metadata.doc_path,
      metadata.doc_title,
      metadata.doc_url,
      metadata.section_title || null,
      metadata.product_line,
      metadata.language,
      metadata.tags ? JSON.stringify(metadata.tags) : null,
      contentHash
    );
  },

  upsertBatch: (
    records: Array<{
      id: string;
      content: string;
      embedding: number[];
      metadata: {
        doc_path: string;
        doc_title: string;
        doc_url: string;
        section_title?: string;
        product_line: string;
        language: string;
        tags?: string[];
      };
      contentHash: string;
    }>
  ) => {
    const stmt = db.prepare(`
      INSERT INTO vector_embeddings (
        id, content, embedding, doc_path, doc_title, doc_url,
        section_title, product_line, language, tags, content_hash
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        content = excluded.content,
        embedding = excluded.embedding,
        doc_title = excluded.doc_title,
        doc_url = excluded.doc_url,
        section_title = excluded.section_title,
        product_line = excluded.product_line,
        language = excluded.language,
        tags = excluded.tags,
        content_hash = excluded.content_hash
    `);

    const transaction = db.transaction(() => {
      for (const record of records) {
        stmt.run(
          record.id,
          record.content,
          float32ArrayToBuffer(record.embedding),
          record.metadata.doc_path,
          record.metadata.doc_title,
          record.metadata.doc_url,
          record.metadata.section_title || null,
          record.metadata.product_line,
          record.metadata.language,
          record.metadata.tags ? JSON.stringify(record.metadata.tags) : null,
          record.contentHash
        );
      }
    });

    transaction();
  },

  getAll: (): Array<{
    id: string;
    content: string;
    embedding: number[];
    metadata: {
      doc_path: string;
      doc_title: string;
      doc_url: string;
      section_title?: string;
      product_line: string;
      language: string;
      tags?: string[];
    };
    content_hash: string;
  }> => {
    const stmt = db.prepare('SELECT * FROM vector_embeddings');
    const rows = stmt.all() as any[];

    return rows.map((row) => ({
      id: row.id,
      content: row.content,
      embedding: bufferToFloat32Array(row.embedding),
      metadata: {
        doc_path: row.doc_path,
        doc_title: row.doc_title,
        doc_url: row.doc_url,
        section_title: row.section_title || undefined,
        product_line: row.product_line,
        language: row.language,
        tags: row.tags ? JSON.parse(row.tags) : undefined,
      },
      content_hash: row.content_hash,
    }));
  },

  getByDocPath: (docPath: string): Array<{
    id: string;
    content: string;
    embedding: number[];
    metadata: {
      doc_path: string;
      doc_title: string;
      doc_url: string;
      section_title?: string;
      product_line: string;
      language: string;
      tags?: string[];
    };
    content_hash: string;
  }> => {
    const stmt = db.prepare('SELECT * FROM vector_embeddings WHERE doc_path = ?');
    const rows = stmt.all(docPath) as any[];

    return rows.map((row) => ({
      id: row.id,
      content: row.content,
      embedding: bufferToFloat32Array(row.embedding),
      metadata: {
        doc_path: row.doc_path,
        doc_title: row.doc_title,
        doc_url: row.doc_url,
        section_title: row.section_title || undefined,
        product_line: row.product_line,
        language: row.language,
        tags: row.tags ? JSON.parse(row.tags) : undefined,
      },
      content_hash: row.content_hash,
    }));
  },

  deleteByDocPath: (docPath: string) => {
    const stmt = db.prepare('DELETE FROM vector_embeddings WHERE doc_path = ?');
    stmt.run(docPath);
  },

  deleteById: (id: string) => {
    const stmt = db.prepare('DELETE FROM vector_embeddings WHERE id = ?');
    stmt.run(id);
  },

  count: (): number => {
    const stmt = db.prepare('SELECT COUNT(*) as count FROM vector_embeddings');
    const row = stmt.get() as any;
    return row.count;
  },

  clear: () => {
    db.prepare('DELETE FROM vector_embeddings').run();
  },
};

// Export helper functions for vector conversion
export { float32ArrayToBuffer, bufferToFloat32Array };

// ============================================================================
// Ragas Evaluation Operations
// ============================================================================

export const ragasEvalOps = {
  save: (evaluation: {
    session_id: string;
    message_id: string;
    faithfulness: number;
    answer_relevancy: number;
    context_recall: number;
    context_precision: number;
    retrieval_latency_ms: number;
    retrieval_count: number;
    retrieval_path: string;
    query: string;
    generated_answer: string;
    retrieved_context: string[];
  }) => {
    const id = uuidv4();
    const stmt = db.prepare(`
      INSERT INTO rag_evaluations (
        id, session_id, message_id, faithfulness, answer_relevancy,
        context_recall, context_precision, retrieval_latency_ms,
        retrieval_count, retrieval_path, query, generated_answer,
        retrieved_context, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
    `);

    stmt.run(
      id,
      evaluation.session_id,
      evaluation.message_id,
      evaluation.faithfulness,
      evaluation.answer_relevancy,
      evaluation.context_recall,
      evaluation.context_precision,
      evaluation.retrieval_latency_ms,
      evaluation.retrieval_count,
      evaluation.retrieval_path,
      evaluation.query,
      evaluation.generated_answer,
      JSON.stringify(evaluation.retrieved_context)
    );

    return id;
  },

  getBySessionId: (sessionId: string) => {
    const stmt = db.prepare('SELECT * FROM rag_evaluations WHERE session_id = ? ORDER BY created_at DESC');
    return stmt.all(sessionId);
  },

  getByMessageId: (messageId: string) => {
    const stmt = db.prepare('SELECT * FROM rag_evaluations WHERE message_id = ?');
    return stmt.get(messageId);
  },

  getStats: (days: number = 7) => {
    const stmt = db.prepare(`
      SELECT
        AVG(faithfulness) as avg_faithfulness,
        AVG(answer_relevancy) as avg_answer_relevancy,
        AVG(context_recall) as avg_context_recall,
        AVG(context_precision) as avg_context_precision,
        COUNT(*) as total_evaluations
      FROM rag_evaluations
      WHERE created_at >= datetime('now', '-${days} days')
    `);
    return stmt.get();
  },
};

// ============================================================================
// Retrieval Metrics Operations
// ============================================================================

export const retrievalMetricsOps = {
  save: (metrics: {
    session_id: string;
    message_id: string;
    retrieval_method: string;
    query_type: string;
    vector_search_latency_ms?: number;
    bm25_search_latency_ms?: number;
    graph_search_latency_ms?: number;
    rerank_latency_ms?: number;
    total_latency_ms: number;
    vector_results_count?: number;
    bm25_results_count?: number;
    final_results_count: number;
    avg_similarity_score?: number;
    alpha_value?: number;
    rerank_enabled?: boolean;
    hyde_enabled?: boolean;
  }) => {
    const id = uuidv4();
    const stmt = db.prepare(`
      INSERT INTO retrieval_metrics (
        id, session_id, message_id, retrieval_method, query_type,
        vector_search_latency_ms, bm25_search_latency_ms, graph_search_latency_ms,
        rerank_latency_ms, total_latency_ms, vector_results_count,
        bm25_results_count, final_results_count, avg_similarity_score,
        alpha_value, rerank_enabled, hyde_enabled, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
    `);

    stmt.run(
      id,
      metrics.session_id,
      metrics.message_id,
      metrics.retrieval_method,
      metrics.query_type,
      metrics.vector_search_latency_ms || 0,
      metrics.bm25_search_latency_ms || 0,
      metrics.graph_search_latency_ms || 0,
      metrics.rerank_latency_ms || 0,
      metrics.total_latency_ms,
      metrics.vector_results_count || 0,
      metrics.bm25_results_count || 0,
      metrics.final_results_count,
      metrics.avg_similarity_score || 0,
      metrics.alpha_value || 0,
      metrics.rerank_enabled ? 1 : 0,
      metrics.hyde_enabled ? 1 : 0
    );

    return id;
  },

  getBySessionId: (sessionId: string) => {
    const stmt = db.prepare('SELECT * FROM retrieval_metrics WHERE session_id = ? ORDER BY created_at DESC');
    return stmt.all(sessionId);
  },

  getStats: (days: number = 7) => {
    const stmt = db.prepare(`
      SELECT
        retrieval_method,
        COUNT(*) as count,
        AVG(total_latency_ms) as avg_latency_ms,
        AVG(final_results_count) as avg_results_count
      FROM retrieval_metrics
      WHERE created_at >= datetime('now', '-${days} days')
      GROUP BY retrieval_method
    `);
    return stmt.all();
  },
};

// ============================================================================
// Utility Functions
// ============================================================================

export const hashIP = (ip: string, secret: string): string => {
  // Simple hash for IP anonymization (use crypto in production)
  const crypto = require('crypto');
  return crypto.createHmac('sha256', secret).update(ip).digest('hex').substring(0, 16);
};

export const close = (): void => {
  db.close();
};

// Graceful shutdown
process.on('exit', close);
process.on('SIGINT', () => {
  close();
  process.exit(0);
});
process.on('SIGTERM', () => {
  close();
  process.exit(0);
});

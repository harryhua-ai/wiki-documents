import { createRequire } from 'module';
const require = createRequire(import.meta.url);

/**
 * Vector Store Client Abstraction
 *
 * Supports multiple vector database backends:
 * - Qdrant (recommended for production)
 * - pgvector (PostgreSQL with vector extension)
 * - SQLite with persistent storage (default for MVP)
 *
 * Usage:
 *   const vectorStore = new VectorStore();
 *   await vectorStore.initialize();
 *   await vectorStore.upsert(chunks);
 *   const results = await vectorStore.search(query, { limit: 5 });
 */

// Type definitions for DocumentChunk
interface DocumentChunk {
  docId: string;
  chunkIndex: number;
  url: string;
  title: string;
  section: string | null;
  content: string;
  product: string;
  language: string;
  tags: string[];
}

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------

export interface VectorSearchResult {
  id: string;
  content: string;
  score: number;
  metadata: {
    docId: string;
    url: string;
    title: string;
    section: string | null;
    product: string;
    language: string;
    tags: string[];
  };
}

export interface VectorSearchOptions {
  limit?: number;
  scoreThreshold?: number;
  filter?: {
    product?: string[];
    language?: string[];
    tags?: string[];
  };
}

export type VectorBackend = 'qdrant' | 'pgvector' | 'memory' | 'sqlite';

// -----------------------------------------------------------------------------
// Qdrant Implementation
// -----------------------------------------------------------------------------

// Type definitions for external modules (lazy loaded)
// eslint-disable-next-line @typescript-eslint/no-unused-vars

const COLLECTION_NAME = 'wiki_docs';
const VECTOR_DIM = 1024; // BAAI/bge-m3 dimension

export class VectorStore {
  private backend: VectorBackend;
  private qdrantClient: any = null;
  private pgClient: any = null;
  private memoryStore: Map<string, VectorSearchResult> = new Map();
  private sqliteDb: any = null;

  constructor(backend: VectorBackend = 'sqlite') {
    this.backend = backend;

    if (backend === 'qdrant') {
      // Lazy load Qdrant client only when needed
      try {
        const { QdrantClient } = require('@qdrant/js-client-rest');
        const qdrantUrl = process.env.QDRANT_URL || 'http://localhost:6333';
        this.qdrantClient = new QdrantClient({ url: qdrantUrl });
      } catch (error) {
        console.warn('Qdrant client not available:', error);
      }
    } else if (backend === 'pgvector') {
      // Lazy load PostgreSQL client only when needed
      try {
        const { Client } = require('pg');
        const pgUrl = process.env.DATABASE_URL;
        if (pgUrl) {
          this.pgClient = new Client({ connectionString: pgUrl });
        }
      } catch (error) {
        console.warn('PostgreSQL client not available:', error);
      }
    } else if (backend === 'sqlite') {
      // Lazy load SQLite only when needed
      try {
        const Database = require('better-sqlite3');
        const dbPath = process.env.VECTOR_DB_PATH || './data/chat.db';
        this.sqliteDb = new Database(dbPath);
        this.initializeSqlite();  // CRITICAL: Initialize SQLite tables
      } catch (error) {
        console.warn('SQLite not available:', error);
      }
    }
  }

  /**
   * Initialize the vector store
   */
  async initialize(): Promise<void> {
    if (this.backend === 'qdrant') {
      await this.initializeQdrant();
    } else if (this.backend === 'pgvector') {
      await this.initializePgVector();
    } else if (this.backend === 'sqlite') {
      // SQLite is initialized in constructor
      console.log('SQLite vector store initialized');
    }

    console.log(`Vector store initialized (backend: ${this.backend})`);
  }

  /**
   * Initialize SQLite vector table
   */
  private initializeSqlite(): void {
    if (!this.sqliteDb) {
      throw new Error('SQLite database not initialized');
    }

    // Create vector_embeddings table if not exists
    this.sqliteDb.exec(`
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

    // Create indexes
    this.sqliteDb.exec(`
      CREATE INDEX IF NOT EXISTS idx_vector_embeddings_doc_path
      ON vector_embeddings(doc_path);

      CREATE INDEX IF NOT EXISTS idx_vector_embeddings_language
      ON vector_embeddings(language);

      CREATE INDEX IF NOT EXISTS idx_vector_embeddings_product_line
      ON vector_embeddings(product_line);
    `);

    console.log('SQLite vector table verified');
  }

  /**
   * Initialize Qdrant collection
   */
  private async initializeQdrant(): Promise<void> {
    if (!this.qdrantClient) {
      throw new Error('Qdrant client not initialized');
    }

    const collections = await this.qdrantClient.getCollections();
    const exists = collections.collections.some((c: any) => c.name === COLLECTION_NAME);

    if (!exists) {
      await this.qdrantClient.createCollection(COLLECTION_NAME, {
        vectors: {
          size: VECTOR_DIM,
          distance: 'Cosine',
        },
        optimizers_config: {
          default_segment_number: 2,
        },
        replication_factor: 1,
      });
      console.log(`Created Qdrant collection: ${COLLECTION_NAME}`);
    } else {
      console.log(`Qdrant collection exists: ${COLLECTION_NAME}`);
    }
  }

  /**
   * Initialize pgvector table
   */
  private async initializePgVector(): Promise<void> {
    if (!this.pgClient) {
      throw new Error('PostgreSQL client not initialized');
    }

    await this.pgClient.connect();

    // Ensure pgvector extension is enabled
    await this.pgClient.query('CREATE EXTENSION IF NOT EXISTS vector');

    // Check if table exists
    const result = await this.pgClient.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_name = 'document_chunks'
      );
    `);

    if (!result.rows[0].exists) {
      throw new Error('document_chunks table does not exist. Run init-db.ts first.');
    }

    console.log('pgvector table verified');
  }

  /**
   * Close the vector store connection
   */
  async close(): Promise<void> {
    if (this.pgClient) {
      await this.pgClient.end();
    }
    if (this.sqliteDb) {
      this.sqliteDb.close();
    }
  }

  /**
   * Insert or update document chunks
   */
  async upsert(chunks: Array<DocumentChunk & { embedding: number[] }>): Promise<void> {
    if (this.backend === 'qdrant') {
      await this.upsertQdrant(chunks);
    } else if (this.backend === 'pgvector') {
      await this.upsertPgVector(chunks);
    } else if (this.backend === 'sqlite') {
      await this.upsertSqlite(chunks);
    } else {
      this.upsertMemory(chunks);
    }
  }

  /**
   * Upsert to Qdrant
   */
  private async upsertQdrant(chunks: Array<DocumentChunk & { embedding: number[] }>): Promise<void> {
    if (!this.qdrantClient) {
      throw new Error('Qdrant client not initialized');
    }

    const points = chunks.map((chunk) => ({
      id: `${chunk.docId}-${chunk.chunkIndex}`,
      vector: chunk.embedding,
      payload: {
        doc_id: chunk.docId,
        url: chunk.url,
        title: chunk.title,
        section: chunk.section,
        content: chunk.content,
        product: chunk.product,
        language: chunk.language,
        tags: chunk.tags,
      },
    }));

    await this.qdrantClient.upsert(COLLECTION_NAME, {
      upsert: points,
      wait: true,
    });

    console.log(`Upserted ${points.length} points to Qdrant`);
  }

  /**
   * Upsert to pgvector
   */
  private async upsertPgVector(chunks: Array<DocumentChunk & { embedding: number[] }>): Promise<void> {
    if (!this.pgClient) {
      throw new Error('PostgreSQL client not initialized');
    }

    for (const chunk of chunks) {
      await this.pgClient.query(`
        INSERT INTO document_chunks (id, doc_id, url, title, section, content, embedding, product, language, tags, chunk_index)
        VALUES ($1, $2, $3, $4, $5, $6, $7::vector, $8, $9, $10, $11)
        ON CONFLICT (doc_id, chunk_index)
        DO UPDATE SET
          content = EXCLUDED.content,
          embedding = EXCLUDED.embedding,
          title = EXCLUDED.title,
          section = EXCLUDED.section,
          tags = EXCLUDED.tags
      `, [
        `${chunk.docId}-${chunk.chunkIndex}`,
        chunk.docId,
        chunk.url,
        chunk.title,
        chunk.section,
        chunk.content,
        `[${chunk.embedding.join(',')}]`,
        chunk.product,
        chunk.language,
        chunk.tags,
        chunk.chunkIndex,
      ]);
    }

    console.log(`Upserted ${chunks.length} rows to pgvector`);
  }

  /**
   * Upsert to SQLite
   */
  private async upsertSqlite(chunks: Array<DocumentChunk & { embedding: number[] }>): Promise<void> {
    if (!this.sqliteDb) {
      throw new Error('SQLite database not initialized');
    }

    const stmt = this.sqliteDb.prepare(`
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

    const transaction = this.sqliteDb.transaction(() => {
      for (const chunk of chunks) {
        const float32Array = new Float32Array(chunk.embedding);
        const buffer = Buffer.from(float32Array.buffer);
        stmt.run(
          `${chunk.docId}-${chunk.chunkIndex}`,
          chunk.content,
          buffer,
          chunk.docId, // doc_path
          chunk.title, // doc_title
          chunk.url, // doc_url
          chunk.section, // section_title
          chunk.product, // product_line
          chunk.language,
          chunk.tags ? JSON.stringify(chunk.tags) : null,
          '' // content_hash
        );
      }
    });

    transaction();

    console.log(`Upserted ${chunks.length} rows to SQLite`);
  }

  /**
   * Upsert to memory (for testing)
   */
  private upsertMemory(chunks: Array<DocumentChunk & { embedding: number[] }>): void {
    for (const chunk of chunks) {
      this.memoryStore.set(`${chunk.docId}-${chunk.chunkIndex}`, {
        id: `${chunk.docId}-${chunk.chunkIndex}`,
        content: chunk.content,
        score: 0,
        metadata: {
          docId: chunk.docId,
          url: chunk.url,
          title: chunk.title,
          section: chunk.section,
          product: chunk.product,
          language: chunk.language,
          tags: chunk.tags,
        },
      });
    }
    console.log(`Stored ${chunks.length} chunks in memory`);
  }

  /**
   * Search for similar documents
   */
  async search(
    queryEmbedding: number[],
    options: VectorSearchOptions = {}
  ): Promise<VectorSearchResult[]> {
    const { limit = 5, scoreThreshold = 0 } = options;

    if (this.backend === 'qdrant') {
      return this.searchQdrant(queryEmbedding, { limit, scoreThreshold, filter: options.filter });
    } else if (this.backend === 'pgvector') {
      return this.searchPgVector(queryEmbedding, { limit, scoreThreshold, filter: options.filter });
    } else if (this.backend === 'sqlite') {
      return this.searchSqlite(queryEmbedding, { limit, scoreThreshold, filter: options.filter });
    } else {
      return this.searchMemory(queryEmbedding, { limit, scoreThreshold });
    }
  }

  /**
   * Search in Qdrant
   */
  private async searchQdrant(
    queryEmbedding: number[],
    options: { limit: number; scoreThreshold: number; filter?: VectorSearchOptions['filter'] }
  ): Promise<VectorSearchResult[]> {
    if (!this.qdrantClient) {
      throw new Error('Qdrant client not initialized');
    }

    // Build filter
    const filterConditions: any[] = [];

    if (options.filter?.product?.length) {
      filterConditions.push({
        key: 'product',
        match: { any: options.filter.product },
      });
    }

    if (options.filter?.language?.length) {
      filterConditions.push({
        key: 'language',
        match: { any: options.filter.language },
      });
    }

    if (options.filter?.tags?.length) {
      filterConditions.push({
        key: 'tags',
        match: { any: options.filter.tags },
      });
    }

    const filter = filterConditions.length > 0 ? { must: filterConditions } : undefined;

    const response = await this.qdrantClient.search(COLLECTION_NAME, {
      vector: queryEmbedding,
      limit: options.limit,
      score_threshold: options.scoreThreshold,
      filter,
      with_payload: true,
    });

    return response.map((point: any) => ({
      id: point.id as string,
      content: point.payload?.content as string || '',
      score: point.score || 0,
      metadata: {
        docId: point.payload?.doc_id as string || '',
        url: point.payload?.url as string || '',
        title: point.payload?.title as string || '',
        section: point.payload?.section as string || null,
        product: point.payload?.product as string || '',
        language: point.payload?.language as string || '',
        tags: point.payload?.tags as string[] || [],
      },
    }));
  }

  /**
   * Search in pgvector
   */
  private async searchPgVector(
    queryEmbedding: number[],
    options: { limit: number; scoreThreshold: number; filter?: VectorSearchOptions['filter'] }
  ): Promise<VectorSearchResult[]> {
    if (!this.pgClient) {
      throw new Error('PostgreSQL client not initialized');
    }

    let query = `
      SELECT
        id,
        doc_id as "docId",
        url,
        title,
        section,
        content,
        product,
        language,
        tags,
        1 - (embedding <=> $1::vector) as score
      FROM document_chunks
      WHERE 1=1
    `;

    const params: any[] = [`[${queryEmbedding.join(',')}]`];
    let paramIndex = 2;

    if (options.filter?.product?.length) {
      query += ` AND product = ANY($${paramIndex}::text[])`;
      params.push(options.filter.product);
      paramIndex++;
    }

    if (options.filter?.language?.length) {
      query += ` AND language = ANY($${paramIndex}::text[])`;
      params.push(options.filter.language);
      paramIndex++;
    }

    if (options.filter?.tags?.length) {
      query += ` AND tags && $${paramIndex}::text[]`;
      params.push(options.filter.tags);
      paramIndex++;
    }

    query += `
      AND 1 - (embedding <=> $1::vector) >= $${paramIndex}
      ORDER BY embedding <=> $1::vector
      LIMIT $${paramIndex + 1}
    `;

    params.push(options.scoreThreshold, options.limit);

    const result = await this.pgClient.query(query, params);

    return result.rows.map((row: any) => ({
      id: row.id,
      content: row.content,
      score: row.score,
      metadata: {
        docId: row.docId,
        url: row.url,
        title: row.title,
        section: row.section,
        product: row.product,
        language: row.language,
        tags: row.tags,
      },
    }));
  }

  /**
   * Search in SQLite (with in-memory cosine similarity)
   */
  private searchSqlite(
    queryEmbedding: number[],
    options: { limit: number; scoreThreshold: number; filter?: VectorSearchOptions['filter'] }
  ): VectorSearchResult[] {
    if (!this.sqliteDb) {
      throw new Error('SQLite database not initialized');
    }

    console.log(`[searchSqlite] filter:`, JSON.stringify(options.filter));
    console.log(`[searchSqlite] limit: ${options.limit}, scoreThreshold: ${options.scoreThreshold}`);

    // Load all embeddings from SQLite
    const stmt = this.sqliteDb.prepare(`
      SELECT id, content, embedding, doc_path, doc_title, doc_url,
             section_title, product_line, language, tags
      FROM vector_embeddings
    `);

    const rows = stmt.all() as any[];
    console.log(`[searchSqlite] Total rows in DB: ${rows.length}`);

    // Helper function to compute cosine similarity
    const cosineSimilarity = (a: number[], b: number[]): number => {
      if (a.length !== b.length) return 0;

      let dotProduct = 0;
      let normA = 0;
      let normB = 0;

      for (let i = 0; i < a.length; i++) {
        dotProduct += a[i] * b[i];
        normA += a[i] * a[i];
        normB += b[i] * b[i];
      }

      return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
    };

    // Helper function to convert Buffer to number array
    const bufferToFloat32Array = (buffer: Buffer): number[] => {
      const float32 = new Float32Array(buffer.buffer, buffer.byteOffset, buffer.byteLength / 4);
      return Array.from(float32);
    };

    const results: Array<VectorSearchResult & { score: number }> = [];

    for (const row of rows) {
      // Apply filters
      if (options.filter?.product?.length && !options.filter.product.includes(row.product_line)) {
        continue;
      }
      if (options.filter?.language?.length && !options.filter.language.includes(row.language)) {
        continue;
      }
      if (options.filter?.tags?.length) {
        const tags = row.tags ? JSON.parse(row.tags) : [];
        if (!options.filter.tags.some((tag: string) => tags.includes(tag))) {
          continue;
        }
      }

      // Calculate cosine similarity
      const embedding = bufferToFloat32Array(row.embedding);
      const score = cosineSimilarity(queryEmbedding, embedding);

      if (score >= options.scoreThreshold) {
        results.push({
          id: row.id,
          content: row.content,
          score,
          metadata: {
            docId: row.doc_path,
            url: row.doc_url,
            title: row.doc_title,
            section: row.section_title,
            product: row.product_line,
            language: row.language,
            tags: row.tags ? JSON.parse(row.tags) : [],
          },
        });
      }
    }

    console.log(`[searchSqlite] Results after filtering and scoring: ${results.length}`);

    // Sort by score descending and limit
    const finalResults = results
      .sort((a, b) => b.score - a.score)
      .slice(0, options.limit);

    console.log(`[searchSqlite] Final results after limit: ${finalResults.length}`);
    return finalResults;
  }

  /**
   * Search in memory (for testing - simple cosine similarity)
   */
  private searchMemory(
    _queryEmbedding: number[],
    options: { limit: number; scoreThreshold: number }
  ): VectorSearchResult[] {
    const results: Array<VectorSearchResult & { score: number }> = [];

    for (const [_, doc] of this.memoryStore) {
      // Simple placeholder scoring - in real implementation, compute cosine similarity
      const score = 0.5 + Math.random() * 0.5;
      if (score >= options.scoreThreshold) {
        results.push({ ...doc, score });
      }
    }

    return results
      .sort((a, b) => b.score - a.score)
      .slice(0, options.limit);
  }

  /**
   * Delete all chunks for a document
   */
  async deleteByDocId(docId: string): Promise<void> {
    if (this.backend === 'qdrant' && this.qdrantClient) {
      await this.qdrantClient.delete(COLLECTION_NAME, {
        filter: {
          must: [{ key: 'doc_id', match: { value: docId } }],
        },
      });
    } else if (this.backend === 'pgvector' && this.pgClient) {
      await this.pgClient.query('DELETE FROM document_chunks WHERE doc_id = $1', [docId]);
    } else if (this.backend === 'sqlite' && this.sqliteDb) {
      this.sqliteDb.prepare('DELETE FROM vector_embeddings WHERE doc_path = ?').run(docId);
    } else {
      for (const [key, doc] of this.memoryStore) {
        if (doc.metadata.docId === docId) {
          this.memoryStore.delete(key);
        }
      }
    }
  }

  /**
   * BM25 关键词检索（仅支持 SQLite）
   * 使用 LIKE 查询 + 关键词匹配评分
   */
  async searchBM25(query: string, options: VectorSearchOptions = {}): Promise<VectorSearchResult[]> {
    if (this.backend !== 'sqlite' || !this.sqliteDb) {
      console.warn('[VectorStore] BM25 search only supported on SQLite backend');
      return [];
    }

    const limit = options.limit || 5;

    try {
      // 使用 LIKE 查询查找匹配的文档
      const stmt = this.sqliteDb.prepare(`
        SELECT
          id,
          content,
          doc_path as docId,
          doc_url as url,
          doc_title as title,
          section_title as section,
          product_line as product,
          language,
          tags
        FROM vector_embeddings
        WHERE content LIKE ?
      `);

      const searchTerm = `%${query}%`;
      const rows = stmt.all(searchTerm) as any[];

      console.log(`[searchBM25] Query: "${query}", Total rows: ${rows.length}`);

      // Apply filters and score results
      const results: VectorSearchResult[] = [];
      const queryLower = query.toLowerCase();

      for (const row of rows) {
        // Apply filters
        if (options.filter?.product?.length && !options.filter.product.includes(row.product)) {
          continue;
        }
        if (options.filter?.language?.length && !options.filter.language.includes(row.language)) {
          continue;
        }
        if (options.filter?.tags?.length) {
          const tags = row.tags ? JSON.parse(row.tags) : [];
          if (!options.filter.tags.some((tag: string) => tags.includes(tag))) {
            continue;
          }
        }

        // Calculate BM25-like score based on keyword matches
        const contentLower = row.content.toLowerCase();
        const titleLower = (row.title || '').toLowerCase();

        // Count keyword occurrences
        let keywordScore = 0;
        const keywords = queryLower.split(/\s+/);

        for (const keyword of keywords) {
          if (contentLower.includes(keyword)) {
            keywordScore += 1;
          }
          if (titleLower.includes(keyword)) {
            keywordScore += 2; // Title matches are worth more
          }
        }

        // Normalize score to 0-1 range
        const score = Math.min(keywordScore / (keywords.length * 2), 1.0) * 0.5 + 0.3; // Base score 0.3 + bonus

        results.push({
          id: row.id,
          content: row.content,
          score,
          metadata: {
            docId: row.docId,
            url: row.url,
            title: row.title,
            section: row.section,
            product: row.product,
            language: row.language,
            tags: row.tags ? JSON.parse(row.tags) : [],
          },
        });
      }

      console.log(`[searchBM25] After filtering: ${results.length} results`);

      // Sort by score descending and limit
      return results
        .sort((a, b) => b.score - a.score)
        .slice(0, limit);

    } catch (error) {
      console.error('[VectorStore] BM25 search error:', error);
      return [];
    }
  }

  /**
   * 混合检索（向量 + BM25）
   * 根据查询类型动态调整权重
   */
  async searchHybrid(
    query: string,
    queryEmbedding: number[],
    queryType: 'specification' | 'general' | 'comparison' = 'general',
    options: VectorSearchOptions = {}
  ): Promise<VectorSearchResult[]> {
    // 1. 确定权重
    const alpha = this.getHybridSearchAlpha(queryType);
    const beta = 1 - alpha;

    console.log(`[Hybrid Search] Query type: ${queryType}, Alpha: ${alpha}, Beta: ${beta}`);

    // 2. 并行执行向量检索和 BM25 检索
    const [vectorResults, bm25Results] = await Promise.all([
      this.search(queryEmbedding, options),
      this.searchBM25(query, options),
    ]);

    console.log(`[Hybrid Search] Vector results: ${vectorResults.length}, BM25 results: ${bm25Results.length}`);

    // 3. 结果融合（RRF - Reciprocal Rank Fusion）
    const fusedResults = this.fuseResults(vectorResults, bm25Results, alpha, beta);

    // 4. 返回 top-k 结果
    const limit = options.limit || 5;
    return fusedResults.slice(0, limit);
  }

  /**
   * 获取混合检索权重
   */
  private getHybridSearchAlpha(queryType: string): number {
    switch (queryType) {
      case 'specification':
        return 1.0; // 技术规格查询：使用原始向量分数
      case 'comparison':
        return 0.5; // 对比查询：均衡
      default:
        return 1.0; // 通用查询：使用原始向量分数
    }
  }

  /**
   * 结果融合（加权融合）
   */
  private fuseResults(
    vectorResults: VectorSearchResult[],
    bm25Results: VectorSearchResult[],
    alpha: number,
    beta: number
  ): VectorSearchResult[] {
    const scoreMap = new Map<string, VectorSearchResult>();

    // 向量检索结果（保留原始余弦相似度分数）
    vectorResults.forEach((result) => {
      scoreMap.set(result.id, {
        ...result,
        score: result.score * alpha, // 使用原始分数 * alpha
      });
    });

    // BM25 检索结果（BM25 分数是固定的 0.5）
    bm25Results.forEach((result) => {
      const existing = scoreMap.get(result.id);
      if (existing) {
        // 如果文档已在向量检索结果中，加权平均
        existing.score = existing.score + (0.5 * beta);
      } else {
        // 如果只在 BM25 结果中
        scoreMap.set(result.id, {
          ...result,
          score: 0.5 * beta,
        });
      }
    });

    // 按融合分数排序
    const fused = Array.from(scoreMap.values()).sort((a, b) => b.score - a.score);

    console.log(`[Hybrid Search] Fused ${fused.length} results, top 3 scores: ${fused.slice(0, 3).map(r => r.score.toFixed(4)).join(', ')}`);

    return fused;
  }

  /**
   * Get collection statistics
   */
  async getStats(): Promise<{ count: number; backend: VectorBackend }> {
    let count = 0;

    if (this.backend === 'qdrant' && this.qdrantClient) {
      const info = await this.qdrantClient.getCollection(COLLECTION_NAME);
      count = info.points_count || 0;
    } else if (this.backend === 'pgvector' && this.pgClient) {
      const result = await this.pgClient.query('SELECT COUNT(*) as count FROM document_chunks');
      count = parseInt(result.rows[0].count, 10);
    } else if (this.backend === 'sqlite' && this.sqliteDb) {
      const row = this.sqliteDb.prepare('SELECT COUNT(*) as count FROM vector_embeddings').get() as any;
      count = row.count;
    } else {
      count = this.memoryStore.size;
    }

    return { count, backend: this.backend };
  }
}

export default VectorStore;

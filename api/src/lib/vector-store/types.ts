export interface VectorDocument {
  id: string;
  content: string;
  embedding: number[];
  metadata: {
    doc_path: string;
    doc_title: string;
    doc_url: string;
    section_title?: string;
    product_line?: string;
    language: string;
    tags?: string[];
    [key: string]: any;
  };
  score?: number;
}

export interface SearchOptions {
  topK?: number;
  minScore?: number;
  filter?: (doc: VectorDocument) => boolean; // For in-memory filtering
  filterObj?: Record<string, any>; // For database-level filtering
  alpha?: number; // Hybrid search weight (0.0 to 1.0, where 1.0 is pure vector)
}

export interface IVectorStore {
  /**
   * Initialize the vector store (connect, create collection if needed)
   */
  init(): Promise<void>;

  /**
   * Add or update a single document
   */
  upsert(doc: VectorDocument): Promise<void>;

  /**
   * Add or update multiple documents in batch
   */
  upsertBatch(docs: VectorDocument[]): Promise<void>;

  /**
   * Search for similar documents
   */
  search(queryEmbedding: number[], queryText: string, options?: SearchOptions): Promise<VectorDocument[]>;

  /**
   * Delete a document by ID
   */
  delete(id: string): Promise<boolean>;

  /**
   * Delete all documents matching a specific metadata field (e.g. doc_path)
   */
  deleteByMetadata(field: string, value: string): Promise<number>;

  /**
   * Count total documents
   */
  count(): Promise<number>;

  /**
   * Clear all documents from the store
   */
  clear(): Promise<void>;
}

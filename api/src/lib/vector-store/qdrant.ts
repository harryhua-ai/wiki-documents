import { QdrantClient } from '@qdrant/js-client-rest';
import { v4 as uuidv4 } from 'uuid';
import { dbConfig, env } from '../../config/index.js';
import { IVectorStore, VectorDocument, SearchOptions } from './types.js';

export class QdrantVectorStore implements IVectorStore {
  private client: QdrantClient;
  private collectionName: string;
  private vectorSize: number;

  constructor() {
    this.client = new QdrantClient({
      url: dbConfig.qdrant.host,
      apiKey: dbConfig.qdrant.apiKey,
    });
    this.collectionName = dbConfig.qdrant.collectionName;
    this.vectorSize = parseInt(env.EMBEDDING_DIMENSION.toString() || '1024');
  }

  async init(): Promise<void> {
    try {
      const result = await this.client.getCollections();
      const exists = result.collections.some((c) => c.name === this.collectionName);

      if (!exists) {
        console.log(`Creating Qdrant collection: ${this.collectionName}`);
        await this.client.createCollection(this.collectionName, {
          vectors: {
            size: this.vectorSize,
            distance: 'Cosine',
          },
        });
      }
    } catch (error) {
      console.error('Failed to initialize Qdrant:', error);
      // Don't throw here to allow fallback to SQLite if Qdrant is down
      // But in production we might want to throw
    }
  }

  async upsert(doc: VectorDocument): Promise<void> {
    await this.upsertBatch([doc]);
  }

  async upsertBatch(docs: VectorDocument[]): Promise<void> {
    if (docs.length === 0) return;

    const points = docs.map((doc) => ({
      id: doc.id || uuidv4(),
      vector: doc.embedding,
      payload: {
        content: doc.content,
        ...doc.metadata,
      },
    }));

    await this.client.upsert(this.collectionName, {
      wait: true,
      points,
    });
  }

  async search(
    queryEmbedding: number[],
    _queryText: string,
    options: SearchOptions = {}
  ): Promise<VectorDocument[]> {
    const { topK = 5, minScore = 0.0, filterObj } = options;

    const searchParams: any = {
      vector: queryEmbedding,
      limit: topK,
      with_payload: true,
      score_threshold: minScore,
    };

    if (filterObj) {
      // Convert simple key-value filter to Qdrant filter
      const should = Object.entries(filterObj).map(([key, value]) => ({
        key,
        match: { value },
      }));

      if (should.length > 0) {
        searchParams.filter = {
          must: should,
        };
      }
    }

    const results = await this.client.search(this.collectionName, searchParams);

    return results.map((point) => ({
      id: point.id as string,
      content: point.payload?.content as string || '',
      embedding: [], // We don't return embeddings to save bandwidth
      metadata: {
        doc_path: point.payload?.doc_path as string,
        doc_title: point.payload?.doc_title as string,
        doc_url: point.payload?.doc_url as string,
        section_title: point.payload?.section_title as string,
        product_line: point.payload?.product_line as string,
        language: point.payload?.language as string,
        tags: point.payload?.tags as string[],
      },
      score: point.score,
    }));
  }

  async delete(id: string): Promise<boolean> {
    try {
      await this.client.delete(this.collectionName, {
        points: [id],
      });
      return true;
    } catch (error) {
      console.error(`Failed to delete document ${id}:`, error);
      return false;
    }
  }

  async deleteByMetadata(field: string, value: string): Promise<number> {
    try {
      // First find points to delete (Qdrant delete by filter is supported but returns void)
      // We do delete directly
      await this.client.delete(this.collectionName, {
        filter: {
          must: [
            {
              key: field,
              match: { value },
            },
          ],
        },
      });
      // We can't easily get the count of deleted items without querying first
      // For now returning 1 to indicate success
      return 1;
    } catch (error) {
      console.error(`Failed to delete by metadata ${field}=${value}:`, error);
      return 0;
    }
  }

  async count(): Promise<number> {
    try {
      const info = await this.client.getCollection(this.collectionName);
      return info.points_count || 0;
    } catch (error) {
      return 0;
    }
  }

  async clear(): Promise<void> {
    try {
        await this.client.deleteCollection(this.collectionName);
        await this.init();
    } catch (error) {
        console.error('Failed to clear collection:', error);
    }
  }
}

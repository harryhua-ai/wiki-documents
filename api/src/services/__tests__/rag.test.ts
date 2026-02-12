/**
 * Unit tests for RAG service
 * Tests focus on:
 * 1. Source relevance filtering (MIN_SOURCE_SCORE threshold)
 * 2. Source deduplication logic
 * 3. Not-found response detection
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock dependencies
vi.mock('../lib/cache.js', () => ({
  cache: {
    get: vi.fn(),
    set: vi.fn(),
  },
}));

vi.mock('../lib/db.js', () => ({
  vectorOps: {
    getAll: vi.fn(() => []),
    upsert: vi.fn(),
    upsertBatch: vi.fn(),
    deleteById: vi.fn(),
    deleteByDocPath: vi.fn(),
    clear: vi.fn(),
  },
}));

vi.mock('../services/llm.js', () => ({
  generateEmbedding: vi.fn(async (text: string) => {
    // Generate deterministic mock embeddings based on text
    const dims = 1024;
    const arr = new Array(dims).fill(0);
    // Use text to create deterministic variation
    for (let i = 0; i < Math.min(text.length, 50); i++) {
      arr[i * 20] = text.charCodeAt(i) / 255;
    }
    return arr;
  }),
  generateEmbeddings: vi.fn(async (texts: string[]) => {
    const dims = 1024;
    return texts.map(text => {
      const arr = new Array(dims).fill(0);
      for (let i = 0; i < Math.min(text.length, 50); i++) {
        arr[i * 20] = text.charCodeAt(i) / 255;
      }
      return arr;
    });
  }),
  buildRAGPrompt: vi.fn(() => []),
  analyzeQueryIntent: vi.fn(async () => ({
    intent: 'SIMPLE_FACT',
    is_sufficient: true,
    confidence: 0.8,
  })),
  generateSubQuery: vi.fn(async (q) => q),
  streamChatCompletion: vi.fn(async function* () {
    yield 'Test response';
    return { content: 'Test response', metadata: {} };
  }),
  rerank: vi.fn(async () => []),
  shouldUseAgentToolsForEmptyRAG: vi.fn(async () => ({
    shouldUseTools: false,
    suggestedTools: [],
    reasoning: 'Test',
  })),
  generateFollowUpSuggestions: vi.fn(async () => []),
}));

vi.mock('../lib/vector-store/qdrant.js', () => ({
  QdrantVectorStore: vi.fn().mockImplementation(() => ({
    init: vi.fn(async () => {}),
    search: vi.fn(async () => []),
    upsert: vi.fn(async () => {}),
    upsertBatch: vi.fn(async () => {}),
    delete: vi.fn(async () => true),
    count: vi.fn(async () => 0),
  })),
}));

vi.mock('../services/agent-tools.js', () => ({
  planToolExecution: vi.fn(async () => ({
    requiresRAG: true,
    tools: [],
  })),
  executeTool: vi.fn(async () => ({
    success: true,
    data: {},
  })),
  formatToolResultsForLLM: vi.fn(() => ''),
}));

// Import after mocks are set up
import {
  filterRelevantSources,
  toSourceReferences,
  isNotFoundResponse,
  retrieve,
  generateAnswer,
} from '../rag.js';
import type { VectorDocument } from '../services/rag.js';
import type { SourceReference } from '../types/index.js';

describe('RAG Service - Source Filtering', () => {
  it('should filter sources below MIN_SOURCE_SCORE (0.55)', () => {
    const mockSources: SourceReference[] = [
      { title: 'High Score', url: 'https://example.com/1', score: 0.8 },
      { title: 'Medium Score', url: 'https://example.com/2', score: 0.55 },
      { title: 'Low Score', url: 'https://example.com/3', score: 0.54 },
      { title: 'Very Low Score', url: 'https://example.com/4', score: 0.3 },
      { title: 'No Score', url: 'https://example.com/5' }, // undefined = 0
    ];

    const filtered = filterRelevantSources(mockSources);

    expect(filtered).toHaveLength(2);
    expect(filtered.every(s => (s.score ?? 0) >= 0.55)).toBe(true);
    expect(filtered.some(s => s.title === 'Low Score')).toBe(false);
    expect(filtered.some(s => s.title === 'Very Low Score')).toBe(false);
  });

  it('should keep sources exactly at threshold', () => {
    const mockSources: SourceReference[] = [
      { title: 'At Threshold', url: 'https://example.com/1', score: 0.55 },
      { title: 'Above Threshold', url: 'https://example.com/2', score: 0.551 },
    ];

    const filtered = filterRelevantSources(mockSources);

    expect(filtered).toHaveLength(2);
  });
});

describe('RAG Service - Source Deduplication', () => {
  it('should deduplicate sources by doc_path and section_title', () => {
    const mockDocs: VectorDocument[] = [
      {
        id: '1',
        content: 'Content 1',
        embedding: new Array(1024).fill(0.1),
        metadata: {
          doc_path: '/docs/guide.md',
          doc_title: 'Guide',
          doc_url: 'https://example.com/guide',
          section_title: 'Introduction',
          language: 'en',
          product_line: 'ne101',
        },
        score: 0.8,
      },
      {
        id: '2',
        content: 'Content 2',
        embedding: new Array(1024).fill(0.2),
        metadata: {
          doc_path: '/docs/guide.md',
          doc_title: 'Guide',
          doc_url: 'https://example.com/guide',
          section_title: 'Introduction',
          language: 'en',
          product_line: 'ne101',
        },
        score: 0.9, // Higher score, should replace
      },
    ];

    const result = toSourceReferences(mockDocs);

    // Should only return one source (the higher scored one)
    expect(result).toHaveLength(1);
    expect(result[0].score).toBe(0.9);
  });

  it('should deduplicate sources by normalized URL (removing anchors)', () => {
    const mockDocs: VectorDocument[] = [
      {
        id: '1',
        content: 'Content 1',
        embedding: new Array(1024).fill(0.1),
        metadata: {
          doc_path: '/docs/guide.md',
          doc_title: 'Guide',
          doc_url: 'https://example.com/guide#section1',
          section_title: null,
          language: 'en',
          product_line: 'ne101',
        },
        score: 0.7,
      },
      {
        id: '2',
        content: 'Content 2',
        embedding: new Array(1024).fill(0.2),
        metadata: {
          doc_path: '/docs/guide.md',
          doc_title: 'Guide',
          doc_url: 'https://example.com/guide#section2', // Different anchor, same base URL
          section_title: null,
          language: 'en',
          product_line: 'ne101',
        },
        score: 0.9, // Higher score
      },
    ];

    const result = toSourceReferences(mockDocs);

    // Should only return one source (normalized URL without anchor)
    expect(result).toHaveLength(1);
    expect(result[0].url).toBe('https://example.com/guide#section2'); // Higher score wins
  });

  it('should keep sources from different documents even with same section title', () => {
    const mockDocs: VectorDocument[] = [
      {
        id: '1',
        content: 'Content 1',
        embedding: new Array(1024).fill(0.1),
        metadata: {
          doc_path: '/docs/guide1.md',
          doc_title: 'Guide 1',
          doc_url: 'https://example.com/guide1',
          section_title: 'Introduction',
          language: 'en',
          product_line: 'ne101',
        },
        score: 0.7,
      },
      {
        id: '2',
        content: 'Content 2',
        embedding: new Array(1024).fill(0.2),
        metadata: {
          doc_path: '/docs/guide2.md',
          doc_title: 'Guide 2',
          doc_url: 'https://example.com/guide2',
          section_title: 'Introduction',
          language: 'en',
          product_line: 'ne101',
        },
        score: 0.8,
      },
    ];

    const result = toSourceReferences(mockDocs);

    // Should return both (different doc_path)
    expect(result).toHaveLength(2);
  });
});

describe('RAG Service - Not Found Detection', () => {
  it('should detect Chinese not-found responses', () => {
    const notFoundResponses = [
      '我在文档中找不到相关信息',
      '无法找到相关信息',
      '文档中未找到这个内容',
      '没有找到相关信息',
      '文档中没有这个信息',
    ];

    notFoundResponses.forEach(response => {
      expect(isNotFoundResponse(response, 'zh-Hans')).toBe(true);
    });
  });

  it('should detect English not-found responses', () => {
    const notFoundResponses = [
      'I cannot find this information in the documentation.',
      'This information cannot be found in the documentation',
      'Not found in the documentation',
      'I am unable to find this information',
      'No information found',
    ];

    notFoundResponses.forEach(response => {
      expect(isNotFoundResponse(response, 'en')).toBe(true);
    });
  });

  it('should not flag normal responses as not-found', () => {
    const normalResponses = [
      { text: 'Here is the information you requested...', lang: 'en' },
      { text: '根据文档，规格如下...', lang: 'zh-Hans' },
      { text: 'The NE101 supports the following features...', lang: 'en' },
      { text: 'NE301 的主要特点包括...', lang: 'zh-Hans' },
    ];

    normalResponses.forEach(({ text, lang }) => {
      expect(isNotFoundResponse(text, lang)).toBe(false);
    });
  });
});

describe('RAG Service - Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should handle retrieve with valid parameters', async () => {
    // This test verifies that retrieve function works with valid parameters
    const result = await retrieve('test query', {
      topK: 5,
      minScore: 0.5,
      language: 'en',
    });

    expect(result).toBeDefined();
    expect(result.chunks).toBeDefined();
    expect(typeof result.max_score).toBe('number');
    expect(typeof result.is_sufficient).toBe('boolean');
  });
});

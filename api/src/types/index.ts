// Type definitions for the Ask AI API

// ============================================================================
// Request/Response Types
// ============================================================================

export interface ChatRequest {
  session_id?: string;
  message: string;
  language: 'en' | 'zh-Hans';
  history?: ChatMessage[];
}

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface FeedbackRequest {
  conversation_id: string;
  message_id: string;
  rating: 'positive' | 'negative';
  comment?: string;
}

export interface FeedbackResponse {
  success: boolean;
}

export interface ConfigResponse {
  suggested_questions: string[];
  model_info: string;
  features: {
    agent_enabled: boolean;
    streaming_enabled: boolean;
    feedback_enabled: boolean;
  };
}

// ============================================================================
// SSE Event Types
// ============================================================================

export type SSEEventType =
  | 'routing'
  | 'progress'
  | 'chunk'
  | 'sources'
  | 'suggestions'
  | 'tool_call'
  | 'tool_result'
  | 'error'
  | 'done';

export interface SSEEvent {
  type: SSEEventType;
}

export interface RoutingEvent extends SSEEvent {
  type: 'routing';
  path: 'fast' | 'agent';
  thinkAnalysis?: {
    intent: string;
    reasoning: string;
    search_language: 'en' | 'zh-Hans' | 'both';
  };
}

export interface ProgressEvent extends SSEEvent {
  type: 'progress';
  step: string;
}

export interface ChunkEvent extends SSEEvent {
  type: 'chunk';
  content: string;
}

export interface SourcesEvent extends SSEEvent {
  type: 'sources';
  sources: SourceReference[];
}

export interface SuggestionsEvent extends SSEEvent {
  type: 'suggestions';
  items: string[];
}

export interface ErrorEvent extends SSEEvent {
  type: 'error';
  message: string;
  code: string;
}

export interface ToolCallEvent extends SSEEvent {
  type: 'tool_call';
  tool: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  message: string;
}

export interface ToolResultEvent extends SSEEvent {
  type: 'tool_result';
  tool: string;
  data: unknown;
  status: 'success' | 'error';
}

export type SSEEventData =
  | RoutingEvent
  | ProgressEvent
  | ChunkEvent
  | SourcesEvent
  | SuggestionsEvent
  | ToolCallEvent
  | ToolResultEvent
  | ErrorEvent
  | { type: 'done' };

// ============================================================================
// RAG Types
// ============================================================================

export interface SourceReference {
  title: string;
  url: string;
  section?: string;
  excerpt: string;
  score?: number;
}

export interface DocumentChunk {
  id: string;
  content: string;
  metadata: ChunkMetadata;
  embedding?: number[];
  content_hash?: string;
}

export interface ChunkMetadata {
  doc_path: string;
  doc_title: string;
  doc_url: string;
  section_title?: string;
  heading_hierarchy?: string[];
  product_line?: string;
  language: string;
  tags?: string[];
  keywords?: string[];
  score?: number; // Similarity score from vector search
}

export interface RetrievalResult {
  chunks: DocumentChunk[];
  max_score: number;
  is_sufficient: boolean;
  query_used: string;
}

// ============================================================================
// LLM Types
// ============================================================================

export interface LLMProvider {
  name: string;
  api_base: string;
  api_key: string;
  model: string;
}

export interface EmbeddingProvider {
  name: string; // 'siliconflow' | 'zhipu'
  provider: string; // 服务商标识
  api_base: string;
  api_key: string;
  model: string;
  dimension: number;
  enabled?: boolean; // 是否启用
  weight?: number; // 负载权重 (默认1)
}

export interface LLMConfig {
  primary: LLMProvider;
  fallbacks: LLMProvider[];
  embedding: EmbeddingProvider | EmbeddingProvider[]; // 支持单个或多个
}

export interface LLMStreamChunk {
  delta: string;
  done: boolean;
}

export interface LLMResponseMetadata {
  model: string;
  tokens_used: number;
  latency_ms: number;
}

// ============================================================================
// Agent Types
// ============================================================================

export interface AgentConfig {
  fast_path_threshold: number;
  max_retrieval_steps: number;
  timeout_ms: number;
  think_mode: boolean;
  think_mode_language_agnostic: boolean;
  think_mode_max_tokens: number;
  retrieval_top_k?: number;  // 准确率优化: 支持 topK 配置
}

export interface QueryAnalysis {
  intent: QueryIntent;
  is_sufficient: boolean;
  confidence: number;
  needs_comparison?: boolean;
  sub_query?: string;
  reasoning?: string; // Think mode reasoning trace
  search_language?: 'en' | 'zh-Hans' | 'both'; // Language strategy for retrieval
}

export type QueryIntent =
  | 'SIMPLE_FACT'
  | 'HOW_TO'
  | 'COMPARISON'
  | 'TROUBLESHOOTING'
  | 'PRICING' // Price/stock inquiry
  | 'CODE_EXAMPLE' // Code example request
  | 'UNKNOWN';

// ============================================================================
// Agent Tools Types
// ============================================================================

export interface ToolDefinition {
  name: string;
  description: string;
  category: 'rag' | 'external' | 'code';
  params: Record<string, ToolParam>;
  handler: (params: Record<string, unknown>, context: ToolContext) => Promise<ToolResult>;
}

export interface ToolParam {
  type: 'string' | 'number' | 'boolean' | 'array';
  description: string;
  required: boolean;
  default?: unknown;
}

export interface ToolContext {
  sessionId: string;
  language: 'en' | 'zh-Hans';
  history: ChatMessage[];
}

export interface ToolResult {
  success: boolean;
  data: unknown;
  error?: string;
  metadata?: {
    source?: string;
    latency_ms?: number;
    tokens_used?: number;
  };
}

export interface ProductInfo {
  name: string;
  model: string;
  price?: string;
  currency?: string;
  description: string;
  specifications?: Record<string, string>;
  url?: string;
  inStock?: boolean;
}

export interface CodeExample {
  repo: string;
  file: string;
  language: string;
  code: string;
  description?: string;
  url: string;
}

export interface ToolCallSummary {
  tool: string;
  status: 'success' | 'error' | 'skipped';
  result?: ToolResult;
  latency_ms: number;
}

// ============================================================================
// Database Types
// ============================================================================

export interface ChatSession {
  id: string;
  user_ip_hash: string;
  language: string;
  created_at: Date;
}

export interface StoredMessage extends ChatMessage {
  id: string;
  session_id: string;
  sources?: SourceReference[];
  metadata?: LLMResponseMetadata;
  created_at: Date;
}

export interface StoredFeedback {
  id: number;
  message_id: string;
  rating: 'positive' | 'negative';
  comment?: string;
  created_at: Date;
}

export interface DocIndexStatus {
  file_path: string;
  content_hash: string;
  last_indexed_at: Date;
  status: 'pending' | 'indexed' | 'failed' | 'deleted';
}

// ============================================================================
// Error Types
// ============================================================================

export class APIError extends Error {
  constructor(
    public code: string,
    public statusCode: number,
    message: string
  ) {
    super(message);
    this.name = 'APIError';
  }
}

export const ErrorCodes = {
  RATE_LIMIT: 'RATE_LIMIT',
  SERVER_BUSY: 'SERVER_BUSY',
  INVALID_REQUEST: 'INVALID_REQUEST',
  LLM_ERROR: 'LLM_ERROR',
  VECTOR_ERROR: 'VECTOR_ERROR',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
} as const;

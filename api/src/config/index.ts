import dotenv from 'dotenv';
import { z } from 'zod';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import type { LLMConfig, AgentConfig } from '../types/index.js';

// Load environment variables from explicit path
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const envPath = resolve(__dirname, '../../.env');
dotenv.config({ path: envPath });

// Environment validation schema
const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().transform(Number).default('3001'),
  HOST: z.string().default('127.0.0.1'),
  CORS_ORIGIN: z.string().default('http://localhost:3000'),

  // LLM Provider - 禁用 SiliconFlow DeepSeek 推理模型
  SILICONFLOW_API_KEY: z.string().default(''),
  SILICONFLOW_API_BASE: z.string().url().default('https://api.siliconflow.cn/v1'),
  SILICONFLOW_MODEL: z.string().default(''),
  SILICONFLOW_ENABLED: z.string().transform((v) => v === 'true').default('false'),

  // Fallback 2 (DeepSeek)
  DEEPSEEK_API_KEY: z.string().default(''),
  DEEPSEEK_API_BASE: z.string().url().default('https://api.deepseek.com/v1'),
  DEEPSEEK_MODEL: z.string().default('deepseek-chat'),

  // Primary LLM (Zhipu GLM)
  ZHIPU_API_KEY: z.string().default(''),
  ZHIPU_API_BASE: z.string().default('https://open.bigmodel.cn/api/paas/v4'),
  ZHIPU_MODEL: z.string().default('glm-4-flash'),

  // Fallback 3 (Qwen - Optional)
  QWEN_API_KEY: z.string().default(''),
  QWEN_API_BASE: z.string().default('https://dashscope.aliyuncs.com/compatible-mode/v1'),
  QWEN_MODEL: z.string().default('qwen-plus'),

  // Embedding
  EMBEDDING_PROVIDER: z.string().default('siliconflow'),
  EMBEDDING_API_KEY: z.string().min(1, 'EMBEDDING_API_KEY is required'),
  EMBEDDING_API_BASE: z.string().url().default('https://api.siliconflow.cn/v1'),
  EMBEDDING_MODEL: z.string().default('BAAI/bge-m3'),
  EMBEDDING_DIMENSION: z.string().transform(Number).default('1024'),

  // 智谱 Embedding-3 (第二个 Embedding Provider)
  ZHIPU_EMBEDDING_API_KEY: z.string().default(''),
  ZHIPU_EMBEDDING_API_BASE: z.string().url().default('https://open.bigmodel.cn/api/paas/v4'),
  ZHIPU_EMBEDDING_MODEL: z.string().default('embedding-3'),
  ZHIPU_EMBEDDING_DIMENSION: z.string().transform(Number).default('1024'),
  ZHIPU_EMBEDDING_ENABLED: z
    .string()
    .transform((v) => v === 'true')
    .default('true'),

  // Vector Store
  VECTOR_STORE_TYPE: z.enum(['sqlite', 'qdrant']).default('sqlite'),
  QDRANT_HOST: z.string().default('http://localhost:6333'),
  QDRANT_API_KEY: z.string().default(''),
  QDRANT_COLLECTION_NAME: z.string().default('wiki_docs'),

  // Redis
  REDIS_HOST: z.string().default('localhost'),
  REDIS_PORT: z.string().transform(Number).default('6379'),
  REDIS_PASSWORD: z.string().optional(),
  REDIS_DB: z.string().transform(Number).default('0'),

  // Reranker
  RERANKER_ENABLED: z
    .string()
    .transform((v) => v !== 'false')
    .default('true'),
  RERANKER_PROVIDER: z.string().default('siliconflow'),
  RERANKER_API_KEY: z.string().optional(),
  RERANKER_API_BASE: z.string().url().default('https://api.siliconflow.cn/v1'),
  RERANKER_MODEL: z.string().default('BAAI/bge-reranker-v2-m3'),

  // Database
  DATABASE_PATH: z.string().default('./data/chat.db'),

  // Rate Limiting
  RATE_LIMIT_WINDOW_MS: z.string().transform(Number).default('60000'),
  RATE_LIMIT_MAX_REQUESTS: z.string().transform(Number).default('10'),

  // Security
  IP_SALT: z.string().default('change-me-in-production'),

  // Agent Configuration
  AGENT_FAST_PATH_THRESHOLD: z.string().transform(Number).default('0.7'),
  AGENT_MAX_RETRIEVAL_STEPS: z.string().transform(Number).default('3'),
  AGENT_TIMEOUT_MS: z.string().transform(Number).default('15000'),
  RETRIEVAL_TOP_K: z.string().transform(Number).default('10'),  // 准确率优化: 默认 10

  // Think Mode Configuration
  AGENT_THINK_MODE: z
    .string()
    .transform((v) => v === 'true')
    .default('true'),
  AGENT_THINK_MODE_LANGUAGE_AGNOSTIC: z
    .string()
    .transform((v) => v === 'true')
    .default('true'),
  AGENT_THINK_MODE_MAX_TOKENS: z.string().transform(Number).default('500'),

  // Langfuse (Observability)
  LANGFUSE_PUBLIC_KEY: z.string().default(''),
  LANGFUSE_SECRET_KEY: z.string().default(''),
  LANGFUSE_BASE_URL: z
    .string()
    .optional()
    .transform((v) => v || undefined),
});

// Validate and parse environment
const validateEnv = () => {
  try {
    // Debug: Log environment variables before parsing
    if (process.env.NODE_ENV !== 'production') {
      console.log('[Config] Environment variables loaded:');
      console.log('  - ZHIPU_API_KEY:', process.env.ZHIPU_API_KEY ? 'SET' : 'MISSING');
      console.log('  - EMBEDDING_API_KEY:', process.env.EMBEDDING_API_KEY ? 'SET' : 'MISSING');
      console.log('  - EMBEDDING_MODEL:', process.env.EMBEDDING_MODEL || 'MISSING');
    }

    const parsed = envSchema.parse(process.env);

    // Additional security checks for production
    if (parsed.NODE_ENV === 'production') {
      if (parsed.IP_SALT === 'change-me-in-production') {
        throw new Error('Security Error: IP_SALT must be changed in production environment');
      }
      if (!parsed.SILICONFLOW_API_KEY && !parsed.ZHIPU_API_KEY && !parsed.DEEPSEEK_API_KEY) {
        throw new Error(
          'Configuration Error: At least one LLM API key must be provided in production'
        );
      }
    }

    return parsed;
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('[Config] Zod validation errors:');
      error.errors.forEach((err) => {
        console.error(`  - ${err.path.join('.')}: ${err.message} (code: ${err.code})`);
      });

      const missingVars = error.errors
        .filter((e) => e.code === 'too_small')
        .map((e) => e.path.join('.'));
      throw new Error(
        `Missing required environment variables:\n${missingVars.map((v) => `  - ${v}`).join('\n')}`
      );
    }
    throw error;
  }
};

export const env = validateEnv();

// ============================================================================
// LLM Configuration
// ============================================================================

export const llmConfig: LLMConfig = {
  primary: {
    name: 'zhipu',
    api_base: env.ZHIPU_API_BASE,
    api_key: env.ZHIPU_API_KEY || '',
    model: env.ZHIPU_MODEL,
  },
  fallbacks: [
    // SiliconFlow 已禁用（使用推理模型导致响应时间过长）
    // ...(env.SILICONFLOW_API_KEY && env.SILICONFLOW_ENABLED
    //   ? [
    //       {
    //         name: 'siliconflow',
    //         api_base: env.SILICONFLOW_API_BASE,
    //         api_key: env.SILICONFLOW_API_KEY || '',
    //         model: env.SILICONFLOW_MODEL,
    //       },
    //     ]
    //   : []),
    ...(env.DEEPSEEK_API_KEY
      ? [
          {
            name: 'deepseek',
            api_base: env.DEEPSEEK_API_BASE,
            api_key: env.DEEPSEEK_API_KEY,
            model: env.DEEPSEEK_MODEL,
          },
        ]
      : []),
    ...(env.QWEN_API_KEY
      ? [
          {
            name: 'qwen',
            api_base: env.QWEN_API_BASE,
            api_key: env.QWEN_API_KEY,
            model: env.QWEN_MODEL,
          },
        ]
      : []),
  ],
  embedding: [
    // 保持现有 SiliconFlow 配置
    {
      name: 'siliconflow',
      provider: 'siliconflow',
      api_base: env.EMBEDDING_API_BASE,
      api_key: env.EMBEDDING_API_KEY,
      model: env.EMBEDDING_MODEL,
      dimension: env.EMBEDDING_DIMENSION,
      enabled: true,
      weight: 1,
    },
    // 新增智谱 Embedding-3
    ...(env.ZHIPU_EMBEDDING_ENABLED && env.ZHIPU_EMBEDDING_API_KEY
      ? [
          {
            name: 'zhipu',
            provider: 'zhipu',
            api_base: env.ZHIPU_EMBEDDING_API_BASE,
            api_key: env.ZHIPU_EMBEDDING_API_KEY,
            model: env.ZHIPU_EMBEDDING_MODEL,
            dimension: env.ZHIPU_EMBEDDING_DIMENSION,
            enabled: true,
            weight: 1,
          },
        ]
      : []),
  ],
};

// ============================================================================
// Agent Configuration
// ============================================================================

export const agentConfig: AgentConfig = {
  fast_path_threshold: env.AGENT_FAST_PATH_THRESHOLD,
  max_retrieval_steps: env.AGENT_MAX_RETRIEVAL_STEPS,
  timeout_ms: env.AGENT_TIMEOUT_MS,
  think_mode: env.AGENT_THINK_MODE,
  think_mode_language_agnostic: env.AGENT_THINK_MODE_LANGUAGE_AGNOSTIC,
  think_mode_max_tokens: env.AGENT_THINK_MODE_MAX_TOKENS,
  retrieval_top_k: env.RETRIEVAL_TOP_K,  // 准确率优化: 支持 topK 配置
};

// ============================================================================
// Server Configuration
// ============================================================================

export const serverConfig = {
  port: env.PORT,
  host: env.HOST,
  corsOrigin: env.CORS_ORIGIN,
  nodeEnv: env.NODE_ENV,
};

// ============================================================================
// Database Configuration
// ============================================================================

export const dbConfig = {
  path: env.DATABASE_PATH,
  vectorStoreType: env.VECTOR_STORE_TYPE,
  qdrant: {
    host: env.QDRANT_HOST,
    apiKey: env.QDRANT_API_KEY,
    collectionName: env.QDRANT_COLLECTION_NAME,
  },
};

// ============================================================================
// Redis Configuration
// ============================================================================

export const redisConfig = {
  host: env.REDIS_HOST,
  port: env.REDIS_PORT,
  password: env.REDIS_PASSWORD,
  db: env.REDIS_DB,
};

// ============================================================================
// Reranker Configuration
// ============================================================================

/**
 * Reranker配置
 *
 * 条件性Reranker优化策略 (PRD §9.3):
 * - 快速路径(置信度≥0.7): 跳过Reranker，减少~1s延迟
 * - 智能路径(置信度<0.7): 启用Reranker，保证检索质量
 * - 全局开关: 通过RERANKER_ENABLED环境变量控制
 *
 * 性能影响:
 * - 快速路径: 3.4s → 2.4s (节省1s)
 * - 智能路径: 保持质量，继续使用Reranker
 */
export const rerankerConfig = {
  enabled: env.RERANKER_ENABLED,
  provider: env.RERANKER_PROVIDER,
  apiKey: env.RERANKER_API_KEY || env.SILICONFLOW_API_KEY || '',
  apiBase: env.RERANKER_API_BASE,
  model: env.RERANKER_MODEL,
};

// ============================================================================
// Rate Limiting Configuration
// ============================================================================

export const rateLimitConfig = {
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  maxRequests: env.RATE_LIMIT_MAX_REQUESTS,
};

// ============================================================================
// Security Configuration
// ============================================================================

export const securityConfig = {
  ipSalt: env.IP_SALT,
};

// ============================================================================
// Langfuse Configuration
// ============================================================================

export const langfuseConfig = {
  publicKey: env.LANGFUSE_PUBLIC_KEY,
  secretKey: env.LANGFUSE_SECRET_KEY,
  baseUrl: env.LANGFUSE_BASE_URL,
  enabled: !!(env.LANGFUSE_PUBLIC_KEY && env.LANGFUSE_SECRET_KEY),
};

// ============================================================================
// System Prompts
// ============================================================================

const BASE_SYSTEM_PROMPT = `You are the CamThink Wiki AI assistant.

Context: {context}

Instructions:
1. Answer the user's question using ONLY the provided context.
2. If the answer is not in the context, state "I cannot find this information in the documentation."
3. Cite sources in format [Title § Section].
4. Use the user's language ({language}).
5. For "How-to" questions, provide step-by-step instructions.
6. For comparison questions, use tables to present key differences.
7. Keep responses concise but comprehensive.`;

export const prompts = {
  base: BASE_SYSTEM_PROMPT,

  getIntentAnalysis: (query: string, contextSummary: string): string => {
    return `Analyze the following user query and retrieval context to determine:
1. Query intent (SIMPLE_FACT, HOW_TO, COMPARISON, TROUBLESHOOTING, UNKNOWN)
2. Whether the retrieved context is sufficient to answer (0-1 confidence)
3. Whether additional comparison data is needed

Query: ${query}

Retrieved Context Summary: ${contextSummary}

Respond in JSON format:
{
  "intent": "SIMPLE_FACT|HOW_TO|COMPARISON|TROUBLESHOOTING|UNKNOWN",
  "is_sufficient": true|false,
  "confidence": 0.0-1.0,
  "needs_comparison": true|false,
  "sub_query": "if additional search needed"
}`;
  },

  getComparisonFollowup: (originalQuery: string, product: string): string => {
    return `The user is asking about ${product}. Generate a specific query to retrieve comparison information for: "${originalQuery}"

Return only the search query string.`;
  },
};

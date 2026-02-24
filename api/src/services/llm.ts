import OpenAI from 'openai';
import { llmConfig, rerankerConfig } from '../config/index.js';
import type {
  LLMProvider,
  EmbeddingProvider,
  ChatMessage,
  // LLMStreamChunk,
  LLMResponseMetadata,
  QueryAnalysis,
} from '../types/index.js';

// Langfuse observability
import { trackLLMGeneration, trackError } from '../lib/langfuse.js';

// Embedding cache
import { withEmbeddingCache, withBatchEmbeddingCache } from '../lib/embedding-cache.js';

// ============================================================================
// LLM Provider Implementation
// ============================================================================

/**
 * Creates an OpenAI client with the given provider configuration
 */
const createClient = (provider: LLMProvider | EmbeddingProvider): OpenAI => {
  return new OpenAI({
    baseURL: provider.api_base,
    apiKey: provider.api_key,
  });
};

/**
 * 获取启用的 Embedding Providers
 * 验证维度一致性
 */
function getActiveEmbeddingProviders(): EmbeddingProvider[] {
  const providers = Array.isArray(llmConfig.embedding)
    ? llmConfig.embedding
    : [llmConfig.embedding];

  const active = providers.filter((p) => p.enabled && p.api_key);

  if (active.length === 0) {
    throw new Error('No active embedding providers configured');
  }

  // 验证维度一致性
  const dimensions = new Set(active.map((p) => p.dimension));
  if (dimensions.size > 1) {
    throw new Error(`Inconsistent embedding dimensions: ${Array.from(dimensions).join(', ')}`);
  }

  return active;
}

/**
 * 检测文本语言
 * 返回 'zh-Hans' (中文) 或 'en' (英文)
 */
function detectTextLanguage(text: string): 'zh-Hans' | 'en' {
  // 如果包含中文字符，归类为中文
  if (/[\u4e00-\u9fa5]/.test(text)) {
    return 'zh-Hans';
  }
  return 'en';
}

/**
 * 为单个文本生成 embedding，支持多 Provider 降级
 * 带重试机制，自动处理速率限制和临时错误
 * 优化：根据文本语言选择最合适的 Embedding 模型
 */
export const generateEmbedding = async (text: string): Promise<number[]> => {
  const providers = getActiveEmbeddingProviders();
  const maxRetries = 3;
  let lastError: Error | null = null;

  // 文本长度限制：根据诊断，SiliconFlow API 对超长文本返回 413 错误
  // BAAI/bge-m3 模型支持最多 8192 tokens，约等于 15000-20000 字符
  // 为安全起见，限制为 8000 字符
  const MAX_TEXT_LENGTH = 8000;
  const truncatedText = text.length > MAX_TEXT_LENGTH ? text.substring(0, MAX_TEXT_LENGTH) : text;

  // 检测文本语言
  const textLanguage = detectTextLanguage(text);

  // 根据语言优先选择合适的 Provider
  // 中文优先使用 bge-m3，英文优先使用 embedding-3
  const sortedProviders = [...providers].sort((a, b) => {
    if (textLanguage === 'zh-Hans') {
      // 中文：bge-m3 优先
      if (a.provider === 'siliconflow' && a.model.includes('bge')) return -1;
      if (b.provider === 'siliconflow' && b.model.includes('bge')) return 1;
    } else {
      // 英文：embedding-3 优先
      if (a.provider === 'zhipu' && a.model.includes('embedding-3')) return -1;
      if (b.provider === 'zhipu' && b.model.includes('embedding-3')) return 1;
    }
    return 0;
  });

  // 依次尝试不同的 Provider（按语言优先级排序）
  for (const provider of sortedProviders) {
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      const startTime = Date.now();
      try {
        const client = createClient({
          name: provider.provider,
          api_base: provider.api_base,
          api_key: provider.api_key,
          model: provider.model,
        });

        // 智谱 embedding-3 需要指定 dimensions 参数
        const embeddingParams: Record<string, unknown> = {
          model: provider.model,
          input: truncatedText,
        };

        // 智谱 API 支持 dimensions 参数来指定输出维度
        if (provider.provider === 'zhipu' && provider.dimension) {
          embeddingParams.dimensions = provider.dimension;
        }

        const response = await client.embeddings.create(embeddingParams as any);

        const latency = Date.now() - startTime;
        const embedding = response.data[0].embedding;

        // Track in Langfuse
        trackLLMGeneration('embedding_generation', {
          model: provider.model,
          provider: provider.provider,
          prompt: truncatedText.substring(0, 1000), // Truncate for logging
          latencyMs: latency,
          tokensUsed: {
            prompt: response.usage?.prompt_tokens || 0,
            completion: 0,
            total: response.usage?.total_tokens || 0,
          },
        });

        console.log(`[Embedding] 使用 ${provider.name} 生成 embedding 成功 (${latency}ms)`);
        return embedding;
      } catch (error: any) {
        lastError = error;

        // 检查错误类型并决定是否重试
        const statusCode = error?.status || error?.response?.status;

        if (statusCode === 429) {
          // Rate limit: 使用指数退避
          const waitTime = Math.pow(2, attempt) * 1000; // 1s, 2s, 4s
          console.warn(
            `[Embedding] [${provider.name}] 速率限制，等待 ${waitTime}ms 后重试 (${attempt + 1}/${maxRetries})`
          );
          await new Promise((resolve) => setTimeout(resolve, waitTime));
          continue;
        } else if (statusCode === 413 || statusCode === 400) {
          // Payload too large 或 Bad Request：可能是文本过长
          if (attempt < maxRetries - 1 && truncatedText.length > 1000) {
            // 尝试截断文本后重试
            const shorterText = truncatedText.substring(0, Math.floor(truncatedText.length / 2));
            console.warn(
              `[Embedding] [${provider.name}] 文本可能过长 (${truncatedText.length} 字符)，尝试截断到 ${shorterText.length} 字符`
            );
            // 递归调用，使用更短的文本
            return generateEmbedding(shorterText);
          }
        } else if (statusCode >= 500 || statusCode === 408) {
          // 服务器错误或超时：可以重试
          if (attempt < maxRetries - 1) {
            const waitTime = 1000 * (attempt + 1);
            console.warn(
              `[Embedding] [${provider.name}] 服务器错误 (HTTP ${statusCode})，等待 ${waitTime}ms 后重试`
            );
            await new Promise((resolve) => setTimeout(resolve, waitTime));
            continue;
          }
        }

        // 其他错误：尝试下一个 Provider
        console.error(`[Embedding] [${provider.name}] 错误 (HTTP ${statusCode}):`, error.message);
        break;
      }
    }
  }

  // 所有 Provider 都失败，抛出错误
  const activeProviders = providers.map((p) => p.name).join(', ');
  trackError(null, lastError?.message || 'Unknown embedding error', {
    providers: activeProviders,
  });

  throw new Error(
    `Failed to generate embedding after trying providers: ${activeProviders}. Last error: ${lastError?.message}`
  );
};

/**
 * 带缓存的Embedding生成函数
 * 包装原始generateEmbedding，自动处理缓存
 */
export const generateEmbeddingCached = withEmbeddingCache(generateEmbedding);

/**
 * Generate embeddings for multiple texts (batch)
 * 支持多 Provider 并发调用，批次轮询分配
 * 带重试机制和批次间延迟，避免速率限制
 */
export const generateEmbeddings = async (texts: string[]): Promise<number[][]> => {
  const startTime = Date.now();
  const providers = getActiveEmbeddingProviders();

  console.log(
    `[Embedding] 使用 ${providers.length} 个并发 Provider: ${providers.map((p) => p.name).join(', ')}`
  );

  // 文本长度限制：根据诊断测试，20000字符会导致 413 错误
  // 安全限制为 8000 字符
  const MAX_TEXT_LENGTH = 8000;
  const truncatedTexts = texts.map((t) =>
    t.length > MAX_TEXT_LENGTH ? t.substring(0, MAX_TEXT_LENGTH) : t
  );

  // 降低批处理大小，从 10 降到 5，减少每批次的 token 数量
  const BATCH_SIZE = 5;
  const BATCH_DELAY = 500; // 批次间延迟 500ms，避免触发速率限制

  // 并发处理每个 Provider 的批次
  const allEmbeddings: number[][] = [];
  const embeddingMap = new Map<number, number[][]>(); // batchIndex → embeddings (二维数组)
  const providerStats = new Map<string, number>(); // provider → success count

  await Promise.all(
    providerBatches.map(async ({ provider, batches: providerBatchesList, batchIndex }) => {
      let batchCount = 0;

      for (const batch of providerBatchesList) {
        const batchStartTime = Date.now();
        const currentBatchIndex = batchIndex[batchCount];

        try {
          const client = createClient({
            name: provider.provider,
            api_base: provider.api_base,
            api_key: provider.api_key,
            model: provider.model,
          });

          // 智谱 embedding-3 需要指定 dimensions 参数
          const embeddingParams: Record<string, unknown> = {
            model: provider.model,
            input: batch,
          };

          // 智谱 API 支持 dimensions 参数来指定输出维度
          if (provider.provider === 'zhipu' && provider.dimension) {
            embeddingParams.dimensions = provider.dimension;
            console.log(`[Embedding] [${provider.name}] 设置 dimensions=${provider.dimension}`);

            // 智谱 API 需要使用原生 fetch，因为 OpenAI SDK 可能不支持 dimensions 参数
            console.log(`[Embedding] [${provider.name}] 使用原生 fetch 调用智谱 API`);
            try {
              const fetchResponse = await fetch(`${provider.api_base}/embeddings`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  Authorization: `Bearer ${provider.api_key}`,
                },
                body: JSON.stringify(embeddingParams),
              });

              if (!fetchResponse.ok) {
                throw new Error(
                  `智谱 API 错误: ${fetchResponse.status} ${fetchResponse.statusText}`
                );
              }

              const fetchData = (await fetchResponse.json()) as {
                data: Array<{ embedding: number[] }>;
                usage?: { prompt_tokens: number; total_tokens: number };
              };
              const embeddings = fetchData.data.map((item) => item.embedding);

              const batchLatency = Date.now() - batchStartTime;

              // 调试: 打印智谱返回的维度
              console.log(`[Embedding] [${provider.name}] 返回 ${embeddings.length} 个 embeddings`);
              embeddings.forEach((e, i) => {
                console.log(`[Embedding] [${provider.name}] embedding ${i}: 维度=${e.length}`);
              });

              embeddingMap.set(currentBatchIndex, embeddings);
              allEmbeddings.push(...embeddings);

              // 更新统计
              providerStats.set(
                provider.name,
                (providerStats.get(provider.name) || 0) + batch.length
              );

              console.log(
                `[Embedding] [${provider.name}] 批次 ${currentBatchIndex + 1}/${batches.length} 成功 (${batch.length} 个文本, ${batchLatency}ms)`
              );

              // Track batch in Langfuse
              trackLLMGeneration('embedding_batch_generation', {
                model: provider.model,
                provider: provider.provider,
                prompt: `Batch of ${batch.length} texts`,
                latencyMs: batchLatency,
                tokensUsed: {
                  prompt: fetchData.usage?.prompt_tokens || 0,
                  completion: 0,
                  total: fetchData.usage?.total_tokens || 0,
                },
              });

              continue; // 跳过后续的 OpenAI SDK 调用
            } catch (fetchError) {
              console.error(
                `[Embedding] [${provider.name}] 原生 fetch 失败，尝试使用 OpenAI SDK:`,
                fetchError
              );
              // 继续使用 OpenAI SDK
            }
          }

          const response = await client.embeddings.create(embeddingParams as any);

          const batchLatency = Date.now() - batchStartTime;

          // 存储结果
          const embeddings = response.data.map((item) => item.embedding);

          // 调试: 打印智谱返回的维度
          if (provider.provider === 'zhipu') {
            console.log(`[Embedding] [${provider.name}] 返回 ${embeddings.length} 个 embeddings`);
            embeddings.forEach((e, i) => {
              console.log(`[Embedding] [${provider.name}] embedding ${i}: 维度=${e.length}`);
            });
          }

          embeddingMap.set(currentBatchIndex, embeddings);
          allEmbeddings.push(...embeddings);

          // 更新统计
          providerStats.set(provider.name, (providerStats.get(provider.name) || 0) + batch.length);

          console.log(
            `[Embedding] [${provider.name}] 批次 ${currentBatchIndex + 1}/${batches.length} 成功 (${batch.length} 个文本, ${batchLatency}ms)`
          );

          // Track batch in Langfuse
          trackLLMGeneration('embedding_batch_generation', {
            model: provider.model,
            provider: provider.provider,
            prompt: `Batch of ${batch.length} texts`,
            latencyMs: batchLatency,
            tokensUsed: {
              prompt: response.usage?.prompt_tokens || 0,
              completion: 0,
              total: response.usage?.total_tokens || 0,
            },
          });
        } catch (error: any) {
          const batchLatency = Date.now() - batchStartTime;
          const statusCode = error?.status || error?.response?.status;

          console.error(
            `[Embedding] [${provider.name}] 批次 ${currentBatchIndex + 1} 失败 (HTTP ${statusCode}):`,
            error.message
          );

          // Track error in Langfuse
          trackError(
            null,
            `Batch ${currentBatchIndex + 1} failed on ${provider.name}: ${error instanceof Error ? error.message : 'Unknown error'}`,
            {
              provider: provider.provider,
              model: provider.model,
              latencyMs: batchLatency,
              batchSize: batch.length,
            }
          );

          // 错误处理策略
          if (statusCode === 413 || statusCode === 400) {
            // Payload too large 或 Bad Request：逐个处理
            console.log(`[Embedding] [${provider.name}] 批次失败，逐个处理...`);
            const embeddings: number[][] = [];
            for (const text of batch) {
              try {
                // 智谱 embedding-3 需要使用原生 fetch
                if (provider.provider === 'zhipu' && provider.dimension) {
                  const singleParams = {
                    model: provider.model,
                    input: [text],
                    dimensions: provider.dimension,
                  };

                  const singleResponse = await fetch(`${provider.api_base}/embeddings`, {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                      Authorization: `Bearer ${provider.api_key}`,
                    },
                    body: JSON.stringify(singleParams),
                  });

                  if (!singleResponse.ok) {
                    throw new Error(`智谱 API 错误: ${singleResponse.status} ${singleResponse.statusText}`);
                  }

                  const singleData = (await singleResponse.json()) as {
                    data: Array<{ embedding: number[] }>;
                  };
                  embeddings.push(singleData.data[0].embedding);
                  providerStats.set(provider.name, (providerStats.get(provider.name) || 0) + 1);
                } else {
                  // 其他 Provider 使用 OpenAI SDK
                  const singleResponse = await createClient({
                    name: provider.provider,
                    api_base: provider.api_base,
                    api_key: provider.api_key,
                    model: provider.model,
                  }).embeddings.create({
                    model: provider.model,
                    input: [text],
                  });
                  embeddings.push(singleResponse.data[0].embedding);
                  providerStats.set(provider.name, (providerStats.get(provider.name) || 0) + 1);
                }
              } catch (singleError) {
                console.error('[Embedding] 单个文本处理失败，使用零向量:', singleError);
                embeddings.push(new Array(provider.dimension).fill(0));
              }
            }
            embeddingMap.set(currentBatchIndex, embeddings);
            allEmbeddings.push(...embeddings);
          } else if (statusCode === 429) {
            // Rate limit: 等待后重试
            const waitTime = 2000;
            console.warn(
              `[Embedding] [${provider.name}] 速率限制，等待 ${waitTime}ms 后重试批次 ${currentBatchIndex + 1}`
            );
            await new Promise((resolve) => setTimeout(resolve, waitTime));

            // 重试当前批次
            try {
              // 智谱 embedding-3 需要指定 dimensions 参数
              const retryParams: Record<string, unknown> = {
                model: provider.model,
                input: batch,
              };

              if (provider.provider === 'zhipu' && provider.dimension) {
                retryParams.dimensions = provider.dimension;
              }

              const retryResponse = await createClient({
                name: provider.provider,
                api_base: provider.api_base,
                api_key: provider.api_key,
                model: provider.model,
              }).embeddings.create(retryParams as any);
              const embeddings = retryResponse.data.map((item) => item.embedding);
              embeddingMap.set(currentBatchIndex, embeddings);
              allEmbeddings.push(...embeddings);
              providerStats.set(
                provider.name,
                (providerStats.get(provider.name) || 0) + batch.length
              );
              console.log(`[Embedding] [${provider.name}] 批次 ${currentBatchIndex + 1} 重试成功`);
            } catch (retryError) {
              // 重试也失败，使用零向量
              console.error(
                `[Embedding] [${provider.name}] 批次 ${currentBatchIndex + 1} 重试失败，使用零向量`
              );
              const zeroEmbeddings = batch.map(() => new Array(provider.dimension).fill(0));
              embeddingMap.set(currentBatchIndex, zeroEmbeddings);
              allEmbeddings.push(...zeroEmbeddings);
            }
          } else {
            // 其他错误：使用零向量占位
            console.warn(
              `[Embedding] [${provider.name}] 批次 ${currentBatchIndex + 1} 错误，使用零向量占位`
            );
            const zeroEmbeddings = batch.map(() => new Array(provider.dimension).fill(0));
            embeddingMap.set(currentBatchIndex, zeroEmbeddings);
            allEmbeddings.push(...zeroEmbeddings);
          }
        }

        // 批次间延迟，避免速率限制
        if (batchCount < providerBatchesList.length - 1) {
          await new Promise((resolve) => setTimeout(resolve, BATCH_DELAY));
        }

        batchCount++;
      }
    })
  );

  // 按 batchIndex 排序结果
  const sortedEmbeddings: number[][] = [];
  for (let i = 0; i < batches.length; i++) {
    const embeddings = embeddingMap.get(i);
    if (embeddings) {
      sortedEmbeddings.push(...embeddings);
    }
  }

  const totalLatency = Date.now() - startTime;
  const successRate = ((sortedEmbeddings.length / truncatedTexts.length) * 100).toFixed(1);

  console.log(`[Embedding] 并发处理完成: ${sortedEmbeddings.length}/${truncatedTexts.length} 成功`);
  console.log(
    `[Embedding] Provider 统计: ${Array.from(providerStats.entries())
      .map(([p, count]) => `${p}=${count}`)
      .join(', ')}`
  );
  console.log(`[Embedding] 总耗时: ${totalLatency}ms, 成功率: ${successRate}%`);

  return sortedEmbeddings;
};

/**
 * 带缓存的批量Embedding生成函数
 */
export const generateEmbeddingsCached = async (texts: string[]): Promise<number[][]> => {
  return withBatchEmbeddingCache(texts, generateEmbeddings);
};

// ============================================================================
// Chat Completion with Streaming
// ============================================================================

interface ChatCompletionOptions {
  messages: ChatMessage[];
  temperature?: number;
  maxTokens?: number;
  onChunk?: (chunk: string) => void;
  signal?: AbortSignal;
}

interface ChatCompletionResult {
  content: string;
  metadata: LLMResponseMetadata;
}

/**
 * Attempts to call a single provider
 */
const tryProvider = async (
  provider: LLMProvider,
  options: ChatCompletionOptions,
  startTime: number
): Promise<ChatCompletionResult> => {
  const client = createClient(provider);

  const messages = options.messages.map((msg) => ({
    role: msg.role,
    content: msg.content,
  }));

  try {
    let fullContent = '';

    const stream = await client.chat.completions.create({
      model: provider.model,
      messages,
      temperature: options.temperature ?? 0.3,
      max_tokens: options.maxTokens ?? 2048,
      stream: true,
    });

    for await (const chunk of stream) {
      const delta = chunk.choices[0]?.delta?.content ?? '';
      if (delta) {
        fullContent += delta;
        options.onChunk?.(delta);
      }

      // Check for abort signal
      if (options.signal?.aborted) {
        throw new Error('Request aborted');
      }
    }

    const latency = Date.now() - startTime;

    // Track in Langfuse
    trackLLMGeneration('chat_completion', {
      model: provider.model,
      provider: provider.name,
      temperature: options.temperature ?? 0.3,
      maxTokens: options.maxTokens ?? 2048,
      prompt: JSON.stringify(messages).substring(0, 2000), // Truncate for logging
      completion: fullContent,
      latencyMs: latency,
      tokensUsed: {
        prompt: fullContent.length / 4, // Rough estimate
        completion: fullContent.length / 4,
        total: fullContent.length / 2,
      },
    });

    return {
      content: fullContent,
      metadata: {
        model: provider.model,
        tokens_used: fullContent.length / 4, // Rough estimate
        latency_ms: latency,
      },
    };
  } catch (error) {
    const latency = Date.now() - startTime;
    console.error(`Provider ${provider.name} error:`, error);

    // Track error in Langfuse
    trackError(
      null,
      `${provider.name} failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      {
        provider: provider.name,
        model: provider.model,
        latencyMs: latency,
      }
    );

    throw error;
  }
};

/**
 * Generate chat completion with automatic fallback
 */
export const chatCompletion = async (
  options: ChatCompletionOptions
): Promise<ChatCompletionResult> => {
  const startTime = Date.now();
  const providers = [llmConfig.primary, ...llmConfig.fallbacks];

  let lastError: Error | null = null;

  for (const provider of providers) {
    try {
      return await tryProvider(provider, options, startTime);
    } catch (error) {
      lastError = error as Error;
      console.warn(`Provider ${provider.name} failed, trying next...`);
    }
  }

  throw new Error(`All LLM providers failed. Last error: ${lastError?.message}`);
};

/**
 * Generate chat completion with streaming callback
 */
export const streamChatCompletion = async function* (
  options: ChatCompletionOptions
): AsyncGenerator<string, ChatCompletionResult, unknown> {
  const providers = [llmConfig.primary, ...llmConfig.fallbacks];
  const startTime = Date.now();
  let lastError: Error | null = null;

  for (const provider of providers) {
    const providerStartTime = Date.now();
    try {
      const client = createClient(provider);

      console.log(`[LLM] Attempting ${provider.name} with model ${provider.model}...`);

      const messages = options.messages.map((msg) => ({
        role: msg.role,
        content: msg.content,
      }));

      let fullContent = '';

      const stream = await client.chat.completions.create({
        model: provider.model,
        messages,
        temperature: options.temperature ?? 0.3,
        max_tokens: options.maxTokens ?? 2048,
        stream: true,
      });

      for await (const chunk of stream) {
        const delta = chunk.choices[0]?.delta?.content ?? '';
        if (delta) {
          fullContent += delta;
          yield delta;
        }

        if (options.signal?.aborted) {
          throw new Error('Request aborted');
        }
      }

      const totalLatency = Date.now() - startTime;

      // Track in Langfuse
      trackLLMGeneration('stream_chat_completion', {
        model: provider.model,
        provider: provider.name,
        temperature: options.temperature ?? 0.3,
        maxTokens: options.maxTokens ?? 2048,
        prompt: JSON.stringify(messages).substring(0, 2000), // Truncate for logging
        completion: fullContent,
        latencyMs: totalLatency,
        tokensUsed: {
          prompt: fullContent.length / 4,
          completion: fullContent.length / 4,
          total: fullContent.length / 2,
        },
      });

      return {
        content: fullContent,
        metadata: {
          model: provider.model,
          tokens_used: fullContent.length / 4,
          latency_ms: totalLatency,
        },
      };
    } catch (error) {
      const latency = Date.now() - providerStartTime;
      lastError = error as Error;

      // Detailed error logging
      console.error(`[LLM] ${provider.name} error details:`, {
        message: error instanceof Error ? error.message : 'Unknown error',
        status: (error as any).status,
        type: (error as any).type,
        code: (error as any).code,
        stack: error instanceof Error ? error.stack?.substring(0, 200) : undefined,
      });

      // Track error in Langfuse
      trackError(
        null,
        `${provider.name} streaming failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        {
          provider: provider.name,
          model: provider.model,
          latencyMs: latency,
        }
      );

      console.warn(`Provider ${provider.name} streaming failed, trying next...`);
    }
  }

  throw new Error(`All LLM providers failed. Last error: ${lastError?.message}`);
};

// ============================================================================
// Intent Analysis & Think Mode
// ============================================================================

/**
 * Think Mode: Pre-retrieval reasoning for better query understanding
 * This analyzes the user's query BEFORE RAG retrieval to determine:
 * 1. Query intent and category
 * 2. Language detection (for search strategy)
 * 3. Whether to search both languages or just one
 * 4. Optimal search queries
 */
export const thinkModeAnalyze = async (
  query: string,
  language: 'en' | 'zh-Hans'
): Promise<{
  intent: string;
  reasoning: string;
  search_language: 'en' | 'zh-Hans' | 'both';
  suggested_queries: string[];
  needs_tools: boolean;
  suggested_tool?: string;
}> => {
  const systemPrompt =
    language === 'zh-Hans'
      ? `你是一个智能查询分析助手。在检索文档之前，深入分析用户查询以优化搜索策略。

分析以下内容并以JSON格式返回：
1. intent: 查询意图类型 (SIMPLE_FACT, HOW_TO, COMPARISON, TROUBLESHOOTING, PRICING, CODE_EXAMPLE, UNKNOWN)
2. reasoning: 简要分析用户想了解什么（1-2句话）
3. search_language: 搜索策略
   - "zh-Hans" - 用户明确询问中文文档
   - "en" - 用户明确询问英文文档
   - "both" - 用户没有明确语言偏好，应该搜索中英文双语
4. suggested_queries: 建议的搜索查询列表（1-3个变体），用于提高检索质量
5. needs_tools: 是否需要调用外部工具（如GitHub代码搜索、产品信息查询）
6. suggested_tool: 如果需要工具，建议使用哪个工具

判断search_language的逻辑：
- 如果查询中提到"中文文档"、"中文资料"等 → zh-Hans
- 如果查询中提到"English"、"英文文档"等 → en
- 否则 → both（默认搜索双语，确保找到最相关的信息）

只返回JSON，不要其他内容。`
      : `You are an intelligent query analyzer. Analyze the user's query BEFORE document retrieval to optimize search strategy.

Analyze and return JSON with:
1. intent: Query type (SIMPLE_FACT, HOW_TO, COMPARISON, TROUBLESHOOTING, PRICING, CODE_EXAMPLE, UNKNOWN)
2. reasoning: Brief analysis of what the user wants to know (1-2 sentences)
3. search_language: Search strategy
   - "zh-Hans" - User explicitly asks for Chinese docs
   - "en" - User explicitly asks for English docs
   - "both" - No language preference, search both Chinese and English
4. suggested_queries: Suggested search queries (1-3 variants) for better retrieval
5. needs_tools: Whether external tools are needed (GitHub code search, product info, etc.)
6. suggested_tool: Which tool to use if needed

Logic for search_language:
- If query mentions "Chinese", "中文", "中文文档" → zh-Hans
- If query mentions "English", "英文文档" → en
- Otherwise → both (default to bilingual search for best results)

Return ONLY JSON, no other content.`;

  const userPrompt = language === 'zh-Hans' ? `用户查询: "${query}"` : `User query: "${query}"`;

  try {
    const result = await chatCompletion({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.1, // Low temperature for consistent analysis
      maxTokens: 500,
    });

    // Parse JSON response
    const jsonMatch = result.content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON found in think mode response');
    }

    const parsed = JSON.parse(jsonMatch[0]);

    return {
      intent: parsed.intent || 'UNKNOWN',
      reasoning: parsed.reasoning || '',
      search_language: parsed.search_language || 'both',
      suggested_queries: parsed.suggested_queries || [query],
      needs_tools: parsed.needs_tools || false,
      suggested_tool: parsed.suggested_tool,
    };
  } catch (error) {
    console.error('Think mode analysis failed, using defaults:', error);
    return {
      intent: 'UNKNOWN',
      reasoning: 'Analysis failed, using default strategy',
      search_language: 'both',
      suggested_queries: [query],
      needs_tools: false,
    };
  }
};

/**
 * Analyze query intent using LLM (legacy, preserved for compatibility)
 */
export const analyzeQueryIntent = async (
  query: string,
  contextSummary: string
): Promise<QueryAnalysis> => {
  const systemPrompt = `You are a query analyzer. Analyze the user's query and determine:
1. Intent type: SIMPLE_FACT, HOW_TO, COMPARISON, TROUBLESHOOTING, or UNKNOWN
2. Whether retrieved context is sufficient (0.0-1.0 confidence)
3. Whether comparison data is needed
4. A sub-query if additional search is needed

Respond ONLY with valid JSON, no markdown.`;

  const userPrompt = `Query: "${query}"

Retrieved Context Summary:
${contextSummary || 'No context retrieved yet.'}

Analyze and respond with JSON.`;

  try {
    const result = await chatCompletion({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0, // Set to 0 for deterministic results
    });

    // Parse JSON response
    const jsonMatch = result.content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON found in response');
    }

    const parsed = JSON.parse(jsonMatch[0]);

    return {
      intent: parsed.intent || 'UNKNOWN',
      is_sufficient: parsed.is_sufficient ?? true,
      confidence: parsed.confidence ?? 0.5,
      needs_comparison: parsed.needs_comparison ?? false,
      sub_query: parsed.sub_query,
    };
  } catch (error) {
    console.error('Intent analysis failed, using defaults:', error);
    // Return conservative defaults
    return {
      intent: 'UNKNOWN',
      is_sufficient: false,
      confidence: 0.3,
    };
  }
};

// ============================================================================
// Prompt Building
// ============================================================================

/**
 * Build RAG prompt with context
 */
export const buildRAGPrompt = (
  query: string,
  contextChunks: string[],
  language: string,
  history: ChatMessage[] = []
): ChatMessage[] => {
  // Language-specific system prompts for better adherence
  const systemPrompts = {
    'zh-Hans': `你是 CamThink Wiki AI 智能助手。

${contextChunks.length > 0 ? `参考文档内容：\n${contextChunks.join('\n\n---\n\n')}` : '未找到相关文档内容。'}

回答要求：
1. 仅基于上述提供的文档内容回答问题
2. 如果文档中没有答案，明确说明"我在文档中找不到此信息"
3. 引用来源时使用格式 [标题 § 章节]
4. 必须使用简体中文回答
5. 对于"如何操作"类问题，提供逐步说明
6. 对于对比类问题，使用表格说明
7. 保持回答简洁但全面`,

    en: `You are the CamThink Wiki AI assistant.

${contextChunks.length > 0 ? `Context:\n${contextChunks.join('\n\n---\n\n')}` : 'No relevant context found.'}

Instructions:
1. Answer using ONLY the provided context above.
2. If the answer is not in the context, state "I cannot find this information in the documentation."
3. Cite sources using format [Title § Section]
4. Respond in English
5. For "How-to" questions, provide step-by-step instructions.
6. For comparison questions, use tables for clarity.
7. Keep responses concise but comprehensive.`,
  };

  const systemPrompt = systemPrompts[language as keyof typeof systemPrompts] || systemPrompts.en;

  const messages: ChatMessage[] = [
    { role: 'system', content: systemPrompt },
    ...history.slice(-10).map((msg) => ({
      role: msg.role,
      content: msg.content,
    })),
    { role: 'user', content: query },
  ];

  return messages;
};

/**
 * Generate a sub-query for additional retrieval
 */
export const generateSubQuery = async (
  originalQuery: string,
  intent: string,
  missingInfo?: string
): Promise<string> => {
  const systemPrompt = `You are a search query optimizer. Generate a specific search query to find additional information.
Return ONLY the search query string, no explanation.`;

  const userPrompt = `Original query: "${originalQuery}"
Intent: ${intent}
${missingInfo ? `Missing information: ${missingInfo}` : ''}

Generate a more specific search query to find the missing information.`;

  try {
    const result = await chatCompletion({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0, // Set to 0 for deterministic results
      maxTokens: 100,
    });

    return result.content.trim().replace(/^["']|["']$/g, '');
  } catch (error) {
    console.error('Sub-query generation failed:', error);
    return originalQuery;
  }
};

/**
 * Rerank documents using the configured reranker provider
 */
export const rerank = async (
  query: string,
  documents: string[],
  topK: number = 5
): Promise<{ index: number; score: number }[]> => {
  // If no reranker configured or empty documents, return original order
  if (!rerankerConfig.apiKey || documents.length === 0) {
    return documents.map((_, index) => ({ index, score: 1.0 - index * 0.01 })).slice(0, topK);
  }

  try {
    new OpenAI({
      baseURL: rerankerConfig.apiBase,
      apiKey: rerankerConfig.apiKey,
    });

    // Construct request based on provider
    // SiliconFlow / BAAI-bge-reranker format usually expects:
    // model: string, query: string, documents: string[], top_n: number
    // But OpenAI SDK doesn't natively support "rerank" endpoint usually.
    // However, many compatible APIs (like SiliconFlow) expose it.
    // If using OpenAI SDK, we might need to use a raw fetch if the SDK doesn't support the specific endpoint structure
    // or if they map it to something else.
    //
    // SiliconFlow Rerank API: POST /v1/rerank
    // { "model": "...", "query": "...", "documents": ["..."], "top_n": ... }

    const response = await fetch(`${rerankerConfig.apiBase}/rerank`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${rerankerConfig.apiKey}`,
      },
      body: JSON.stringify({
        model: rerankerConfig.model,
        query,
        documents,
        top_n: topK,
        return_documents: false,
      }),
    });

    if (!response.ok) {
      throw new Error(`Rerank API failed: ${response.statusText}`);
    }

    const jsonData = (await response.json()) as {
      results: Array<{ index: number; relevance_score: number }>;
    };
    // Expected response: { results: [{ index: 0, relevance_score: 0.9 }, ...] }

    return jsonData.results.map((r: any) => ({
      index: r.index,
      score: r.relevance_score,
    }));
  } catch (error) {
    console.warn('Reranking failed, falling back to original order:', error);
    // Fallback: return original order
    return documents.map((_, index) => ({ index, score: 1.0 - index * 0.01 })).slice(0, topK);
  }
};

// ============================================================================
// Health Check
// ============================================================================

/**
 * Check if LLM providers are accessible
 */
export const healthCheck = async (): Promise<{
  primary: boolean;
  fallbacks: boolean[];
}> => {
  const checkProvider = async (provider: LLMProvider): Promise<boolean> => {
    try {
      const client = createClient(provider);
      await client.chat.completions.create({
        model: provider.model,
        messages: [{ role: 'user', content: 'test' }],
        max_tokens: 1,
      });
      return true;
    } catch {
      return false;
    }
  };

  const [primary, ...fallbacks] = await Promise.all([
    checkProvider(llmConfig.primary),
    ...llmConfig.fallbacks.map(checkProvider),
  ]);

  return { primary, fallbacks };
};

/**
 * Generate follow-up suggestions based on conversation context
 */
export const generateFollowUpSuggestions = async (
  originalQuery: string,
  assistantResponse: string,
  language: 'en' | 'zh-Hans'
): Promise<string[]> => {
  const systemPrompt =
    language === 'zh-Hans'
      ? `你是一个智能助手，根据用户的问题和AI的回答，生成3个相关的后续问题。

要求：
1. 问题应该基于用户当前的兴趣点和已回答的内容
2. 问题应该引导用户深入了解相关主题
3. 问题应该简洁明了（10-15个字）
4. 避免重复已经回答的问题
5. 返回JSON格式：["问题1", "问题2", "问题3"]`
      : `You are an intelligent assistant. Generate 3 relevant follow-up questions based on the user's query and the AI's response.

Requirements:
1. Questions should be based on user's current interest and answered content
2. Questions should guide users to explore related topics deeper
3. Questions should be concise (5-10 words)
4. Avoid repeating what was already answered
5. Return JSON format: ["question1", "question2", "question3"]`;

  const responseSummary =
    assistantResponse.length > 500
      ? assistantResponse.substring(0, 500) + '...'
      : assistantResponse;

  const userPrompt =
    language === 'zh-Hans'
      ? `用户问题: "${originalQuery}"\n\nAI回答摘要: ${responseSummary}`
      : `User query: "${originalQuery}"\n\nAI response summary: ${responseSummary}`;

  try {
    const result = await chatCompletion({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.7,
      maxTokens: 200,
    });

    const jsonMatch = result.content.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      if (Array.isArray(parsed)) {
        return parsed.slice(0, 3).filter((q) => q && q.trim().length > 0);
      }
    }
  } catch (error) {
    console.error('Follow-up suggestions generation failed:', error);
  }

  return [];
};

/**
 * Analyze whether to use agent tools when RAG returns no results
 * This enables intelligent fallback to external data sources
 */
export const shouldUseAgentToolsForEmptyRAG = async (
  query: string,
  language: 'en' | 'zh-Hans',
  thinkAnalysis?: {
    intent: string;
    reasoning: string;
    search_language: 'en' | 'zh-Hans' | 'both';
  }
): Promise<{
  shouldUseTools: boolean;
  suggestedTools: string[];
  reasoning: string;
}> => {
  console.log(`[shouldUseAgentToolsForEmptyRAG] query="${query}", language=${language}`);
  console.log(
    `[shouldUseAgentToolsForEmptyRAG] thinkAnalysis=`,
    JSON.stringify(thinkAnalysis, null, 2)
  );
  const systemPrompt =
    language === 'zh-Hans'
      ? `你是一个智能助手，分析用户查询是否需要从外部数据源获取信息。

当文档库中没有相关信息时，判断是否应该调用外部工具：

可用工具:
1. get_product_info - 获取产品规格、价格、描述信息
2. check_stock - 检查产品库存状态
3. search_code - 在GitHub代码库中搜索代码示例
4. get_github_repos - 获取GitHub仓库信息

判断逻辑:
- 价格/库存相关问题 → 使用 get_product_info 或 check_stock
- 代码/SDK/示例问题 → 使用 search_code
- GitHub相关 → 使用 get_github_repos
- 产品介绍/规格问题 → 使用 get_product_info
- 文档相关问题（如"查找文档"、"文档在哪里"）→ 不使用工具，直接返回未找到
- 其他一般性问题 → 不使用工具

返回JSON格式:
{
  "shouldUseTools": true/false,
  "suggestedTools": ["tool_name1", "tool_name2"],
  "reasoning": "简短说明原因"
}`
      : `You are an intelligent assistant analyzing if a query needs external data sources.

When documentation has no relevant information, determine if external tools should be used:

Available tools:
1. get_product_info - Get product specs, pricing, descriptions
2. check_stock - Check product stock status
3. search_code - Search code examples in GitHub
4. get_github_repos - Get GitHub repository info

Logic:
- Pricing/stock questions → get_product_info or check_stock
- Code/SDK/examples → search_code
- GitHub related → get_github_repos
- Product info/specs → get_product_info
- Documentation-related queries (like "find docs", "where are docs") → do NOT use tools, return not found
- General questions → no tools needed

Return JSON:
{
  "shouldUseTools": true/false,
  "suggestedTools": ["tool_name1", "tool_name2"],
  "reasoning": "Brief explanation"
}`;

  const userPrompt =
    language === 'zh-Hans'
      ? `用户查询: "${query}"\n意图分析: ${thinkAnalysis?.reasoning || '无'}`
      : `User query: "${query}"\nIntent analysis: ${thinkAnalysis?.reasoning || 'None'}`;

  try {
    const result = await chatCompletion({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.1,
      maxTokens: 200,
    });

    console.log(`[shouldUseAgentToolsForEmptyRAG] LLM result:`, result.content);

    const jsonMatch = result.content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      console.log(
        `[shouldUseAgentToolsForEmptyRAG] Parsed decision:`,
        JSON.stringify(parsed, null, 2)
      );
      return {
        shouldUseTools: parsed.shouldUseTools || false,
        suggestedTools: parsed.suggestedTools || [],
        reasoning: parsed.reasoning || '',
      };
    }
  } catch (error) {
    console.error('Tool decision analysis failed:', error);
  }

  console.log(`[shouldUseAgentToolsForEmptyRAG] Fallback: returning { shouldUseTools: false }`);
  return { shouldUseTools: false, suggestedTools: [], reasoning: 'Analysis failed' };
};

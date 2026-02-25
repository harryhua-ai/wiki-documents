/**
 * HyDE (Hypothetical Document Embedding) 查询扩展服务
 *
 * 核心思想：用假设答案的 embedding 检索，而非直接用查询
 * 目标：召回率 +15%
 */

import { generateEmbedding, streamChatCompletion } from './llm.js';
import { VectorStore, VectorSearchOptions, VectorSearchResult } from '../lib/vector.js';
import { featureFlags } from '../config/feature-flags.js';

/**
 * HyDE 查询扩展
 * 使用 LLM 生成假设答案，返回假设答案列表
 *
 * @param query 原始查询
 * @param language 查询语言
 * @returns 扩展后的查询列表（假设答案）
 */
export async function hydeExpansion(
  query: string,
  language: 'en' | 'zh-Hans' = 'en'
): Promise<string[]> {
  if (!featureFlags.enableHyDE) {
    return [query];
  }

  const prompt = language === 'zh-Hans'
    ? `基于以下问题，生成一个简洁的假设性答案（50-100字）：

问题：${query}

假设性答案：`
    : `Generate a concise hypothetical answer (50-100 words) to the following question:

Question: ${query}

Hypothetical answer:`;

  try {
    const response = await streamChatCompletion({
      messages: [
        { role: 'system', content: 'You are a helpful assistant that generates hypothetical answers to improve search results.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.3,
      maxTokens: 200,
    });

    let hypotheticalAnswer = '';
    for await (const chunk of response) {
      if (typeof chunk === 'string') {
        hypotheticalAnswer += chunk;
      }
    }

    if (hypotheticalAnswer.trim().length > 10) {
      console.log(`[HyDE] Generated hypothetical answer: "${hypotheticalAnswer.substring(0, 50)}..."`);
      return [hypotheticalAnswer.trim(), query]; // 返回假设答案和原始查询
    } else {
      console.log(`[HyDE] Generated answer too short, using original query`);
      return [query];
    }
  } catch (error: any) {
    console.error(`[HyDE] Failed to generate hypothetical answer:`, error?.message || error);
    return [query];
  }
}

/**
 * HyDE 检索结果
 */
export interface HyDEResult extends VectorSearchResult {
  /** 假设答案 */
  hypotheticalAnswer?: string;

  /** 是否使用了 HyDE */
  usedHyDE: boolean;
}

/**
 * 生成假设答案
 *
 * @param query 用户查询
 * @returns 假设答案
 */
async function generateHypotheticalAnswer(query: string): Promise<string> {
  // 简化实现：使用模板生成假设答案
  // 实际实现中应该调用 LLM 生成

  const templates = {
    specification: `${query} 的典型值是在标准工作条件下测量的参数。具体数值请参考产品技术文档。`,
    general: `${query} 相关信息可以在产品文档中找到详细说明。`,
    comparison: `${query} 的对比分析需要考虑多个维度的差异，包括性能、功能和应用场景。`,
  };

  // 简单的关键词匹配
  if (query.includes('功耗') || query.includes('功率') || query.includes('电压')) {
    return templates.specification;
  } else if (query.includes('对比') || query.includes('比较') || query.includes('区别')) {
    return templates.comparison;
  } else {
    return templates.general;
  }
}

/**
 * 执行 HyDE 检索
 *
 * @param vectorStore 向量存储实例
 * @param query 用户查询
 * @param options 检索选项
 * @returns HyDE 检索结果
 */
export async function hydeRetrieval(
  vectorStore: VectorStore,
  query: string,
  options: VectorSearchOptions = {}
): Promise<HyDEResult[]> {
  // 1. 检查是否启用 HyDE
  if (!featureFlags.enableHyDE) {
    console.log('[HyDE] Disabled, using standard search');

    // 降级为标准检索
    const queryEmbedding = await generateEmbedding(query);
    const results = await vectorStore.search(queryEmbedding, options);

    return results.map((result) => ({
      ...result,
      usedHyDE: false,
    }));
  }

  // 2. 生成假设答案
  console.log('[HyDE] Generating hypothetical answer...');
  const hypotheticalAnswer = await generateHypotheticalAnswer(query);
  console.log('[HyDE] Hypothetical answer:', hypotheticalAnswer.slice(0, 100) + '...');

  // 3. 用假设答案生成 embedding
  const hypotheticalEmbedding = await generateEmbedding(hypotheticalAnswer);

  // 4. 用假设答案的 embedding 检索
  console.log('[HyDE] Searching with hypothetical embedding...');
  const results = await vectorStore.search(hypotheticalEmbedding, options);

  // 5. 添加 HyDE 元数据
  return results.map((result) => ({
    ...result,
    hypotheticalAnswer,
    usedHyDE: true,
  }));
}

/**
 * 批量 HyDE 检索
 *
 * @param vectorStore 向量存储实例
 * @param queries 用户查询列表
 * @param options 检索选项
 * @returns 批量检索结果
 */
export async function batchHydeRetrieval(
  vectorStore: VectorStore,
  queries: string[],
  options: VectorSearchOptions = {}
): Promise<HyDEResult[][]> {
  const results = await Promise.all(
    queries.map((query) => hydeRetrieval(vectorStore, query, options))
  );

  return results;
}

/**
 * 条件性 HyDE 检索
 *
 * 仅在低置信度时启用 HyDE
 *
 * @param vectorStore 向量存储实例
 * @param query 用户查询
 * @param confidence 初始检索的置信度
 * @param options 检索选项
 * @returns HyDE 检索结果
 */
export async function conditionalHydeRetrieval(
  vectorStore: VectorStore,
  query: string,
  confidence: number,
  options: VectorSearchOptions = {}
): Promise<HyDEResult[]> {
  // 如果置信度高，跳过 HyDE
  if (confidence >= featureFlags.hydeConfidenceThreshold) {
    console.log('[HyDE] Skipping due to high confidence:', confidence);

    const queryEmbedding = await generateEmbedding(query);
    const results = await vectorStore.search(queryEmbedding, options);

    return results.map((result) => ({
      ...result,
      usedHyDE: false,
    }));
  }

  // 置信度低，使用 HyDE
  console.log('[HyDE] Using HyDE due to low confidence:', confidence);
  return hydeRetrieval(vectorStore, query, options);
}

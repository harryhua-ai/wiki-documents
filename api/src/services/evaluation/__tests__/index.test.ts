/**
 * Ragas 评估服务测试
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { evaluateRAG, checkRagasHealth, clearCache } from '../index';
import type { RagasEvaluationRequest } from '../types';

describe('Ragas Evaluation Service', () => {
  beforeAll(() => {
    // 清除缓存
    clearCache();
  });

  afterAll(() => {
    clearCache();
  });

  describe('evaluateRAG', () => {
    it('应该成功评估高质量的 RAG 回答', async () => {
      const request: RagasEvaluationRequest = {
        query: 'NE301 的功耗是多少？',
        answer: '根据文档，NE301 的典型功耗为 2.5W，支持低功耗模式可降至 0.5W。',
        context: [
          'NE301 设备功耗说明：典型功耗为 2.5W，低功耗模式下功耗为 0.5W。',
          'NE301 支持多种电源管理模式，包括正常模式和低功耗模式。',
        ],
      };

      const response = await evaluateRAG(request);

      expect(response.success).toBe(true);
      expect(response.metrics.faithfulness).toBeGreaterThan(0.7);
      expect(response.metrics.answer_relevancy).toBeGreaterThan(0.7);
      expect(response.metrics.context_recall).toBeGreaterThan(0.7);
      expect(response.metrics.context_precision).toBeGreaterThan(0.7);
      expect(response.latency_ms).toBeGreaterThan(0);
    });

    it('应该检测到低忠实度的回答', async () => {
      const request: RagasEvaluationRequest = {
        query: 'NE301 的功耗是多少？',
        answer: 'NE301 是一款高性能设备，支持多种功能。', // 未回答功耗问题
        context: [
          'NE301 设备功耗说明：典型功耗为 2.5W。',
        ],
      };

      const response = await evaluateRAG(request);

      expect(response.success).toBe(true);
      expect(response.metrics.faithfulness).toBeLessThan(0.5);
    });

    it('应该处理空上下文', async () => {
      const request: RagasEvaluationRequest = {
        query: '测试查询',
        answer: '测试答案',
        context: [],
      };

      const response = await evaluateRAG(request);

      expect(response.success).toBe(true);
      expect(response.metrics.context_recall).toBe(0);
      expect(response.metrics.context_precision).toBe(0);
    });

    it('应该使用缓存', async () => {
      const request: RagasEvaluationRequest = {
        query: '缓存测试',
        answer: '测试缓存',
        context: ['测试上下文'],
      };

      // 第一次调用
      const response1 = await evaluateRAG(request);
      expect(response1.success).toBe(true);

      // 第二次调用（应该使用缓存）
      const response2 = await evaluateRAG(request, { enableCache: true });
      expect(response2.success).toBe(true);
      // 缓存的响应应该更快
      expect(response2.latency_ms).toBeLessThanOrEqual(response1.latency_ms);
    });

    it('应该禁用缓存', async () => {
      const request: RagasEvaluationRequest = {
        query: '禁用缓存测试',
        answer: '测试',
        context: ['测试'],
      };

      const response = await evaluateRAG(request, { enableCache: false });
      expect(response.success).toBe(true);
    });
  });

  describe('checkRagasHealth', () => {
    it('应该检查服务健康状态', async () => {
      // 注意：这个测试需要 Ragas 服务运行
      const isHealthy = await checkRagasHealth();
      // 如果服务未运行，测试可能会失败
      // 在 CI 环境中，可以 mock 这个测试
      console.log('Ragas service health:', isHealthy);
    });
  });

  describe('缓存管理', () => {
    it('应该清除缓存', () => {
      clearCache();
      // 清除后缓存应该为空
      // 可以通过 getCacheStats() 验证
    });
  });
});

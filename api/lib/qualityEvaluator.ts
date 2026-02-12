import { RetrievalResult, EvaluationResult, RoutingPath } from './types';

// 定义 LLM 客户端接口，后续在 llm.ts 中实现
export interface LLMClient {
  checkSufficiency(query: string, context: string): Promise<boolean>;
}

export class QualityEvaluator {
  private llm: LLMClient;

  constructor(llmClient: LLMClient) {
    this.llm = llmClient;
  }

  /**
   * 评估检索结果质量，决定路由路径
   * @param query 用户问题
   * @param results 检索到的文档片段
   */
  async evaluate(query: string, results: RetrievalResult[]): Promise<EvaluationResult> {
    // ---------------------------------------------------------
    // 第一层：硬规则 (Hard Rules) - 零延迟
    // ---------------------------------------------------------

    // 场景 A: 根本没搜到结果 -> 必须升级 Agent 尝试其他搜索策略
    if (!results || results.length === 0) {
      return {
        path: 'AGENT_PATH',
        reason: '无检索结果',
        confidence: 1.0
      };
    }

    const topScore = results[0].score;

    // 场景 B: 命中率极低 (< 0.5) -> 可能是关键词不匹配，升级 Agent 进行 Query 改写
    if (topScore < 0.5) {
      return {
        path: 'AGENT_PATH',
        reason: `Top-1 相似度过低 (${topScore.toFixed(2)})`,
        confidence: 1.0
      };
    }

    // 场景 C: 命中率极高 (> 0.85) -> 几乎肯定是原文档，直接走快速路径
    if (topScore > 0.85) {
      return {
        path: 'FAST_PATH',
        reason: `Top-1 相似度极高 (${topScore.toFixed(2)})`,
        confidence: 0.95
      };
    }

    // ---------------------------------------------------------
    // 第二层：LLM 语义裁判 (Model Check) - 轻量级
    // ---------------------------------------------------------
    // 分数在 0.5 - 0.85 之间，属于"模糊地带"。
    // 可能是相关文档，也可能是只包含关键词但内容无关的文档。
    // 需要消耗一次轻量级 LLM 调用来判断。

    try {
      // 拼接上下文供裁判阅读
      const contextText = results
        .slice(0, 3)
        .map((r, i) => `[片段${i + 1}]: ${r.content}`)
        .join('\n\n');

      console.log(`[Evaluator] 进入语义裁判阶段 (Score: ${topScore.toFixed(2)})`);

      const isSufficient = await this.llm.checkSufficiency(query, contextText);

      if (isSufficient) {
        return {
          path: 'FAST_PATH',
          reason: 'LLM 判定上下文包含足够信息',
          confidence: 0.8
        };
      } else {
        return {
          path: 'AGENT_PATH',
          reason: 'LLM 判定上下文缺失关键信息',
          confidence: 0.8
        };
      }
    } catch (error) {
      console.error('[Evaluator] LLM 裁判服务异常:', error);
      // 降级策略：如果裁判挂了，分数还行就放行，否则保守一点
      const fallbackPath: RoutingPath = topScore > 0.7 ? 'FAST_PATH' : 'AGENT_PATH';
      return {
        path: fallbackPath,
        reason: `裁判异常，执行降级策略 (Score: ${topScore.toFixed(2)})`,
        confidence: 0.5
      };
    }
  }
}

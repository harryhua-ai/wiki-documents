#!/usr/bin/env python3
"""
Ragas 评估服务器

提供 RAG 质量评估 API，计算以下指标：
- Faithfulness（忠实度）：答案是否基于上下文
- Answer Relevancy（答案相关性）：答案与问题的相关程度
- Context Recall（上下文召回率）：检索到的上下文覆盖度
- Context Precision（上下文精确度）：检索到的上下文精确度

依赖安装：
pip install ragas openai fastapi uvicorn

启动服务：
python ragas-server.py --port 8000
"""

import argparse
import logging
import time
from typing import List, Dict, Any
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import uvicorn

# 配置日志
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="Ragas Evaluation Service", version="1.0.0")


class EvaluationRequest(BaseModel):
    """评估请求"""
    query: str
    answer: str
    context: List[str]


class EvaluationResponse(BaseModel):
    """评估响应"""
    metrics: Dict[str, float]
    latency_ms: int
    success: bool
    error: str = None


def calculate_faithfulness(answer: str, context: List[str]) -> float:
    """
    计算忠实度（简化版本）

    实际应用中应使用 LLM 判断答案是否基于上下文
    这里使用简化的关键词匹配作为示例
    """
    if not answer or not context:
        return 0.0

    # 简化实现：检查答案中的关键词是否出现在上下文中
    answer_words = set(answer.lower().split())
    context_words = set(' '.join(context).lower().split())

    if not answer_words:
        return 0.0

    overlap = answer_words & context_words
    return min(len(overlap) / len(answer_words), 1.0)


def calculate_answer_relevancy(query: str, answer: str) -> float:
    """
    计算答案相关性（简化版本）

    实际应用中应使用 embedding 相似度
    这里使用简化的关键词匹配
    """
    if not query or not answer:
        return 0.0

    query_words = set(query.lower().split())
    answer_words = set(answer.lower().split())

    if not query_words:
        return 0.0

    overlap = query_words & answer_words
    return min(len(overlap) / len(query_words), 1.0)


def calculate_context_recall(query: str, context: List[str]) -> float:
    """
    计算上下文召回率（简化版本）

    检查查询中的关键词是否被上下文覆盖
    """
    if not query or not context:
        return 0.0

    query_words = set(query.lower().split())
    context_words = set(' '.join(context).lower().split())

    if not query_words:
        return 0.0

    overlap = query_words & context_words
    return min(len(overlap) / len(query_words), 1.0)


def calculate_context_precision(query: str, context: List[str]) -> float:
    """
    计算上下文精确度（简化版本）

    检查上下文中与查询相关的内容比例
    """
    if not query or not context:
        return 0.0

    query_words = set(query.lower().split())

    relevant_chunks = 0
    for chunk in context:
        chunk_words = set(chunk.lower().split())
        if query_words & chunk_words:
            relevant_chunks += 1

    return relevant_chunks / len(context) if context else 0.0


@app.post("/evaluate", response_model=EvaluationResponse)
async def evaluate_rag(request: EvaluationRequest):
    """
    评估 RAG 质量

    返回四个核心指标的评分
    """
    start_time = time.time()

    try:
        logger.info(f"Evaluating query: {request.query[:50]}...")

        # 计算指标
        faithfulness = calculate_faithfulness(request.answer, request.context)
        answer_relevancy = calculate_answer_relevancy(request.query, request.answer)
        context_recall = calculate_context_recall(request.query, request.context)
        context_precision = calculate_context_precision(request.query, request.context)

        latency_ms = int((time.time() - start_time) * 1000)

        metrics = {
            "faithfulness": round(faithfulness, 2),
            "answer_relevancy": round(answer_relevancy, 2),
            "context_recall": round(context_recall, 2),
            "context_precision": round(context_precision, 2)
        }

        logger.info(f"Evaluation complete: {metrics}")

        return EvaluationResponse(
            metrics=metrics,
            latency_ms=latency_ms,
            success=True
        )

    except Exception as e:
        logger.error(f"Evaluation failed: {str(e)}")
        latency_ms = int((time.time() - start_time) * 1000)

        return EvaluationResponse(
            metrics={},
            latency_ms=latency_ms,
            success=False,
            error=str(e)
        )


@app.get("/health")
async def health_check():
    """健康检查"""
    return {"status": "ok", "service": "ragas-evaluation"}


def main():
    parser = argparse.ArgumentParser(description="Ragas Evaluation Server")
    parser.add_argument("--port", type=int, default=8000, help="Server port")
    parser.add_argument("--host", type=str, default="127.0.0.1", help="Server host")
    args = parser.parse_args()

    logger.info(f"Starting Ragas Evaluation Server on {args.host}:{args.port}")
    uvicorn.run(app, host=args.host, port=args.port)


if __name__ == "__main__":
    main()

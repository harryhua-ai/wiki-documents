import type { Request, Response } from 'express';
import { llmConfig } from '../config/index.js';
import { getVectorStoreStats } from '../services/rag.js';

// ============================================================================
// GET /api/config
// ============================================================================

export const handleConfig = async (_req: Request, res: Response): Promise<void> => {
  const vectorStats = await getVectorStoreStats();

  res.json({
    suggested_questions: [
      'What is NeoEyes NE301?',
      'How do I install NeoEdge NG4500?',
      'What AI models are supported?',
      'NE101 vs NE301 comparison',
    ],
    model_info: llmConfig.primary.model,
    features: {
      agent_enabled: true,
      streaming_enabled: true,
      feedback_enabled: true,
      multilingual: true,
    },
    limits: {
      max_message_length: 2000,
      max_history_length: 10,
    },
    vector_store: {
      document_count: vectorStats.documentCount,
    },
    version: '1.0.0',
  });
};

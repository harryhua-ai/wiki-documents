import { z } from 'zod';
import type { Request, Response } from 'express';
import { feedbackOps } from '../lib/db.js';

// ============================================================================
// Validation Schema
// ============================================================================

const feedbackRequestSchema = z.object({
  conversation_id: z.string().uuid(),
  message_id: z.string().uuid(),
  rating: z.enum(['positive', 'negative']),
  comment: z.string().max(500).optional(),
});

// ============================================================================
// POST /api/feedback
// ============================================================================

export const handleFeedback = async (req: Request, res: Response): Promise<void> => {
  try {
    // Validate request body
    const body = feedbackRequestSchema.parse(req.body);

    // Store feedback
    const feedback = feedbackOps.create(body.message_id, body.rating, body.comment);

    res.json({
      success: true,
      id: feedback.id,
    });
  } catch (error) {
    console.error('Feedback endpoint error:', error);

    if (error instanceof z.ZodError) {
      res.status(400).json({
        success: false,
        error: 'Invalid request: ' + error.errors[0].message,
      });
    } else {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to store feedback',
      });
    }
  }
};

// ============================================================================
// GET /api/feedback/stats
// ============================================================================

export const getFeedbackStats = async (_req: Request, res: Response): Promise<void> => {
  try {
    const stats = feedbackOps.getStats();

    res.json({
      total: stats.total,
      positive: stats.positive,
      negative: stats.negative,
      positive_rate: stats.total > 0 ? stats.positive / stats.total : 0,
    });
  } catch (error) {
    console.error('Feedback stats error:', error);
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Failed to get feedback stats',
    });
  }
};

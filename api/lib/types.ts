export interface RetrievalResult {
  content: string;
  score: number; // 0.0 to 1.0
  metadata: {
    source: string;
    title: string;
    [key: string]: any;
  };
}

export type RoutingPath = 'FAST_PATH' | 'AGENT_PATH';

export interface EvaluationResult {
  path: RoutingPath;
  reason: string;
  confidence: number; // 0.0 to 1.0
}

export interface AgentContext {
  query: string;
  history: Array<{ role: 'user' | 'assistant'; content: string }>;
  retrievedDocs: RetrievalResult[];
  attemptCount: number;
}

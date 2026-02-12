# Ask AI Backend API

Backend service for the CamThink Wiki Ask AI feature. Implements RAG-based question answering with agent orchestration.

## Features

- **SSE Streaming**: Real-time response streaming for chat interactions
- **Agent Orchestration**: Dual-path architecture (fast vs. agent path)
- **Multi-LLM Support**: Provider abstraction with automatic fallback
- **RAG Pipeline**: Vector-based document retrieval with context assembly
- **Feedback Collection**: User rating system for quality monitoring
- **Rate Limiting**: Built-in request throttling

## Prerequisites

- Node.js 18+
- SQLite3 (included via better-sqlite3)

## Installation

```bash
# Install dependencies
npm install

# Copy environment template
cp .env.example .env

# Edit .env with your API keys
nano .env
```

## Configuration

Edit `.env` and configure:

1. **LLM Provider Keys**: Get API keys from [DeepSeek](https://platform.deepseek.com/) or [Zhipu AI](https://open.bigmodel.cn/)
2. **Embedding Key**: Get free API key from [SiliconFlow](https://api.siliconflow.cn/)
3. **CORS Origin**: Set to your frontend URL

## Development

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

## API Endpoints

### POST /api/chat

Main chat endpoint with SSE streaming.

**Request:**
```json
{
  "session_id": "uuid-v4",
  "message": "How do I configure NeoEdge?",
  "language": "en",
  "history": [
    {"role": "user", "content": "..."},
    {"role": "assistant", "content": "..."}
  ]
}
```

**SSE Events:**
- `routing` - Fast or agent path selection
- `progress` - Agent progress updates (agent path only)
- `chunk` - Response content chunks
- `sources` - Document references
- `done` - Response complete

### POST /api/feedback

Submit feedback for AI responses.

**Request:**
```json
{
  "conversation_id": "uuid-v4",
  "message_id": "uuid-v4",
  "rating": "positive",
  "comment": "Very helpful!"
}
```

### GET /api/config

Public configuration endpoint.

**Response:**
```json
{
  "suggested_questions": ["What is NeoEyes?"],
  "model_info": "DeepSeek-V3",
  "features": { "agent_enabled": true }
}
```

## Project Structure

```
api/
├── src/
│   ├── index.ts           # Express server setup
│   ├── routes/
│   │   ├── chat.ts        # Chat endpoint with SSE
│   │   ├── feedback.ts    # Feedback storage
│   │   └── config.ts      # Public config endpoint
│   ├── services/
│   │   ├── llm.ts         # LLM provider abstraction
│   │   ├── rag.ts         # RAG pipeline
│   │   └── history.ts     # Session management
│   ├── lib/
│   │   ├── db.ts          # Database connection
│   │   └── sse.ts         # SSE utilities
│   ├── types/
│   │   └── index.ts       # TypeScript types
│   ├── config/
│   │   └── prompts.ts     # System prompts
│   └── scripts/
│       └── ingest.ts      # Document indexing
├── package.json
├── tsconfig.json
└── .env.example
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | 3001 |
| `HOST` | Server host | 127.0.0.1 |
| `DEEPSEEK_API_KEY` | DeepSeek API key | Required |
| `ZHIPU_API_KEY` | Zhipu AI API key | Optional |
| `EMBEDDING_API_KEY` | Embedding API key | Required |
| `DATABASE_PATH` | SQLite database path | ./data/chat.db |
| `RATE_LIMIT_MAX_REQUESTS` | Requests per window | 10 |

## License

MIT


import { retrieve } from '../services/rag.js';
import { vectorStore } from '../services/rag.js';

// Golden Dataset: Ground truth Q&A pairs to evaluate retrieval
const GOLDEN_DATASET = [
  {
    query: "What is the NE101 camera?",
    expectedDocTitle: "NE101 Overview",
    expectedKeywords: ["modular", "ESP32-S3", "camera"]
  },
  {
    query: "Does NE301 support YOLO?",
    expectedDocTitle: "NE301 AI Features",
    expectedKeywords: ["YOLO", "STM32N6", "NPU"]
  },
  {
    query: "How much does the NG4500 cost?",
    expectedDocTitle: "NG4500 Pricing", // Hypothetical doc
    expectedKeywords: ["price", "cost", "Jetson"]
  },
  {
    query: "Can I use Python with AIToolStack?",
    expectedDocTitle: "AIToolStack SDK",
    expectedKeywords: ["Python", "SDK", "inference"]
  }
];

async function evaluate() {
  console.log("Starting RAG Evaluation...");

  // Ensure vector store is loaded
  await vectorStore.init();

  let totalScore = 0;
  let retrievalCount = 0;

  for (const item of GOLDEN_DATASET) {
    console.log(`\nEvaluating Query: "${item.query}"`);
    const startTime = Date.now();

    // Perform retrieval (Top 5)
    const result = await retrieve(item.query, { topK: 5 });
    const duration = Date.now() - startTime;

    // Check if expected document is in top K
    const foundDoc = result.chunks.find(chunk =>
      chunk.metadata.doc_title.includes(item.expectedDocTitle) ||
      chunk.content.includes(item.expectedKeywords[0]) // Fallback check
    );

    const isSuccess = !!foundDoc;
    const score = isSuccess ? 1 : 0;
    totalScore += score;
    retrievalCount++;

    console.log(`  - Found: ${isSuccess ? "✅" : "❌"}`);
    console.log(`  - Latency: ${duration}ms`);
    if (foundDoc) {
      console.log(`  - Match: ${foundDoc.metadata.doc_title}`);
    } else {
      console.log(`  - Top Result: ${result.chunks[0]?.metadata.doc_title || "None"}`);
    }
  }

  const accuracy = (totalScore / retrievalCount) * 100;
  console.log(`\n========================================`);
  console.log(`Evaluation Complete`);
  console.log(`Accuracy (Recall@5): ${accuracy.toFixed(1)}%`);
  console.log(`========================================`);
}

// Run evaluation if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  evaluate().catch(console.error);
}

export { evaluate };

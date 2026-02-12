#!/usr/bin/env node

/**
 * End-to-End Tests for CamThink Wiki Ask AI Feature
 *
 * Tests critical user flows including:
 * - RAG retrieval and relevance scoring
 * - Agent tool triggering (product info, stock, code search)
 * - SSE event streaming (routing, progress, chunk, sources, done)
 * - Mock fallback mechanism
 * - Bilingual support
 */

const API = "http://127.0.0.1:3001";
const FRONTEND = "http://localhost:3000";

async function healthCheck() {
  const resp = await fetch(API + "/health");
  const data = await resp.json();
  return data.status === "ok";
}

async function testChat(query, options = {}) {
  const start = Date.now();
  const resp = await fetch(API + "/api/chat", {
    method: "POST",
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify({
      message: query,
      session_id: options.session_id || "00000000-0000-0000-0000-000000000001",
      language: options.language || "en"
    })
  });

  let content = "";
  let sources = [];
  let routingPath = null;
  let toolCalls = [];
  let progressSteps = [];

  // Read stream as text
  const text = await resp.text();
  const lines = text.split("\n");

  for (const line of lines) {
    if (line.startsWith("data:")) {
      try {
        const data = JSON.parse(line.slice(5));

        // Track routing path
        if (data.type === "routing") {
          routingPath = data.path;
        }

        // Track agent tool calls
        if (data.type === "tool_call") {
          toolCalls.push({
            tool: data.tool,
            status: data.status
          });
        }

        // Track progress steps
        if (data.type === "progress") {
          progressSteps.push(data.step);
        }

        if (data.type === "chunk") {
          content += data.content;
        } else if (data.type === "sources") {
          sources = data.sources || [];
        } else if (data.type === "done") {
          break;
        } else if (data.type === "error") {
          throw new Error(data.data.message || "API Error");
        }
      } catch (e) {
        // Skip invalid JSON
      }
    }
  }

  return {
    content,
    sources,
    routingPath,
    toolCalls,
    progressSteps,
    duration: Date.now() - start
  };
}

const tests = [
  // Original tests
  { name: "A1 - Low relevance", query: "weather sensor", expect: "0-2 sources", validate: r => r.sources?.length <= 2 },
  { name: "A2 - High relevance", query: "NE301 install", expect: "sources > 0.55", validate: r => r.sources?.length > 0 && r.sources.some(s => (s.score || 0) > 0.55) },
  { name: "B1 - Dedup", query: "Quick Start", expect: "unique URLs", validate: r => !r.sources || new Set(r.sources.map(s => s.url?.split("#")[0])).size === r.sources.length },
  { name: "C1 - Not found", query: "unknown docs", expect: "not found phrase", validate: r => /cannot find/i.test(r.content.toLowerCase()) },

  // NEW: Product info scraping tests
  { name: "D1 - Product price query", query: "NE101 price", expect: "tool: get_product_info", validate: r => /\$149\.00/.test(r.content) && /product/i.test(r.content.toLowerCase()) },
  { name: "D2 - Product availability", query: "NG4500 stock", expect: "tool: check_stock", validate: r => /in stock|available/i.test(r.content) },

  // NEW: Code search tests
  { name: "E1 - GitHub code search", query: "NE301 code examples", expect: "tool: search_code", validate: r => /github\.com/i.test(r.content) && /code|example/i.test(r.content.toLowerCase()) },
  { name: "E2 - Repository info", query: "GitHub repositories", expect: "tool: get_repo_info", validate: r => /repository|repo/i.test(r.content) },

  // NEW: Fallback mechanism test
  { name: "F1 - Mock fallback", query: "XYZ999999 price", expect: "fallback to mock or not found", validate: r => /cannot find|not available|no information/i.test(r.content.toLowerCase()) },

  // NEW: Bilingual support
  { name: "G1 - Chinese query", query: "NE101 价格", expect: "Chinese response", validate: r => /[\u4e00-\u9fa5]/.test(r.content) && /\$149\.00|\$149/.test(r.content), language: "zh-Hans" },
];

async function runTest(t) {
  try {
    console.log("\n\x1b[36mTest: " + t.name + "\x1b[0m");
    console.log("Query: " + t.query);
    console.log("Expected: " + t.expect);

    const r = await testChat(t.query, t.options);
    const passed = t.validate(r);
    const status = passed ? "PASS" : "FAIL";
    const color = passed ? "\x1b[32m" : "\x1b[31m";

    console.log("Status: " + color + status + "\x1b[0m");
    console.log("Duration: " + r.duration + "ms");

    // Show routing path if available
    if (r.routingPath) {
      console.log("Routing: " + r.routingPath + " path");
    }

    // Show tool calls if any
    if (r.toolCalls && r.toolCalls.length > 0) {
      console.log("Tools: " + r.toolCalls.map(tc => tc.tool).join(", "));
    }

    // Show progress steps if any
    if (r.progressSteps && r.progressSteps.length > 0) {
      console.log("Progress: " + r.progressSteps.length + " steps");
      r.progressSteps.forEach((step, i) => {
        console.log("  " + (i+1) + ". " + step);
      });
    }

    console.log("Sources: " + (r.sources?.length || 0));

    if (r.sources?.length > 0) {
      console.log("Sources:");
      r.sources.forEach((s, i) => {
        console.log("  [" + (i+1) + "]. " + s.title);
        console.log("       URL: " + s.url);
        console.log("       Score: " + (s.score || 0));
      });
    }

    return {
      name: t.name,
      status,
      duration: r.duration,
      details: passed ? "Passed" : "Failed: " + (t.validate(r).details || "Validation failed"),
      sources: r.sources
    };
  } catch (e) {
    return { name: t.name, status: "FAIL", duration: 0, details: e.message || "Error" };
  }
}

async function main() {
  console.log("\x1b[36m=== Ask AI E2E Tests ===\x1b[0m");
  console.log("API: " + API);
  console.log("Frontend: " + FRONTEND);
  console.log("");

  const isHealthy = await healthCheck();
  if (!isHealthy) {
    console.log("\x1b[31mAPI not healthy\x1b[0m");
    process.exit(1);
  }

  const results = [];
  for (const t of tests) {
    const r = await runTest(t);
    results.push(r);
    // Add delay between tests to avoid rate limiting
    await new Promise(res => setTimeout(res, 500));
  }

  const passed = results.filter(r => r.status === "PASS").length;
  const failedResults = results.filter(r => r.status === "FAIL");
  const failed = failedResults.length;

  console.log("\n\x1b[36m=== Summary ===\x1b[0m");
  console.log("Total: " + results.length);
  console.log("Passed: " + passed);
  console.log("Failed: " + failed);

  if (failed > 0) {
    console.log("\n\x1b[31mFailed Tests:\x1b[0m");
    failedResults.forEach(t => console.log("  * " + t.name + ": " + t.details));
  }

  const durations = results.filter(r => r.status === "PASS").map(r => r.duration);
  const avg = durations.reduce((a,b) => a+b, 0) / durations.length;
  const p95 = durations.sort((a,b) => a-b)[Math.floor(durations.length * 0.95)] || 0;

  console.log("\nResponse Time:");
  console.log("Average: " + avg.toFixed(0) + "ms");
  console.log("P95: " + p95.toFixed(0) + "ms");
  console.log("Target: <3000ms (allow for tool calls)");
  console.log("Status: " + (avg < 3000 ? "\x1b[32mPASS\x1b[0m" : "\x1b[31mFAIL\x1b[0m"));

  console.log("\nManual testing: " + FRONTEND);
  process.exit(failed > 0 ? 1 : 0);
}

main().catch(e => {
  console.error("Fatal:", e);
  process.exit(1);
});

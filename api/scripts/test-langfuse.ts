#!/usr/bin/env node
/**
 * Manual test script for Langfuse integration
 *
 * This script tests the Langfuse integration without requiring actual API credentials.
 * Run with: node scripts/test-langfuse.ts
 */

import { getLangfuseClient, shutdownLangfuse, createTrace, trackLLMGeneration, trackError } from '../src/lib/langfuse.js';

console.log('=== Langfuse Integration Manual Test ===\n');

// Test 1: Client without credentials
console.log('Test 1: Get client without credentials');
const client1 = getLangfuseClient();
console.log('✓ Result:', client1 === null ? 'PASS (returns null)' : 'UNEXPECTED');
console.log('');

// Test 2: Client with mock credentials
console.log('Test 2: Get client with mock credentials');
process.env.LANGFUSE_PUBLIC_KEY = 'pk-test-mock-key';
process.env.LANGFUSE_SECRET_KEY = 'sk-test-mock-secret';

const client2 = getLangfuseClient();
console.log('✓ Client initialized:', client2 ? 'YES' : 'NO (may fail in test env)');
console.log('');

// Test 3: Create a trace
console.log('Test 3: Create trace');
const trace = createTrace('manual_test', 'test-user', { test: true });
console.log('✓ Trace created:', trace ? 'YES' : 'NO');
console.log('');

// Test 4: Track LLM generation
console.log('Test 4: Track LLM generation');
const generation = trackLLMGeneration('test_generation', {
  model: 'test-model',
  prompt: 'Test prompt',
  completion: 'Test response',
  latencyMs: 100,
  tokensUsed: { prompt: 10, completion: 20, total: 30 },
});
console.log('✓ Generation tracked:', generation.trace ? 'YES' : 'NO');
console.log('');

// Test 5: Track error
console.log('Test 5: Track error');
if (trace) {
  trackError(trace, 'Test error', { code: 'TEST_ERROR' });
  console.log('✓ Error tracked');
} else {
  console.log('✓ Error tracking skipped (no trace)');
}
console.log('');

// Test 6: Shutdown
console.log('Test 6: Shutdown');
await shutdownLangfuse();
console.log('✓ Shutdown complete');
console.log('');

console.log('=== All Tests Completed ===');
console.log('\nNote: Some tests may show "NO" if Langfuse client failed to initialize');
console.log('This is expected in test environments without valid credentials.\n');

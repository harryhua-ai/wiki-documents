#!/usr/bin/env node
/**
 * Test script for Task #8: Multi-language Retrieval
 *
 * Tests that Chinese queries return Chinese docs
 * and English queries return English docs
 */

import http from 'http';

const API_URL = 'http://localhost:3001';
const CHAT_ENDPOINT = '/api/chat';

// Test cases
const TEST_CASES = [
  {
    name: 'VT1: 中文查询',
    query: '如何配置 NeoEdge 设备？',
    expectedLanguage: 'zh-Hans',
    expectedDocPrefix: '/docs/',
  },
  {
    name: 'VT2: 英文查询',
    query: 'How to configure NeoEdge device?',
    expectedLanguage: 'en',
    expectedDocPrefix: '/en/docs/',
  },
  {
    name: 'VT3: 中英混合查询（检测中文）',
    query: 'What is NG4500规格?', // 包含中文"规格"
    expectedLanguage: 'zh-Hans',
    expectedDocPrefix: '/docs/',
  },
];

function postChatRequest(query) {
  return new Promise((resolve) => {
    const postData = JSON.stringify({
      message: query,
      language: 'en', // Let backend detect
    });

    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData),
      },
    };

    const req = http.request(`${API_URL}${CHAT_ENDPOINT}`, options, (res) => {
      let sourcesFound = false;

      res.on('data', (chunk) => {
        // Parse SSE events
        const lines = chunk.toString().split('\n');
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const jsonData = line.slice(6);
            try {
              const event = JSON.parse(jsonData);

              // Check for sources event - format is {type, sources}
              if (event.type === 'sources') {
                sourcesFound = true;
                resolve({
                  sources: event.sources || [],
                });
              }
            } catch (e) {
              // Skip invalid JSON
            }
          }
        }
      });

      res.on('end', () => {
        if (!sourcesFound) {
          resolve({ sources: [] });
        }
      });

      // Timeout after 30 seconds
      setTimeout(() => {
        resolve({ sources: [], timeout: true });
      }, 30000);
    });

    req.on('error', () => {
      resolve({ sources: [], error: true });
    });

    req.write(postData);
    req.end();
  });
}

async function runTest(testCase) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`📋 ${testCase.name}`);
  console.log(`${'='.repeat(60)}`);
  console.log(`Query: "${testCase.query}"`);
  console.log(`Expected Language: ${testCase.expectedLanguage}`);
  console.log(`Expected URL Prefix: ${testCase.expectedDocPrefix}`);

  const result = await postChatRequest(testCase.query);

  if (result.timeout) {
    console.log('⏱️  TIMEOUT: Request timed out after 30s');
    return false;
  }

  if (result.error) {
    console.log('❌ ERROR: Request failed');
    return false;
  }

  if (!result.sources || result.sources.length === 0) {
    console.log('❌ FAIL: No sources returned');
    return false;
  }

  const sources = result.sources;
  console.log(`\n📄 Retrieved ${sources.length} sources:`);

  // Check each source
  let passCount = 0;
  let failCount = 0;

  for (let i = 0; i < sources.length; i++) {
    const source = sources[i];
    const urlMatches = source.url && source.url.startsWith(testCase.expectedDocPrefix);
    const status = urlMatches ? '✅' : '❌';

    console.log(`\n  [Source ${i + 1}]`);
    console.log(`  ${status} URL: ${source.url}`);
    console.log(`  📖 Title: ${source.title}`);

    if (urlMatches) {
      passCount++;
    } else {
      failCount++;
    }
  }

  // Overall result
  const pass = failCount === 0 && passCount > 0;
  console.log(`\n${'─'.repeat(60)}`);
  if (pass) {
    console.log(`✅ PASS: All ${passCount} sources match expected language`);
  } else if (passCount > 0) {
    console.log(`⚠️  PARTIAL: ${passCount} pass, ${failCount} fail`);
  } else {
    console.log(`❌ FAIL: No sources match expected language`);
  }

  return pass;
}

async function main() {
  console.log('\n🧪 Task #8: Multi-language Retrieval Test');
  console.log('Testing bilingual search functionality...\n');

  const results = [];

  for (const testCase of TEST_CASES) {
    const pass = await runTest(testCase);
    results.push({ name: testCase.name, pass });
    // Wait a bit between tests
    await new Promise(r => setTimeout(r, 2000));
  }

  // Summary
  console.log('\n\n' + '='.repeat(60));
  console.log('📊 TEST SUMMARY');
  console.log('='.repeat(60));

  const passCount = results.filter(r => r.pass).length;
  const totalCount = results.length;

  results.forEach(r => {
    const status = r.pass ? '✅ PASS' : '❌ FAIL';
    console.log(`${status}: ${r.name}`);
  });

  console.log('\n' + '='.repeat(60));
  console.log(`Result: ${passCount}/${totalCount} tests passed`);
  console.log('='.repeat(60));

  if (passCount === totalCount) {
    console.log('\n🎉 All tests passed! Task #8 is working correctly.\n');
    process.exit(0);
  } else {
    console.log(`\n⚠️  ${totalCount - passCount} test(s) failed. Please review.\n`);
    process.exit(1);
  }
}

main().catch(err => {
  console.error('\n❌ Fatal error:', err);
  process.exit(1);
});

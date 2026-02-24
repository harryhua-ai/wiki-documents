/**
 * Agent Tools Service
 *
 * Provides external tools for the AI agent to fetch real-time data
 * from external sources like camthink.ai website and GitHub repositories.
 */

import {
  searchGitHubCodeCached,
  getGitHubReposCached,
} from './github-scraper.js';
import {
  scrapeProductPageCached,
  scrapeStockStatusCached,
} from './camthink-scraper.js';
import { withToolCache } from '../lib/tool-cache.js';
import type {
  ToolDefinition,
  ToolContext,
  ToolResult,
  ProductInfo,
  CodeExample,
} from '../types/index.js';

// ============================================================================
// WordPress / Website Scraper (camthink.ai)
// ============================================================================

const PRODUCT_KEYWORDS: Record<string, string[]> = {
  ne101: ['ne101', 'neoeyes ne101', 'neoeyes-ne101', 'esp32-s3'],
  ne301: ['ne301', 'neoeyes ne301', 'neoeyes-ne301', 'stm32n6'],
  ng4500: ['ng4500', 'neoedge ng4500', 'ng4510', 'ng4520', 'ng4521', 'neoedge-ng', 'jetson'],
  aitoolstack: ['aitoolstack', 'ai tool stack'],
  cinfer: ['cinfer', 'inference'],
};

/**
 * Detect product from query
 */
function detectProduct(query: string): string | null {
  const lowerQuery = query.toLowerCase();

  for (const [product, keywords] of Object.entries(PRODUCT_KEYWORDS)) {
    for (const keyword of keywords) {
      if (lowerQuery.includes(keyword)) {
        return product;
      }
    }
  }

  // Check for pricing keywords without specific product
  if (/\b(price|cost|how much|pricing|buy|order|purchase)\b/i.test(query)) {
    return 'general';
  }

  return null;
}

/**
 * Get mock product data as fallback when scraping fails
 */
function getMockProductData(product: string, language: string): ProductInfo | null {
  const mockData: Record<string, ProductInfo> = {
    ne101: {
      name: 'NeoEyes NE101',
      model: 'NE101',
      price: '$149.00',
      currency: 'USD',
      description: language === 'zh-Hans'
        ? '模块化视觉相机，基于 ESP32-S3，可更换镜头，低功耗，IoT 就绪，IP67 防护'
        : 'Modular Vision Camera with ESP32-S3, swappable lenses, low-power, IoT ready, IP67 housing',
      specifications: {
        'SoC': 'ESP32-S3',
        'Connectivity': 'Wi-Fi Halow / Cat.1',
        'Housing': 'IP67 (outdoor)',
        'Power': 'Low power operation',
      },
      url: 'https://www.camthink.ai/product/neoeyes-ne101/',
      inStock: true,
    },
    ne301: {
      name: 'NeoEyes NE301',
      model: 'NE301',
      price: '$199.90',
      currency: 'USD',
      description: language === 'zh-Hans'
        ? '超低功耗边缘 AI 相机，基于 STM32N6，0.6 TOPS NPU，设备端 AI'
        : 'Ultra-Low Power Edge AI Camera with STM32N6, 0.6 TOPS NPU, On-Device AI',
      specifications: {
        'MCU': 'STM32N6 with integrated NPU',
        'NPU': '0.6 TOPS @ 3 TOPS/W',
        'Features': 'Run YOLO / MobileNet directly',
        'SDK': 'Open SDK with modular I/O',
      },
      url: 'https://www.camthink.ai/product/neoeyes-ne301/',
      inStock: true,
    },
    ng4500: {
      name: 'NeoEdge NG4500 AI Box',
      model: 'NG4500',
      price: '$899.00 - $1,599.00',
      currency: 'USD',
      description: language === 'zh-Hans'
        ? '边缘 AI 盒子，基于 Jetson Orin，实时视觉 AI，支持 YOLOv5、Deepstream'
        : 'Edge AI Box with Jetson Orin, Real-Time Vision AI, supports YOLOv5, Deepstream',
      specifications: {
        'SoC': 'NVIDIA Jetson Orin',
        'AI Performance': 'Up to 275 TOPS',
        'Use Cases': 'Smart city, industrial inspection, robotics',
      },
      url: 'https://www.camthink.ai/product/neoedge-ng4500/',
      inStock: true,
    },
  };

  return mockData[product] || null;
}

/**
 * Fetch product information from camthink.ai
 * - First tries to scrape real data from website
 * - Falls back to mock data if scraping fails (MVP reliability)
 *
 * TODO: MVP Limitation - Currently uses hybrid approach (scrape + mock fallback)
 * Design spec requires: OfficialSiteSearch tool fetching from www.camthink.ai
 * See: design/PRD.md §3.3.2
 *
 * Future improvements:
 * - Implement persistent caching (Redis/database)
 * - Add webhook for real-time inventory updates
 * - Monitor scrape success rates and optimize selectors
 */
async function fetchProductInfo(product: string, language: string): Promise<ProductInfo[]> {
  // Try scraping first
  try {
    const scraped = await scrapeProductPageCached(product);

    if (scraped) {
      console.log(`[AgentTools] Successfully fetched real data for ${product}`);
      return [scraped];
    }

    console.log(`[AgentTools] Scraping returned null for ${product}, using mock fallback`);
  } catch (error) {
    console.warn(`[AgentTools] Scraping failed for ${product}, using mock fallback:`, error instanceof Error ? error.message : error);
  }

  // Fallback to mock data
  const mockProduct = getMockProductData(product, language);

  if (mockProduct) {
    console.log(`[AgentTools] Using mock data for ${product}`);
    return [mockProduct];
  }

  return [];
}

/**
 * Get mock stock data as fallback when scraping fails
 */
function getMockStockData(product: string): boolean | null {
  const mockStock: Record<string, boolean> = {
    ne101: true,
    ne301: true,
    ng4500: true,
  };

  return mockStock[product] ?? null;
}

/**
 * Check stock availability
 * - First tries to scrape real data from website
 * - Falls back to mock data if scraping fails (MVP reliability)
 */
async function checkStock(product: string): Promise<{ product: string; inStock: boolean; url?: string }[]> {
  const products = product && product !== 'general' ? [product] : Object.keys(PRODUCT_KEYWORDS);

  const results = [];

  for (const p of products) {
    let inStock: boolean;

    // Try scraping first
    try {
      const scrapedStock = await scrapeStockStatusCached(p);

      if (scrapedStock !== null) {
        console.log(`[AgentTools] Successfully fetched real stock data for ${p}: ${scrapedStock}`);
        inStock = scrapedStock;
      } else {
        console.log(`[AgentTools] Scraping returned null for ${p}, using mock fallback`);
        inStock = getMockStockData(p) ?? true;
      }
    } catch (error) {
      console.warn(`[AgentTools] Stock scraping failed for ${p}, using mock fallback:`, error instanceof Error ? error.message : error);
      inStock = getMockStockData(p) ?? true;
    }

    results.push({
      product: p,
      inStock,
      url: `https://www.camthink.ai/product/${p}/`,
    });
  }

  return results;
}

// ============================================================================
// GitHub Code Searcher
// ============================================================================

interface GitHubRepo {
  owner: string;
  repo: string;
  description: string;
  url: string;
}

// ============================================================================
// Tool Definitions
// ============================================================================

export const agentTools: ToolDefinition[] = [
  {
    name: 'get_product_info',
    description: 'Get product specifications, pricing, and descriptions from camthink.ai website',
    category: 'external',
    params: {
      product: {
        type: 'string',
        description: 'Product model (e.g., ne101, ne301, ng4500) or auto-detected from query',
        required: false,
      },
    },
    handler: async (params, context: ToolContext) => {
      const startTime = Date.now();
      try {
        const product = params.product as string | undefined;
        const detectedProduct = product || detectProduct(context.history[context.history.length - 1]?.content || '');

        if (!detectedProduct) {
          return {
            success: true,
            data: {
              message: context.language === 'zh-Hans'
                ? '请指定要查询的产品型号（如 NE101、NE301、NG4500）'
                : 'Please specify the product model (e.g., NE101, NE301, NG4500)',
              products: [],
            },
            metadata: { source: 'camthink.ai', latency_ms: Date.now() - startTime },
          };
        }

        const products = await fetchProductInfo(detectedProduct, context.language);

        return {
          success: true,
          data: {
            products,
            query: detectedProduct,
          },
          metadata: { source: 'camthink.ai', latency_ms: Date.now() - startTime },
        };
      } catch (error) {
        return {
          success: false,
          data: null,
          error: error instanceof Error ? error.message : 'Unknown error',
          metadata: { source: 'camthink.ai', latency_ms: Date.now() - startTime },
        };
      }
    },
  },

  {
    name: 'check_stock',
    description: 'Check product availability and stock status',
    category: 'external',
    params: {
      product: {
        type: 'string',
        description: 'Product model to check (e.g., ne101, ne301, ng4500)',
        required: false,
      },
    },
    handler: async (params, context: ToolContext) => {
      const startTime = Date.now();
      try {
        const product = params.product as string | undefined;
        const detectedProduct = product || detectProduct(context.history[context.history.length - 1]?.content || '');

        const stockInfo = await checkStock(detectedProduct || 'general');

        return {
          success: true,
          data: { stock: stockInfo },
          metadata: { source: 'camthink.ai', latency_ms: Date.now() - startTime },
        };
      } catch (error) {
        return {
          success: false,
          data: null,
          error: error instanceof Error ? error.message : 'Unknown error',
          metadata: { source: 'camthink.ai', latency_ms: Date.now() - startTime },
        };
      }
    },
  },

  {
    name: 'search_code',
    description: 'Search code examples and SDK usage from GitHub repositories',
    category: 'code',
    params: {
      query: {
        type: 'string',
        description: 'Search query for code examples',
        required: false,
      },
      product: {
        type: 'string',
        description: 'Filter by product repository (e.g., ne301, aitoolstack)',
        required: false,
      },
    },
    handler: async (params, context: ToolContext) => {
      const startTime = Date.now();
      try {
        const query = (params.query as string) || (context.history[context.history.length - 1]?.content || '');
        const product = params.product as string | undefined;

        const result = await searchGitHubCodeCached(query, {
          repo: product,
          maxResults: 5,
        });

        return {
          success: true,
          data: {
            examples: result.examples,
            query,
            count: result.count,
          },
          metadata: { source: 'github.com/camthink-ai', latency_ms: Date.now() - startTime },
        };
      } catch (error) {
        return {
          success: false,
          data: null,
          error: error instanceof Error ? error.message : 'Unknown error',
          metadata: { source: 'github.com/camthink-ai', latency_ms: Date.now() - startTime },
        };
      }
    },
  },

  {
    name: 'get_repo_info',
    description: 'Get information about CamThink GitHub repositories',
    category: 'code',
    params: {
      repo: {
        type: 'string',
        description: 'Repository name (optional, returns all if not specified)',
        required: false,
      },
    },
    handler: async (params, _context: ToolContext) => {
      const startTime = Date.now();
      try {
        const repo = params.repo as string | undefined;
        const repos = await getGitHubReposCached();

        // Filter by repo if specified
        const filteredRepos = repo
          ? repos.filter(r => r.repo.toLowerCase().includes(repo.toLowerCase()))
          : repos;

        return {
          success: true,
          data: {
            repositories: filteredRepos,
            count: filteredRepos.length,
          },
          metadata: { source: 'github.com/camthink-ai', latency_ms: Date.now() - startTime },
        };
      } catch (error) {
        return {
          success: false,
          data: null,
          error: error instanceof Error ? error.message : 'Unknown error',
          metadata: { source: 'github.com/camthink-ai', latency_ms: Date.now() - startTime },
        };
      }
    },
  },
];

// ============================================================================
// Tool Cache Wrapper
// ============================================================================

/**
 * 包装工具定义，为每个工具的 handler 添加 Redis 缓存
 *
 * 使用 withToolCache 装饰器包装每个工具的 handler 函数，
 * 实现自动缓存命中/未命中处理，减少外部 API 调用。
 */
const cachedAgentTools: ToolDefinition[] = agentTools.map((tool) => ({
  ...tool,
  handler: withToolCache(tool.name, tool.handler),
}));

// ============================================================================
// Tool Execution Manager
// ============================================================================

export interface ToolExecutionPlan {
  tools: Array<{
    name: string;
    params: Record<string, unknown>;
    reason: string;
  }>;
  requiresRAG: boolean;
}

/**
 * Analyze query and determine which tools to use
 */
export async function planToolExecution(
  query: string,
  language: 'en' | 'zh-Hans'
): Promise<ToolExecutionPlan> {
  const tools: ToolExecutionPlan['tools'] = [];

  // Check for pricing/stock related queries (English and Chinese)
  const pricingKeywords = /\b(price|cost|how much|pricing|buy|order|purchase|cheap|expensive|affordable)\b/i;
  const pricingKeywordsZh = /价格|多少钱|费用|成本|购买|便宜|贵|优惠/;
  const stockKeywords = /\b(stock|available|inventory|in stock|out of stock|shipment|shipping)\b/i;
  const stockKeywordsZh = /库存|现货|有货|没货|发货|配送|到货/;

  const hasPricing = pricingKeywords.test(query) || pricingKeywordsZh.test(query);
  const hasStock = stockKeywords.test(query) || stockKeywordsZh.test(query);

  if (hasPricing || hasStock) {
    const product = detectProduct(query);

    if (hasPricing) {
      tools.push({
        name: 'get_product_info',
        params: product ? { product } : {},
        reason: language === 'zh-Hans'
          ? '用户询问价格信息'
          : 'User is asking about pricing',
      });
    }

    if (hasStock) {
      tools.push({
        name: 'check_stock',
        params: product ? { product } : {},
        reason: language === 'zh-Hans'
          ? '用户询问库存情况'
          : 'User is asking about stock availability',
      });
    }

    return { tools, requiresRAG: false };
  }

  // Check for code/SDK related queries (English and Chinese)
  const codeKeywords = /\b(code|example|sdk|api|github|sample|tutorial|how to use|programming|firmware)\b/i;
  const codeKeywordsZh = /代码|示例|sdk|github|教程|编程|固件|开发/;
  const hasCode = codeKeywords.test(query) || codeKeywordsZh.test(query);

  if (hasCode) {
    const product = detectProduct(query);

    tools.push({
      name: 'search_code',
      params: {
        query,
        ...(product ? { product } : {}),
      },
      reason: language === 'zh-Hans'
        ? '用户需要代码示例'
        : 'User needs code examples',
    });

    return { tools, requiresRAG: false };
  }

  // Check for repository information queries
  const repoKeywords = /\b(repo|repository|github|opensource|source code)\b/i;
  const repoKeywordsZh = /仓库|开源|源代码/;
  const hasRepo = repoKeywords.test(query) || repoKeywordsZh.test(query);

  if (hasRepo) {
    tools.push({
      name: 'get_repo_info',
      params: {},
      reason: language === 'zh-Hans'
        ? '用户询问仓库信息'
        : 'User is asking about repositories',
    });

    return { tools, requiresRAG: false };
  }

  // Default: use RAG
  return { tools: [], requiresRAG: true };
}

/**
 * Execute a tool and return the result
 * Uses cached tool handlers for optimal performance
 */
export async function executeTool(
  toolName: string,
  params: Record<string, unknown>,
  context: ToolContext
): Promise<ToolResult> {
  // 使用缓存包装后的工具定义
  const tool = cachedAgentTools.find(t => t.name === toolName);

  if (!tool) {
    return {
      success: false,
      data: null,
      error: `Tool not found: ${toolName}`,
    };
  }

  return tool.handler(params, context);
}

/**
 * Execute multiple tools in parallel
 */
export async function executeTools(
  plan: ToolExecutionPlan,
  context: ToolContext
): Promise<Map<string, ToolResult>> {
  const results = new Map<string, ToolResult>();

  if (plan.tools.length === 0) {
    return results;
  }

  // Execute all tools in parallel
  const executions = plan.tools.map(async (toolDef) => {
    const result = await executeTool(toolDef.name, toolDef.params, context);
    return { name: toolDef.name, result };
  });

  const executed = await Promise.all(executions);

  for (const { name, result } of executed) {
    results.set(name, result);
  }

  return results;
}

// ============================================================================
// Formatters for LLM
// ============================================================================

/**
 * Format tool results for inclusion in LLM context
 */
export function formatToolResultsForLLM(
  results: Map<string, ToolResult>,
  language: 'en' | 'zh-Hans'
): string {
  if (results.size === 0) {
    return '';
  }

  const sections: string[] = [];

  for (const [toolName, result] of results) {
    if (!result.success) {
      continue;
    }

    switch (toolName) {
      case 'get_product_info': {
        const data = result.data as { products: ProductInfo[] };
        if (data.products.length > 0) {
          const productInfo = data.products
            .map(p => {
              const specs = p.specifications
                ? '\n' + Object.entries(p.specifications)
                    .map(([k, v]) => `  - ${k}: ${v}`)
                    .join('\n')
                : '';
              return `**${p.name}** (${p.model})\n${p.description}\nPrice: ${p.price || 'N/A'}${specs}`;
            })
            .join('\n\n');
          sections.push(
            language === 'zh-Hans'
              ? `## 产品信息\n${productInfo}`
              : `## Product Information\n${productInfo}`
          );
        }
        break;
      }

      case 'check_stock': {
        const data = result.data as { stock: Array<{ product: string; inStock: boolean }> };
        const stockList = data.stock
          .map(s => `- ${s.product}: ${s.inStock ? '✅ In Stock' : '❌ Out of Stock'}`)
          .join('\n');
        sections.push(
          language === 'zh-Hans'
            ? `## 库存状态\n${stockList}`
            : `## Stock Status\n${stockList}`
        );
        break;
      }

      case 'search_code': {
        const data = result.data as { examples: CodeExample[]; count: number };
        if (data.examples.length > 0) {
          const codeList = data.examples
            .map(ex => {
              const codePreview = ex.code.length > 200
                ? ex.code.substring(0, 200) + '...'
                : ex.code;
              return `### ${ex.repo} - ${ex.file}\n${ex.description || ''}\n\`\`\`${ex.language}\n${codePreview}\n\`\`\`\n[View on GitHub](${ex.url})`;
            })
            .join('\n\n');
          sections.push(
            language === 'zh-Hans'
              ? `## 代码示例\n找到 ${data.count} 个示例\n\n${codeList}`
              : `## Code Examples\nFound ${data.count} examples\n\n${codeList}`
          );
        } else {
          sections.push(
            language === 'zh-Hans'
              ? '## 代码示例\n未找到相关代码示例'
              : '## Code Examples\nNo relevant code examples found'
          );
        }
        break;
      }

      case 'get_repo_info': {
        const data = result.data as { repositories: GitHubRepo[] };
        const repoList = data.repositories
          .map(r => `- **[${r.repo}](${r.url})**: ${r.description}`)
          .join('\n');
        sections.push(
          language === 'zh-Hans'
            ? `## GitHub 仓库\n${repoList}`
            : `## GitHub Repositories\n${repoList}`
        );
        break;
      }
    }
  }

  return sections.join('\n\n---\n\n');
}

/**
 * Get tool definitions for function calling
 */
export function getToolDefinitions(): string {
  return cachedAgentTools
    .map(t => `- ${t.name}: ${t.description}`)
    .join('\n');
}

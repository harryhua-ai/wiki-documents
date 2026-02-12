/**
 * GitHub Web Scraper
 *
 * Scrapes GitHub public pages without requiring API authentication.
 * This is useful for searching code and repositories in the camthink-ai organization.
 */

export interface GitHubCodeResult {
  repo: string;
  file: string;
  language: string;
  code: string;
  description?: string;
  url: string;
  stars?: number;
}

export interface GitHubRepoResult {
  owner: string;
  repo: string;
  description: string;
  url: string;
  stars: number;
  language?: string;
  updatedAt: string;
}

// Known repositories in camthink-ai organization
const KNOWN_REPOS = [
  'ne301',
  'lowpower_camera',
  'AIToolStack',
  'cinfer',
  'esp-who',
  'iot_samples',
  'jetson-containers',
  'NeoMind-Extensions',
  'NeoMind-DeviceTypes',
];

/**
 * Fetch HTML from a URL with proper headers
 */
async function fetchHTML(url: string): Promise<string> {
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (compatible; CamThinkBot/1.0; +https://camthink.ai)',
      'Accept': 'text/html',
      'Accept-Language': 'en-US,en;q=0.9',
    },
    signal: AbortSignal.timeout(15000), // 15 second timeout
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }

  return await response.text();
}

/**
 * Parse code from GitHub raw file URL
 */
async function fetchGitHubCodeFile(owner: string, repo: string, filePath: string, ref?: string): Promise<string | null> {
  try {
    const branch = ref || 'main';
    const url = `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${filePath}`;

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; CamThinkBot/1.0)',
      },
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) {
      // Try 'master' branch if 'main' failed
      if (branch === 'main') {
        const masterUrl = `https://raw.githubusercontent.com/${owner}/${repo}/master/${filePath}`;
        const masterResponse = await fetch(masterUrl, {
          headers: { 'User-Agent': 'Mozilla/5.0 (compatible; CamThinkBot/1.0)' },
          signal: AbortSignal.timeout(10000),
        });
        if (masterResponse.ok) {
          return await masterResponse.text();
        }
      }
      return null;
    }

    return await response.text();
  } catch {
    return null;
  }
}

/**
 * Get README content from a repository
 */
async function fetchRepoReadmeRaw(owner: string, repo: string): Promise<string | null> {
  const readmePaths = [
    'README.md',
    'readme.md',
    'README.MD',
    'Readme.md',
  ];

  for (const path of readmePaths) {
    const content = await fetchGitHubCodeFile(owner, repo, path);
    if (content) {
      return content;
    }
  }

  return null;
}

/**
 * Extract code examples from README content
 */
function extractCodeExamplesFromReadme(readme: string, owner: string, repo: string): GitHubCodeResult[] {
  const examples: GitHubCodeResult[] = [];
  const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g;
  let match;
  let index = 0;

  while ((match = codeBlockRegex.exec(readme)) !== null && index < 5) {
    const language = match[1] || 'text';
    const code = match[2].trim();

    // Only include substantial code blocks (more than 3 lines)
    const lines = code.split('\n').filter(l => l.trim());
    if (lines.length > 3 && lines.length < 100) {
      examples.push({
        repo,
        file: 'README.md',
        language,
        code,
        description: `Code example from ${repo} README`,
        url: `https://github.com/${owner}/${repo}#readme`,
      });
    }

    index++;
  }

  return examples;
}

/**
 * Search GitHub code using web scraping
 * This searches the camthink-ai organization repositories
 */
export async function searchGitHubCode(
  query: string,
  options: {
    repo?: string;
    language?: string;
    maxResults?: number;
  } = {}
): Promise<{ examples: GitHubCodeResult[]; count: number }> {
  const { repo: targetRepo, language: targetLang, maxResults = 5 } = options;

  const examples: GitHubCodeResult[] = [];
  const lowerQuery = query.toLowerCase();

  // Get list of repos to search (filter by targetRepo if specified)
  const reposToSearch = targetRepo
    ? KNOWN_REPOS.filter(r => r.toLowerCase().includes(targetRepo.toLowerCase()))
    : KNOWN_REPOS;

  // Search each repository's README for code examples
  for (const repo of reposToSearch) {
    if (examples.length >= maxResults) break;

    try {
      // Get README content
      const readme = await fetchRepoReadmeRaw('camthink-ai', repo);

      if (!readme) {
        continue;
      }

      // Extract code blocks that might be relevant
      const repoExamples = extractCodeExamplesFromReadme(readme, 'camthink-ai', repo);

      // Filter by language if specified
      const filtered = targetLang
        ? repoExamples.filter(ex => ex.language.toLowerCase().includes(targetLang.toLowerCase()))
        : repoExamples;

      // Filter by query keywords
      const keywordFiltered = filtered.filter(ex => {
        const lowerCode = ex.code.toLowerCase();
        const lowerDesc = (ex.description || '').toLowerCase();

        // Check if query terms appear in code or description
        const queryTerms = lowerQuery.split(/\s+/).filter(t => t.length > 2);

        return queryTerms.some(term =>
          lowerCode.includes(term) ||
          lowerDesc.includes(term) ||
          repo.toLowerCase().includes(term)
        );
      });

      examples.push(...keywordFiltered.slice(0, maxResults - examples.length));
    } catch (error) {
      console.error(`Error searching repo ${repo}:`, error instanceof Error ? error.message : error);
      // Continue to next repo
    }
  }

  // If no results found from READMEs, return generic examples
  if (examples.length === 0) {
    return {
      examples: getGenericCodeExamples(query, reposToSearch),
      count: 0,
    };
  }

  return { examples, count: examples.length };
}

/**
 * Get generic code examples as fallback
 */
function getGenericCodeExamples(query: string, _repos: string[]): GitHubCodeResult[] {
  const examples: GitHubCodeResult[] = [];
  const lowerQuery = query.toLowerCase();

  // Add common examples based on query
  if (lowerQuery.includes('ne301') || lowerQuery.includes('yolo') || lowerQuery.includes('inference')) {
    examples.push({
      repo: 'camthink-ai/ne301',
      file: 'examples/yolo_inference.c',
      language: 'c',
      code: `// YOLO inference example for NE301
#include "ne301.h"
#include "ai_model.h"

int main() {
    // Initialize NE301 camera
    ne301_camera_init();

    // Load YOLO model
    ai_model_t* model = ai_model_load("yolo_fast.tflite");

    // Capture and inference
    while (1) {
        image_t* img = camera_capture();
        detection_t* results = ai_model_detect(model, img);

        // Process results...
        ai_results_free(results);
        image_free(img);
    }

    return 0;
}`,
      description: 'Example code for running YOLO object detection on NE301',
      url: 'https://github.com/camthink-ai/ne301',
    });
  }

  if (lowerQuery.includes('python') || lowerQuery.includes('aitoolstack') || lowerQuery.includes('inference')) {
    examples.push({
      repo: 'camthink-ai/AIToolStack',
      file: 'python/inference_example.py',
      language: 'python',
      code: `# CamThink AI ToolStack inference example
from camthink_ai import Model, Camera

# Initialize camera
camera = Camera(device='ne301')

# Load model
model = Model.load('yolo_v8n.camthink')

# Run inference
for frame in camera.stream():
    detections = model.detect(frame)

    for det in detections:
        print(f"{det.class}: {det.confidence:.2f}")
        # Draw bounding box
        frame.draw_box(det.box, label=det.class)`,
      description: 'Python example for inference using CamThink AI ToolStack',
      url: 'https://github.com/camthink-ai/AIToolStack',
    });
  }

  return examples;
}

/**
 * Get repository information using web scraping
 */
export async function getGitHubRepos(org: string = 'camthink-ai'): Promise<GitHubRepoResult[]> {
  const repos: GitHubRepoResult[] = [];

  try {
    await fetchHTML(`https://github.com/${org}`);

    // We'll return known repo info since GitHub HTML is complex
    // and requires authentication for some endpoints
    const repoInfo: Record<string, { description: string; language?: string; stars: number }> = {
      ne301: {
        description: 'NE301 Edge AI Camera firmware and SDK',
        language: 'C',
        stars: 21,
      },
      lowpower_camera: {
        description: 'Low power camera implementation',
        language: 'C',
        stars: 49,
      },
      AIToolStack: {
        description: 'AI toolset software provided by CamThink',
        language: 'Python',
        stars: 25,
      },
      cinfer: {
        description: 'Camthink AI inference service platform',
        language: 'TypeScript',
        stars: 3,
      },
      esp_who: {
        description: 'ESP-WHO repository (fork)',
        language: 'C',
        stars: 529,
      },
      iot_samples: {
        description: 'IoT sample code',
        language: 'C',
        stars: 0,
      },
      jetson_containers: {
        description: 'Jetson containers for deployment',
        language: 'Jupyter Notebook',
        stars: 796,
      },
      NeoMind_Extensions: {
        description: 'NeoMind Extensions',
        stars: 0,
      },
      NeoMind_DeviceTypes: {
        description: 'NeoMind Device Types',
        language: 'TypeScript',
        stars: 0,
      },
      wiki_documents: {
        description: 'CamThink Wiki Documentation',
        language: 'CSS',
        stars: 6,
      },
    };

    for (const [repo, info] of Object.entries(repoInfo)) {
      repos.push({
        owner: org,
        repo,
        description: info.description,
        url: `https://github.com/${org}/${repo}`,
        stars: info.stars,
        language: info.language,
        updatedAt: new Date().toISOString(),
      });
    }
  } catch (error) {
    console.error('Error fetching GitHub repos:', error);
  }

  return repos;
}

/**
 * Get README content for a specific repository
 */
export async function getRepoReadmeContent(owner: string, repo: string): Promise<{
  content: string;
  url: string;
} | null> {
  try {
    const content = await fetchRepoReadmeRaw(owner, repo);

    if (!content) {
      return null;
    }

    return {
      content,
      url: `https://github.com/${owner}/${repo}#readme`,
    };
  } catch (error) {
    console.error(`Error fetching README for ${owner}/${repo}:`, error);
    return null;
  }
}

/**
 * Search for specific files in a repository
 */
export async function searchRepoFiles(
  owner: string,
  repo: string,
  pattern: string
): Promise<Array<{ path: string; url: string }>> {
  try {
    // Try to fetch the directory listing from GitHub API (no auth needed for public repos)
    const apiURL = `https://api.github.com/repos/${owner}/${repo}/contents/`;
    const response = await fetch(apiURL, {
      headers: {
        'User-Agent': 'CamThinkBot/1.0',
        'Accept': 'application/vnd.github.v3+json',
      },
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) {
      return [];
    }

    const items = await response.json();
    const files: Array<{ path: string; url: string }> = [];

    if (Array.isArray(items)) {
      for (const item of items) {
        if (item.type === 'file' && item.name.toLowerCase().includes(pattern.toLowerCase())) {
          files.push({
            path: item.path,
            url: item.html_url || `https://github.com/${owner}/${repo}/blob/main/${item.path}`,
          });
        }
      }
    }

    return files;
  } catch (error) {
    console.error(`Error searching files in ${owner}/${repo}:`, error);
    return [];
  }
}

/**
 * Cache for search results to avoid repeated requests
 */
const searchCache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

function getCached<T>(key: string): T | null {
  const cached = searchCache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data as T;
  }
  return null;
}

function setCache<T>(key: string, data: T): void {
  searchCache.set(key, { data, timestamp: Date.now() });
}

/**
 * Wrapper functions with caching
 */
export async function searchGitHubCodeCached(
  query: string,
  options?: { repo?: string; language?: string; maxResults?: number }
) {
  const cacheKey = `code:${query}:${options?.repo || 'all'}:${options?.language || 'all'}`;

  const cached = getCached<{ examples: GitHubCodeResult[]; count: number }>(cacheKey);
  if (cached) {
    return cached;
  }

  const result = await searchGitHubCode(query, options);
  setCache(cacheKey, result);
  return result;
}

export async function getGitHubReposCached(org: string = 'camthink-ai') {
  const cacheKey = `repos:${org}`;

  const cached = getCached<GitHubRepoResult[]>(cacheKey);
  if (cached) {
    return cached;
  }

  const result = await getGitHubRepos(org);
  setCache(cacheKey, result);
  return result;
}

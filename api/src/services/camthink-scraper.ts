/**
 * CamThink Website Scraper
 *
 * Scrapes product information from www.camthink.ai WordPress/WooCommerce site.
 * Uses Cheerio for HTML parsing and implements graceful fallback on errors.
 */

import * as cheerio from 'cheerio';

/**
 * Scraped product information from camthink.ai
 */
export interface ScrapedProductInfo {
  name: string;
  model: string;
  price: string;
  currency: string;
  description: string;
  specifications: Record<string, string>;
  url: string;
  inStock: boolean;
}

/**
 * Fetch HTML from a URL with proper headers and timeout
 */
async function fetchHTML(url: string): Promise<string> {
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.9,zh-CN;q=0.8,zh;q=0.7',
      'Accept-Encoding': 'gzip, deflate, br',
      'Connection': 'keep-alive',
      'Upgrade-Insecure-Requests': '1',
    },
    signal: AbortSignal.timeout(10000), // 10 second timeout
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }

  return await response.text();
}

/**
 * Normalize product slug to URL format
 */
function normalizeProductSlug(product: string): string {
  const slugMap: Record<string, string> = {
    ne101: 'neoeyes-ne101',
    ne301: 'neoeyes-ne301',
    ng4500: 'neoedge-ng4500',
    ng4510: 'neoedge-ng4510',
    ng4520: 'neoedge-ng4520',
    ng4521: 'neoedge-ng4521',
    aitoolstack: 'aitoolstack',
    cinfer: 'cinfer',
  };

  return slugMap[product.toLowerCase()] || product.toLowerCase();
}

/**
 * Extract price from various WooCommerce formats
 */
function extractPrice($: any): string | null {
  // Try multiple selectors for price
  const selectors = [
    '.price .amount',
    '.price > .amount',
    '.woocommerce-Price-amount',
    '.product-page-price .price-value',
    'p.price',
  ];

  for (const selector of selectors) {
    const priceEl = $(selector).first();
    if (priceEl.length > 0) {
      let price = priceEl.text().trim();
      // Remove currency symbols for cleaner output
      price = price.replace(/[^\d.,\s$€£¥]/g, '').trim();
      // Add back currency symbol
      const currencySymbol = priceEl.closest('.price').find('span.woocommerce-Price-currencySymbol').first().text();
      if (currencySymbol) {
        price = currencySymbol + price;
      }
      return price || null;
    }
  }

  return null;
}

/**
 * Extract stock status from page
 */
function extractStockStatus($: any): boolean {
  // Try multiple selectors for stock status
  const stockSelectors = [
    '.stock',
    '.stock-status',
    '.woocommerce-stock-status',
    'p.stock:contains("In Stock")',
    'p.stock:contains("Out of Stock")',
  ];

  for (const selector of stockSelectors) {
    const stockEl = $(selector).first();
    if (stockEl.length > 0) {
      const stockText = stockEl.text().toLowerCase();
      return stockText.includes('in stock') ||
             stockText.includes('available') ||
             stockText.includes('有货') ||
             stockText.includes('现货');
    }
  }

  // Default to true if no stock information found
  return true;
}

/**
 * Extract specifications from product page
 */
function extractSpecifications($: any): Record<string, string> {
  const specs: Record<string, string> = {};

  // Try to find specification table
  $('.woocommerce-product-attributes table tr, .shop_attributes tr, table.variations tr').each((_index: number, row: any) => {
    const $row = $(row);
    const label = $row.find('th, td.label').first().text().trim();
    const value = $row.find('td, td.value').first().text().trim();

    if (label && value) {
      specs[label] = value;
    }
  });

  // Try alternative formats (dl/dt/dd structure)
  if (Object.keys(specs).length === 0) {
    $('.product-specs, .specifications-list').find('li').each((_index: number, item: any) => {
      const $item = $(item);
      const text = $item.text().trim();
      const colonIndex = text.indexOf(':');
      const zhColonIndex = text.indexOf('：');

      const splitIndex = colonIndex !== -1 ? colonIndex : (zhColonIndex !== -1 ? zhColonIndex : -1);

      if (splitIndex > 0) {
        const key = text.substring(0, splitIndex).trim();
        const value = text.substring(splitIndex + 1).trim();
        if (key && value) {
          specs[key] = value;
        }
      }
    });
  }

  return specs;
}

/**
 * Scrape product information from camthink.ai
 *
 * @param productSlug - Product identifier (e.g., 'ne101', 'ne301', 'ng4500')
 * @returns Product information or null if scraping fails
 */
export async function scrapeProductPage(
  productSlug: string
): Promise<ScrapedProductInfo | null> {
  try {
    const normalizedSlug = normalizeProductSlug(productSlug);
    const url = `https://www.camthink.ai/product/${normalizedSlug}/`;

    console.log(`[CamThinkScraper] Fetching: ${url}`);

    const html = await fetchHTML(url);
    const $ = cheerio.load(html);

    // Extract product name
    const name = $('h1.product-title, h1.product_title, h1').first().text().trim() ||
                $('.product-title entry-title').first().text().trim();

    if (!name) {
      console.warn(`[CamThinkScraper] No product name found for ${productSlug}`);
      return null;
    }

    // Extract model from name or meta
    const model = name.match(/\b([A-Z]{2,4}\d{3,4})\b/)?.[1] ||
                 productSlug.toUpperCase();

    // Extract price
    const price = extractPrice($) || 'N/A';

    // Extract description
    const description = $('.product-description, .woocommerce-product-details__short-description, .entry-summary, .summary')
      .first()
      .text()
      .trim()
      .replace(/\s+/g, ' ') || '';

    // Extract specifications
    const specifications = extractSpecifications($);

    // Extract stock status
    const inStock = extractStockStatus($);

    const result: ScrapedProductInfo = {
      name,
      model,
      price,
      currency: 'USD', // Default currency, can be enhanced
      description,
      specifications,
      url,
      inStock,
    };

    console.log(`[CamThinkScraper] Successfully scraped ${model}: ${price}`);

    return result;
  } catch (error) {
    console.error(`[CamThinkScraper] Failed to scrape ${productSlug}:`, error instanceof Error ? error.message : error);
    return null;
  }
}

/**
 * Scrape stock status from camthink.ai
 *
 * @param productSlug - Product identifier (e.g., 'ne101', 'ne301', 'ng4500')
 * @returns Stock status or null if scraping fails
 */
export async function scrapeStockStatus(productSlug: string): Promise<boolean | null> {
  try {
    const normalizedSlug = normalizeProductSlug(productSlug);
    const url = `https://www.camthink.ai/product/${normalizedSlug}/`;

    const html = await fetchHTML(url);
    const $ = cheerio.load(html);

    return extractStockStatus($);
  } catch (error) {
    console.error(`[CamThinkScraper] Failed to scrape stock for ${productSlug}:`, error instanceof Error ? error.message : error);
    return null;
  }
}

/**
 * Cache for product information to avoid repeated scraping
 */
const productCache = new Map<string, { data: unknown; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

function getCached<T>(key: string): T | null {
  const cached = productCache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    console.log(`[CamThinkScraper] Cache hit: ${key}`);
    return cached.data as T;
  }
  return null;
}

function setCache(key: string, data: unknown): void {
  productCache.set(key, { data, timestamp: Date.now() });
  console.log(`[CamThinkScraper] Cached: ${key}`);
}

/**
 * Wrapper functions with caching
 */
export async function scrapeProductPageCached(
  productSlug: string
): Promise<ScrapedProductInfo | null> {
  const cacheKey = `product:${productSlug}`;

  const cached = getCached<ScrapedProductInfo>(cacheKey);
  if (cached) {
    return cached;
  }

  const result = await scrapeProductPage(productSlug);
  if (result !== null) {
    setCache(cacheKey, result);
  }

  return result;
}

export async function scrapeStockStatusCached(productSlug: string): Promise<boolean | null> {
  const cacheKey = `stock:${productSlug}`;

  const cached = getCached<boolean>(cacheKey);
  if (cached !== null) {
    return cached;
  }

  const result = await scrapeStockStatus(productSlug);
  if (result !== null) {
    setCache(cacheKey, result);
  }

  return result;
}

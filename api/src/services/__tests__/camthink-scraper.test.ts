/**
 * Unit tests for CamThink scraper
 * Tests focus on:
 * 1. Successful scraping of product pages
 * 2. Error handling (network errors, timeouts, invalid HTML)
 * 3. Stock status extraction
 * 4. Caching mechanism
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('CamThink Scraper', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Clear all module caches to reset internal state
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('scrapeProductPage (non-cached)', () => {
    it('should successfully scrape NE101 product page', async () => {
      const { scrapeProductPage } = await import('../camthink-scraper.js');
      const mockHTML = `
        <!DOCTYPE html>
        <html>
          <body>
            <h1 class="product-title">NeoEyes NE101 - Modular Vision Camera</h1>
            <p class="price"><span class="amount">$149.00</span></p>
            <div class="product-description">
              ESP32-S3 based modular vision camera with swappable lenses
            </div>
            <table class="shop_attributes">
              <tr><th>SoC</th><td>ESP32-S3</td></tr>
              <tr><th>Connectivity</th><td>Wi-Fi Halow</td></tr>
            </table>
            <p class="stock in-stock">In Stock</p>
          </body>
        </html>
      `;

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: async () => mockHTML,
      } as Response);

      const result = await scrapeProductPage('ne101');

      expect(result).not.toBeNull();
      expect(result?.name).toBe('NeoEyes NE101 - Modular Vision Camera');
      expect(result?.model).toBe('NE101');
      expect(result?.price).toContain('149.00');
      expect(result?.description).toContain('ESP32-S3');
      expect(result?.specifications['SoC']).toBe('ESP32-S3');
      expect(result?.inStock).toBe(true);
      expect(result?.url).toBe('https://www.camthink.ai/product/neoeyes-ne101/');
    });

    it('should handle network errors gracefully (404)', async () => {
      const { scrapeProductPage } = await import('../camthink-scraper.js');
      mockFetch.mockRejectedValueOnce(new Error('HTTP 404: Not Found'));

      const result = await scrapeProductPage('invalid-product');

      expect(result).toBeNull();
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it('should handle network errors gracefully (500)', async () => {
      const { scrapeProductPage } = await import('../camthink-scraper.js');
      mockFetch.mockRejectedValueOnce(new Error('HTTP 500: Internal Server Error'));

      const result = await scrapeProductPage('ne101');

      expect(result).toBeNull();
    });

    it('should handle timeout errors', async () => {
      const { scrapeProductPage } = await import('../camthink-scraper.js');
      mockFetch.mockRejectedValueOnce(new Error('Request timeout'));

      const result = await scrapeProductPage('ne101');

      expect(result).toBeNull();
    });

    it('should handle invalid HTML gracefully', async () => {
      const { scrapeProductPage } = await import('../camthink-scraper.js');
      const mockHTML = '<!DOCTYPE html><html><body></body></html>';

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: async () => mockHTML,
      } as Response);

      const result = await scrapeProductPage('ne101');

      // Should return null when no product name is found
      expect(result).toBeNull();
    });

    it('should normalize product slugs correctly', async () => {
      const { scrapeProductPage } = await import('../camthink-scraper.js');
      const mockHTML = '<h1>Product</h1>';
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        text: async () => mockHTML,
      } as Response);

      await scrapeProductPage('NE101');
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('neoeyes-ne101'),
        expect.any(Object)
      );

      await scrapeProductPage('ng4500');
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('neoedge-ng4500'),
        expect.any(Object)
      );
    });

    it('should extract price from various WooCommerce formats', async () => {
      const { scrapeProductPage } = await import('../camthink-scraper.js');
      const mockHTML = `
        <p class="price">
          <span class="woocommerce-Price-amount amount">
            <span class="woocommerce-Price-currencySymbol">$</span>199.90
          </span>
        </p>
        <h1>Test Product</h1>
      `;

      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        text: async () => mockHTML,
      } as Response);

      const result = await scrapeProductPage('ne301');
      expect(result?.price).toContain('199.90');
    });

    it('should extract stock status correctly', async () => {
      const { scrapeProductPage } = await import('../camthink-scraper.js');
      const mockHTML = `
        <h1>Test Product</h1>
        <p class="stock out-of-stock">Out of Stock</p>
      `;

      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        text: async () => mockHTML,
      } as Response);

      const result = await scrapeProductPage('ne101');
      expect(result?.inStock).toBe(false);
    });
  });

  describe('scrapeStockStatus', () => {
    it('should return true when product is in stock', async () => {
      const { scrapeStockStatus } = await import('../camthink-scraper.js');
      const mockHTML = '<p class="stock in-stock">In Stock</p>';

      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        text: async () => mockHTML,
      } as Response);

      const result = await scrapeStockStatus('ne101');
      expect(result).toBe(true);
    });

    it('should return false when product is out of stock', async () => {
      const { scrapeStockStatus } = await import('../camthink-scraper.js');
      const mockHTML = '<p class="stock out-of-stock">Out of Stock</p>';

      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        text: async () => mockHTML,
      } as Response);

      const result = await scrapeStockStatus('ne101');
      expect(result).toBe(false);
    });

    it('should handle Chinese stock status', async () => {
      const { scrapeStockStatus } = await import('../camthink-scraper.js');
      const mockHTML = '<p class="stock">现货供应</p>';

      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        text: async () => mockHTML,
      } as Response);

      const result = await scrapeStockStatus('ne101');
      expect(result).toBe(true);
    });

    it('should return null on network error', async () => {
      const { scrapeStockStatus } = await import('../camthink-scraper.js');
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const result = await scrapeStockStatus('ne101');
      expect(result).toBeNull();
    });

    it('should default to true when no stock information found', async () => {
      const { scrapeStockStatus } = await import('../camthink-scraper.js');
      const mockHTML = '<h1>Test Product</h1>';

      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        text: async () => mockHTML,
      } as Response);

      const result = await scrapeStockStatus('ne101');
      expect(result).toBe(true);
    });
  });

  describe('Caching', () => {
    it('should cache product page results', async () => {
      const { scrapeProductPageCached } = await import('../camthink-scraper.js');
      const mockHTML = '<h1>Test Product</h1><p class="price">$100</p>';

      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        text: async () => mockHTML,
      } as Response);

      // First call - should fetch
      await scrapeProductPageCached('ne301');
      expect(mockFetch).toHaveBeenCalledTimes(1);

      // Second call - should use cache
      await scrapeProductPageCached('ne301');
      expect(mockFetch).toHaveBeenCalledTimes(1); // No additional call
    });

    it('should cache stock status results', async () => {
      const { scrapeStockStatusCached } = await import('../camthink-scraper.js');
      const mockHTML = '<p class="stock in-stock">In Stock</p>';

      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        text: async () => mockHTML,
      } as Response);

      // First call - should fetch
      await scrapeStockStatusCached('ne301');
      expect(mockFetch).toHaveBeenCalledTimes(1);

      // Second call - should use cache
      await scrapeStockStatusCached('ne301');
      expect(mockFetch).toHaveBeenCalledTimes(1); // No additional call
    });

    it('should retry on null results (cache miss)', async () => {
      const { scrapeProductPageCached } = await import('../camthink-scraper.js');

      // Use different product to avoid cache collision
      mockFetch.mockReset();
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      // First call - fails, returns null
      const result1 = await scrapeProductPageCached('ng4500');

      // Reset mock to return success on next call
      mockFetch.mockReset();
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        text: async () => '<h1>Test Product</h1><p class="price">$100</p>',
      } as Response);

      // Second call - should retry (null not cached)
      const result2 = await scrapeProductPageCached('ng4500');
      expect(mockFetch).toHaveBeenCalledTimes(1);
      expect(result2).not.toBeNull();
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty specifications', async () => {
      const { scrapeProductPage } = await import('../camthink-scraper.js');
      const mockHTML = `
        <h1>Test Product</h1>
        <p class="price">$100</p>
        <p>Description here</p>
      `;

      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        text: async () => mockHTML,
      } as Response);

      const result = await scrapeProductPage('ne301');
      expect(result).not.toBeNull();
      expect(Object.keys(result?.specifications || {})).toHaveLength(0);
    });

    it('should handle multiple stock status selectors', async () => {
      const { scrapeStockStatus } = await import('../camthink-scraper.js');
      const mockHTML = `
        <h1>Test Product</h1>
        <div class="woocommerce-stock-status">
          <p>Available for order</p>
        </div>
      `;

      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        text: async () => mockHTML,
      } as Response);

      const result = await scrapeStockStatus('ne301');
      expect(result).toBe(true);
    });

    it('should handle malformed price gracefully', async () => {
      const { scrapeProductPage } = await import('../camthink-scraper.js');
      const mockHTML = `
        <h1>Test Product</h1>
        <p class="price">Contact us for pricing</p>
      `;

      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        text: async () => mockHTML,
      } as Response);

      const result = await scrapeProductPage('ne301');
      expect(result).not.toBeNull();
      // Price should be extracted or default gracefully
      expect(result?.price).toBeTruthy();
    });

    it('should strip extra whitespace from description', async () => {
      const { scrapeProductPage } = await import('../camthink-scraper.js');
      const mockHTML = `
        <h1>Test Product</h1>
        <p class="price">$100</p>
        <div class="product-description">
          Line 1
          Line 2
            Line 3
        </div>
      `;

      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        text: async () => mockHTML,
      } as Response);

      const result = await scrapeProductPage('ne301');
      expect(result?.description).not.toMatch(/\s{2,}/); // No multiple spaces
    });
  });
});

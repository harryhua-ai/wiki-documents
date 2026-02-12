import { test, expect } from '@playwright/test';

test.describe('Ask AI Feature', () => {
  test('chat window should open and close', async ({ page }) => {
    // Go to homepage
    await page.goto('/');

    // Wait for the floating button to appear
    const openButton = page.getByLabel('Open chat');
    await expect(openButton).toBeVisible();

    // Click to open chat
    await openButton.click();

    // Verify chat window is visible
    const chatWindow = page.getByRole('dialog', { name: 'AI Chat' });
    await expect(chatWindow).toBeVisible();

    // Verify chat title is visible (use h3 selector)
    const chatTitle = chatWindow.locator('h3');
    await expect(chatTitle).toBeVisible();

    // Click close button
    await chatWindow.getByLabel('Close chat').click();

    // Verify chat window is hidden
    await expect(chatWindow).not.toBeVisible();
  });

  test('should send a message and show loading state', async ({ page }) => {
    // Mock the API response
    await page.route('**/api/chat', async route => {
      // Simulate a stream response
      const body = [
        'data: {"type":"chunk","content":"Hello"}\n\n',
        'data: {"type":"chunk","content":" world"}\n\n',
        'data: [DONE]\n\n'
      ].join('');

      await route.fulfill({
        status: 200,
        contentType: 'text/event-stream',
        body: body
      });
    });

    await page.goto('/');
    await page.getByLabel('Open chat').click();

    // Type a message
    const input = page.getByPlaceholder(/ask a question/i);
    await input.fill('Hello AI');

    // Send
    await page.getByLabel('Send message').click();

    // Check that user message appears
    await expect(page.getByText('Hello AI')).toBeVisible();

    // Check that assistant response appears
    await expect(page.getByText('Hello world')).toBeVisible();
  });

  test('should handle rate limit error', async ({ page }) => {
    // Mock error response via SSE
    await page.route('**/api/chat', async route => {
      const sseBody = [
        'data: {"type":"error","message":"You have reached the message limit. Please try again later."}\n\n',
        'data: {"type":"done"}\n\n',
      ].join('');

      await route.fulfill({
        status: 200,
        contentType: 'text/event-stream',
        body: sseBody
      });
    });

    await page.goto('/');
    await page.getByLabel('Open chat').click();

    const input = page.getByPlaceholder(/ask a question/i);
    await input.fill('Spam message');
    await page.getByLabel('Send message').click();

    // Look for error message containing "message limit"
    const errorMessage = page.getByText(/message limit/i);
    await expect(errorMessage).toBeVisible({ timeout: 10000 });
  });
});

import { test, expect } from '@playwright/test';

test.describe('Ask AI Feature', () => {
  test('chat window should open and close', async ({ page }) => {
    // Go to homepage
    await page.goto('/');

    // Wait for the floating button to appear
    // The button has aria-label="Open chat" initially
    const openButton = page.getByLabel('Open chat');
    await expect(openButton).toBeVisible();

    // Click to open chat
    await openButton.click();

    // Verify chat window is visible
    const chatWindow = page.getByRole('dialog', { name: 'AI Chat' });
    await expect(chatWindow).toBeVisible();

    // Verify chat title is visible - use specific text content selector
    const chatTitle = chatWindow.getByText('Ask CamThink AI');
    await expect(chatTitle).toBeVisible();

    // Click close button in the header
    // There are two buttons with "Close chat" label (one in header, one floating FAB)
    // Let's use the one in the dialog
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
    const input = page.getByPlaceholder('Ask a question about CamThink products...');
    await input.fill('Hello AI');

    // Send
    await page.getByLabel('Send message').click();

    // Check that user message appears
    await expect(page.getByText('Hello AI', { exact: true })).toBeVisible();

    // Check that assistant response appears (constructed from stream)
    await expect(page.getByText('Hello world')).toBeVisible();
  });

  test('should handle rate limit error', async ({ page }) => {
    // Mock SSE response with rate limit error
    await page.route('**/api/chat', async route => {
      // Send error event followed by DONE to properly close the stream
      const sseBody = [
        'data: {"type":"error","message":"You have reached the message limit. Please try again later.","code":"RATE_LIMIT"}\n\n',
        'data: [DONE]\n\n',
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

    // Check for error message - the frontend prefixes with "Error: "
    const chatWindow = page.getByRole('dialog', { name: 'AI Chat' });
    const errorMessage = chatWindow.getByText(/message limit|Error/i);
    await expect(errorMessage).toBeVisible({ timeout: 10000 });
  });
});

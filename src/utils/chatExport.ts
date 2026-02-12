import { Message } from '../hooks/useChat';

export type ExportFormat = 'markdown' | 'json' | 'txt';

/**
 * Format timestamp to locale string
 */
const formatTime = (timestamp: number): string => {
  return new Date(timestamp).toLocaleString();
};

/**
 * Generate markdown content from messages
 */
const generateMarkdown = (messages: Message[], sessionId: string): string => {
  const title = `# Chat Export - ${new Date().toLocaleString()}\nSession ID: ${sessionId}\n\n`;

  const content = messages.map(msg => {
    const role = msg.role === 'user' ? '**User**' : '**AI Assistant**';
    const time = formatTime(msg.timestamp);
    let text = `${role} (${time}):\n\n${msg.content}\n\n`;

    if (msg.sources && msg.sources.length > 0) {
      text += `> Sources:\n${msg.sources.map((s, i) => `> ${i + 1}. [${s.title}](${s.url})`).join('\n')}\n\n`;
    }

    return text;
  }).join('---\n\n');

  return title + content;
};

/**
 * Generate plain text content from messages
 */
const generateTxt = (messages: Message[], sessionId: string): string => {
  const title = `Chat Export - ${new Date().toLocaleString()}\nSession ID: ${sessionId}\n\n================================\n\n`;

  const content = messages.map(msg => {
    const role = msg.role === 'user' ? 'User' : 'AI Assistant';
    const time = formatTime(msg.timestamp);
    let text = `[${role} - ${time}]\n${msg.content}\n`;

    if (msg.sources && msg.sources.length > 0) {
      text += `\nSources:\n${msg.sources.map((s, i) => `${i + 1}. ${s.title} (${s.url})`).join('\n')}\n`;
    }

    return text;
  }).join('\n--------------------------------\n\n');

  return title + content;
};

/**
 * Download content as file
 */
const downloadFile = (content: string, filename: string, type: string) => {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

/**
 * Export chat history
 */
export const exportChatHistory = (
  messages: Message[],
  sessionId: string,
  format: ExportFormat = 'markdown'
) => {
  const timestamp = new Date().toISOString().slice(0, 10);
  const prefix = 'camthink-ai-chat';

  switch (format) {
    case 'markdown':
      downloadFile(
        generateMarkdown(messages, sessionId),
        `${prefix}-${timestamp}.md`,
        'text/markdown'
      );
      break;
    case 'json':
      downloadFile(
        JSON.stringify({ sessionId, exportedAt: new Date().toISOString(), messages }, null, 2),
        `${prefix}-${timestamp}.json`,
        'application/json'
      );
      break;
    case 'txt':
      downloadFile(
        generateTxt(messages, sessionId),
        `${prefix}-${timestamp}.txt`,
        'text/plain'
      );
      break;
  }
};

import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Message } from '../../hooks/useChat';
import { exportChatHistory, ExportFormat } from '../chatExport';

// Mock the DOM and download functionality
const mockBlob = { size: 0, type: '', text: () => Promise.resolve('') };
global.Blob = class {
  constructor(public parts: unknown[], public options: { type: string }) {
    mockBlob.size = parts.length;
    mockBlob.type = options.type;
  }
} as any;

global.URL.createObjectURL = vi.fn(() => 'blob:mock-url');
global.URL.revokeObjectURL = vi.fn();

describe('chatExport', () => {
  let mockAnchor: HTMLAnchorElement;
  let createElementSpy: ReturnType<typeof vi.spyOn>;
  let removeChildSpy: ReturnType<typeof vi.spyOn>;

  const mockMessages: Message[] = [
    {
      id: '1',
      role: 'user',
      content: 'What is NeoEdge?',
      timestamp: 1234567890000,
    },
    {
      id: '2',
      role: 'assistant',
      content: 'NeoEdge is a high-performance edge AI platform.',
      timestamp: 1234567891000,
    },
  ];

  beforeEach(() => {
    // Reset all mocks
    vi.clearAllMocks();

    // Mock document.createElement and appendChild/removeChild
    mockAnchor = {
      href: '',
      download: '',
      click: vi.fn(),
    } as unknown as HTMLAnchorElement;

    createElementSpy = vi.spyOn(document, 'createElement').mockReturnValue(mockAnchor);
    vi.spyOn(document.body, 'appendChild').mockImplementation(() => mockAnchor as Node);
    removeChildSpy = vi.spyOn(document.body, 'removeChild').mockImplementation(() => mockAnchor as Node);
  });

  describe('exportChatHistory', () => {
    it('should export as markdown and trigger download', () => {
      exportChatHistory(mockMessages, 'session-123', 'markdown');

      expect(createElementSpy).toHaveBeenCalledWith('a');
      expect(mockAnchor.download).toMatch(/camthink-ai-chat-.*\.md/);
      expect(mockAnchor.href).toBe('blob:mock-url');
      expect(mockAnchor.click).toHaveBeenCalled();
      expect(removeChildSpy).toHaveBeenCalledWith(mockAnchor);
    });

    it('should export as JSON and trigger download', () => {
      exportChatHistory(mockMessages, 'session-123', 'json');

      expect(createElementSpy).toHaveBeenCalledWith('a');
      expect(mockAnchor.download).toMatch(/camthink-ai-chat-.*\.json/);
      expect(mockAnchor.href).toBe('blob:mock-url');
      expect(mockAnchor.click).toHaveBeenCalled();
    });

    it('should export as plain text and trigger download', () => {
      exportChatHistory(mockMessages, 'session-123', 'txt');

      expect(createElementSpy).toHaveBeenCalledWith('a');
      expect(mockAnchor.download).toMatch(/camthink-ai-chat-.*\.txt/);
      expect(mockAnchor.href).toBe('blob:mock-url');
      expect(mockAnchor.click).toHaveBeenCalled();
    });

    it('should default to markdown format', () => {
      exportChatHistory(mockMessages, 'session-123');

      expect(createElementSpy).toHaveBeenCalledWith('a');
      expect(mockAnchor.download).toMatch(/\.md$/);
    });

    it('should handle empty messages', () => {
      exportChatHistory([], 'session-empty', 'markdown');

      expect(createElementSpy).toHaveBeenCalledWith('a');
      expect(mockAnchor.click).toHaveBeenCalled();
    });
  });
});

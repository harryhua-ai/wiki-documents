import type { Message, MessageSource } from '../../../hooks/useChat';

export const mockSources: MessageSource[] = [
  {
    title: 'Test Document 1',
    url: 'https://example.com/doc1',
    section: 'Introduction',
  },
  {
    title: 'Test Document 2',
    url: 'https://example.com/doc2',
  },
];

export const mockUserMessage: Message = {
  id: 'msg-1',
  role: 'user',
  content: 'How do I install the driver?',
  timestamp: 1625000000000,
};

export const mockAssistantMessage: Message = {
  id: 'msg-2',
  role: 'assistant',
  content: 'You can install the driver by running `apt install driver`.',
  sources: mockSources,
  timestamp: 1625000001000,
};

export const mockAssistantMessageWithFeedback: Message = {
  ...mockAssistantMessage,
  id: 'msg-3',
  feedback: 'up',
};

export const mockStreamingMessage: Message = {
  id: 'msg-4',
  role: 'assistant',
  content: 'Generating response...',
  timestamp: 1625000002000,
};

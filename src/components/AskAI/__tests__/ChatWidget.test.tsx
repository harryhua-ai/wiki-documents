import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import ChatWidget from '../ChatWidget';
import { useChat } from '../../../hooks/useChat';
import { vi } from 'vitest';

// Mock child components to avoid deep rendering issues
vi.mock('../ChatWindow', () => ({
  default: ({ isOpen, onClose, onSendMessage }: any) =>
    isOpen ? (
      <div data-testid="chat-window">
        <button onClick={onClose}>Close</button>
        <button onClick={() => onSendMessage('Hello')}>Send Message</button>
      </div>
    ) : null,
}));

vi.mock('../ChatButton', () => ({
  default: ({ isOpen, onClick }: any) => (
    <button data-testid="chat-button" onClick={onClick}>
      {isOpen ? 'Close Chat' : 'Open Chat'}
    </button>
  ),
}));

// Mock useChat hook
vi.mock('../../../hooks/useChat');

describe('ChatWidget', () => {
  const mockUseChat = useChat as unknown as ReturnType<typeof vi.fn>;

  const defaultChatState = {
    isOpen: false,
    isLoading: false,
    messages: [],
    streamingContent: '',
    routingPath: null,
    agentStep: null,
    toolCalls: [],
    suggestions: [],
    toggleChat: vi.fn(),
    closeChat: vi.fn(),
    sendMessage: vi.fn(),
    submitFeedback: vi.fn(),
    resetSession: vi.fn(),
    exportChat: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseChat.mockReturnValue(defaultChatState);
  });

  it('renders chat button initially', () => {
    render(<ChatWidget />);
    expect(screen.getByTestId('chat-button')).toBeInTheDocument();
    expect(screen.queryByTestId('chat-window')).not.toBeInTheDocument();
  });

  it('renders chat window when open', () => {
    mockUseChat.mockReturnValue({
      ...defaultChatState,
      isOpen: true,
    });

    render(<ChatWidget />);
    expect(screen.getByTestId('chat-window')).toBeInTheDocument();
  });

  it('toggles chat when button is clicked', () => {
    render(<ChatWidget />);
    fireEvent.click(screen.getByTestId('chat-button'));
    expect(defaultChatState.toggleChat).toHaveBeenCalled();
  });

  it('closes chat when close button in window is clicked', () => {
    mockUseChat.mockReturnValue({
      ...defaultChatState,
      isOpen: true,
    });

    render(<ChatWidget />);
    fireEvent.click(screen.getByText('Close'));
    expect(defaultChatState.closeChat).toHaveBeenCalled();
  });

  it('sends message when interacting with window', () => {
    mockUseChat.mockReturnValue({
      ...defaultChatState,
      isOpen: true,
    });

    render(<ChatWidget />);
    fireEvent.click(screen.getByText('Send Message'));
    expect(defaultChatState.sendMessage).toHaveBeenCalledWith('Hello');
  });

  it('closes on Escape key press', () => {
    mockUseChat.mockReturnValue({
      ...defaultChatState,
      isOpen: true,
    });

    render(<ChatWidget />);
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(defaultChatState.closeChat).toHaveBeenCalled();
  });

  it('does not close on Escape key if not open', () => {
    render(<ChatWidget />);
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(defaultChatState.closeChat).not.toHaveBeenCalled();
  });
});

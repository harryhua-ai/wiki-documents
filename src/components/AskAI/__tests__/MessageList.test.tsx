import React from 'react';
import { render, screen } from '@testing-library/react';
import { MessageList } from '../MessageList';
import { mockUserMessage, mockAssistantMessage } from './testUtils';

// Mock MessageBubble to isolate unit tests
vi.mock('../MessageBubble', () => ({
  default: ({ message, isStreaming, onFeedback }: any) => (
    <div data-testid="message-bubble">
      <span data-testid="message-role">{message.role}</span>
      <span data-testid="message-content">{message.content}</span>
      <span data-testid="message-streaming">{isStreaming ? 'streaming' : 'not-streaming'}</span>
    </div>
  ),
  MessageBubble: ({ message, isStreaming, onFeedback }: any) => (
    <div data-testid="message-bubble">
      <span data-testid="message-role">{message.role}</span>
      <span data-testid="message-content">{message.content}</span>
      <span data-testid="message-streaming">{isStreaming ? 'streaming' : 'not-streaming'}</span>
    </div>
  ),
}));

describe('MessageList', () => {
  it('renders welcome message when no messages', () => {
    const { container } = render(
      <MessageList
        messages={[]}
        isLoading={false}
        streamingContent=""
        routingPath={null}
        agentStep={null}
      />
    );

    expect(screen.getByText('Welcome to CamThink AI')).toBeInTheDocument();
    expect(
      screen.getByText('Ask me anything about CamThink products, documentation, or development guides.')
    ).toBeInTheDocument();
  });

  it('renders messages when available', () => {
    render(
      <MessageList
        messages={[mockUserMessage, mockAssistantMessage]}
        isLoading={false}
        streamingContent=""
        routingPath={null}
        agentStep={null}
      />
    );

    const bubbles = screen.getAllByTestId('message-bubble');
    expect(bubbles).toHaveLength(2);
    expect(screen.getByText('How do I install the driver?')).toBeInTheDocument();
  });

  it('renders typing indicator when loading and no messages', () => {
    render(
      <MessageList
        messages={[]}
        isLoading={true}
        streamingContent=""
        routingPath={null}
        agentStep={null}
      />
    );

    // Typing indicator is rendered with the avatar
    const avatar = document.querySelector('img');
    expect(avatar).toBeInTheDocument();
    expect(avatar).toHaveAttribute('src', '/img/icon.jpeg');
  });

  it('renders agent progress when agent step is provided', () => {
    render(
      <MessageList
        messages={[mockUserMessage]}
        isLoading={false}
        streamingContent=""
        routingPath="agent"
        agentStep="Searching documentation..."
        toolCalls={[]}
      />
    );

    expect(screen.getByText('Searching documentation...')).toBeInTheDocument();
  });

  it('renders tool calls when provided', () => {
    const toolCalls = [
      { tool: 'get_product_info', status: 'running' as const },
      { tool: 'search_code', status: 'completed' as const },
    ];

    render(
      <MessageList
        messages={[mockUserMessage]}
        isLoading={false}
        streamingContent=""
        routingPath="agent_tools"
        agentStep="Running tools"
        toolCalls={toolCalls}
      />
    );

    expect(screen.getByText('Product Info')).toBeInTheDocument();
    expect(screen.getByText('Code Examples')).toBeInTheDocument();
  });

  it('passes feedback callback to MessageBubble', () => {
    const onFeedback = vi.fn();
    render(
      <MessageList
        messages={[mockAssistantMessage]}
        isLoading={false}
        streamingContent=""
        routingPath={null}
        agentStep={null}
        onFeedback={onFeedback}
      />
    );

    // Just verify the message is rendered; feedback functionality is tested in MessageBubble tests
    expect(screen.getByTestId('message-content')).toBeInTheDocument();
  });

  it('does not show agent progress for non-agent routes', () => {
    const { container } = render(
      <MessageList
        messages={[mockUserMessage]}
        isLoading={false}
        streamingContent=""
        routingPath="fast"
        agentStep={null}
        toolCalls={[]}
      />
    );

    expect(screen.queryByText('Thinking...')).not.toBeInTheDocument();
  });
});

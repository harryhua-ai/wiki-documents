import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { MessageBubble } from '../MessageBubble';
import { mockUserMessage, mockAssistantMessage, mockAssistantMessageWithFeedback } from './testUtils';
import { vi } from 'vitest';

// Mock child components to isolate unit test
vi.mock('../MarkdownRenderer', () => ({
  default: ({ content }: { content: string }) => <div data-testid="markdown-content">{content}</div>,
  MarkdownRenderer: ({ content }: { content: string }) => <div data-testid="markdown-content">{content}</div>,
}));

vi.mock('../SourceReference', () => ({
  default: ({ sources }: { sources: any[] }) => <div data-testid="source-reference">Sources: {sources.length}</div>,
  SourceReference: ({ sources }: { sources: any[] }) => <div data-testid="source-reference">Sources: {sources.length}</div>,
}));

vi.mock('../FeedbackModal', () => ({
  default: ({ isOpen, onSubmit }: { isOpen: boolean; onSubmit: any }) =>
    isOpen ? (
      <div data-testid="feedback-modal">
        <button onClick={() => onSubmit('inaccurate', 'Test comment')}>Submit Feedback</button>
      </div>
    ) : null,
  FeedbackModal: ({ isOpen, onSubmit }: { isOpen: boolean; onSubmit: any }) =>
    isOpen ? (
      <div data-testid="feedback-modal">
        <button onClick={() => onSubmit('inaccurate', 'Test comment')}>Submit Feedback</button>
      </div>
    ) : null,
}));

describe('MessageBubble', () => {
  it('renders user message correctly', () => {
    render(<MessageBubble message={mockUserMessage} />);
    expect(screen.getByText(mockUserMessage.content)).toBeInTheDocument();
    expect(screen.queryByTestId('avatar')).not.toBeInTheDocument();
  });

  it('renders assistant message correctly', () => {
    render(<MessageBubble message={mockAssistantMessage} />);
    expect(screen.getByTestId('markdown-content')).toHaveTextContent(mockAssistantMessage.content);
    expect(screen.getByTestId('source-reference')).toBeInTheDocument();
  });

  it('renders feedback buttons for assistant message', () => {
    render(<MessageBubble message={mockAssistantMessage} onFeedback={vi.fn()} />);
    expect(screen.getByLabelText('Helpful')).toBeInTheDocument();
    expect(screen.getByLabelText('Not helpful')).toBeInTheDocument();
  });

  it('calls onFeedback with "up" when thumbs up is clicked', () => {
    const onFeedbackSpy = vi.fn();
    render(<MessageBubble message={mockAssistantMessage} onFeedback={onFeedbackSpy} />);

    fireEvent.click(screen.getByLabelText('Helpful'));
    expect(onFeedbackSpy).toHaveBeenCalledWith(mockAssistantMessage.id, 'up');
  });

  it('opens feedback modal when thumbs down is clicked', () => {
    const onFeedbackSpy = vi.fn();
    render(<MessageBubble message={mockAssistantMessage} onFeedback={onFeedbackSpy} />);

    expect(screen.queryByTestId('feedback-modal')).not.toBeInTheDocument();

    fireEvent.click(screen.getByLabelText('Not helpful'));
    expect(screen.getByTestId('feedback-modal')).toBeInTheDocument();
  });

  it('submits detailed feedback from modal', () => {
    const onFeedbackSpy = vi.fn();
    render(<MessageBubble message={mockAssistantMessage} onFeedback={onFeedbackSpy} />);

    // Open modal
    fireEvent.click(screen.getByLabelText('Not helpful'));

    // Submit modal
    fireEvent.click(screen.getByText('Submit Feedback'));

    expect(onFeedbackSpy).toHaveBeenCalledWith(
      mockAssistantMessage.id,
      'down',
      'Test comment'
    );
  });

  it('shows active state for feedback', () => {
    render(<MessageBubble message={mockAssistantMessageWithFeedback} onFeedback={vi.fn()} />);
    // Check if the class is applied (implementation detail, but visual regression usually covers this)
    // Here we assume active button might have specific aria state or class
    const upButton = screen.getByLabelText('Helpful');
    expect(upButton.className).toContain('feedbackActive');
  });
});

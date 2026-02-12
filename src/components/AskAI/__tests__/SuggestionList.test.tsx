import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { SuggestionList } from '../SuggestionList';

describe('SuggestionList', () => {
  const mockOnSelectSuggestion = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders default suggestions when none provided', () => {
    render(<SuggestionList onSelectSuggestion={mockOnSelectSuggestion} isLoading={false} />);

    expect(screen.getByText('How do I get started with NeoEdge?')).toBeInTheDocument();
    expect(screen.getByText('What are the key features of NeoEyes?')).toBeInTheDocument();
    expect(screen.getByText('How do I deploy AI models to the device?')).toBeInTheDocument();
    expect(screen.getByText('Common issues and troubleshooting tips')).toBeInTheDocument();
  });

  it('renders custom suggestions when provided', () => {
    const customSuggestions = ['Custom suggestion 1', 'Custom suggestion 2'];
    render(
      <SuggestionList
        suggestions={customSuggestions}
        onSelectSuggestion={mockOnSelectSuggestion}
        isLoading={false}
      />
    );

    expect(screen.getByText('Custom suggestion 1')).toBeInTheDocument();
    expect(screen.getByText('Custom suggestion 2')).toBeInTheDocument();
  });

  it('calls onSelectSuggestion when suggestion is clicked', () => {
    render(<SuggestionList onSelectSuggestion={mockOnSelectSuggestion} isLoading={false} />);

    fireEvent.click(screen.getByText('How do I get started with NeoEdge?'));
    expect(mockOnSelectSuggestion).toHaveBeenCalledWith('How do I get started with NeoEdge?');
  });

  it('does not render when loading', () => {
    const { container } = render(
      <SuggestionList onSelectSuggestion={mockOnSelectSuggestion} isLoading={true} />
    );

    expect(container.firstChild).toBe(null);
  });

  it('disables buttons when loading', () => {
    render(<SuggestionList onSelectSuggestion={mockOnSelectSuggestion} isLoading={false} />);

    const buttons = screen.getAllByRole('button');
    buttons.forEach((button) => {
      expect(button).not.toBeDisabled();
    });
  });
});

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import ChatButton from '../ChatButton';

describe('ChatButton', () => {
  it('renders chat icon when closed', () => {
    render(<ChatButton isOpen={false} onClick={() => {}} />);
    const button = screen.getByLabelText('Open chat');
    expect(button).toBeInTheDocument();
    expect(button).toHaveAttribute('type', 'button');
  });

  it('renders close icon when open', () => {
    render(<ChatButton isOpen={true} onClick={() => {}} />);
    const button = screen.getByLabelText('Close chat');
    expect(button).toBeInTheDocument();
  });

  it('calls onClick when clicked', () => {
    const handleClick = vi.fn();
    render(<ChatButton isOpen={false} onClick={handleClick} />);

    fireEvent.click(screen.getByLabelText('Open chat'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('applies custom className', () => {
    render(<ChatButton isOpen={false} onClick={() => {}} className="custom-class" />);
    const button = screen.getByLabelText('Open chat');
    expect(button.className).toContain('custom-class');
  });

  it('has correct ARIA label when closed', () => {
    render(<ChatButton isOpen={false} onClick={() => {}} />);
    expect(screen.getByLabelText('Open chat')).toBeInTheDocument();
  });

  it('has correct ARIA label when open', () => {
    render(<ChatButton isOpen={true} onClick={() => {}} />);
    expect(screen.getByLabelText('Close chat')).toBeInTheDocument();
  });
});

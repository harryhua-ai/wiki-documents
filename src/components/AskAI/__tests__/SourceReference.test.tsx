import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { SourceReference } from '../SourceReference';
import { mockSources } from './testUtils';
import { vi } from 'vitest';

// Mock Docusaurus Context
vi.mock('@docusaurus/ExecutionEnvironment', () => ({
  default: {
    canUseDOM: true,
  },
}));

describe('SourceReference', () => {
  it('renders nothing when no sources are provided', () => {
    const { container } = render(<SourceReference sources={[]} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('renders source count correctly', () => {
    render(<SourceReference sources={mockSources} />);
    expect(screen.getByText('Sources')).toBeInTheDocument();
    expect(screen.getByText(`(${mockSources.length})`)).toBeInTheDocument();
  });

  it('toggles details when clicked', () => {
    render(<SourceReference sources={mockSources} />);
    const details = screen.getByRole('group'); // <details> usually has group role or implicit
    // Since details role support varies, we check the attribute
    expect(details).not.toHaveAttribute('open');

    const summary = screen.getByText('Sources');
    fireEvent.click(summary);

    // In JSDOM, click on summary toggles open attribute usually
    // If not, we might need to manually set it for the test or verify the summary interaction
    expect(details).toHaveAttribute('open');
  });

  it('opens link in new tab when clicked', () => {
    const windowOpenSpy = vi.spyOn(window, 'open').mockImplementation(() => null);
    render(<SourceReference sources={mockSources} />);

    // Expand first
    fireEvent.click(screen.getByText('Sources'));

    const firstLink = screen.getByText('Test Document 1');
    fireEvent.click(firstLink);

    expect(windowOpenSpy).toHaveBeenCalledWith(
      'https://example.com/doc1',
      '_blank',
      'noopener,noreferrer'
    );

    windowOpenSpy.mockRestore();
  });
});

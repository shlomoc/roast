import React from 'react';
import { render, screen } from '@testing-library/react';
import { Button } from '@/components/ui/button';

describe('Button Component', () => {
  test('renders button with children', () => {
    render(<Button>Click Me</Button>);
    const buttonElement = screen.getByText(/click me/i);
    expect(buttonElement).toBeInTheDocument();
  });

  it('renders as a child component when asChild prop is true', () => {
    render(
      <Button asChild>
        <a href="/test">Test Link</a>
      </Button>
    );
    const linkElement = screen.getByRole('link', { name: /test link/i });
    expect(linkElement).toBeInTheDocument();
    expect(linkElement.tagName).toBe('A');
    // Check if button-like classes are applied (variant, size)
    // This depends on the actual classes applied by cva
    // For example, if default variant applies 'bg-primary':
    // expect(linkElement).toHaveClass('bg-primary'); 
    // More robustly, check for a class that is always there from buttonVariants
    expect(linkElement).toHaveClass('inline-flex'); // From base styles in buttonVariants
  });
}); 
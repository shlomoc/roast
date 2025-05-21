import React from 'react';
import { render, screen } from '@testing-library/react';
import { Button } from './button'; // Adjust the import path as needed

describe('Button Component', () => {
  test('renders button with children', () => {
    render(<Button>Click Me</Button>);
    const buttonElement = screen.getByText(/click me/i);
    expect(buttonElement).toBeInTheDocument();
  });
});

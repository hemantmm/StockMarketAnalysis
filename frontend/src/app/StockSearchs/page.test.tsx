
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    prefetch: jest.fn(),
    replace: jest.fn(),
    refresh: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
  }),
}));

import Page from './page';

describe('StockSearchs Page', () => {
  it('renders without crashing', () => {
    render(<Page />);
    expect(screen.getByText(/stock search & analysis/i)).toBeInTheDocument();
  });

  it('renders search input', () => {
    render(<Page />);
    expect(screen.getByPlaceholderText(/enter stock symbol/i)).toBeInTheDocument();
  });

  it('allows user to type in search input', () => {
    render(<Page />);
    const input = screen.getByPlaceholderText(/enter stock symbol/i);
    fireEvent.change(input, { target: { value: 'AAPL' } });
    expect(input).toHaveValue('AAPL');
  });
});

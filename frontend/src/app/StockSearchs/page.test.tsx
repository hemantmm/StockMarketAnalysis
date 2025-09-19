import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import Page from './page';

describe('StockSearchs Page', () => {
  it('renders without crashing', () => {
    render(<Page />);
    // Replace with actual heading or label from your component
    expect(screen.getByText(/stock/i)).toBeInTheDocument();
  });

  it('renders search input', () => {
    render(<Page />);
    // Replace with actual placeholder or label from your input
    expect(screen.getByPlaceholderText(/search/i)).toBeInTheDocument();
  });

  it('allows user to type in search input', () => {
    render(<Page />);
    const input = screen.getByPlaceholderText(/search/i);
    fireEvent.change(input, { target: { value: 'AAPL' } });
    expect(input).toHaveValue('AAPL');
  });

  // Add more tests for search results, API calls, error handling, etc.
  // For example:
  // it('shows results after searching', async () => {
  //   // Mock API, trigger search, assert results
  // });
});

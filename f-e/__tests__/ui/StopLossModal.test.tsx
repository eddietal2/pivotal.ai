import React from 'react';
import '@testing-library/jest-dom';
import { render, screen, fireEvent } from '@testing-library/react';
import App from '@/app/home/page';

describe('Stop Loss modal flow', () => {
  test('clicking stop loss opens modal and shows content', () => {
    render(<App />);
    const stopLossBtn = screen.getByTestId('stop-loss-open-btn');
    expect(stopLossBtn).toBeInTheDocument();
    fireEvent.click(stopLossBtn);
    expect(screen.getByText('Stop Loss Reminder')).toBeInTheDocument();
    expect(screen.getByText(/A stop loss is an order designed to limit an investor’s loss/i)).toBeInTheDocument();
    // Close modal
    fireEvent.click(screen.getByLabelText('Close modal'));
  });
});

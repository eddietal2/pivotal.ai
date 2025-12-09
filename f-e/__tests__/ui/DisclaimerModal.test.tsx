import React from 'react';
import '@testing-library/jest-dom';
import { render, screen, fireEvent } from '@testing-library/react';
import App from '@/app/home/page';

describe('Disclaimer modal flow', () => {
  test('clicking disclaimer alert opens disclaimer modal and content is present', () => {
    render(<App />);
    // The interactive disclaimer alert should exist
    const disclaimerAlert = screen.getByLabelText('Open disclaimer details');
    expect(disclaimerAlert).toBeInTheDocument();
    // Click the alert to open the modal
    fireEvent.click(disclaimerAlert);
    // The modal title should be visible
    expect(screen.getByText('Legal Disclaimer')).toBeInTheDocument();
    // Expect content sections to be present (one sample check)
    expect(screen.getByText(/No Financial Advice/i)).toBeInTheDocument();
    // Close the modal using the close button
    fireEvent.click(screen.getByLabelText('Close modal'));
  });
});

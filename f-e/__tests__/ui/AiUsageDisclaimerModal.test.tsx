import React from 'react';
import '@testing-library/jest-dom';
import { render, screen, fireEvent } from '@testing-library/react';
import App from '@/app/home/page';

describe('AI Usage modal flow', () => {
  test('clicking AI Usage opens modal and shows content', () => {
    render(<App />);
    const aiBtn = screen.getByTestId('ai-usage-open-btn');
    expect(aiBtn).toBeInTheDocument();
    fireEvent.click(aiBtn);
    expect(screen.getByText('AI Usage')).toBeInTheDocument();
    expect(screen.getByText(/This application uses language models/i)).toBeInTheDocument();
    expect(screen.getByText(/LLMs are probabilistic/i)).toBeInTheDocument();
    fireEvent.click(screen.getByLabelText('Close modal'));
  });
});

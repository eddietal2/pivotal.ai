import '@testing-library/jest-dom';
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ToastProvider, useToast } from '@/components/context/ToastContext';

function TestTrigger() {
  const { showToast, hideToast } = useToast();
  return (
    <div>
      <button onClick={() => showToast('Hello', 'success', 10000)}>Show Toast</button>
      <button onClick={() => {/* no-op */}}>No-op</button>
    </div>
  );
}

describe('ToastContext', () => {
  test('toast container is not rendered when no toasts are present', () => {
    render(
      <ToastProvider>
        <div>child</div>
      </ToastProvider>
    );
    expect(screen.queryByTestId('toast-container')).not.toBeInTheDocument();
  });

  test('shows container when a toast is added and hides after closing', async () => {
    render(
      <ToastProvider>
        <TestTrigger />
      </ToastProvider>
    );

    expect(screen.queryByTestId('toast-container')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Show Toast/i }));
    // container should appear
    const container = await screen.findByTestId('toast-container');
    expect(container).toBeInTheDocument();

    // There should be a toast with the message
    expect(screen.getByText(/Hello/)).toBeInTheDocument();

    // Close the toast using the close button in the Toast (button aria label 'Close notification')
    const closeBtn = screen.getByRole('button', { name: /Close notification/i });
    fireEvent.click(closeBtn);

    // Wait for the toast to be removed and container to disappear
    await waitFor(() => expect(screen.queryByTestId('toast-container')).not.toBeInTheDocument());
  });
});

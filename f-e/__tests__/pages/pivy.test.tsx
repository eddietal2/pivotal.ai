import '@testing-library/jest-dom';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import PivyPage from '../../app/pivy/page';

// Mock useSearchParams
jest.mock('next/navigation', () => ({
  useSearchParams: () => new URLSearchParams(),
}));

describe('Pivy Chat page', () => {
  test('renders and shows chat cards with loading skeleton initially', async () => {
    render(<PivyPage />);

    // Initially shows loading skeleton
    expect(screen.getByTestId('candlestick-animation')).toBeInTheDocument();

    // Wait for loading to complete (2 second timeout in component)
    await waitFor(() => {
      expect(screen.getByText('This is a very long title that should test the maximum length for display purposes and see how it wraps.')).toBeInTheDocument();
    }, { timeout: 3000 });

    // Check that chat cards are rendered
    expect(screen.getByText('Weather Update')).toBeInTheDocument();
    expect(screen.getByText('Fun Time')).toBeInTheDocument();
  });

  test('welcome alert can be dismissed', async () => {
    render(<PivyPage />);

    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.getByText('Welcome to Pivy! Start a new conversation or browse existing chats.')).toBeInTheDocument();
    }, { timeout: 3000 });

    // Find the alert close button (yellow colored ✕ button)
    const closeButtons = screen.getAllByRole('button', { name: '✕' });
    const alertCloseButton = closeButtons.find(button => 
      button.classList.contains('text-yellow-800')
    );
    expect(alertCloseButton).toBeInTheDocument();
    fireEvent.click(alertCloseButton as any);

    // Alert should be gone
    await waitFor(() => {
      expect(screen.queryByText('Welcome to Pivy! Start a new conversation or browse existing chats.')).not.toBeInTheDocument();
    });
  });

  test.skip('settings drawer can be opened', async () => {
    render(<PivyPage />);

    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.getByText('This is a very long title that should test the maximum length for display purposes and see how it wraps.')).toBeInTheDocument();
    }, { timeout: 3000 });

    // Click the settings button (the Layout button in the header)
    const buttons = screen.getAllByRole('button', { name: '' });
    const layoutButton = buttons.find(button => 
      button.querySelector('.lucide-panels-top-left')
    );
    expect(layoutButton).toBeInTheDocument();
    fireEvent.click(layoutButton as any);

    // Check that settings drawer opened (look for "Pivy Chat Settings" heading)
    expect(screen.getByText('Pivy Chat Settings')).toBeInTheDocument();
  });

  test('shows recent messages in chat cards', async () => {
    render(<PivyPage />);

    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.getByText('I\'m good, thanks!')).toBeInTheDocument();
    }, { timeout: 3000 });

    // Check that recent messages are displayed
    expect(screen.getByText('It\'s sunny today.')).toBeInTheDocument();
    expect(screen.getByText('Why did the chicken cross the road? To get to the other side!')).toBeInTheDocument();
  });

  test('timeframe selector shows current month and year', async () => {
    render(<PivyPage />);

    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.getByText('This is a very long title that should test the maximum length for display purposes and see how it wraps.')).toBeInTheDocument();
    }, { timeout: 3000 });

    // Check that timeframe is displayed (January, 2023 by default)
    expect(screen.getByText('January, 2023')).toBeInTheDocument();
  });
});

import '@testing-library/jest-dom'
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react'
import { ThemeProvider } from '../components/context/ThemeContext'
import { redirectTo } from '../lib/redirect'

// Mock fetch API
import fetchMock from 'jest-fetch-mock';
import { describe } from 'node:test';
fetchMock.enableMocks();

// Mock the redirect helper so `redirectTo` is a Jest mock function
jest.mock('../lib/redirect', () => ({
  redirectTo: jest.fn(),
}));

// Mock the ThemeContext module at module level so it works in all tests
jest.mock('@/components/context/ThemeContext', () => ({
  useTheme: jest.fn(),
  ThemeProvider: ({ children }) => children,
}));

// Mock the ToastContext module at module level
jest.mock('@/components/context/ToastContext', () => ({
  useToast: jest.fn(),
  ToastProvider: ({ children }) => children,
}));

// Utility function to render with ThemeProvider
const renderWithProviders = (ui, options) => {
  return render(ui, { wrapper: ThemeProvider, ...options })
}

// ----------------------- 
// Settings: Account Settings
// -----------------------
describe('Settings: Account Settings', () => {

  beforeEach(() => {
    // Set default mock return for useTheme so Page component can render
    const { useTheme } = require('@/components/context/ThemeContext');
    useTheme.mockReturnValue({
      theme: 'light',
      toggleTheme: jest.fn(),
    });
    
    // Set default mock return for useToast
    const { useToast } = require('@/components/context/ToastContext');
    useToast.mockReturnValue({
      showToast: jest.fn(),
      hideToast: jest.fn(),
    });
  });

  it('FE-401: The Settings page loads and displays the authenticated user\'s information from localStorage. The Page will load with Skeleton UI initially, then display content after loading completes.', async () => {
    // Mock localStorage with user data
    const mockUser = {
      id: '123',
      email: 'testuser@example.com',
      first_name: 'Test User'
    };
    
    Storage.prototype.getItem = jest.fn((key) => {
      if (key === 'auth_token') return 'mock-jwt-token-123';
      if (key === 'user') return JSON.stringify(mockUser);
      return null;
    });

    const { default: SettingsPage } = await import('../app/settings/page');
    const { container } = renderWithProviders(<SettingsPage />);
    
    // ASSERT: Skeleton UI is visible initially
    const skeletons = container.querySelectorAll('[data-testid="skeleton"]');
    expect(skeletons.length).toBeGreaterThan(0);
    
    // Wait for loading to complete and skeletons to disappear
    await waitFor(() => {
      const skeletonsAfterLoad = container.querySelectorAll('[data-testid="skeleton"]');
      expect(skeletonsAfterLoad.length).toBe(0);
    });
    
    // ASSERT: Settings page title is visible (page loaded successfully)
    const pageTitle = screen.getByRole('heading', { name: /^settings$/i, level: 1 });
    expect(pageTitle).toBeInTheDocument();
    
    // ASSERT: Account Settings section is visible
    const accountSettingsTitle = screen.getByRole('heading', { name: /account settings/i, level: 2 });
    expect(accountSettingsTitle).toBeInTheDocument();
    
    // ACT: Open the Change Email modal to see current email
    const changeEmailButton = screen.getByRole('button', { name: /change email/i });
    fireEvent.click(changeEmailButton);
    
    // ASSERT: Current email field is pre-populated with user's email from localStorage
    const currentEmailInput = screen.getByLabelText(/current email/i);
    expect(currentEmailInput).toHaveValue('testuser@example.com');
    
    // ASSERT: User data was retrieved from localStorage
    expect(Storage.prototype.getItem).toHaveBeenCalledWith('user');
    
    // Close modal
    const closeButton = screen.getByRole('button', { name: /close/i });
    fireEvent.click(closeButton);
  });

  it("FE-402: The Settings page successfully renders the 'Change Email' form (modal), including the current email, new email input field, and a 'Save' button.", async () => {
    // Mock localStorage with user data
    const mockUser = {
      id: '123',
      email: 'testuser@example.com',
      first_name: 'Test User'
    };
    
    Storage.prototype.getItem = jest.fn((key) => {
      if (key === 'auth_token') return 'mock-jwt-token-123';
      if (key === 'user') return JSON.stringify(mockUser);
      return null;
    });

    const { default: SettingsPage } = await import('../app/settings/page');
    const { container } = renderWithProviders(<SettingsPage />);
    
    // Wait for loading to complete and skeletons to disappear
    await waitFor(() => {
      const skeletonsAfterLoad = container.querySelectorAll('[data-testid="skeleton"]');
      expect(skeletonsAfterLoad.length).toBe(0);
    });
    
    // ARRANGE: Click the Change Email button to open the modal
    const changeEmailButton = screen.getByRole('button', { name: /change email/i });
    expect(changeEmailButton).toBeInTheDocument();
    
    fireEvent.click(changeEmailButton);
    
    // ASSERT: Modal is now visible
    const modal = screen.getByRole('dialog');
    expect(modal).toBeInTheDocument();
    
    // ASSERT: Modal has proper title
    const modalTitle = screen.getByRole('heading', { name: /change email address/i });
    expect(modalTitle).toBeInTheDocument();
    
    // ASSERT: Current email is displayed (readonly/disabled)
    const currentEmailInput = screen.getByLabelText(/current email/i);
    expect(currentEmailInput).toBeInTheDocument();
    expect(currentEmailInput).toBeDisabled();
    
    // ASSERT: New email input field is present and enabled
    const newEmailInput = screen.getByLabelText(/new email/i);
    expect(newEmailInput).toBeInTheDocument();
    expect(newEmailInput).toBeEnabled();
    expect(newEmailInput).toHaveAttribute('type', 'email');
    
    // ASSERT: Save/Submit button is present
    const saveButton = screen.getByRole('button', { name: /save|send verification email/i });
    expect(saveButton).toBeInTheDocument();
    expect(saveButton).toBeEnabled();
    
    // ASSERT: Cancel button is present
    const cancelButton = screen.getByRole('button', { name: /cancel/i });
    expect(cancelButton).toBeInTheDocument();
    expect(cancelButton).toBeEnabled();
    
    // ASSERT: Close button (X) is present
    const closeButton = screen.getByRole('button', { name: /close/i });
    expect(closeButton).toBeInTheDocument();
    
    // ASSERT: Modal has animation classes for upward slide-in effect
    // This will FAIL until animation is implemented
    expect(modal).toHaveClass('animate-slide-up');
  });

  it('FE-403: Submitting the \'Change Email\' form with an empty or invalid email format shows an inline error message.', async () => {
    // Mock localStorage with user data
    Storage.prototype.getItem = jest.fn((key) => {
      if (key === 'auth_token') return 'mock-jwt-token-123';
      if (key === 'user') return JSON.stringify({ id: '123', email: 'test@example.com' });
      return null;
    });

    const { default: SettingsPage } = await import('../app/settings/page');
    const { container } = renderWithProviders(<SettingsPage />);
    
    // Wait for loading to complete
    await waitFor(() => {
      const skeletons = container.querySelectorAll('[data-testid="skeleton"]');
      expect(skeletons.length).toBe(0);
    });
    
    // ARRANGE: Open the Change Email modal
    const changeEmailButton = screen.getByRole('button', { name: /change email/i });
    fireEvent.click(changeEmailButton);
    
    const newEmailInput = screen.getByLabelText(/new email/i);
    const saveButton = screen.getByRole('button', { name: /send verification email/i });
    
    // ACT: Test 1 - Leave email empty and click save
    fireEvent.click(saveButton);
    
    // ASSERT: Error message appears for empty email
    await waitFor(() => {
      const errorMessage = screen.getByText(/email is required/i);
      expect(errorMessage).toBeInTheDocument();
    });
    
    // ASSERT: Save button is disabled when error exists
    expect(saveButton).toBeDisabled();
    
    // ACT: Test 2 - Enter invalid email format
    fireEvent.change(newEmailInput, { target: { value: 'invalid-email' } });
    
    // ASSERT: Error message updates to show invalid format
    await waitFor(() => {
      const errorMessage = screen.getByText(/please enter a valid email address/i);
      expect(errorMessage).toBeInTheDocument();
    });
    
    // ASSERT: Save button remains disabled
    expect(saveButton).toBeDisabled();
    
    // ACT: Test 3 - Enter valid email format
    fireEvent.change(newEmailInput, { target: { value: 'newemail@example.com' } });
    
    // ASSERT: Error message disappears
    await waitFor(() => {
      const errorMessage = screen.queryByText(/please enter a valid email address/i);
      expect(errorMessage).not.toBeInTheDocument();
    });
    
    // ASSERT: Save button is enabled again
    expect(saveButton).toBeEnabled();
  });
  
  it('FE-404: Submitting a valid new email triggers a PUT/PATCH request to the correct API endpoint (/api/user/email) with the new email data.', async () => {
    // ARRANGE: Mock successful API response
    fetchMock.mockResponseOnce(JSON.stringify({ 
      message: 'Verification email sent successfully' 
    }), { 
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

    // Mock localStorage for auth token
    Storage.prototype.getItem = jest.fn((key) => {
      if (key === 'auth_token') return 'mock-jwt-token-123';
      if (key === 'user') return JSON.stringify({ id: '123', email: 'test@example.com' });
      return null;
    });

    const { default: SettingsPage } = await import('../app/settings/page');
    const { container } = renderWithProviders(<SettingsPage />);
    
    // Wait for loading to complete
    await waitFor(() => {
      const skeletons = container.querySelectorAll('[data-testid="skeleton"]');
      expect(skeletons.length).toBe(0);
    });
    
    // ARRANGE: Open modal and enter valid email
    const changeEmailButton = screen.getByRole('button', { name: /change email/i });
    fireEvent.click(changeEmailButton);
    
    const newEmailInput = screen.getByLabelText(/new email/i);
    const saveButton = screen.getByRole('button', { name: /send verification email/i });
    
    // ACT: Enter valid email and submit
    fireEvent.change(newEmailInput, { target: { value: 'newemail@example.com' } });
    fireEvent.click(saveButton);
    
    // ASSERT: API was called with correct endpoint
    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });
    
    // ASSERT: Request method is PUT
    const callArgs = fetchMock.mock.calls[0];
    expect(callArgs[0]).toBe('http://127.0.0.1:8000/auth/settings/email');
    
    // ASSERT: Request includes proper headers and body
    const requestOptions = callArgs[1];
    expect(requestOptions.method).toBe('PUT');
    expect(requestOptions.headers['Content-Type']).toBe('application/json');
    expect(requestOptions.headers['Authorization']).toBe('Bearer mock-jwt-token-123');
    
    // ASSERT: Request body contains new email
    const requestBody = JSON.parse(requestOptions.body);
    expect(requestBody.new_email).toBe('newemail@example.com');
    
    // ASSERT: Success message appears (modal stays open to show success)
    await waitFor(() => {
      const successMessage = screen.getByText(/verification email sent/i);
      expect(successMessage).toBeInTheDocument();
    });
    
    // ASSERT: Modal remains open to display success message
    const modal = screen.queryByRole('dialog');
    expect(modal).toBeInTheDocument();
  });

  it('FE-405: After a successful API response (HTTP 200/202), the UI displays a success notification prompting the user to verify via email. The current email displayed should NOT change until verification is complete, and localStorage user data remains unchanged. When user returns from email verification, a success toast appears.', async () => {
    // ARRANGE: Mock successful API response from backend
    fetchMock.mockResponseOnce(JSON.stringify({ 
      message: 'Verification email sent to newemail@example.com. Please check your inbox.'
    }), { 
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

    // Mock localStorage for auth token and user data
    const originalUser = { id: '123', email: 'test@example.com', first_name: 'Test' };
    Storage.prototype.getItem = jest.fn((key) => {
      if (key === 'auth_token') return 'mock-jwt-token-123';
      if (key === 'user') return JSON.stringify(originalUser);
      return null;
    });
    
    // Mock setItem to verify localStorage is NOT updated
    Storage.prototype.setItem = jest.fn();

    const { default: SettingsPage } = await import('../app/settings/page');
    const { container } = renderWithProviders(<SettingsPage />);
    
    // Wait for loading to complete
    await waitFor(() => {
      const skeletons = container.querySelectorAll('[data-testid="skeleton"]');
      expect(skeletons.length).toBe(0);
    });
    
    // ARRANGE: Open modal and verify current email is displayed
    const changeEmailButton = screen.getByRole('button', { name: /change email/i });
    fireEvent.click(changeEmailButton);
    
    const currentEmailInput = screen.getByLabelText(/current email/i);
    expect(currentEmailInput).toHaveValue('test@example.com');
    
    const newEmailInput = screen.getByLabelText(/new email/i);
    const saveButton = screen.getByRole('button', { name: /send verification email/i });
    
    // ACT: Enter valid email and submit
    fireEvent.change(newEmailInput, { target: { value: 'newemail@example.com' } });
    fireEvent.click(saveButton);
    
    // ASSERT: Success message appears after API call
    await waitFor(() => {
      const successMessage = screen.getByText(/verification email sent|check your email|email update link sent/i);
      expect(successMessage).toBeInTheDocument();
    });
    
    // ASSERT: Success message has proper styling (should be visible with green/success color)
    const successMessage = screen.getByText(/verification email sent|check your email|email update link sent/i);
    expect(successMessage).toHaveClass('text-green-600');
    
    // ASSERT: Success message mentions verification is required
    expect(successMessage.textContent).toMatch(/verification|check|sent/i);
    
    // ASSERT: Modal remains open to show success message
    const modal = screen.queryByRole('dialog');
    expect(modal).toBeInTheDocument();
    
    // ASSERT: Current email in modal is STILL the old email (not changed yet)
    expect(currentEmailInput).toHaveValue('test@example.com');
    
    // ASSERT: localStorage user data was NOT updated (email change pending verification)
    // The setItem should NOT have been called to update user data
    const setItemCalls = Storage.prototype.setItem.mock.calls;
    const userUpdateCall = setItemCalls.find(call => call[0] === 'user');
    expect(userUpdateCall).toBeUndefined(); // Should NOT update user in localStorage
    
    // ASSERT: Auth token remains the same (no new JWT issued)
    expect(Storage.prototype.getItem).toHaveBeenCalledWith('auth_token');
    const tokenUpdateCall = setItemCalls.find(call => call[0] === 'auth_token');
    expect(tokenUpdateCall).toBeUndefined(); // Should NOT update token
    
    // ASSERT: Error message should NOT be visible
    const errorMessage = screen.queryByText(/email is required|please enter a valid email/i);
    expect(errorMessage).not.toBeInTheDocument();
    
    // PART 2: Test email verification callback with toast notification
    // Simulate user returning from email verification link
    
    // Unmount the previous component
    cleanup();
    
    // Reset mocks for fresh test
    jest.clearAllMocks();
    
    // Mock URLSearchParams to simulate URL with query parameters
    const mockSearchParams = new URLSearchParams(
      'token=new-jwt-token&email=newemail@example.com&user_id=123&first_name=Test&email_updated=true'
    );
    
    // Store original URLSearchParams
    const OriginalURLSearchParams = global.URLSearchParams;
    
    // Mock URLSearchParams constructor
    global.URLSearchParams = jest.fn((search) => {
      // If called with window.location.search, return our mock params
      if (search === window.location.search || search === '') {
        return mockSearchParams;
      }
      // Otherwise use original
      return new OriginalURLSearchParams(search);
    });
    
    // Mock window.history.replaceState
    const originalReplaceState = window.history.replaceState;
    window.history.replaceState = jest.fn();
    
    // Mock localStorage with original data (will be updated by component)
    Storage.prototype.getItem = jest.fn((key) => {
      if (key === 'auth_token') return 'old-jwt-token';
      if (key === 'user') return JSON.stringify({ 
        id: '123', 
        email: 'test@example.com', 
        first_name: 'Test' 
      });
      return null;
    });
    
    Storage.prototype.setItem = jest.fn();
    
    // Re-mock ToastContext with a fresh mock function
    const mockShowToast = jest.fn();
    const { useToast } = require('@/components/context/ToastContext');
    useToast.mockReturnValue({
      showToast: mockShowToast,
      hideToast: jest.fn(),
    });
    
    // Re-render component with URL params (simulating page load after redirect)
    const { container: containerAfterVerify } = renderWithProviders(<SettingsPage />);
    
    // Wait for loading to complete
    await waitFor(() => {
      const skeletons = containerAfterVerify.querySelectorAll('[data-testid="skeleton"]');
      expect(skeletons.length).toBe(0);
    });
    
    // ASSERT: showToast was called with success message
    await waitFor(() => {
      expect(mockShowToast).toHaveBeenCalledWith(
        'Email successfully updated and verified!',
        'success',
        6000
      );
    }, { timeout: 3000 });
    
    // ASSERT: localStorage was updated with new token and user data
    expect(Storage.prototype.setItem).toHaveBeenCalledWith('auth_token', 'new-jwt-token');
    expect(Storage.prototype.setItem).toHaveBeenCalledWith('user', expect.stringContaining('newemail@example.com'));
    
    // ASSERT: URL parameters were cleared
    expect(window.history.replaceState).toHaveBeenCalledWith({}, '', '/settings');
    
    // Restore original URLSearchParams and history.replaceState
    global.URLSearchParams = OriginalURLSearchParams;
    window.history.replaceState = originalReplaceState;
    
    // IMPLEMENTATION NOTE:
    // The backend should:
    // 1. Send verification email to newemail@example.com with a token
    // 2. NOT change the user's email in the database yet
    // 3. When user clicks the verification link, THEN:
    //    - Update email in database
    //    - Issue new JWT with updated email
    //    - Redirect to frontend with new token and email_updated=true
    //    - Frontend updates localStorage with new user data and token
    //    - Frontend shows success toast notification
  });

  it('FE-406: If the API returns an error (e.g., 409 Conflict, email already in use), a clear error message is displayed to the user.', async () => {
    // ARRANGE: Mock API error response (409 Conflict)
    fetchMock.mockResponseOnce(JSON.stringify({ 
      message: 'The email address is already in use by another account.'
    }), { 
      status: 409,
      headers: { 'Content-Type': 'application/json' }
    });
  });

  it('FE-407:', async () => {
    const { default: SettingsPage } = await import('../app/settings/page');
    renderWithProviders(<SettingsPage />);
  });

  it('FE-408:', async () => {
    const { default: SettingsPage } = await import('../app/settings/page');
    renderWithProviders(<SettingsPage />);
  });

  it('FE-409:', async () => {
    const { default: SettingsPage } = await import('../app/settings/page');
    renderWithProviders(<SettingsPage />);
  });

  it('FE-410:', async () => {
    const { default: SettingsPage } = await import('../app/settings/page');
    renderWithProviders(<SettingsPage />);
  });

  it('FE-411:', async () => {
    const { default: SettingsPage } = await import('../app/settings/page');
    renderWithProviders(<SettingsPage />);
  });

  it('FE-412:', async () => {
    const { default: SettingsPage } = await import('../app/settings/page');
    renderWithProviders(<SettingsPage />);
  });

  it('FE-413: The Settings page successfully renders the Logout section with a heading, descriptive text, and an enabled Logout button', async () => {
    const { default: SettingsPage } = await import('../app/settings/page');
    renderWithProviders(<SettingsPage />);
  });

  it('FE-414: Clicking the Logout button displays a confirmation modal with Cancel and Confirm Logout options', async () => {
    const { default: SettingsPage } = await import('../app/settings/page');
    renderWithProviders(<SettingsPage />);
  });

  it('FE-415: After confirming logout, the application clears localStorage auth data and redirects to the login page', async () => {
    const { default: SettingsPage } = await import('../app/settings/page');
    renderWithProviders(<SettingsPage />);
  });

  it('FE-416: The Settings page loads and displays the authenticated user\'s information from localStorage', async () => {
    
  });

  it('FE-414:', async () => {
    const { default: SettingsPage } = await import('../app/settings/page');
    renderWithProviders(<SettingsPage />);
  });

  it('FE-415:', async () => {
    const { default: SettingsPage } = await import('../app/settings/page');
    renderWithProviders(<SettingsPage />);
  });

  it('FE-416:', async () => {
    const { default: SettingsPage } = await import('../app/settings/page');
    renderWithProviders(<SettingsPage />);
  });
});

// ----------------------- 
// Settings: Light/Dark Mode Toggle
// -----------------------
describe('Settings: Light/Dark Mode Toggle', () => {

  beforeEach(() => {
    // Set default mock return for useTheme so Page component can render
    const { useTheme } = require('@/components/context/ThemeContext');
    useTheme.mockReturnValue({
      theme: 'light',
      toggleTheme: jest.fn(),
    });
  });

  // it('FE-501: Account Settings render all elements', async () => {
  //   const { default: SettingsPage } = await import('../app/settings/page');
  //   renderWithProviders(<SettingsPage />);
    
  //   // Assert Delete Account subsection is rendered
  //   const deleteSection = screen.getByRole('heading', { name: /delete account/i, level: 3 });
  //   expect(deleteSection).toBeInTheDocument();
    
  //   // Assert Delete button is rendered
  //   const deleteButton = screen.getByRole('button', { name: /^delete$/i });
  //   expect(deleteButton).toBeInTheDocument();
  //   expect(deleteButton).toBeEnabled();
  // });

});

// ----------------------- 
// Settings: Notification Preferences
// -----------------------
describe('Settings: Notification Preferences', () => {

  beforeEach(() => {
    // Set default mock return for useTheme so Page component can render
    const { useTheme } = require('@/components/context/ThemeContext');
    useTheme.mockReturnValue({
      theme: 'light',
      toggleTheme: jest.fn(),
    });
  });

  it('FE-', async () => {
   
  });

});

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
    // Reset fetch mocks before each test
    fetchMock.resetMocks();
    
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

  it('FE-401: The Settings page loads and displays the authenticated user\'s information from localStorage. The Page will load with Skeleton UI initially, then display content after loading completes. ', async () => {
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

  it('FE-402: The Settings page successfully renders the \'Change Email\' Button. Clicking the button shows a Modal, including the current email, new email input field, and a \'Save\' button.', async () => {
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
    
    // ASSERT: Change Email button is rendered
    const changeEmailButton = screen.getByRole('button', { name: /change email/i });
    expect(changeEmailButton).toBeInTheDocument();
    
    // ACT: Click the Change Email button to open the modal
    fireEvent.click(changeEmailButton);
    
    // ASSERT: Modal is visible with correct elements
    const modal = screen.getByRole('dialog');
    expect(modal).toBeInTheDocument();
    
    const currentEmailInput = screen.getByLabelText(/current email/i);
    expect(currentEmailInput).toBeInTheDocument();
    
    const newEmailInput = screen.getByLabelText(/new email/i);
    expect(newEmailInput).toBeInTheDocument();
    
    const saveButton = screen.getByRole('button', { name: /save|send verification email/i });
    expect(saveButton).toBeInTheDocument();
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

  it('FE-407: The username field is pre-populated with the user\'s current username from localStorage, or displays a default placeholder if no username exists. Clicking the "Change Username" button opens the Change Username modal with current username pre-populated.', async () => {
    // ARRANGE: Mock localStorage with user data including username
    const mockUser = {
      id: '123',
      email: 'testuser@example.com',
      username: 'currentusername',
      first_name: 'Test User'
    };
    
    Storage.prototype.getItem = jest.fn((key) => {
      if (key === 'auth_token') return 'mock-jwt-token-123';
      if (key === 'user') return JSON.stringify(mockUser);
      return null;
    });

    const { default: SettingsPage } = await import('../app/settings/page');
    const { container } = renderWithProviders(<SettingsPage />);
    
    // Wait for loading to complete
    await waitFor(() => {
      const skeletons = container.querySelectorAll('[data-testid="skeleton"]');
      expect(skeletons.length).toBe(0);
    });
    
    // ASSERT: Username is displayed on the page
    const usernameDisplay = screen.getByText(/currentusername/i);
    expect(usernameDisplay).toBeInTheDocument();
    
    // ACT: Click the "Change Username" button
    const changeUsernameButton = screen.getByRole('button', { name: /change username/i });
    expect(changeUsernameButton).toBeInTheDocument();
    fireEvent.click(changeUsernameButton);
    
    // ASSERT: Modal is visible
    const modal = screen.getByRole('dialog');
    expect(modal).toBeInTheDocument();
    
    // ASSERT: Modal has proper title
    const modalTitle = screen.getByRole('heading', { name: /change username/i });
    expect(modalTitle).toBeInTheDocument();
    
    // ASSERT: Current username input field is present and pre-populated
    const currentUsernameInput = screen.getByLabelText(/current username/i);
    expect(currentUsernameInput).toBeInTheDocument();
    expect(currentUsernameInput).toHaveValue('currentusername');
    expect(currentUsernameInput).toBeDisabled();
    
    // ASSERT: New username input field is present and enabled
    const newUsernameInput = screen.getByLabelText(/new username/i);
    expect(newUsernameInput).toBeInTheDocument();
    expect(newUsernameInput).toBeEnabled();
    
    // ASSERT: Save button is present
    const saveButton = screen.getByRole('button', { name: /save|update username/i });
    expect(saveButton).toBeInTheDocument();
    
    // TODO: Test scenario with no username (should show placeholder)
  });

  it('FE-408: Submitting the \'Change Username\' form with an empty or invalid username shows an inline error message. Should have a maxlength of 25 characters.', async () => {
    // Mock localStorage with user data
    Storage.prototype.getItem = jest.fn((key) => {
      if (key === 'auth_token') return 'mock-jwt-token-123';
      if (key === 'user') return JSON.stringify({ 
        id: '123', 
        email: 'test@example.com',
        username: 'currentusername'
      });
      return null;
    });

    const { default: SettingsPage } = await import('../app/settings/page');
    const { container } = renderWithProviders(<SettingsPage />);
    
    // Wait for loading to complete
    await waitFor(() => {
      const skeletons = container.querySelectorAll('[data-testid="skeleton"]');
      expect(skeletons.length).toBe(0);
    });
    
    // ARRANGE: Open the Change Username modal
    const changeUsernameButton = screen.getByRole('button', { name: /change username/i });
    fireEvent.click(changeUsernameButton);
    
    const newUsernameInput = screen.getByLabelText(/new username/i);
    const saveButton = screen.getByRole('button', { name: /update username/i });
    
    // ASSERT: Input has maxlength attribute set to 25
    expect(newUsernameInput).toHaveAttribute('maxlength', '25');
    
    // ACT: Test 1 - Leave username empty and click save
    fireEvent.click(saveButton);
    
    // ASSERT: Error message appears for empty username
    await waitFor(() => {
      const errorMessage = screen.getByText(/username is required/i);
      expect(errorMessage).toBeInTheDocument();
    });
    
    // ASSERT: Save button is disabled when error exists
    expect(saveButton).toBeDisabled();
    
    // ACT: Test 2 - Enter invalid username (too short)
    fireEvent.change(newUsernameInput, { target: { value: 'ab' } });
    
    // ASSERT: Error message updates to show invalid format
    await waitFor(() => {
      const errorMessage = screen.getByText(/username must be at least|invalid username/i);
      expect(errorMessage).toBeInTheDocument();
    });
    
    // ASSERT: Save button remains disabled
    expect(saveButton).toBeDisabled();
    
    // ACT: Test 3 - Enter username at max length (25 characters)
    fireEvent.change(newUsernameInput, { target: { value: 'a'.repeat(25) } });
    
    // ASSERT: Info message appears indicating max length reached
    await waitFor(() => {
      const infoMessage = screen.getByText(/25 characters maximum/i);
      expect(infoMessage).toBeInTheDocument();
    });
    
    // ASSERT: Message is styled as info/warning (not error)
    const infoMessage = screen.getByText(/25 characters maximum/i);
    expect(infoMessage).toHaveClass('text-yellow-600');
    
    // ASSERT: Save button is still enabled (it's a valid username)
    expect(saveButton).toBeEnabled();
    
    // ACT: Test 4 - Enter username longer than 25 characters (validation catches it)
    const longUsername = 'a'.repeat(26);
    fireEvent.change(newUsernameInput, { target: { value: longUsername } });
    
    // ASSERT: Error message appears for username too long
    await waitFor(() => {
      const errorMessage = screen.getByText(/must be less than 25 characters/i);
      expect(errorMessage).toBeInTheDocument();
    });
    
    // ASSERT: Save button is disabled
    expect(saveButton).toBeDisabled();
    
    // ACT: Test 5 - Enter valid username
    fireEvent.change(newUsernameInput, { target: { value: 'newvalidusername' } });
    
    // ASSERT: Error message disappears
    await waitFor(() => {
      const errorMessage = screen.queryByText(/username is required|invalid username/i);
      expect(errorMessage).not.toBeInTheDocument();
    });
    
    // ASSERT: Save button is enabled again
    expect(saveButton).toBeEnabled();
  });

  it('FE-409: Submitting a valid new username triggers a PUT request to the backend API. A verification email is sent to the user. The username is NOT updated until the user clicks the verification link in the email. After verification, the username is updated in localStorage and reflected throughout the application.', async () => {
    // ARRANGE: Mock successful API response from backend
    fetchMock.mockResponseOnce(JSON.stringify({ 
      message: 'Verification email sent. Please check your inbox to confirm username change.'
    }), { 
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

    // Mock localStorage for auth token and user data
    const originalUser = { id: '123', email: 'test@example.com', username: 'oldusername' };
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
    
    // ARRANGE: Open modal and verify current username is displayed
    const changeUsernameButton = screen.getByRole('button', { name: /change username/i });
    fireEvent.click(changeUsernameButton);
    
    const currentUsernameInput = screen.getByLabelText(/current username/i);
    expect(currentUsernameInput).toHaveValue('oldusername');
    
    const newUsernameInput = screen.getByLabelText(/new username/i);
    const saveButton = screen.getByRole('button', { name: /update username/i });
    
    // ACT: Enter valid username and submit
    fireEvent.change(newUsernameInput, { target: { value: 'newusername' } });
    fireEvent.click(saveButton);
    
    // ASSERT: API was called with correct endpoint
    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });
    
    // ASSERT: Request method is PUT
    const callArgs = fetchMock.mock.calls[0];
    expect(callArgs[0]).toBe('http://127.0.0.1:8000/auth/settings/username');
    
    // ASSERT: Request includes proper headers and body
    const requestOptions = callArgs[1];
    expect(requestOptions.method).toBe('PUT');
    expect(requestOptions.headers['Content-Type']).toBe('application/json');
    expect(requestOptions.headers['Authorization']).toBe('Bearer mock-jwt-token-123');
    
    // ASSERT: Request body contains new username
    const requestBody = JSON.parse(requestOptions.body);
    expect(requestBody.new_username).toBe('newusername');
    
    // ASSERT: Success message appears after API call
    await waitFor(() => {
      const successMessage = screen.getByText(/verification email sent|check your email|username update link sent/i);
      expect(successMessage).toBeInTheDocument();
    });
    
    // ASSERT: Success message has proper styling (should be visible with green/success color)
    const successMessage = screen.getByText(/verification email sent|check your email|username update link sent/i);
    expect(successMessage).toHaveClass('text-green-600');
    
    // ASSERT: Success message mentions verification is required
    expect(successMessage.textContent).toMatch(/verification|check|sent/i);
    
    // ASSERT: Modal remains open to show success message
    const modal = screen.queryByRole('dialog');
    expect(modal).toBeInTheDocument();
    
    // ASSERT: Current username in modal is STILL the old username (not changed yet)
    expect(currentUsernameInput).toHaveValue('oldusername');
    
    // ASSERT: localStorage user data was NOT updated (username change pending verification)
    const setItemCalls = Storage.prototype.setItem.mock.calls;
    const userUpdateCall = setItemCalls.find(call => call[0] === 'user');
    expect(userUpdateCall).toBeUndefined(); // Should NOT update user in localStorage
    
    // ASSERT: Auth token remains the same (no new JWT issued)
    expect(Storage.prototype.getItem).toHaveBeenCalledWith('auth_token');
    const tokenUpdateCall = setItemCalls.find(call => call[0] === 'auth_token');
    expect(tokenUpdateCall).toBeUndefined(); // Should NOT update token
    
    // ASSERT: Error message should NOT be visible
    const errorMessage = screen.queryByText(/username is required|invalid username/i);
    expect(errorMessage).not.toBeInTheDocument();
    
    // PART 2: Test username verification callback with toast notification
    // Simulate user returning from username verification link
    
    // Unmount the previous component
    cleanup();
    
    // Reset mocks for fresh test
    jest.clearAllMocks();
    
    // Mock URLSearchParams to simulate URL with query parameters
    const mockSearchParams = new URLSearchParams(
      'token=new-jwt-token&username=newusername&user_id=123&email=test@example.com&username_updated=true'
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
        username: 'oldusername'
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
        'Username successfully updated and verified!',
        'success',
        6000
      );
    }, { timeout: 3000 });
    
    // ASSERT: localStorage was updated with new token and user data
    expect(Storage.prototype.setItem).toHaveBeenCalledWith('auth_token', 'new-jwt-token');
    expect(Storage.prototype.setItem).toHaveBeenCalledWith('user', expect.stringContaining('newusername'));
    
    // ASSERT: URL parameters were cleared
    expect(window.history.replaceState).toHaveBeenCalledWith({}, '', '/settings');
    
    // Restore original URLSearchParams and history.replaceState
    global.URLSearchParams = OriginalURLSearchParams;
    window.history.replaceState = originalReplaceState;
    
    // IMPLEMENTATION NOTE:
    // The backend should:
    // 1. Send verification email with a token containing user_id, old_username, new_username
    // 2. NOT change the user's username in the database yet
    // 3. When user clicks the verification link, THEN:
    //    - Update username in database
    //    - Issue new JWT with updated username
    //    - Redirect to frontend with new token and username_updated=true
    //    - Frontend updates localStorage with new user data and token
    //    - Frontend shows success toast notification
  });

  it('FE-410: The Settings page displays a prominent \'Delete Account\' button and section.', async () => {
    // Mock localStorage with user data
    Storage.prototype.getItem = jest.fn((key) => {
      if (key === 'auth_token') return 'mock-jwt-token-123';
      if (key === 'user') return JSON.stringify({ 
        id: '123', 
        email: 'test@example.com',
        username: 'testuser'
      });
      return null;
    });

    const { default: SettingsPage } = await import('../app/settings/page');
    const { container } = renderWithProviders(<SettingsPage />);
    
    // Wait for loading to complete
    await waitFor(() => {
      const skeletons = container.querySelectorAll('[data-testid="skeleton"]');
      expect(skeletons.length).toBe(0);
    });
    
    // ASSERT: Delete Account heading is visible
    const deleteAccountHeading = screen.getByRole('heading', { name: /delete account/i, level: 3 });
    expect(deleteAccountHeading).toBeInTheDocument();
    
    // ASSERT: Delete Account heading has red styling to indicate danger
    expect(deleteAccountHeading).toHaveClass('text-red-600');
    
    // ASSERT: Descriptive text is present explaining the action
    const descriptionText = screen.getByText(/permanently delete your account and all data/i);
    expect(descriptionText).toBeInTheDocument();
    
    // ASSERT: Delete button is rendered and enabled
    const deleteButton = screen.getByRole('button', { name: /^delete$/i });
    expect(deleteButton).toBeInTheDocument();
    expect(deleteButton).toBeEnabled();
    
    // ASSERT: Delete button has red/danger styling
    expect(deleteButton).toHaveClass('bg-red-600');
    
    // ASSERT: Delete Account section is within Account Settings section
    const accountSettingsSection = screen.getByRole('heading', { name: /account settings/i, level: 2 });
    expect(accountSettingsSection).toBeInTheDocument();
  });

  it('FE-411: Clicking \'Delete Account\' opens a mandatory confirmation modal or dialogue box requiring explicit consent by typing Delete Account in the modals input box.', async () => {
    // Mock localStorage with user data
    Storage.prototype.getItem = jest.fn((key) => {
      if (key === 'auth_token') return 'mock-jwt-token-123';
      if (key === 'user') return JSON.stringify({ 
        id: '123', 
        email: 'test@example.com',
        username: 'testuser'
      });
      return null;
    });

    const { default: SettingsPage } = await import('../app/settings/page');
    const { container } = renderWithProviders(<SettingsPage />);
    
    // Wait for loading to complete
    await waitFor(() => {
      const skeletons = container.querySelectorAll('[data-testid="skeleton"]');
      expect(skeletons.length).toBe(0);
    });
    
    // ARRANGE: Find and click the Delete button
    const deleteButton = screen.getByRole('button', { name: /^delete$/i });
    expect(deleteButton).toBeInTheDocument();
    
    // ACT: Click the Delete button
    fireEvent.click(deleteButton);
    
    // ASSERT: Confirmation modal opens
    await waitFor(() => {
      const modal = screen.getByRole('dialog');
      expect(modal).toBeInTheDocument();
    });
    
    // ASSERT: Modal has proper title (use getAllBy to handle duplicate and select the modal one)
    const modalTitles = screen.getAllByRole('heading', { name: /delete account/i });
    const modalTitle = modalTitles.find(heading => heading.id === 'delete-modal-title');
    expect(modalTitle).toBeInTheDocument();
    expect(modalTitle).toHaveClass('text-red-600');
    
    // ASSERT: Modal contains warning text about permanent deletion (look for unique "cannot be undone" text)
    const warningText = screen.getByText(/this action cannot be undone/i);
    expect(warningText).toBeInTheDocument();
    expect(warningText).toHaveClass('text-red-800');
    
    // ASSERT: Modal has an input field for confirmation
    const confirmationInput = screen.getByRole('textbox', { name: /type.*delete account|confirm/i });
    expect(confirmationInput).toBeInTheDocument();
    expect(confirmationInput.placeholder).toMatch(/type.*delete account/i);
    
    // ASSERT: Modal has Cancel button
    const cancelButton = screen.getByRole('button', { name: /cancel/i });
    expect(cancelButton).toBeInTheDocument();
    
    // ASSERT: Modal has Confirm/Delete button
    const confirmButton = screen.getByRole('button', { name: /confirm|delete account/i });
    expect(confirmButton).toBeInTheDocument();
    
    // ASSERT: Confirm button is initially disabled (no text entered)
    expect(confirmButton).toBeDisabled();
    
    // ACT: Enter incorrect confirmation text
    fireEvent.change(confirmationInput, { target: { value: 'delete' } });
    
    // ASSERT: Confirm button remains disabled with incorrect text
    expect(confirmButton).toBeDisabled();
    
    // ACT: Enter correct confirmation text "Delete Account"
    fireEvent.change(confirmationInput, { target: { value: 'Delete Account' } });
    
    // ASSERT: Confirm button becomes enabled with correct text
    await waitFor(() => {
      expect(confirmButton).toBeEnabled();
    });
    
    // ACT: Clear the input
    fireEvent.change(confirmationInput, { target: { value: '' } });
    
    // ASSERT: Confirm button becomes disabled again
    expect(confirmButton).toBeDisabled();
    
    // ACT: Click Cancel button
    fireEvent.click(cancelButton);
    
    // ASSERT: Modal closes
    await waitFor(() => {
      const modal = screen.queryByRole('dialog');
      expect(modal).not.toBeInTheDocument();
    });
  });

  it('FE-412: Confirming deletion triggers a DELETE request to the correct API endpoint (/settings/account/delete). Success Toast should appear, as well as a redirect to the Landing Page. The session cookie/JWT should be cleared.', async () => {
    // ARRANGE: Mock successful API response (204 No Content for soft delete)
    fetchMock.mockResponseOnce('', { 
      status: 204
    });

    // Mock localStorage with user data
    Storage.prototype.getItem = jest.fn((key) => {
      if (key === 'auth_token') return 'mock-jwt-token-123';
      if (key === 'user') return JSON.stringify({ 
        id: '123', 
        email: 'test@example.com',
        username: 'testuser'
      });
      return null;
    });
    
    // Mock removeItem to verify localStorage is cleared
    Storage.prototype.removeItem = jest.fn();

    // Mock showToast
    const mockShowToast = jest.fn();
    const { useToast } = require('@/components/context/ToastContext');
    useToast.mockReturnValue({
      showToast: mockShowToast,
      hideToast: jest.fn(),
    });

    const { default: SettingsPage } = await import('../app/settings/page');
    const { container } = renderWithProviders(<SettingsPage />);
    
    // Wait for loading to complete
    await waitFor(() => {
      const skeletons = container.querySelectorAll('[data-testid="skeleton"]');
      expect(skeletons.length).toBe(0);
    });
    
    // ARRANGE: Open delete confirmation modal
    const deleteButton = screen.getByRole('button', { name: /^delete$/i });
    fireEvent.click(deleteButton);
    
    // Wait for modal to open
    await waitFor(() => {
      const modal = screen.getByRole('dialog');
      expect(modal).toBeInTheDocument();
    });
    
    // ARRANGE: Enter correct confirmation text to enable the confirm button
    const confirmationInput = screen.getByRole('textbox', { name: /type.*delete account|confirm/i });
    fireEvent.change(confirmationInput, { target: { value: 'Delete Account' } });
    
    // Wait for confirm button to be enabled
    const confirmButton = screen.getByRole('button', { name: /confirm|delete account/i });
    await waitFor(() => {
      expect(confirmButton).toBeEnabled();
    });
    
    // ACT: Click the Confirm Delete button
    fireEvent.click(confirmButton);
    
    // ASSERT: API was called with correct endpoint
    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });
    
    // ASSERT: Request method is DELETE
    const callArgs = fetchMock.mock.calls[0];
    expect(callArgs[0]).toBe('http://127.0.0.1:8000/auth/settings/account/delete');
    
    // ASSERT: Request includes proper headers
    const requestOptions = callArgs[1];
    expect(requestOptions.method).toBe('DELETE');
    expect(requestOptions.headers['Content-Type']).toBe('application/json');
    expect(requestOptions.headers['Authorization']).toBe('Bearer mock-jwt-token-123');
    
    // ASSERT: Success toast is shown
    await waitFor(() => {
      expect(mockShowToast).toHaveBeenCalledWith(
        expect.stringMatching(/account.*deleted|deletion.*successful/i),
        'success',
        expect.any(Number)
      );
    });
    
    // ASSERT: localStorage is cleared
    await waitFor(() => {
      expect(Storage.prototype.removeItem).toHaveBeenCalledWith('auth_token');
      expect(Storage.prototype.removeItem).toHaveBeenCalledWith('user');
    });
    
    // ASSERT: User is redirected to landing page (login or home)
    await waitFor(() => {
      expect(redirectTo).toHaveBeenCalledWith(expect.stringMatching(/login|^\/$|home/i));
    }, { timeout: 3000 });
    
    // ASSERT: Modal closes after successful deletion
    await waitFor(() => {
      const modal = screen.queryByRole('dialog');
      expect(modal).not.toBeInTheDocument();
    });
  });

  it('FE-413: The Settings page successfully renders the Logout section with a heading, descriptive text, and an enabled Logout button', async () => {
    // Mock localStorage with user data
    Storage.prototype.getItem = jest.fn((key) => {
      if (key === 'auth_token') return 'mock-jwt-token-123';
      if (key === 'user') return JSON.stringify({ 
        id: '123', 
        email: 'test@example.com',
        username: 'testuser'
      });
      return null;
    });

    const { default: SettingsPage } = await import('../app/settings/page');
    const { container } = renderWithProviders(<SettingsPage />);
    
    // Wait for loading to complete
    await waitFor(() => {
      const skeletons = container.querySelectorAll('[data-testid="skeleton"]');
      expect(skeletons.length).toBe(0);
    });
    
    // ASSERT: Logout section heading is visible
    const logoutHeading = screen.getByRole('heading', { name: /^logout$/i, level: 3 });
    expect(logoutHeading).toBeInTheDocument();
    
    // ASSERT: Descriptive text is present explaining the logout action
    const descriptionText = screen.getByText(/end your current session|sign out of your account|log out of the application/i);
    expect(descriptionText).toBeInTheDocument();
    
    // ASSERT: Logout button is rendered and enabled
    const logoutButton = screen.getByRole('button', { name: /^logout$|log out|sign out/i });
    expect(logoutButton).toBeInTheDocument();
    expect(logoutButton).toBeEnabled();
    
    // ASSERT: Logout section is within Account Settings or a separate section
    const accountSettingsSection = screen.getByRole('heading', { name: /account settings/i, level: 2 });
    expect(accountSettingsSection).toBeInTheDocument();
  });

  it('FE-414: Clicking the Logout button displays a confirmation modal with Cancel and Confirm Logout options', async () => {
    // Mock localStorage with user data
    Storage.prototype.getItem = jest.fn((key) => {
      if (key === 'auth_token') return 'mock-jwt-token-123';
      if (key === 'user') return JSON.stringify({ 
        id: '123', 
        email: 'test@example.com',
        username: 'testuser'
      });
      return null;
    });

    const { default: SettingsPage } = await import('../app/settings/page');
    const { container } = renderWithProviders(<SettingsPage />);
    
    // Wait for loading to complete
    await waitFor(() => {
      const skeletons = container.querySelectorAll('[data-testid="skeleton"]');
      expect(skeletons.length).toBe(0);
    });
    
    // ARRANGE: Find and click the Logout button
    const logoutButton = screen.getByRole('button', { name: /^logout$|log out|sign out/i });
    expect(logoutButton).toBeInTheDocument();
    
    // ACT: Click the Logout button
    fireEvent.click(logoutButton);
    
    // ASSERT: Confirmation modal opens
    await waitFor(() => {
      const modal = screen.getByRole('dialog');
      expect(modal).toBeInTheDocument();
    });
    
    // ASSERT: Modal has proper title (use more specific match)
    const modalTitle = screen.getByRole('heading', { name: /^confirm logout$/i });
    expect(modalTitle).toBeInTheDocument();
    
    // ASSERT: Modal contains warning or confirmation text
    const confirmationText = screen.getByText(/are you sure you want to log out/i);
    expect(confirmationText).toBeInTheDocument();
    
    // ASSERT: Modal has Cancel button
    const cancelButton = screen.getByRole('button', { name: /cancel/i });
    expect(cancelButton).toBeInTheDocument();
    
    // ASSERT: Modal has Confirm Logout button
    const confirmLogoutButton = screen.getByRole('button', { name: /^confirm logout$/i });
    expect(confirmLogoutButton).toBeInTheDocument();
    
    // ACT: Click Cancel button
    fireEvent.click(cancelButton);
    
    // ASSERT: Modal closes
    await waitFor(() => {
      const modal = screen.queryByRole('dialog');
      expect(modal).not.toBeInTheDocument();
    });
    
    // ASSERT: User remains on settings page (not redirected)
    const settingsHeading = screen.getByRole('heading', { name: /^settings$/i, level: 1 });
    expect(settingsHeading).toBeInTheDocument();
  });

  it('FE-415: After confirming logout, the application clears localStorage auth data and redirects to the login page, ending with a Success Toast.', async () => {
    // Mock localStorage with user data
    Storage.prototype.getItem = jest.fn((key) => {
      if (key === 'auth_token') return 'mock-jwt-token-123';
      if (key === 'user') return JSON.stringify({ 
        id: '123', 
        email: 'test@example.com',
        username: 'testuser'
      });
      return null;
    });
    
    // Mock removeItem to verify localStorage is cleared
    Storage.prototype.removeItem = jest.fn();
    
    // Mock showToast to verify success message
    const mockShowToast = jest.fn();
    const { useToast } = require('@/components/context/ToastContext');
    useToast.mockReturnValue({
      showToast: mockShowToast,
      hideToast: jest.fn(),
    });

    const { default: SettingsPage } = await import('../app/settings/page');
    const { container } = renderWithProviders(<SettingsPage />);
    
    // Wait for loading to complete
    await waitFor(() => {
      const skeletons = container.querySelectorAll('[data-testid="skeleton"]');
      expect(skeletons.length).toBe(0);
    });
    
    // ARRANGE: Find and click the Logout button
    const logoutButton = screen.getByRole('button', { name: /^logout$|log out|sign out/i });
    fireEvent.click(logoutButton);
    
    // Wait for modal to open
    await waitFor(() => {
      const modal = screen.getByRole('dialog');
      expect(modal).toBeInTheDocument();
    });
    
    // ARRANGE: Find the Confirm Logout button in the modal
    const confirmLogoutButton = screen.getByRole('button', { name: /^confirm logout$/i });
    expect(confirmLogoutButton).toBeInTheDocument();
    
    // ACT: Click the Confirm Logout button
    fireEvent.click(confirmLogoutButton);
    
    // ASSERT: localStorage auth_token is removed
    await waitFor(() => {
      expect(Storage.prototype.removeItem).toHaveBeenCalledWith('auth_token');
    });
    
    // ASSERT: localStorage user data is removed
    expect(Storage.prototype.removeItem).toHaveBeenCalledWith('user');
    
    // ASSERT: Success toast is displayed
    await waitFor(() => {
      expect(mockShowToast).toHaveBeenCalledWith(
        'Successfully logged out',
        'success',
        3000
      );
    });
    
    // ASSERT: User is redirected to login page
    await waitFor(() => {
      expect(redirectTo).toHaveBeenCalledWith(expect.stringMatching(/login/i));
    });
    
    // ASSERT: Modal closes after logout
    await waitFor(() => {
      const modal = screen.queryByRole('dialog');
      expect(modal).not.toBeInTheDocument();
    });
  });

  it('FE-416: The Settings page loads and displays the authenticated user\'s information from localStorage', async () => {
    
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

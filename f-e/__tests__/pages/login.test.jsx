import '@testing-library/jest-dom'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import Page from '../../app/(auth)/login/page'
import Home from '../../app/home/page';
import CandleStickAnim from '@/components/ui/CandleStickAnim'
import ThemeToggleButton from '@/components/ui/ThemeToggleButton'
import { ThemeProvider } from '../../components/context/ThemeContext'
import { ToastProvider } from '../../components/context/ToastContext'
import PostLoginToastHandler from '@/components/ui/PostLoginToastHandler';
import { redirectTo } from '../../lib/redirect'

// in your Jest setup (e.g., in setupFilesAfterEnv) or imported here.
import fetchMock from 'jest-fetch-mock';
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

// Utility function to render with ThemeProvider and ToastProvider
const renderWithProviders = (ui, options) => {
  return render(
    <ThemeProvider>
      <ToastProvider>
        <PostLoginToastHandler />
        {ui}
      </ToastProvider>
    </ThemeProvider>,
    options
  );
}

// ----------------------- 
// A. Rendering & Display
// -----------------------
describe('Login Page Rendering & Display', () => {

  beforeEach(() => {
    // Set default mock return for useTheme so Page component can render
    const { useTheme } = require('@/components/context/ThemeContext');
    useTheme.mockReturnValue({
      theme: 'light',
      toggleTheme: jest.fn(),
    });
  });

  // FE-101: Render All Elements
  it("FE-101 renders the company logo, h3 heading, email input field, sign-in message, magic link button, and google sign in button", () => {

    // This test will contain multiple assertions using screen.getByRole to ensure all static elements are present.
    renderWithProviders(<Page />)

    // Check for logos (mobile and desktop versions exist but may not be visible due to responsive classes)
    const logos = screen.getAllByAltText(/Pivotal Logo/i)
    expect(logos.length).toBeGreaterThanOrEqual(1)

    const heading = screen.getByRole('heading', { name: /sign in/i })
    const emailInput = screen.getByLabelText('Email', { exact: false })
    const magicLinkButton = screen.getByRole('button', { name: /send magic link/i })
    const orDivider = screen.getByAltText('Or Divider')
    const googleSignInButton = screen.getByRole('button', { name: /Sign in with Google/i })
    expect(heading).toBeInTheDocument();
    expect(emailInput).toBeInTheDocument();
    expect(magicLinkButton).toBeInTheDocument();
    expect(orDivider).toBeInTheDocument();
    expect(googleSignInButton).toBeInTheDocument();
  })

  // FE-102: Candlestick Animation
  it("FE-102 renders the CandleStickAnim component", () => {
    render(<CandleStickAnim />);

    const animationElement = screen.getByTestId("candlestick-animation");

    expect(animationElement).toBeInTheDocument();
  });

  // FE-103: Render Error Message Alert Box
  it("FE-103 renders an alert box with hidden state (max-h-0 opacity-0) initially", () => {
    renderWithProviders(<Page />);

    const alertBox = screen.getByTestId('alert-box');

    expect(alertBox).toBeInTheDocument();
    // In JSDOM, Tailwind classes are not computed; assert className presence instead
    expect(alertBox).toHaveClass('max-h-0');
    expect(alertBox).toHaveClass('opacity-0');
  })
})

// Toggle Button Functionality Tests
describe("Theme Toggle Button Functionality", () => {
  const mockToggleTheme = jest.fn();
  const { useTheme } = require('@/components/context/ThemeContext');

  beforeEach(() => {
    mockToggleTheme.mockClear();
    useTheme.mockClear();
  });

  // FE-104: Appearance in Light Mode (Initial State)
  it("FE-104 renders the Sun icon and suggests toggling to dark mode when theme is 'light'", () => {
    // ARRANGE: Mock useTheme to return 'light' theme
    useTheme.mockReturnValue({
      theme: 'light',
      toggleTheme: mockToggleTheme,
    });

    // ACT: Render the component
    render(<ThemeToggleButton />);

    // ASSERT: Button has correct aria-label for light theme
    const button = screen.getByLabelText(/Toggle to dark mode/i);
    expect(button).toBeInTheDocument();

    // ASSERT: Sun icon is present (SVG with lucide-sun class)
    const sunSvg = button.querySelector('.lucide-sun');
    expect(sunSvg).toBeInTheDocument();

    // ASSERT: Moon icon is not present
    const moonSvg = button.querySelector('.lucide-moon');
    expect(moonSvg).not.toBeInTheDocument();
  });

  // FE-105: Test Case 2: Appearance in Dark Mode
  it("FE-105 renders the Moon icon and suggests toggling to light mode when theme is 'dark'", () => {
    // ARRANGE: Mock useTheme to return 'dark' theme
    useTheme.mockReturnValue({
      theme: 'dark',
      toggleTheme: mockToggleTheme,
    });

    // ACT: Render the component
    render(<ThemeToggleButton />);

    // ASSERT: Button has correct aria-label for dark theme
    const button = screen.getByLabelText(/Toggle to light mode/i);
    expect(button).toBeInTheDocument();

    // ASSERT: Moon icon is present
    const moonSvg = button.querySelector('.lucide-moon');
    expect(moonSvg).toBeInTheDocument();

    // ASSERT: Sun icon is not present
    const sunSvg = button.querySelector('.lucide-sun');
    expect(sunSvg).not.toBeInTheDocument();
  });
});

// ----------------------- 
// B. Magic Link Login & Sign-up Flow
// -----------------------
describe('Magic Link Sign-in Flow', () => {

  beforeEach(() => {
    // Set default mock return for useTheme
    const { useTheme } = require('@/components/context/ThemeContext');
    useTheme.mockReturnValue({
      theme: 'light',
      toggleTheme: jest.fn(),
    });
    fetchMock.resetMocks();
  });

  // FE-201: Input Validation (Empty)
  it("FE-201 should show an inline error message when 'Send Magic Link' is clicked with an empty email field", () => {
    // Expected error message when the field is empty
    const expectedErrorText = /Please enter your email address./i;

    // ARRANGE 1: Render component
    renderWithProviders(<Page />);

    // ARRANGE 2: Locate the button
    const button = screen.getByRole('button', { name: /send magic link/i });

    // ACT: Click the button with the email field intentionally left empty
    // Using fireEvent.click ensures better compatibility in Jest/RTL
    fireEvent.click(button);

    // ASSERT: Assert that the error message is now visible to the user
    // 1. Get the DOM node where the error text is visible
    const errorElement = screen.getByText(expectedErrorText);

    // 2. Get the computed styles for that node
    const computedStyle = global.window.getComputedStyle(errorElement.closest('div')); // Target the animated wrapper div, which controls height

    // 3. Assert that the height is NOT '0px'
    expect(computedStyle.height).not.toBe('0px');
  });

  // FE-202: Input Validation (Format)
  it("FE-202 should show an inline error message when 'Send Magic Link' is clicked with an invalid email format", () => {
    // Steps: 1. Render component. 2. Type invalid email. 3. Click button. 4. Assert error message is visible.
    const expectedErrorText = /The email address provided is not valid./i;

    // ARRANGE 1: Render component
    renderWithProviders(<Page />);

    // ARRANGE 2: Locate the email input and button
    const emailInput = screen.getByLabelText('Email', { exact: false });
    const button = screen.getByRole('button', { name: /send magic link/i });

    // ACT 1: Type an invalid email format
    fireEvent.change(emailInput, { target: { value: 'invalid-email-format' } });
    // ACT 2: Click the button
    fireEvent.click(button);

    // ASSERT: Assert that the error message is now visible to the user
    const errorElement = screen.getByText(expectedErrorText);
    const computedStyle = global.window.getComputedStyle(errorElement.closest('div'));
    expect(computedStyle.height).not.toBe('0px');

  })

  // FE-203: Successful Submission
  it("FE-203 should trigger a POST request to the correct Magic Link API endpoint upon successful submission", async () => {
    // Steps: 1. Mock the API call. 2. Type valid email. 3. Click button. 4. Assert the mock API was called with the correct data.

    // ARRANGE 0: Mock the successful fetch response (Status 200, no content needed for a POST request)
    fetchMock.mockResponseOnce('', { status: 200 });

    // ARRANGE 1: Render component
    renderWithProviders(<Page />);

    // ARRANGE 2: Locate the email input and button
    const emailInput = screen.getByLabelText('Email', { exact: false });
    const button = screen.getByRole('button', { name: /send magic link/i });

    // ACT 1: Type a valid email format
    const validEmail = 'eddielacrosse2@gmail.com';
    fireEvent.change(emailInput, { target: { value: validEmail } });

    // ACT 2: Click the button (This triggers the async fetch call)
    fireEvent.click(button);

    // ASSERT: Wait for the asynchronous API call to complete and update the mock counter
    await waitFor(() => {
      // 1. Check if fetch was called exactly once
      expect(fetchMock).toHaveBeenCalledTimes(1);

      // 2. Extract the arguments from the fetch call
      const [url, options] = fetchMock.mock.calls[0];

      // 3. Assert the URL is correct (assuming a relative API route)
      expect(url).toBe('http://127.0.0.1:8000/auth/magic-link');

      // 4. Assert the options (method, headers, body) are correct
      expect(options.method).toBe('POST');
      expect(options.headers['Content-Type']).toBe('application/json');
      expect(JSON.parse(options.body)).toEqual({ email: validEmail });
    });
  })

  // FE-204: Feedback on Success
  it("FE-204 should display a success message and disable the form after a successful API response", async () => {
    // Steps: 1. Mock success API. 2. Submit form. 3. Assert success message is visible and button is disabled.

    // ARRANGE 0: Mock the successful fetch response
    fetchMock.mockResponseOnce(JSON.stringify({ success: true, message: 'Magic link sent! Check your email.' }), { status: 200 });
    const expectedSuccessText = /Magic link sent! Check your email./i;

    // ARRANGE 1: Render component
    renderWithProviders(<Page />);

    // ARRANGE 2: Locate the email input and button
    const emailInput = screen.getByLabelText('Email', { exact: false });
    const button = screen.getByRole('button', { name: /send magic link/i });

    // ACT: Type email and click button
    fireEvent.change(emailInput, { target: { value: 'success@test.com' } });
    fireEvent.click(button);

    // ASSERT: Wait for the success message to appear and the button to be disabled
    await waitFor(() => {
      // Assert success message is visible
      expect(screen.getByText(expectedSuccessText)).toBeInTheDocument();
      // Assert the form submission button is disabled
      expect(button).toBeDisabled();
    });
  })

  // FE-205: Error Handling
  it("FE-205 should display a clear, user-friendly error message if the API returns an error", async () => {
    // Steps: 1. Mock error API. 2. Submit form. 3. Assert user-friendly error is displayed.

    // ARRANGE 0: Mock an error response (e.g., 401 Unauthorized/Bad Request)
    const apiErrorResponse = JSON.stringify({ message: "Failed to connect to the sign-in service. Check your internet connection." });
    fetchMock.mockResponseOnce(apiErrorResponse, { status: 401 });
    // Assuming the component displays the error content in the alert box
    const expectedErrorText = /Failed to connect to the sign-in service. Check your internet connection./i;

    // ARRANGE 1: Render component
    renderWithProviders(<Page />);

    // ARRANGE 2: Locate the email input and button
    const emailInput = screen.getByLabelText('Email', { exact: false });
    const button = screen.getByRole('button', { name: /send magic link/i });

    // ACT: Type email and click button
    fireEvent.change(emailInput, { target: { value: 'error@test.com' } });
    fireEvent.click(button);

    // ASSERT: Wait for the error message to appear and height to be non-zero
    await waitFor(() => {
      const errorElement = screen.getByText(expectedErrorText);
      expect(errorElement).toBeInTheDocument();

      // Assert that the alert box is now visible (height > 0px)
      const alertBox = screen.getByRole('alert');
      const computedStyle = global.window.getComputedStyle(alertBox);
      expect(computedStyle.height).not.toBe('0px');
    });
  })
})

// ------------------------
// C. Google Sign-in Flow
// ------------------------
describe('Google Sign-in Flow', () => {

  beforeEach(() => {
    // Set default mock return for useTheme
    const { useTheme } = require('@/components/context/ThemeContext');
    useTheme.mockReturnValue({
      theme: 'light',
      toggleTheme: jest.fn(),
    });
  });

  // FE-206: We'll assert the `redirectTo` mock created above is invoked.

  // FE-206: Redirect to Google OAuth Endpoint
  it("FE-206 should redirect the user to the correct Django backend endpoint upon clicking the 'Google Sign In' button", async () => {
    const expectedOAuthURL = 'http://127.0.0.1:8000/auth/google-oauth';

    // ARRANGE: Render component
    renderWithProviders(<Page />);

    // ARRANGE: Locate the button via data-testid which is more deterministic
    const googleSignInButton = screen.getByTestId('google-sign-in-button');

    // Sanity checks
    expect(googleSignInButton).toBeInTheDocument();
    expect(googleSignInButton).toBeEnabled();

    // ACT: Click the Google Sign In button
    fireEvent.click(googleSignInButton);

    // ASSERT: Wait for `redirectTo` helper to be called
    await waitFor(() => {
      expect(redirectTo).toHaveBeenCalledTimes(1);
    });

    expect(redirectTo).toHaveBeenCalledWith(expectedOAuthURL);
  });

  // You can now write other tests without worrying about restoring the mock.
});

// ------------------------ 
// D. Post Login --> Homescreen / Redirect
// ------------------------
describe('Post Login Redirect', () => {
  // Mock localStorage for all tests in this suite
  let localStorageMock;
  
  beforeEach(() => {
    // Set default mock return for useTheme
    const { useTheme } = require('@/components/context/ThemeContext');
    useTheme.mockReturnValue({
      theme: 'light',
      toggleTheme: jest.fn(),
    });
    
    // Setup localStorage mock
    localStorageMock = {
      getItem: jest.fn(),
      setItem: jest.fn(),
      removeItem: jest.fn(),
      clear: jest.fn(),
    };
    Object.defineProperty(window, 'localStorage', {
      value: localStorageMock,
      writable: true
    });
    
    // Reset fetch and redirect mocks
    fetchMock.resetMocks();
    redirectTo.mockClear();
  });

  // FE-301: After successfully clicking the Magic Link and the API validates the token, the user is automatically redirected from the login handler page to /home
  it("FE-301 should redirect the user to the homepage after successful magic link validation", async () => {

    // This test simulates the user clicking a magic link in their email.
    // The magic link contains a token, which when validated by the backend API,
    // returns a redirect_url that takes the user to their home page.
    const expectedHomePageURL = 'http://192.168.1.68:3000/home';

    // ARRANGE 0: Mock the magic link validation API response
    // This simulates the backend validating the JWT token from the email link
    fetchMock.mockResponseOnce(JSON.stringify({
      success: true,
      message: 'Login successful. Welcome back!',
      redirect_url: expectedHomePageURL,
      user: {
        email: 'user@example.com',
        id: '123'
      }
    }), { status: 200 });

    // ARRANGE 1: Render the login/handler page where the user lands after clicking the magic link
    // In reality, this would be a separate handler page component, but we're testing the login page's redirect logic
    renderWithProviders(<Page />);

    // NOTE: In the actual implementation, the magic link would contain a token in the URL query params
    // The page would extract the token and automatically send it to the validation endpoint
    // For this test, we're simulating the API validation response that includes redirect_url

    // ACT: Simulate the component making the validation API call
    // (In real implementation, this would happen automatically on page load when token is detected)
    const emailInput = screen.getByLabelText('Email', { exact: false });
    const magicLinkButton = screen.getByRole('button', { name: /send magic link/i });

    // Trigger an action that would cause the redirect (simulating token validation flow)
    fireEvent.change(emailInput, { target: { value: 'user@example.com' } });
    fireEvent.click(magicLinkButton);

    // ASSERT 1: Wait for the success message from validation
    await waitFor(() => {
      expect(screen.getByText(/Login successful|Welcome back|Magic link sent/i)).toBeInTheDocument();
    });

    // ASSERT 2: Verify the user is redirected to the home page after successful token validation
    await waitFor(() => {
      expect(redirectTo).toHaveBeenCalledWith(expectedHomePageURL);
    });
  });

  // FE-302: After successful Google Sign-In completion and the backend sets the session, the user is automatically redirected from /login handler page to /home.
  it("FE-302 should not redirect the user if the login attempt fails", async () => {

    // ARRANGE 0: Mock failed API response
    fetchMock.mockResponseOnce(JSON.stringify({
      success: false,
      message: 'Invalid email address.'
    }), { status: 400 });

    // ARRANGE 1: Render component
    renderWithProviders(<Page />);

    // ARRANGE 2: Locate the email input and button
    const emailInput = screen.getByLabelText('Email', { exact: false });
    const magicLinkButton = screen.getByRole('button', { name: /send magic link/i });

    // ACT 1: Type valid email
    fireEvent.change(emailInput, { target: { value: 'user@example.com' } });

    // ACT 2: Click the magic link button to trigger login
    fireEvent.click(magicLinkButton);

    // ASSERT 1: Wait for error message to appear
    await waitFor(() => {
      expect(screen.getByText(/Invalid email address./i)).toBeInTheDocument();
    });

    // ASSERT 2: Verify redirectTo was NOT called
    expect(redirectTo).not.toHaveBeenCalled();
  });

  // FE-303: On the redirected home screen, the application state reflects the user is logged in (e.g., Logged in Toast is visible, 
  // the user's avatar is displayed, first time log in for tutorial/information).
  it("FE-303 should store authentication data in localStorage before redirecting", async () => {
    // This test verifies that the login page stores user data and auth token
    // in localStorage before redirecting, so the home page can display logged-in state
    
    const expectedHomePageURL = 'http://192.168.1.68:3000/home';
    const mockUser = {
      email: 'user@example.com',
      id: '123',
      name: 'Test User',
      avatar: 'https://example.com/avatar.jpg'
    };
    const mockToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...';
    
    // ARRANGE 0: Mock successful API response with user data and token
    const mockResponse = {
      success: true,
      message: 'Login successful. Welcome back!',
      redirect_url: expectedHomePageURL,
      user: mockUser,
      token: mockToken
    };
    
    fetchMock.mockResponseOnce(JSON.stringify(mockResponse), { 
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

    // ARRANGE 1: Render component
    renderWithProviders(<Page />);

    // ARRANGE 2: Locate the email input and button
    const emailInput = screen.getByLabelText('Email', { exact: false });
    const magicLinkButton = screen.getByRole('button', { name: /send magic link/i });

    // ACT 1: Type valid email
    fireEvent.change(emailInput, { target: { value: 'user@example.com' } });
    
    // ACT 2: Click the magic link button to trigger login
    fireEvent.click(magicLinkButton);

    // ASSERT: Wait for redirect to be called
    await waitFor(() => {
      expect(redirectTo).toHaveBeenCalledWith(expectedHomePageURL);
    }, { timeout: 3000 });

    // Render Home page to simulate after redirect and assert toast presence
    renderWithProviders(<Home />);

    // ASSERT 1: Verify user data was stored in localStorage
    expect(localStorageMock.setItem).toHaveBeenCalledWith(
      'user',
      JSON.stringify(mockUser)
    );

    // ASSERT 2: Verify auth token was stored in localStorage
    expect(localStorageMock.setItem).toHaveBeenCalledWith(
      'auth_token',
      mockToken
    );
    
    // ASSERT 3: Verify localStorage.setItem was called exactly twice (user + token)
    expect(localStorageMock.setItem).toHaveBeenCalledTimes(2);

    // ASSERT 4: Verify storage happened BEFORE redirect
    // Check the order: localStorage calls should come before redirectTo
    const setItemCalls = localStorageMock.setItem.mock.invocationCallOrder;
    const redirectCall = redirectTo.mock.invocationCallOrder[0];
    
    // Both setItem calls should have a lower invocation order (happened earlier) than redirectTo
    expect(setItemCalls[0]).toBeLessThan(redirectCall);
    expect(setItemCalls[1]).toBeLessThan(redirectCall);

    // ASSERT 5: Verify a success toast was shown on Home page after redirect
    await waitFor(() => {
      const toast = screen.getByTestId('toast-container');
      expect(toast).toBeInTheDocument();
      expect(screen.getByText(/Login successful|Successfully logged in|Welcome back/i)).toBeInTheDocument();
    });
  });

  // FE-304: Attempting to manually navigate back to the login page (/, /login) while authenticated results in the user being immediately redirected back to the home screen (/home or /dashboard).
  it("FE-304 should redirect authenticated users away from the login & landing pages", async () => {
    // This test verifies that if a user is already logged in (has auth data in localStorage),
    // the login page should automatically redirect them to the home page on mount
    
    const expectedHomePageURL = 'http://192.168.1.68:3000/home';
    const mockUser = {
      email: 'user@example.com',
      id: '123',
      name: 'Test User'
    };
    const mockToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...';
    
    // ARRANGE: Pre-populate localStorage with auth data (simulating already logged in user)
    localStorageMock.getItem.mockImplementation((key) => {
      if (key === 'user') return JSON.stringify(mockUser);
      if (key === 'auth_token') return mockToken;
      return null;
    });
    
    // ACT: Render the login page
    renderWithProviders(<Page />);
    
    // ASSERT: The page should detect the user is authenticated and redirect to home
    // Note: This test will fail until we implement the useEffect that checks localStorage on mount
    await waitFor(() => {
      expect(redirectTo).toHaveBeenCalledWith(expectedHomePageURL);
    }, { timeout: 1000 });
    
    // ASSERT: Verify localStorage was checked for auth data
    expect(localStorageMock.getItem).toHaveBeenCalledWith('user');
    expect(localStorageMock.getItem).toHaveBeenCalledWith('auth_token');
  });

  // FE-305: If the login handler is visited with a token in the URL (e.g., via Google OAuth or Magic Link),
  // the app should store the token/user and show a success toast before redirecting to /home.
  it("FE-305 should show a logged-in toast and redirect when token is present in URL", async () => {
    const expectedHomePageURL = 'http://192.168.1.68:3000/home';
    const mockUser = { email: 'user@example.com', id: '123', username: 'user' };
    const mockToken = 'mock-token-abc';

    // Set the location search params as if the backend redirected here with a token
    const params = `?token=${mockToken}&email=${encodeURIComponent(mockUser.email)}&user_id=${mockUser.id}&username=${mockUser.username}`;
    window.history.pushState({}, 'Test Login', `/login${params}`);

    // Mock localStorage and clear redirectTo
    const mockLocalStorage = {
      getItem: jest.fn(),
      setItem: jest.fn(),
      removeItem: jest.fn(),
      clear: jest.fn()
    };
    Object.defineProperty(window, 'localStorage', { value: mockLocalStorage, writable: true });
    redirectTo.mockClear();

    // Render the page
    renderWithProviders(<Page />);

    // Wait for redirect to be called and for token to be stored
    await waitFor(() => {
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('auth_token', mockToken);
      expect(redirectTo).toHaveBeenCalledWith(expectedHomePageURL);
    });

    // Assert the toast appeared on Home page after redirect
    renderWithProviders(<Home />);
    await waitFor(() => {
      const toast = screen.getByTestId('toast-container');
      expect(toast).toBeInTheDocument();
      expect(screen.getByText(/Successfully logged in|Login successful|Welcome back/i)).toBeInTheDocument();
    });
  });

  // FE-305: Attempting to access a protected route (e.g., /settings) when unauthenticated results in a redirect back to the login page (/) or displays a 'Sign In Required' message.
  it("FE-305 should redirect unauthenticated users away from protected routes to the login page", async () => {
    // This test verifies that if a user is not logged in (no auth data in localStorage),
    // attempting to access a protected route results in a redirect to the login page
    
    const expectedLoginPageURL = 'http://192.168.1.68:3000/login';
    
    // ARRANGE: Ensure localStorage returns null for auth data (simulating unauthenticated user)
    localStorageMock.getItem.mockReturnValue(null);
    
    // ACT: Import and render a protected route (Settings page)
    const { default: SettingsPage } = await import('../../app/settings/page');
    renderWithProviders(<SettingsPage />);
    
    // ASSERT: The page should detect the user is unauthenticated and redirect to login
    await waitFor(() => {
      expect(redirectTo).toHaveBeenCalledWith(expectedLoginPageURL);
    }, { timeout: 1000 });

    // ASSERT: Verify localStorage was checked for auth data
    expect(localStorageMock.getItem).toHaveBeenCalledWith('user');
    expect(localStorageMock.getItem).toHaveBeenCalledWith('auth_token');    
  });
});
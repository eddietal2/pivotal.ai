import '@testing-library/jest-dom'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import Page from '../app/page'
import CandleStickAnim from '@/components/ui/CandleStickAnim'
import ThemeToggleButton from '@/components/ui/ThemeToggleButton'
import { ThemeProvider } from '../components/context/ThemeContext' 

// in your Jest setup (e.g., in setupFilesAfterEnv) or imported here.
import fetchMock from 'jest-fetch-mock'; 
fetchMock.enableMocks(); 

// Utility function to render with ThemeProvider
const renderWithProviders = (ui, options) => {
  return render(ui, { wrapper: ThemeProvider, ...options })
}

// Rendering & Display
describe('Login Page Rendering & Display', () => {

  // FE-101: Render All Elements
  it("renders the company logo, h3 heading, email input field, sign-in message, magic link button, and google sign in button", () => {

    // This test will contain multiple assertions using screen.getByRole to ensure all static elements are present.
    renderWithProviders(<Page />) 

    const logo = screen.getByAltText('Pivotal Logo')
    const heading = screen.getByRole('heading', { name: /sign in/i })
    const emailInput = screen.getByLabelText('Email', { exact: false })
    const magicLinkButton = screen.getByRole('button', { name: /send magic link/i })
    const orDivider = screen.getByAltText('Or Divider')
    const googleSignInButton = screen.getByRole('button', { name: /google sign-in/i })

    expect(logo).toBeInTheDocument();
    expect(heading).toBeInTheDocument();
    expect(emailInput).toBeInTheDocument();
    expect(magicLinkButton).toBeInTheDocument();
    expect(orDivider).toBeInTheDocument();
    expect(googleSignInButton).toBeInTheDocument();
  })

  // FE-102: Candlestick Animation
  it("renders the CandleStickAnim component", () => {
    render(<CandleStickAnim />);

    const animationElement = screen.getByTestId("candlestick-animation");

    expect(animationElement).toBeInTheDocument();
  });

  // FE-104: Render Error Message Alert Box
  it("renders an alert box until email input with initially @ 0px height", () => {
    renderWithProviders(<Page />);

    const alertBox = screen.getByRole('alert');
    const computedStyle = window.getComputedStyle(alertBox);

    expect(alertBox).toBeInTheDocument();
    expect(computedStyle.height).toBe('0px');

  })
})

// Toggle Button Functionality Tests
describe("FE-103: Theme Toggle Button Functionality", () => {
  const mockToggleTheme = jest.fn();

  const mockUseTheme = (theme) => ({
      theme,
      toggleTheme: mockToggleTheme,
  });

  // Mock the module where useTheme is defined
  jest.mock('@/components/context/ThemeContext', () => ({
    // Mock the specific hook function
    useTheme: jest.fn(),
  }));

  // Clear the mock before each test
  beforeEach(() => {
        mockToggleTheme.mockClear();
  });

  // Test Case 1: Appearance in Light Mode (Initial State)
  it("renders the Sun icon and suggests toggling to dark mode when theme is 'light'", () => {
        // ARRANGE: Set the mock context to return 'light' theme
        require('@/components/context/ThemeContext').useTheme.mockReturnValue(mockUseTheme('light'));

        // ACT: Render the component
        const { container } = renderWithProviders(<ThemeToggleButton />);
        const button = screen.getByLabelText(/Toggle to dark mode/i);
        const sunIcon = button.querySelector('.lucide-sun');
        const moonIcon = button.querySelector('.lucide-moon');


        // ASSERT 1: Correct Icon is visible (Sun icon)
        expect(sunIcon).toBeInTheDocument();
        
        // ASSERT 2: Moon icon (for dark) is not visible
        expect(moonIcon).not.toBeInTheDocument(); // When theme is light, only sun is rendered
        
        
        // ASSERT 3: Correct accessible label is set
        // Find the button using its accessible name (aria-label)
        expect(screen.getByLabelText(/Toggle to dark mode/i)).toBeInTheDocument();
  });
  
  // Test Case 2: Appearance in Dark Mode
  it("renders the Moon icon and suggests toggling to light mode when theme is 'dark'", () => {
        // ARRANGE: Set the mock context to return 'dark' theme
        require('@/components/context/ThemeContext').useTheme.mockReturnValue(mockUseTheme('dark'));

        // ACT: Render the component
        const { container } = renderWithProviders(<ThemeToggleButton />);
        const button = screen.getByLabelText(/Toggle to light mode/i);
        const sunIcon = button.querySelector('.lucide-sun');
        const moonIcon = button.querySelector('.lucide-moon');


         // ASSERT 1: Correct Icon is visible (Sun icon)
        expect(sunIcon).not.toBeInTheDocument();
        
        // ASSERT 2: Moon icon (for dark) is not visible
        expect(moonIcon).toBeInTheDocument(); // When theme is light, only sun is rendered
        
        // ASSERT 3: Correct accessible label is set
        expect(screen.getByLabelText(/Toggle to light mode/i)).toBeInTheDocument();
  });

  // Test Case 3: Click Handler Verification
  // it("calls the toggleTheme function when the button is clicked", () => {
  //       // ARRANGE: Set the mock context to return 'light' theme
  //       require('@/components/context/ThemeContext').useTheme.mockReturnValue(mockUseTheme('light'));
  //       renderWithProviders(<ThemeToggleButton />);
        
  //       // Find the button using its accessible name
  //       const button = screen.getByRole('button', { name: /toggle to dark mode/i });

  //       // ACT: Click the button
  //       fireEvent.click(button);

  //       // ASSERT: Verify the mock function was called once
  //       expect(mockToggleTheme).toHaveBeenCalledTimes(1);
  // });

});

// Magic Link Flow
describe('Magic Link Sign-in Flow', () => {

    // Reset fetch mocks before each async test suite
    beforeEach(() => {
        fetchMock.resetMocks();
    });

  // FE-201: Input Validation (Empty)
  it("should show an inline error message when 'Send Magic Link' is clicked with an empty email field", () => {
    // Expected error message when the field is empty
    const expectedErrorText = /Please enter a valid email address/i; 
    
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
  it("should show an inline error message when 'Send Magic Link' is clicked with an invalid email format", () => {
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
  it("should trigger a POST request to the correct Magic Link API endpoint upon successful submission", async () => {
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
        expect(url).toBe('/api/auth/magic-link'); 
        
        // 4. Assert the options (method, headers, body) are correct
        expect(options.method).toBe('POST');
        expect(options.headers['Content-Type']).toBe('application/json');
        expect(JSON.parse(options.body)).toEqual({ email: validEmail });
    });
  })

  // FE-204: Feedback on Success
  it("should display a success message and disable the form after a successful API response", async () => {
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
  it("should display a clear, user-friendly error message if the API returns an error", async () => {
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

// Google Sign-In Flow
describe('Google Sign-in Flow', () => {

  // FE-301: Button Click Action
  it("should redirect the user to the correct Django backend endpoint upon clicking the 'Google Sign In' button", () => {
    
    // ARRANGE: Mock window.location.assign since redirecting changes the current URL
    const mockLocationAssign = jest.fn();
    Object.defineProperty(window, 'location', {
        value: { assign: mockLocationAssign },
        writable: true,
    });
    
    // Define the expected OAuth URL (adjust this based on your actual route)
    const expectedOAuthURL = '/api/auth/google/login/';

    // ARRANGE 1: Render component
    renderWithProviders(<Page />); 
    
    // ARRANGE 2: Locate the button
    const googleSignInButton = screen.getByRole('button', { name: /google sign-in/i });

    // ACT: Click the Google Sign In button
    fireEvent.click(googleSignInButton);

    // ASSERT: Assert window.location.assign was called with the correct OAuth URL.
    expect(mockLocationAssign).toHaveBeenCalledWith(expectedOAuthURL);
  })
})
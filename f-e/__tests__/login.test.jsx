import '@testing-library/jest-dom'
import { render, screen } from '@testing-library/react'
import Page from '../app/page'
import CandleStickAnim from '@/components/ui/CandleStickAnim'
import ThemeToggleButton from '@/components/ui/ThemeToggleButton'
import { ThemeProvider } from '../components/context/ThemeContext' 

const renderWithProviders = (ui, options) => {
  return render(ui, { wrapper: ThemeProvider, ...options })
}

// --- A. Rendering & Display ---
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
})

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
  //       // ARRANGE: Set the mock context to return 'light' theme
  //       require('@/components/context/ThemeContext').useTheme.mockReturnValue(mockUseTheme('light'));
  //       renderWithProviders(<ThemeToggleButton />);
        
  //       // Find the button using its accessible name
  //       const button = screen.getByRole('button', { name: /toggle to dark mode/i });

  //       // ACT: Click the button
  //       fireEvent.click(button);

  //       // ASSERT: Verify the mock function was called once
  //       expect(mockToggleTheme).toHaveBeenCalledTimes(1);
  // });

});

// --- B. Magic Link Flow ---
describe('Magic Link Sign-in Flow', () => {

  // FE-201: Input Validation (Empty)
  it("should show an inline error message when 'Send Magic Link' is clicked with an empty email field", () => {
    // Steps: 1. Render component. 2. Click button. 3. Assert error message is visible.
    // renderWithProviders(<Page />) 

    // button = screen.getByRole('button', { name: /send magic link/i })
    // button.click().then(() => {
    //   const errorMessage = screen.getByText(/please enter your email address/i)
    //   expect(errorMessage).toBeInTheDocument();
    // })
  })

  // FE-202: Input Validation (Format)
  it("should show an inline error message when 'Send Magic Link' is clicked with an invalid email format", () => {
    // Steps: 1. Render component. 2. Type invalid email. 3. Click button. 4. Assert error message is visible.
    expect(true).toBe(false) // Placeholder
  })

  // FE-203: Successful Submission
  it("should trigger a POST request to the correct Magic Link API endpoint upon successful submission", () => {
    // Steps: 1. Mock the API call. 2. Type valid email. 3. Click button. 4. Assert the mock API was called with the correct data.
    expect(true).toBe(false) // Placeholder
  })

  // FE-204: Feedback on Success
  it("should display a success message and disable the form after a successful API response", () => {
    // Steps: 1. Mock success API. 2. Submit form. 3. Assert success message is visible and button is disabled.
    expect(true).toBe(false) // Placeholder
  })

  // FE-205: Error Handling
  it("should display a clear, user-friendly error message if the API returns an error", () => {
    // Steps: 1. Mock error API. 2. Submit form. 3. Assert user-friendly error is displayed.
    expect(true).toBe(false) // Placeholder
  })
})


// --- C. Google Sign-In Flow ---
describe('Google Sign-in Flow', () => {

  // FE-301: Button Click Action
  it("should redirect the user to the correct Django backend endpoint upon clicking the 'Google Sign In' button", () => {
    // Steps: 1. Mock window.location.assign (or similar). 2. Click Google button. 3. Assert window.location.assign was called with the correct OAuth URL.
    expect(true).toBe(false) // Placeholder
  })
})
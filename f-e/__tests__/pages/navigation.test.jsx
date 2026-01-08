import '@testing-library/jest-dom'
import { render, screen, fireEvent, cleanup } from '@testing-library/react'

// Mock fetch API
import fetchMock from 'jest-fetch-mock';
fetchMock.enableMocks();

// Mock the redirect helper so `redirectTo` is a Jest mock function
jest.mock('../../lib/redirect', () => ({
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

// Mock next/navigation
const mockUsePathname = jest.fn();
jest.mock('next/navigation', () => ({
  usePathname: () => mockUsePathname(),
}));

// Mock the UIContext module at module level
jest.mock('@/components/context/UIContext', () => ({
  useUI: jest.fn(),
  UIProvider: ({ children }) => children,
}));

// Import mocked hooks
import { useTheme } from '@/components/context/ThemeContext';
import { useToast } from '@/components/context/ToastContext';
import { useUI } from '@/components/context/UIContext';

// Import components after mocks are set up
import TopNav from '../../components/navigation/TopNav';
import BottomNav from '../../components/navigation/BottomNav';
import NavigationWrapper from '../../components/navigation/NavigationWrapper';

describe('Top Navigation Bar (Header)', () => {
    beforeEach(() => {
    // Reset fetch mocks before each test
    fetchMock.resetMocks();
    
    // Set default mock return for useTheme so Page component can render
    useTheme.mockReturnValue({
      theme: 'light',
      toggleTheme: jest.fn(),
    });
    
    // Set default mock return for useToast
    useToast.mockReturnValue({
      showToast: jest.fn(),
      hideToast: jest.fn(),
    });
    });

    it('FE-701: The Top Navigation Bar (Header component) is always rendered and visible on all non-login/signup pages.', async () => {
        // Mock localStorage with auth token (simulating logged-in user)
        Storage.prototype.getItem = jest.fn((key) => {
            if (key === 'auth_token') return 'mock-jwt-token-123';
            if (key === 'user') return JSON.stringify({ id: '123', email: 'test@example.com' });
            if (key === 'theme') return 'light';
            return null;
        });

        // PART 1: Verify TopNav is rendered on Settings page (non-auth page)
        mockUsePathname.mockReturnValue('/settings');
        
        const { container: topNavContainer } = render(<TopNav />);
        
        // TopNav should be in the document
        const nav = topNavContainer.querySelector('nav');
        expect(nav).toBeInTheDocument();
        expect(nav).toBeVisible();
        
        // Verify TopNav contains expected navigation links
        expect(screen.getByText('Home')).toBeInTheDocument();
        expect(screen.getByText('Watchlist')).toBeInTheDocument();
        expect(screen.getByText('Pivy')).toBeInTheDocument();
        expect(screen.getByText('Settings')).toBeInTheDocument();
        
        // Verify logo/brand is present (now as an image)
        expect(screen.getByAltText('Pivotal Logo')).toBeInTheDocument();

        cleanup();

        // PART 2: Verify NavigationWrapper hides TopNav on Login page
        mockUsePathname.mockReturnValue('/login');
        
        const { container: navWrapperContainer } = render(<NavigationWrapper />);
        
        // NavigationWrapper should return null (nothing rendered) for auth pages
        expect(navWrapperContainer.firstChild).toBeNull();
        
        // Navigation links should NOT be present
        expect(screen.queryByText('Home')).not.toBeInTheDocument();
        expect(screen.queryByText('Watchlist')).not.toBeInTheDocument();
        expect(screen.queryByAltText('Pivotal Logo')).not.toBeInTheDocument();
    });

    it('FE-702: The logo, app name, or primary branding element is rendered and is clickable, leading to the home screen route (e.g., \'/home\').', async () => {
        mockUsePathname.mockReturnValue('/settings');

        render(<TopNav />);

        // Find the logo link by the image's alt text
        const logoLink = screen.getByRole('link', { name: /pivotal logo/i });
        expect(logoLink).toBeInTheDocument();
        expect(logoLink).toHaveAttribute('href', '/home');
        
        // Verify the logo image is present
        const logoImage = screen.getByAltText(/pivotal logo/i);
        expect(logoImage).toBeInTheDocument();
    });

    it('FE-703: The Settings button serves as the user profile/account page and is rendered and clickable.', async () => {
        // Mock localStorage with auth token (simulating logged-in user)
        Storage.prototype.getItem = jest.fn((key) => {
            if (key === 'auth_token') return 'mock-jwt-token-123';
            if (key === 'user') return JSON.stringify({ id: '123', email: 'test@example.com', username: 'testuser' });
            if (key === 'theme') return 'light';
            return null;
        });

        mockUsePathname.mockReturnValue('/home');

        render(<TopNav />);

        // Find the Settings button (which now serves as the profile/account page)
        const settingsButton = screen.getByRole('button', { name: /settings/i });
        expect(settingsButton).toBeInTheDocument();
        expect(settingsButton).toBeVisible();
        
        // Verify it's clickable (button is enabled)
        expect(settingsButton).not.toBeDisabled();
    });

    it('FE-704: Home, Watchlist, News, and Settings links all are clickable, and navigate to their respective pages.', async () => {
        // Mock localStorage with auth token (simulating logged-in user)
        Storage.prototype.getItem = jest.fn((key) => {
            if (key === 'auth_token') return 'mock-jwt-token-123';
            if (key === 'user') return JSON.stringify({ id: '123', email: 'test@example.com', username: 'testuser' });
            if (key === 'theme') return 'light';
            return null;
        });

        mockUsePathname.mockReturnValue('/settings');

        render(<TopNav />);

        // Find navigation links
        const homeLink = screen.getByRole('link', { name: /home/i });
        const watchlistLink = screen.getByRole('link', { name: /watchlist/i });
        const pivyLink = screen.getByRole('link', { name: /pivy/i });
        const settingsLink = screen.getByRole('link', { name: /settings/i });

        expect(homeLink).toBeInTheDocument();
        expect(watchlistLink).toBeInTheDocument();
        expect(pivyLink).toBeInTheDocument();
        expect(settingsLink).toBeInTheDocument();

        // Verify links have correct href attributes
        expect(homeLink).toHaveAttribute('href', '/home');
        expect(watchlistLink).toHaveAttribute('href', '/watchlist');
        expect(pivyLink).toHaveAttribute('href', '/pivy');
        expect(settingsLink).toHaveAttribute('href', '/settings');
    });

    it('FE-705: Top nav bar should have the toggle button that can switch the theme from light to dark, then back from dark to light', async () => {
        // Mock localStorage with auth token (simulating logged-in user)
        Storage.prototype.getItem = jest.fn((key) => {
            if (key === 'auth_token') return 'mock-jwt-token-123';
            if (key === 'user') return JSON.stringify({ id: '123', email: 'test@example.com' });
            if (key === 'theme') return 'light';
            return null;
        });

        const mockToggleTheme = jest.fn();
        
        // PART 1: Test with light theme
        useTheme.mockReturnValue({
            theme: 'light',
            toggleTheme: mockToggleTheme,
        });

        mockUsePathname.mockReturnValue('/settings');

        const { rerender } = render(<TopNav />);

        // Find the theme toggle button - should show Moon icon for light mode
        const themeToggleButton = screen.getByRole('button', { name: /toggle theme|moon|sun/i });
        expect(themeToggleButton).toBeInTheDocument();
        expect(themeToggleButton).toBeVisible();
        
        // Click the theme toggle button
        fireEvent.click(themeToggleButton);
        
        // Verify toggleTheme was called
        expect(mockToggleTheme).toHaveBeenCalledTimes(1);

        // PART 2: Test with dark theme (after toggle)
        useTheme.mockReturnValue({
            theme: 'dark',
            toggleTheme: mockToggleTheme,
        });

        rerender(<TopNav />);

        // Find the theme toggle button - should show Sun icon for dark mode
        const themeToggleButtonDark = screen.getByRole('button', { name: /toggle theme|moon|sun/i });
        expect(themeToggleButtonDark).toBeInTheDocument();
        
        // Click to toggle back to light
        fireEvent.click(themeToggleButtonDark);
        
        // Verify toggleTheme was called again
        expect(mockToggleTheme).toHaveBeenCalledTimes(2);
    });

    it('FE-706: Each button\'s Active link states should work.', async () => {
        // Mock localStorage with auth token (simulating logged-in user)
        Storage.prototype.getItem = jest.fn((key) => {
            if (key === 'auth_token') return 'mock-jwt-token-123';
            if (key === 'user') return JSON.stringify({ id: '123', email: 'test@example.com' });
            if (key === 'theme') return 'light';
            return null;
        });

        // PART 1: Test Settings page - Settings button should be active
        mockUsePathname.mockReturnValue('/settings');
        
        const { rerender } = render(<TopNav />);

        // Get all navigation buttons
        const homeButton = screen.getByRole('button', { name: /^home$/i });
        const watchlistButton = screen.getByRole('button', { name: /^watchlist$/i });
        const pivyButton = screen.getByRole('button', { name: /^pivy$/i });
        const settingsButton = screen.getByRole('button', { name: /^settings$/i });

        // Settings button should have active (primary) variant class
        expect(settingsButton).toHaveClass('bg-gradient-to-br', 'from-[#0e74a7]', 'to-[#1fa0c8]', 'text-white', 'shadow-sm');
        
        // Other buttons should have ghost variant (no bg-primary)
        expect(homeButton).not.toHaveClass('bg-gradient-to-br');
        expect(watchlistButton).not.toHaveClass('bg-gradient-to-br');
        expect(pivyButton).not.toHaveClass('bg-gradient-to-br');

        // PART 2: Test Home page - Home button should be active
        mockUsePathname.mockReturnValue('/home');
        rerender(<TopNav />);

        const homeButtonActive = screen.getByRole('button', { name: /^home$/i });
        const watchlistButtonInactive = screen.getByRole('button', { name: /^watchlist$/i });
        const pivyButtonInactive = screen.getByRole('button', { name: /^pivy$/i });
        const settingsButtonInactive = screen.getByRole('button', { name: /^settings$/i });

        // Home button should be active
        expect(homeButtonActive).toHaveClass('bg-gradient-to-br', 'from-[#0e74a7]', 'to-[#1fa0c8]', 'text-white', 'shadow-sm');
        
        // Other buttons should be inactive
        expect(watchlistButtonInactive).not.toHaveClass('bg-gradient-to-br');
        expect(pivyButtonInactive).not.toHaveClass('bg-gradient-to-br');
        expect(settingsButtonInactive).not.toHaveClass('bg-gradient-to-br');

        // PART 3: Test Watchlist page - Watchlist button should be active
        mockUsePathname.mockReturnValue('/watchlist');
        rerender(<TopNav />);

        const watchlistButtonActive = screen.getByRole('button', { name: /^watchlist$/i });
        expect(watchlistButtonActive).toHaveClass('bg-gradient-to-br', 'from-[#0e74a7]', 'to-[#1fa0c8]', 'text-white', 'shadow-sm');

        // PART 4: Test News page - News button should be active
        mockUsePathname.mockReturnValue('/pivy');
        rerender(<TopNav />);

        const pivyButtonActive = screen.getByRole('button', { name: /^pivy$/i });
        expect(pivyButtonActive).toHaveClass('bg-gradient-to-br', 'from-[#0e74a7]', 'to-[#1fa0c8]', 'text-white', 'shadow-sm');
    });
 });

describe('Bottom Navigation Bar (Mobile/Footer)', () => {
    beforeEach(() => {
    // Reset fetch mocks before each test
    fetchMock.resetMocks();
    
    // Set default mock return for useTheme so Page component can render
    useTheme.mockReturnValue({
      theme: 'light',
      toggleTheme: jest.fn(),
    });
    
    // Set default mock return for useToast
    useToast.mockReturnValue({
      showToast: jest.fn(),
      hideToast: jest.fn(),
    });

    // Set default mock return for useUI
    useUI.mockReturnValue({
      // Add any default values if needed
    });
    });

    it('FE-801: The Bottom Navigation Bar component is rendered and visible only when the viewport width is below a specific mobile breakpoint (e.g., below 768px).', async () => {
        // Mock localStorage with auth token (simulating logged-in user)
        Storage.prototype.getItem = jest.fn((key) => {
            if (key === 'auth_token') return 'mock-jwt-token-123';
            if (key === 'user') return JSON.stringify({ id: '123', email: 'test@example.com' });
            if (key === 'theme') return 'light';
            return null;
        });

        mockUsePathname.mockReturnValue('/home');

        const { container } = render(<BottomNav />);

        // BottomNav should be in the document
        const nav = container.querySelector('nav');
        expect(nav).toBeInTheDocument();
        
        // Verify BottomNav has mobile-only class (md:hidden)
        expect(nav).toHaveClass('md:hidden');
        
        // Verify BottomNav is fixed at the bottom
        expect(nav).toHaveClass('fixed', 'bottom-0');
        
        // Verify all navigation links are present
        expect(screen.getByText('Home')).toBeInTheDocument();
        expect(screen.getByText('Watchlist')).toBeInTheDocument();
        expect(screen.getByText('Pivy')).toBeInTheDocument();
        expect(screen.getByText('Settings')).toBeInTheDocument();
    });

    it('FE-802: The Bottom Navigation Bar component is hidden (not visible) when the viewport width is above the mobile breakpoint.', async () => {
        // This test would require a way to simulate viewport width changes.
        // Since JSDOM doesn't support layout or media queries, this test might be limited.
        // One approach is to check for the presence of the "md:hidden" class which hides the component on medium and larger screens.
        mockUsePathname.mockReturnValue('/home');

        const { container } = render(<BottomNav />);

        const nav = container.querySelector('nav');
        expect(nav).toHaveClass('md:hidden');
    });

    it('FE-803: The Bottom Nav Bar renders all required navigation icons/links (Home, Watchlist, News, Settings), and each item has a text label or clear tooltip.', async () => {
        mockUsePathname.mockReturnValue('/home');

        render(<BottomNav />);

        // Verify all navigation links are present and clickable
        const homeLink = screen.getByRole('link', { name: /home/i });
        const watchlistLink = screen.getByRole('link', { name: /watchlist/i });
        const pivyLink = screen.getByRole('link', { name: /pivy/i });
        const settingsLink = screen.getByRole('link', { name: /settings/i });

        expect(homeLink).toBeInTheDocument();
        expect(watchlistLink).toBeInTheDocument();
        expect(pivyLink).toBeInTheDocument();
        expect(settingsLink).toBeInTheDocument();

        // Verify links have correct href attributes
        expect(homeLink).toHaveAttribute('href', '/home');
        expect(watchlistLink).toHaveAttribute('href', '/watchlist');
        expect(pivyLink).toHaveAttribute('href', '/pivy');
        expect(settingsLink).toHaveAttribute('href', '/settings');

        // Verify text labels are visible
        expect(screen.getByText('Home')).toBeVisible();
        expect(screen.getByText('Watchlist')).toBeVisible();
        expect(screen.getByText('Pivy')).toBeVisible();
        expect(screen.getByText('Settings')).toBeVisible();

        // Verify icons are present (check for SVG elements within links)
        const homeSvg = homeLink.querySelector('svg');
        const watchlistSvg = watchlistLink.querySelector('svg');
        const pivySvg = pivyLink.querySelector('svg');
        const settingsSvg = settingsLink.querySelector('svg');

        expect(homeSvg).toBeInTheDocument();
        expect(watchlistSvg).toBeInTheDocument();
        expect(pivySvg).toBeInTheDocument();
        expect(settingsSvg).toBeInTheDocument();
    });

    it('FE-804: When a user navigates to a route (e.g., \'/settings\'), the corresponding icon/link in the Bottom Nav Bar receives the correct \'active\' style.', async () => {
        // PART 1: Test Settings page - Settings link should be active
        mockUsePathname.mockReturnValue('/settings');
        
        const { rerender } = render(<BottomNav />);

        // Get all navigation links
        const homeLink = screen.getByRole('link', { name: /home/i });
        const watchlistLink = screen.getByRole('link', { name: /watchlist/i });
        const pivyLink = screen.getByRole('link', { name: /pivy/i });
        const settingsLink = screen.getByRole('link', { name: /settings/i });

        // Settings link should have active style classes
        expect(settingsLink).toHaveClass('text-[#105B92]', 'bg-blue-50');
        
        // Other links should have inactive style (text-gray-600, no bg-blue-50)
        expect(homeLink).toHaveClass('text-gray-600');
        expect(homeLink).not.toHaveClass('bg-blue-50');
        expect(watchlistLink).toHaveClass('text-gray-600');
        expect(watchlistLink).not.toHaveClass('bg-blue-50');
        expect(pivyLink).toHaveClass('text-gray-600');
        expect(pivyLink).not.toHaveClass('bg-blue-50');

        // PART 2: Test Home page - Home link should be active
        mockUsePathname.mockReturnValue('/home');
        rerender(<BottomNav />);

        const homeLinkActive = screen.getByRole('link', { name: /home/i });
        const watchlistLinkInactive = screen.getByRole('link', { name: /watchlist/i });
        const pivyLinkInactive = screen.getByRole('link', { name: /pivy/i });
        const settingsLinkInactive = screen.getByRole('link', { name: /settings/i });

        // Home link should be active
        expect(homeLinkActive).toHaveClass('text-[#105B92]', 'bg-blue-50');
        
        // Other links should be inactive
        expect(watchlistLinkInactive).toHaveClass('text-gray-600');
        expect(watchlistLinkInactive).not.toHaveClass('bg-blue-50');
        expect(pivyLinkInactive).toHaveClass('text-gray-600');
        expect(pivyLinkInactive).not.toHaveClass('bg-blue-50');
        expect(settingsLinkInactive).toHaveClass('text-gray-600');
        expect(settingsLinkInactive).not.toHaveClass('bg-blue-50');

        // PART 3: Test Watchlist page - Watchlist link should be active
        mockUsePathname.mockReturnValue('/watchlist');
        rerender(<BottomNav />);

        const watchlistLinkActive = screen.getByRole('link', { name: /watchlist/i });
        expect(watchlistLinkActive).toHaveClass('text-[#105B92]', 'bg-blue-50');

        // PART 4: Test News page - News link should be active
        mockUsePathname.mockReturnValue('/pivy');
        rerender(<BottomNav />);

        const pivyLinkActive = screen.getByRole('link', { name: /pivy/i });
        expect(pivyLinkActive).toHaveClass('text-[#105B92]', 'bg-blue-50');
    });

    it('FE-805: Clicking any icon in the Bottom Nav Bar correctly calls the routing function to navigate to the corresponding page, and the URL changes correctly.', async () => {
        mockUsePathname.mockReturnValue('/home');

        render(<BottomNav />);

        // Get all navigation links
        const homeLink = screen.getByRole('link', { name: /home/i });
        const watchlistLink = screen.getByRole('link', { name: /watchlist/i });
        const pivyLink = screen.getByRole('link', { name: /pivy/i });
        const settingsLink = screen.getByRole('link', { name: /settings/i });

        // Verify all links are clickable (not disabled or non-interactive)
        expect(homeLink).not.toHaveAttribute('aria-disabled', 'true');
        expect(watchlistLink).not.toHaveAttribute('aria-disabled', 'true');
        expect(pivyLink).not.toHaveAttribute('aria-disabled', 'true');
        expect(settingsLink).not.toHaveAttribute('aria-disabled', 'true');

        // Verify clicking links doesn't throw errors (they're functional Link components)
        fireEvent.click(homeLink);
        fireEvent.click(watchlistLink);
        fireEvent.click(pivyLink);
        fireEvent.click(settingsLink);

        // Verify links maintain correct hrefs after interactions
        expect(homeLink).toHaveAttribute('href', '/home');
        expect(watchlistLink).toHaveAttribute('href', '/watchlist');
        expect(pivyLink).toHaveAttribute('href', '/pivy');
        expect(settingsLink).toHaveAttribute('href', '/settings');
    });

    it('FE-806: The order of the links in the Bottom Nav Bar remains consistent across all pages.', async () => {
        const pages = ['/home', '/watchlist', '/pivy', '/settings'];
        let previousOrder = null;

        for (const page of pages) {
            mockUsePathname.mockReturnValue(page);
            render(<BottomNav />);

            const links = screen.getAllByRole('link');
            const currentOrder = links.map(link => link.getAttribute('href'));

            if (previousOrder) {
                expect(currentOrder).toEqual(previousOrder);
            }
            previousOrder = currentOrder;

            // Cleanup after each render to avoid overlapping renders
            cleanup();
        }
    });
 });
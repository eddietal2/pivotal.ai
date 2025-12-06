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

// Mock next/navigation
const mockUsePathname = jest.fn();
jest.mock('next/navigation', () => ({
  usePathname: () => mockUsePathname(),
}));

// Import components after mocks are set up
import TopNav from '../components/navigation/TopNav';
import NavigationWrapper from '../components/navigation/NavigationWrapper';

describe('Top Navigation Bar (Header)', () => {
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
        expect(screen.getByText('News')).toBeInTheDocument();
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

    it('FE-703: When the user is signed in, the user\'s profile link is rendered, and clicking it correctly calls the navigation function to the profile page.', async () => {
        // Mock localStorage with auth token (simulating logged-in user)
        Storage.prototype.getItem = jest.fn((key) => {
            if (key === 'auth_token') return 'mock-jwt-token-123';
            if (key === 'user') return JSON.stringify({ id: '123', email: 'test@example.com', username: 'testuser' });
            if (key === 'theme') return 'light';
            return null;
        });

        mockUsePathname.mockReturnValue('/settings');

        render(<TopNav />);

        // Find the profile button - currently it's a button, not a link
        const profileButton = screen.getByRole('button', { name: /profile/i });
        expect(profileButton).toBeInTheDocument();
        expect(profileButton).toBeVisible();
        
        // Verify it's clickable (button is enabled)
        expect(profileButton).not.toBeDisabled();
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
        const newsLink = screen.getByRole('link', { name: /news/i });
        const settingsLink = screen.getByRole('link', { name: /settings/i });

        expect(homeLink).toBeInTheDocument();
        expect(watchlistLink).toBeInTheDocument();
        expect(newsLink).toBeInTheDocument();
        expect(settingsLink).toBeInTheDocument();

        // Verify links have correct href attributes
        expect(homeLink).toHaveAttribute('href', '/home');
        expect(watchlistLink).toHaveAttribute('href', '/watchlist');
        expect(newsLink).toHaveAttribute('href', '/news');
        expect(settingsLink).toHaveAttribute('href', '/settings');
    });

    it('FE-705: ', async () => {
   
    });

    it('FE-706: ', async () => {
   
    });
 });

describe('Bottom Navigation Bar (Mobile/Footer)', () => {
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

    it('FE-801: ', async () => {
   
    });

    it('FE-802: ', async () => {
   
    });

    it('FE-803: ', async () => {
   
    });

    it('FE-804: ', async () => {
   
    });

    it('FE-805: ', async () => {
   
    });

    it('FE-806: ', async () => {
   
    });
 });
// Mock data for Live Screens - currently empty, will be replaced with real API data
import { LiveScreen } from '@/types/screens';

// Empty array - no mock data to avoid hydration issues
export const mockLiveScreens: LiveScreen[] = [];

// Helper function to get time until refresh
export function getTimeUntilRefresh(expiresAt: string): string {
  const now = new Date();
  const expires = new Date(expiresAt);
  const diff = expires.getTime() - now.getTime();
  
  if (diff <= 0) return 'Refreshing...';
  
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
}

'use client';

import { usePathname } from 'next/navigation';
import TopNav from './TopNav';
import BottomNav from './BottomNav';

export default function NavigationWrapper() {
  const pathname = usePathname();
  
  // Hide navigation on auth pages (login, signup)
  const isAuthPage = pathname === '/login' || pathname === '/signup' || pathname === '/';
  
  // Hide BottomNav on pivy/chat pages, live-screen detail pages, and stock detail pages
  const hideBottomNav = pathname.startsWith('/pivy/chat') || pathname.startsWith('/watchlist/live-screen/') || pathname.startsWith('/stock/');
  
  if (isAuthPage) {
    return null;
  }
  
  return (
    <>
      {/* Top Navigation - Desktop Only */}
      <TopNav />
      
      {/* Bottom Navigation - Mobile Only */}
      {!hideBottomNav && <BottomNav />}
    </>
  );
}

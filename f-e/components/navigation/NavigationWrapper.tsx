'use client';

import { usePathname } from 'next/navigation';
import TopNav from './TopNav';
import BottomNav from './BottomNav';

export default function NavigationWrapper() {
  const pathname = usePathname();
  
  // Hide navigation on auth pages (login, signup)
  const isAuthPage = pathname === '/login' || pathname === '/signup' || pathname === '/';
  
  if (isAuthPage) {
    return null;
  }
  
  return (
    <>
      {/* Top Navigation - Desktop Only */}
      <TopNav />
      
      {/* Bottom Navigation - Mobile Only */}
      <BottomNav />
    </>
  );
}

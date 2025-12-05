'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Home, LineChart, Newspaper, Settings } from 'lucide-react';

const navLinks = [
  { name: 'Home', href: '/home', icon: Home },
  { name: 'Trading', href: '/trading', icon: LineChart },
  { name: 'News', href: '/news', icon: Newspaper },
  { name: 'Settings', href: '/settings', icon: Settings },
];

export default function TopNav() {
  const pathname = usePathname();

  return (
    <nav className="hidden md:flex border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-black">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        {/* Logo */}
        <Link href="/home" className="text-xl font-bold">
          Pivotal AI
        </Link>

        {/* Navigation Links */}
        <div className="flex items-center gap-1">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.href;
            
            return (
              <Link key={link.name} href={link.href}>
                <Button
                  variant={isActive ? 'default' : 'ghost'}
                  size="sm"
                  className="gap-2"
                >
                  <Icon className="h-4 w-4" />
                  {link.name}
                </Button>
              </Link>
            );
          })}
        </div>

        {/* User Menu / Profile */}
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            Profile
          </Button>
        </div>
      </div>
    </nav>
  );
}

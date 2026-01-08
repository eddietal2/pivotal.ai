import type { Metadata } from "next";
import { Geist, Geist_Mono, Raleway } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/context/ThemeContext";
import { ToastProvider } from "@/components/context/ToastContext";
import PostLoginToastHandler from '@/components/ui/PostLoginToastHandler';
import NavigationWrapper from "@/components/navigation/NavigationWrapper";
import { UIProvider } from "@/components/context/UIContext";

const raleway = Raleway({
  variable: "--font-raleway",
  subsets: ["latin"],
});

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Pivotal AI - Trading Platform",
  description: "AI-powered trading platform with real-time insights",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${raleway.variable} antialiased`}
      >
        <ThemeProvider>
          <ToastProvider>
            <PostLoginToastHandler />
            {/* UIProvider for global modal state */}
            <UIProvider>
              <div className="min-h-screen flex flex-col">
                {/* Navigation wrapper conditionally renders TopNav and BottomNav */}
                <NavigationWrapper />
                {/* Main Content Area */}
                <main className="flex-1  md:pb-0 lg:pb-16">
                  {children}
                </main>
              </div>
            </UIProvider>
          </ToastProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}

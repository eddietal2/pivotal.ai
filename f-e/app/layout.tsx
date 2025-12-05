import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/context/ThemeContext";
import TopNav from "@/components/navigation/TopNav";
import BottomNav from "@/components/navigation/BottomNav";

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
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ThemeProvider>
          <div className="min-h-screen flex flex-col">
            {/* Top Navigation - Desktop Only */}
            <TopNav />
            
            {/* Main Content Area */}
            <main className="flex-1 pb-16 md:pb-0">
              {children}
            </main>
            
            {/* Bottom Navigation - Mobile Only */}
            <BottomNav />
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}

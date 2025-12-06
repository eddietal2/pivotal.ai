import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/context/ThemeContext";
import { ToastProvider } from "@/components/context/ToastContext";
import NavigationWrapper from "@/components/navigation/NavigationWrapper";

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
          <ToastProvider>
            <div className="min-h-screen flex flex-col">
              {/* Navigation wrapper conditionally renders TopNav and BottomNav */}
              <NavigationWrapper />
              
              {/* Main Content Area */}
              <main className="flex-1 pb-16 md:pb-0">
                {children}
              </main>
            </div>
          </ToastProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}

'use client';

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function LandingPage() {
    return (
        <div className="min-h-screen bg-white dark:bg-black">
            {/* Header */}
            <header className="border-b border-gray-200 dark:border-gray-800">
                <div className="container mx-auto px-4 py-4 flex items-center justify-between">
                    <div className="text-xl font-bold">Pivotal AI</div>
                    <Link href="/login">
                        <Button variant="outline" size="sm">
                            Sign In
                        </Button>
                    </Link>
                </div>
            </header>

            {/* Hero Section */}
            <section className="container mx-auto px-4 py-20 text-center">
                <h1 className="text-4xl md:text-6xl font-bold mb-4">
                    AI-Powered Trading Platform
                </h1>
                <p className="text-lg md:text-xl text-gray-600 dark:text-gray-400 mb-8 max-w-2xl mx-auto">
                    Make smarter investment decisions with real-time market analysis
                </p>
                <Link href="/login">
                    <Button size="lg">
                        Get Started <ArrowRight className="ml-2 h-5 w-5" />
                    </Button>
                </Link>
            </section>

            {/* Features Grid */}
            <section className="container mx-auto px-4 py-20">
                <div className="grid md:grid-cols-3 gap-8">
                    <div className="p-6 border border-gray-200 dark:border-gray-800 rounded-lg">
                        <h3 className="text-xl font-semibold mb-2">Real-Time Data</h3>
                        <p className="text-gray-600 dark:text-gray-400">
                            Access live market data and insights
                        </p>
                    </div>
                    <div className="p-6 border border-gray-200 dark:border-gray-800 rounded-lg">
                        <h3 className="text-xl font-semibold mb-2">AI Analytics</h3>
                        <p className="text-gray-600 dark:text-gray-400">
                            Advanced algorithms for predictions
                        </p>
                    </div>
                    <div className="p-6 border border-gray-200 dark:border-gray-800 rounded-lg">
                        <h3 className="text-xl font-semibold mb-2">Secure</h3>
                        <p className="text-gray-600 dark:text-gray-400">
                            Bank-level security for your data
                        </p>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="border-t border-gray-200 dark:border-gray-800 py-8">
                <div className="container mx-auto px-4 text-center text-gray-600 dark:text-gray-400">
                    © 2025 Pivotal AI. All rights reserved.
                </div>
            </footer>
        </div>
    );
}

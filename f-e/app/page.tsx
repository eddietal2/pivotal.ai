'use client';

import Link from "next/link";
import { ArrowRight, TrendingUp, MessageCircle, BarChart3, Settings, LogOut, User } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function LandingPage() {
    return (
        <div className="min-h-screen bg-gray-50">
            {/* ===== HEADER / NAVIGATION ===== */}
            <header className="border-b border-gray-300 bg-white sticky top-0 z-50">
                <div className="container mx-auto px-4 py-3 flex items-center justify-between">
                    {/* Logo */}
                    <div className="text-lg font-bold text-gray-900">📈 Pivy</div>
                    
                    {/* Nav Links */}
                    <nav className="hidden md:flex gap-6 text-sm text-gray-700">
                        <a href="#features" className="hover:text-gray-900">Features</a>
                        <a href="#pricing" className="hover:text-gray-900">Pricing</a>
                        <a href="#faq" className="hover:text-gray-900">FAQ</a>
                    </nav>
                    
                    {/* Sign In / Get Started */}
                    <Link href="/login">
                        <Button size="sm">Sign In</Button>
                    </Link>
                </div>
            </header>

            {/* ===== HERO SECTION ===== */}
            <section className="container mx-auto px-4 py-20 text-center">
                <div className="max-w-3xl mx-auto">
                    <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
                        Your AI Trading Copilot
                    </h1>
                    <p className="text-lg text-gray-600 mb-4">
                        Real-time market analysis, AI-powered insights, and daily trading chats—all in one place.
                    </p>
                    <p className="text-sm text-gray-500 mb-8">
                        Paper trading · Market data · AI agents
                    </p>
                    
                    {/* CTA Buttons */}
                    <div className="flex gap-4 justify-center">
                        <Link href="/login">
                            <Button size="lg" className="bg-gray-900 text-white">
                                Get Started <ArrowRight className="ml-2 h-5 w-5" />
                            </Button>
                        </Link>
                        <Button size="lg" variant="outline" className="border-gray-400 text-gray-900">
                            Watch Demo
                        </Button>
                    </div>
                </div>
                
                {/* Hero Image Placeholder */}
                <div className="mt-16 bg-gray-200 border-2 border-gray-400 rounded-lg h-96 flex items-center justify-center text-gray-500">
                    <span className="text-center">
                        <p className="text-lg font-semibold">Dashboard Preview</p>
                        <p className="text-sm">[Chart / Trading Interface]</p>
                    </span>
                </div>
            </section>

            {/* ===== FEATURES SECTION ===== */}
            <section id="features" className="container mx-auto px-4 py-20">
                <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">Key Features</h2>
                
                <div className="grid md:grid-cols-4 gap-6">
                    {/* Feature 1 */}
                    <div className="p-6 border-2 border-gray-300 rounded-lg bg-white">
                        <MessageCircle className="h-8 w-8 text-gray-700 mb-3" />
                        <h3 className="font-semibold text-gray-900 mb-2">Daily AI Chat</h3>
                        <p className="text-sm text-gray-600">
                            Automated 8:30 AM market analysis from AI agents
                        </p>
                    </div>
                    
                    {/* Feature 2 */}
                    <div className="p-6 border-2 border-gray-300 rounded-lg bg-white">
                        <TrendingUp className="h-8 w-8 text-gray-700 mb-3" />
                        <h3 className="font-semibold text-gray-900 mb-2">Real-Time Data</h3>
                        <p className="text-sm text-gray-600">
                            Live stock prices, market trends, and watchlists
                        </p>
                    </div>
                    
                    {/* Feature 3 */}
                    <div className="p-6 border-2 border-gray-300 rounded-lg bg-white">
                        <BarChart3 className="h-8 w-8 text-gray-700 mb-3" />
                        <h3 className="font-semibold text-gray-900 mb-2">Paper Trading</h3>
                        <p className="text-sm text-gray-600">
                            Trade risk-free with virtual portfolio
                        </p>
                    </div>
                    
                    {/* Feature 4 */}
                    <div className="p-6 border-2 border-gray-300 rounded-lg bg-white">
                        <Settings className="h-8 w-8 text-gray-700 mb-3" />
                        <h3 className="font-semibold text-gray-900 mb-2">Smart Alerts</h3>
                        <p className="text-sm text-gray-600">
                            Notifications for price changes & opportunities
                        </p>
                    </div>
                </div>
            </section>

            {/* ===== HOW IT WORKS ===== */}
            <section className="container mx-auto px-4 py-20">
                <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">How It Works</h2>
                
                <div className="grid md:grid-cols-3 gap-8 max-w-3xl mx-auto">
                    {/* Step 1 */}
                    <div className="text-center">
                        <div className="w-12 h-12 bg-gray-900 text-white rounded-full flex items-center justify-center font-bold text-lg mx-auto mb-4">
                            1
                        </div>
                        <h4 className="font-semibold text-gray-900 mb-2">Sign Up</h4>
                        <p className="text-sm text-gray-600">Create your free Pivy account in seconds</p>
                    </div>
                    
                    {/* Step 2 */}
                    <div className="text-center">
                        <div className="w-12 h-12 bg-gray-900 text-white rounded-full flex items-center justify-center font-bold text-lg mx-auto mb-4">
                            2
                        </div>
                        <h4 className="font-semibold text-gray-900 mb-2">Add Watchlist</h4>
                        <p className="text-sm text-gray-600">Track your favorite stocks and assets</p>
                    </div>
                    
                    {/* Step 3 */}
                    <div className="text-center">
                        <div className="w-12 h-12 bg-gray-900 text-white rounded-full flex items-center justify-center font-bold text-lg mx-auto mb-4">
                            3
                        </div>
                        <h4 className="font-semibold text-gray-900 mb-2">Trade & Learn</h4>
                        <p className="text-sm text-gray-600">Get daily AI insights and test strategies</p>
                    </div>
                </div>
            </section>

            {/* ===== PRICING SECTION ===== */}
            <section id="pricing" className="container mx-auto px-4 py-20">
                <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">Pricing</h2>
                
                <div className="grid md:grid-cols-2 gap-8 max-w-2xl mx-auto">
                    {/* Free Plan */}
                    <div className="p-8 border-2 border-gray-300 rounded-lg bg-white">
                        <h3 className="text-xl font-bold text-gray-900 mb-2">Free</h3>
                        <p className="text-sm text-gray-600 mb-6">Perfect to get started</p>
                        <div className="text-3xl font-bold text-gray-900 mb-6">$0<span className="text-lg text-gray-600">/month</span></div>
                        <ul className="text-sm text-gray-700 space-y-3 mb-6">
                            <li>✓ Paper trading</li>
                            <li>✓ Real-time market data</li>
                            <li>✓ Daily AI chat</li>
                            <li>✗ Priority support</li>
                        </ul>
                        <Button className="w-full border-gray-400" variant="outline">Get Started</Button>
                    </div>
                    
                    {/* Pro Plan */}
                    <div className="p-8 border-2 border-gray-900 rounded-lg bg-gray-900 text-white">
                        <h3 className="text-xl font-bold mb-2">Pro</h3>
                        <p className="text-sm text-gray-300 mb-6">For serious traders</p>
                        <div className="text-3xl font-bold mb-6">$9.99<span className="text-lg text-gray-300">/month</span></div>
                        <ul className="text-sm space-y-3 mb-6">
                            <li>✓ Advanced analytics</li>
                            <li>✓ Custom alerts</li>
                            <li>✓ Historical data</li>
                            <li>✓ Priority support</li>
                        </ul>
                        <Button className="w-full bg-white text-gray-900 hover:bg-gray-100">Upgrade Now</Button>
                    </div>
                </div>
            </section>

            {/* ===== CTA SECTION ===== */}
            <section className="container mx-auto px-4 py-20 text-center bg-gray-100 rounded-lg">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Ready to start trading smarter?</h2>
                <p className="text-gray-600 mb-8">Join thousands of traders using Pivy for AI-powered market insights</p>
                <Link href="/login">
                    <Button size="lg" className="bg-gray-900 text-white">Get Started Free</Button>
                </Link>
            </section>

            {/* ===== FOOTER ===== */}
            <footer className="border-t border-gray-300 bg-white mt-20">
                <div className="container mx-auto px-4 py-8">
                    <div className="grid md:grid-cols-4 gap-8 mb-8">
                        <div>
                            <p className="font-semibold text-gray-900 mb-2">📈 Pivy</p>
                            <p className="text-sm text-gray-600">AI trading platform</p>
                        </div>
                        <div>
                            <p className="font-semibold text-gray-900 mb-3">Product</p>
                            <ul className="text-sm text-gray-600 space-y-1">
                                <li><a href="#" className="hover:text-gray-900">Features</a></li>
                                <li><a href="#" className="hover:text-gray-900">Pricing</a></li>
                                <li><a href="#" className="hover:text-gray-900">Security</a></li>
                            </ul>
                        </div>
                        <div>
                            <p className="font-semibold text-gray-900 mb-3">Legal</p>
                            <ul className="text-sm text-gray-600 space-y-1">
                                <li><a href="#" className="hover:text-gray-900">Privacy</a></li>
                                <li><a href="#" className="hover:text-gray-900">Terms</a></li>
                                <li><a href="#" className="hover:text-gray-900">Disclaimer</a></li>
                            </ul>
                        </div>
                        <div>
                            <p className="font-semibold text-gray-900 mb-3">Connect</p>
                            <ul className="text-sm text-gray-600 space-y-1">
                                <li><a href="#" className="hover:text-gray-900">Twitter</a></li>
                                <li><a href="#" className="hover:text-gray-900">Discord</a></li>
                                <li><a href="#" className="hover:text-gray-900">GitHub</a></li>
                            </ul>
                        </div>
                    </div>
                    <div className="border-t border-gray-300 pt-8 text-center text-sm text-gray-600">
                        <p>&copy; 2026 Pivy. All rights reserved.</p>
                    </div>
                </div>
            </footer>
        </div>
    );
}

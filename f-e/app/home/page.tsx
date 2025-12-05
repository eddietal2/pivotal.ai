'use client';

export default function HomePage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Home</h1>
      <div className="grid gap-6">
        <div className="p-6 border border-gray-200 dark:border-gray-800 rounded-lg">
          <h2 className="text-xl font-semibold mb-2">Welcome to Pivotal AI</h2>
          <p className="text-gray-600 dark:text-gray-400">
            Your AI-powered trading dashboard
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 gap-4">
          <div className="p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
            <h3 className="font-semibold mb-1">Portfolio Value</h3>
            <p className="text-2xl font-bold">$0.00</p>
          </div>
          <div className="p-4 bg-green-50 dark:bg-green-950 rounded-lg">
            <h3 className="font-semibold mb-1">Today's Gain</h3>
            <p className="text-2xl font-bold text-green-600 dark:text-green-400">+$0.00</p>
          </div>
        </div>
      </div>
    </div>
  );
}

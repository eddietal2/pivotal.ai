// <!-- 
//   Pivotal.ai MVP Mobile Wireframe (Low Fidelity)
//   Focus: Vertical stacking, clear interaction points, and sticky bottom navigation.
//   Palette: Minimal, using blue accents for action/brand.
// -->
// <html lang="en">
// <head>
//     <meta charset="UTF-8">
//     <meta name="viewport" content="width=device-width, initial-scale=1.0">
//     <title>Pivotal.ai MVP</title>
//     <script src="https://cdn.tailwindcss.com"></script>
//     <style>
//         /* Ensuring a mobile-like container and sticky elements */
//         body {
//             font-family: 'Inter', sans-serif;
//             background-color: #f7f9fb; /* Light background */
//         }
//         /* Make the main content scrollable and pad the bottom for the nav bar */
//         .content-area {
//             padding-bottom: 60px; /* Space for the bottom navigation */
//         }
//         /* Ensure the canvas scales responsively */
//         #stock-chart {
//             display: block;
//             width: 100%;
//         }
//     </style>
// </head>
// <body class="min-h-screen">

//     <!-- Primary Mobile Container: Max w-md for phone screens -->
//     <div id="app" class="max-w-md mx-auto bg-white min-h-screen shadow-lg relative">

//         <!-- HEADER / NAVIGATION (Placeholder) -->
//         <header class="p-4 flex justify-between items-center border-b border-gray-100 sticky top-0 bg-white z-20">
//             <h1 class="text-xl font-bold text-gray-800">Pivotal.ai</h1>
//             <div class="p-2 rounded-full bg-gray-100 text-gray-500">
//                 <!-- User Icon Placeholder -->
//                 <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
//                     <path stroke-linecap="round" stroke-linejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
//                 </svg>
//             </div>
//         </header>
        
//         <!-- MAIN SCROLLABLE CONTENT AREA -->
//         <div class="content-area">

//             <!-- NEW SECTION: TOP PICKS (High Value Content) -->
//             <section id="top-picks" class="p-4 border-b border-gray-200 bg-gray-50">
//                 <h2 class="text-lg font-semibold text-gray-800 mb-3">Today's Agent Picks</h2>
//                 <div id="top-picks-content" class="space-y-3">
//                     <!-- Top picks will be rendered here by JS -->
//                 </div>
//             </section>

//             <!-- SECTION 1: WATCHLIST -->
//             <section id="watchlist" class="p-4 border-b border-gray-100">
//                 <div class="flex justify-between items-center mb-3">
//                     <h2 class="text-lg font-semibold text-gray-800">Your Watchlist</h2>
//                     <button class="flex items-center space-x-1 text-blue-600 hover:text-blue-700 font-medium text-sm">
//                         <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
//                             <path fill-rule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clip-rule="evenodd" />
//                         </svg>
//                         <span>Add Ticker</span>
//                     </button>
//                 </div>
                
//                 <!-- Ticker Chips Container -->
//                 <div class="flex flex-wrap gap-2">
//                     <!-- Ticker Chip: Clicking this will load the ticker into the search bar -->
//                     <button onclick="document.getElementById('ticker-input').value = 'TSLA'" class="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium hover:bg-blue-200 transition">TSLA</button>
//                     <button onclick="document.getElementById('ticker-input').value = 'NVDA'" class="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium hover:bg-blue-200 transition">NVDA</button>
//                     <button onclick="document.getElementById('ticker-input').value = 'AAPL'" class="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium hover:bg-blue-200 transition">AAPL</button>
//                     <button onclick="document.getElementById('ticker-input').value = 'MSFT'" class="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium hover:bg-blue-200 transition">MSFT</button>
//                 </div>
//             </section>

//             <!-- SECTION 2: TICKER INPUT & TRIGGER -->
//             <section id="input-trigger" class="p-4 space-y-4">
//                 <h2 class="text-lg font-semibold text-gray-800">Agent Analysis Request</h2>
//                 <div class="flex space-x-2">
//                     <input id="ticker-input" type="text" placeholder="Enter Ticker (e.g., GOOG, AMZN)" class="flex-grow p-3 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-lg shadow-sm" />
//                     <button id="analyze-button" onclick="runAnalysis()" class="px-5 py-3 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 transition shadow-md">
//                         Analyze
//                     </button>
//                 </div>
//                 <p id="analysis-status" class="text-sm text-gray-500 h-5">Ready to analyze.</p>
//             </section>

//             <!-- SECTION 3: RECOMMENDATION CARD (Dynamic/Hidden by default) -->
//             <section id="recommendation-output" class="p-4" style="display: none;">
//                 <!-- Content will be dynamically injected here -->
//             </section>

//             <!-- Spacer to ensure content above the footer is visible -->
//             <div class="h-10"></div>
//         </div>


//         <!-- BOTTOM NAVIGATION BAR (Sticky) -->
//         <nav class="fixed bottom-0 left-1/2 transform -translate-x-1/2 w-full max-w-md bg-white border-t border-gray-200 shadow-xl z-30">
//             <div class="flex justify-around items-center h-14">
//                 <!-- 1. Dashboard (Current View) -->
//                 <button class="flex flex-col items-center text-blue-600 font-semibold text-xs">
//                     <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
//                         <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
//                     </svg>
//                     <span>Home</span>
//                 </button>
                
//                 <!-- 2. Watchlist -->
//                 <button class="flex flex-col items-center text-gray-500 hover:text-gray-700 text-xs">
//                     <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
//                         <path stroke-linecap="round" stroke-linejoin="round" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
//                     </svg>
//                     <span>Watchlist</span>
//                 </button>

//                 <!-- 3. Performance/Portfolio (Future Feature) -->
//                 <button class="flex flex-col items-center text-gray-500 hover:text-gray-700 text-xs">
//                     <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
//                         <path stroke-linecap="round" stroke-linejoin="round" d="M7 12l3-3 3 3 4-4M18 21s-1.5-1.5-4-1.5-4 1.5-4 1.5M7 12v6" />
//                         <path stroke-linecap="round" stroke-linejoin="round" d="M16 12l-3-3-3 3-4-4" />
//                         <path stroke-linecap="round" stroke-linejoin="round" d="M3 12h2" />
//                         <path stroke-linecap="round" stroke-linejoin="round" d="M19 12h2" />
//                         <path stroke-linecap="round" stroke-linejoin="round" d="M12 3v2" />
//                         <path stroke-linecap="round" stroke-linejoin="round" d="M12 19v2" />
//                     </svg>
//                     <span>Performance</span>
//                 </button>

//                 <!-- 4. Settings -->
//                 <button class="flex flex-col items-center text-gray-500 hover:text-gray-700 text-xs">
//                     <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
//                         <path stroke-linecap="round" stroke-linejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37a1.724 1.724 0 002.572-1.065z" />
//                         <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
//                     </svg>
//                     <span>Settings</span>
//                 </button>
//             </div>
//         </nav>

//     </div>

//     <script>
//         const recommendationOutput = document.getElementById('recommendation-output');
//         const analysisStatus = document.getElementById('analysis-status');
//         const analyzeButton = document.getElementById('analyze-button');
//         const tickerInput = document.getElementById('ticker-input');

//         // --- New Mock Data for Top Picks ---
//         const mockTopPicks = [
//             { ticker: "AMD", action: "BUY", confidence: "High" },
//             { ticker: "KO", action: "SHORT", confidence: "Medium" },
//             { ticker: "JPM", action: "BUY", confidence: "High" },
//         ];

//         // --- Existing Mock Data for Demonstration (Updated with historical_prices) ---
//         const mockAnalysis = {
//             ticker: "TSLA",
//             action: "BUY", // Can be 'BUY' or 'SHORT'
//             target_price: "265.00",
//             stop_loss: "245.50",
//             reasoning: "The RSI (65) indicates strong upward momentum, and the price is significantly above the 50-day SMA. The agent recommends buying now as a near-term breakout catalyst is imminent. This is a high-probability swing trade.",
//             timestamp: new Date().toLocaleTimeString(),
//             // NEW: Simulated 30 days of closing prices (simple upward trend for demo)
//             historical_prices: [200, 205, 203, 207, 210, 212, 215, 214, 218, 220, 225, 222, 228, 230, 235, 238, 240, 245, 248, 250, 253, 258, 260, 263, 265, 268, 270, 275, 278, 280] 
//         };

//         const mockError = {
//             error: true,
//             message: "API Error: Could not retrieve market data for the last 50 days. Try again later or check ticker spelling."
//         };

//         // --- New Function: Render Top Picks ---
//         function renderTopPicks() {
//             const topPicksContent = document.getElementById('top-picks-content');
//             if (!topPicksContent) return;

//             topPicksContent.innerHTML = mockTopPicks.map(pick => {
//                 const actionColor = pick.action === 'BUY' ? 'bg-green-100 text-green-800 border-green-300' : 'bg-red-100 text-red-800 border-red-300';
//                 const actionText = pick.action === 'BUY' ? 'BUY' : 'SHORT';

//                 return `
//                     <div onclick="setTickerAndScroll('${pick.ticker}')" 
//                          class="p-3 bg-white rounded-lg shadow-sm flex justify-between items-center border ${actionColor} cursor-pointer transition duration-150 ease-in-out hover:shadow-md">
//                         <div>
//                             <span class="text-lg font-bold text-gray-800">${pick.ticker}</span>
//                             <p class="text-xs text-gray-500">${pick.confidence} Confidence</p>
//                         </div>
//                         <div class="px-3 py-1 text-sm font-semibold rounded-full ${actionColor}">
//                             ${actionText}
//                         </div>
//                     </div>
//                 `;
//             }).join('');
//         }
        
//         // Helper function to set ticker and scroll
//         function setTickerAndScroll(ticker) {
//             tickerInput.value = ticker;
//             window.scrollTo({ top: document.getElementById('input-trigger').offsetTop, behavior: 'smooth' });
//         }
        
//         /**
//          * Draws a basic line chart on the canvas using pure JS Canvas API.
//          * @param {string} canvasId - The ID of the canvas element.
//          * @param {number[]} prices - Array of historical closing prices.
//          */
//         function drawStockChart(canvasId, prices) {
//             const canvas = document.getElementById(canvasId);
//             // Ensure the canvas is ready and context is available
//             if (!canvas || !canvas.getContext) return;

//             const ctx = canvas.getContext('2d');
            
//             // Set canvas size (important for proper drawing scale)
//             // Use client dimensions to avoid stretching/blurring on high-DPI screens
//             const containerWidth = canvas.clientWidth;
//             canvas.width = containerWidth;
//             const width = canvas.width;
//             const height = canvas.height;
            
//             ctx.clearRect(0, 0, width, height);

//             if (prices.length === 0) {
//                 ctx.font = '14px Inter';
//                 ctx.fillStyle = '#6b7280';
//                 ctx.fillText('No historical data available.', 10, height / 2);
//                 return;
//             }

//             // Determine min/max values and scale factors
//             const minPrice = Math.min(...prices);
//             const maxPrice = Math.max(...prices);
//             const priceRange = maxPrice - minPrice;
            
//             // Padding to prevent line from hitting the canvas edges
//             const padding = 10; 
//             const drawableWidth = width - 2 * padding;
//             const drawableHeight = height - 2 * padding;

//             // Calculate horizontal step size between data points
//             const xStep = drawableWidth / (prices.length - 1);

//             // Start drawing the line
//             ctx.beginPath();
//             ctx.strokeStyle = '#3b82f6'; // Blue price line
//             ctx.lineWidth = 2;
            
//             prices.forEach((price, index) => {
//                 // Normalize price to canvas height (0 to 1)
//                 const normalizedPrice = (price - minPrice) / priceRange;
//                 // Y coordinate (invert normalized value because canvas y=0 is the top)
//                 const y = padding + drawableHeight * (1 - normalizedPrice);
//                 // X coordinate
//                 const x = padding + index * xStep;

//                 if (index === 0) {
//                     ctx.moveTo(x, y);
//                 } else {
//                     ctx.lineTo(x, y);
//                 }
//             });
            
//             ctx.stroke();

//             // Draw a dot for the last price point
//             const lastX = padding + (prices.length - 1) * xStep;
//             const lastPrice = prices[prices.length - 1];
//             const lastNormalized = (lastPrice - minPrice) / priceRange;
//             const lastY = padding + drawableHeight * (1 - lastNormalized);

//             ctx.fillStyle = '#10b981'; // Green dot for last price
//             ctx.beginPath();
//             ctx.arc(lastX, lastY, 4, 0, Math.PI * 2);
//             ctx.fill();

//             // Add labels for min/max prices
//             ctx.font = '10px sans-serif';
//             ctx.fillStyle = '#6b7280';
            
//             // Max Price Label (top left)
//             ctx.fillText(`Max: $${maxPrice.toFixed(2)}`, padding, padding + 10);
//             // Min Price Label (bottom left)
//             ctx.fillText(`Min: $${minPrice.toFixed(2)}`, padding, height - 5);
//         }


//         // --- Core Function to Simulate Agent Call ---
//         function runAnalysis() {
//             const ticker = tickerInput.value.trim().toUpperCase();
//             if (!ticker) {
//                 analysisStatus.textContent = "Please enter a ticker symbol.";
//                 return;
//             }

//             // Phase 2: Loading State
//             recommendationOutput.style.display = 'none';
//             analysisStatus.textContent = `Analyzing ${ticker}... This may take a few seconds.`;
//             analyzeButton.disabled = true;

//             // Simulate Network/Agent Latency (5 seconds)
//             setTimeout(() => {
//                 // For this demo, we clone the mock analysis and update the ticker
//                 const result = (Math.random() > 0.1) ? {...mockAnalysis, ticker: ticker} : mockError; 

//                 // Phase 3: Display Results
//                 analyzeButton.disabled = false;

//                 if (result.error) {
//                     renderError(ticker, result.message);
//                 } else {
//                     renderRecommendation(result);
//                 }

//             }, 5000); // 5 second simulation of AI Agent call
//         }


//         // --- Render Success State (FR4) ---
//         function renderRecommendation(data) {
//             const signalColor = data.action === 'BUY' ? 'bg-green-600' : 'bg-red-600';
//             const signalText = data.action === 'BUY' ? 'BUY SIGNAL' : 'SHORT SIGNAL';
            
//             analysisStatus.textContent = `Analysis complete for ${data.ticker}.`;

//             // HTML content with the new canvas element
//             recommendationOutput.innerHTML = `
//                 <div class="space-y-4 p-4 border border-gray-200 rounded-xl shadow-lg">
//                     <!-- Signal Box -->
//                     <div class="text-center p-3 rounded-lg ${signalColor} text-white font-extrabold text-2xl shadow-xl">
//                         ${signalText} - ${data.ticker}
//                     </div>
                    
//                     <!-- NEW: Chart Visualization Area -->
//                     <div class="p-2 border border-gray-300 rounded-lg bg-gray-50">
//                         <h3 class="text-md font-semibold text-gray-700 mb-2">Price Action (Last 30 Days)</h3>
//                         <!-- Height is set for aspect ratio, width will be 100% via CSS -->
//                         <canvas id="stock-chart" height="150"></canvas>
//                     </div>

//                     <h3 class="text-xl font-bold text-gray-800">Agent's Reasoning</h3>
//                     <p class="text-gray-700 italic">${data.reasoning}</p>

//                     <!-- Risk Parameters -->
//                     <div class="grid grid-cols-2 gap-4 pt-2">
//                         <div class="p-3 bg-gray-100 rounded-lg border-l-4 border-blue-500">
//                             <p class="text-sm font-semibold text-gray-600">Target Price (Take Profit)</p>
//                             <p class="text-lg font-bold">$${data.target_price}</p>
//                         </div>
//                         <div class="p-3 bg-gray-100 rounded-lg border-l-4 border-red-500">
//                             <p class="text-sm font-semibold text-gray-600">Stop-Loss (Risk Exit)</p>
//                             <p class="text-lg font-bold">$${data.stop_loss}</p>
//                         </div>
//                     </div>

//                     <p class="text-xs text-gray-500 pt-4">Analysis generated at ${data.timestamp}</p>
//                 </div>
//             `;
//             recommendationOutput.style.display = 'block';
            
//             // CRITICAL: Call the drawing function after the canvas element has been added to the DOM
//             if (data.historical_prices) {
//                 // A small delay helps ensure the browser has computed the canvas width
//                 setTimeout(() => {
//                     drawStockChart('stock-chart', data.historical_prices);
//                 }, 50); 
//             }

//             window.scrollTo({ top: recommendationOutput.offsetTop, behavior: 'smooth' }); // Scroll to result
//         }

//         // --- Render Error State ---
//         function renderError(ticker, message) {
//             analysisStatus.textContent = `Analysis failed for ${ticker}.`;
//             recommendationOutput.innerHTML = `
//                 <div class="p-4 bg-red-100 border-l-4 border-red-500 text-red-700 rounded-lg" role="alert">
//                     <p class="font-bold">Agent Error</p>
//                     <p class="text-sm">${message}</p>
//                     <p class="text-xs mt-2">Check the ticker symbol or try again later.</p>
//                 </div>
//             `;
//             recommendationOutput.style.display = 'block';
//         }

//         // Initialize Top Picks on load
//         renderTopPicks();

//     </script>
// </body>
// </html>
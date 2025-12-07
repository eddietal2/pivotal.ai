'use client';
  

import React from 'react';
import InfoModal from '@/components/modals/InfoModal';
import { useUI } from '@/components/context/UIContext';
import { ListChecks, ArrowUpRight, ArrowDownRight, TrendingUp, Info } from 'lucide-react';

// CollapsibleSection component (add at the top of the file, after imports)
function CollapsibleSection({ title, infoButton, children }: { title: React.ReactNode; infoButton?: React.ReactNode; children: React.ReactNode }) {
  const [open, setOpen] = React.useState(true);
  return (
    <div className="mb-4">
      <div className="flex items-center justify-between gap-2">
        {/* Collapse toggle button (arrow + title) */}
        <button
          type="button"
          aria-label={open ? 'Collapse section' : 'Expand section'}
          className="flex items-center gap-2 px-2 py-1 rounded hover:bg-gray-800 focus:outline-none"
          onClick={() => setOpen((v) => !v)}
        >
          <span className={`transition-transform duration-200 ${open ? '' : 'rotate-180'}`}>▼</span>
          {title}
        </button>
        {/* Info button (separate, does not toggle collapse) */}
        {infoButton && (
          <div className="flex-shrink-0">
            {infoButton}
          </div>
        )}
      </div>
      {open && <div className="mt-4">{children}</div>}
    </div>
  );
}

// --- MOCK DATA ---

// Mock data for the Real-time Confluence Feed (The most important component)
const mockSignals = [
  {
    ticker: 'TSLA',
    signal: 'Strong Bullish Entry',
    confluence: ['MACD Crossover', 'RSI below 30 (Oversold)', 'High Volume Spike'],
    timeframe: '4H',
    change: '+3.45%',
    type: 'Bullish',
  },
  {
    ticker: 'NVDA',
    signal: 'Confirmed Bearish Reversal',
    confluence: ['RSI above 70 (Overbought)', 'MACD Bearish Cross', 'Declining Volume'],
    timeframe: '1D',
    change: '-1.89%',
    type: 'Bearish',
  },
  {
    ticker: 'GOOGL',
    signal: 'Momentum Breakout Alert',
    confluence: ['Volume 2x 20-Day Avg', 'Price action above resistance'],
    timeframe: '1H',
    change: '+1.12%',
    type: 'Bullish',
  },
  {
    ticker: 'AAPL',
    signal: 'Consolidation Watch',
    confluence: ['RSI Neutral (50)', 'MACD Flat'],
    timeframe: '30M',
    change: '-0.21%',
    type: 'Neutral',
  },
];

// Mock data for the Global Market Pulse
const mockPulse = [
  { index: 'S&P 500', value: 5210.45, change: '+0.82%', color: 'text-green-500' },
  { index: 'VIX (Fear Index)', value: 13.20, change: '-3.10%', color: 'text-green-500' },
  { index: '10-Yr Yield', value: 4.15, change: '+0.05%', color: 'text-red-500' },
  { index: 'Bitcoin', value: 43250.00, change: '+2.15%', color: 'text-green-500' },
];

// --- INLINE COMPONENTS ---

// 1. Global Market Pulse Card
const MarketPulseCard = ({ index, value, change, color, onClick }: { index: string; value: number; change: string; color: string; onClick: () => void }) => (
  <button
    className="bg-gray-800 p-4 rounded-xl shadow-lg border border-gray-700 hover:border-indigo-500 transition duration-200 w-full text-left focus:outline-none focus:ring-2 focus:ring-indigo-500"
    onClick={onClick}
    type="button"
    aria-label={`More info about ${index}`}
  >
    <p className="text-sm font-medium text-gray-400">{index}</p>
    <div className="flex items-center justify-between mt-1">
      <span className="text-xl font-bold text-white">{value}</span>
      <span className={`text-sm font-semibold ${color} flex items-center`}>
        {color.includes('green') ? <ArrowUpRight className="w-4 h-4 mr-1" /> : <ArrowDownRight className="w-4 h-4 mr-1" />}
        {change}
      </span>
    </div>
  </button>
);

// 3. Confluence Signal Feed Item
const SignalFeedItem = ({ ticker, signal, confluence, timeframe, change, type }: { ticker: string; signal: string; confluence: string[]; timeframe: string; change: string; type: string }) => {
  const isBullish = type === 'Bullish';
  const color = isBullish ? 'text-green-400' : type === 'Bearish' ? 'text-red-400' : 'text-yellow-400';
  const bgColor = isBullish ? 'bg-green-900/50' : type === 'Bearish' ? 'bg-red-900/50' : 'bg-yellow-900/50';
  const borderColor = isBullish ? 'border-green-600' : type === 'Bearish' ? 'border-red-600' : 'border-yellow-600';

  const { setModalOpen } = useUI();
  const [chartModalOpen, setChartModalOpen] = React.useState(false);

  return (
    <>
      <div className={`p-5 rounded-2xl border-l-4 ${borderColor} ${bgColor} transition duration-300 hover:shadow-2xl`}>
        <div className="flex justify-between items-start">
          <div className="flex items-baseline">
            <span className="text-2xl font-extrabold text-white mr-2">{ticker}</span>
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${color} border ${borderColor} bg-gray-900/70`}>
              {timeframe}
            </span>
          </div>
          <div className="text-right">
            <span className={`text-lg font-bold ${color}`}>{change}</span>
            <p className="text-xs text-gray-400">{type} Change</p>
          </div>
        </div>

        <p className={`mt-2 text-lg font-semibold ${color}`}>{signal}</p>

        <div className="mt-3 flex flex-wrap gap-2">
          {confluence.map((c, i) => (
            <span key={i} className="text-xs text-indigo-300 bg-indigo-900/50 px-3 py-1 rounded-full border border-indigo-700">
              {c}
            </span>
          ))}
        </div>

        {/* Action Buttons */}
        <div className="mt-4 flex gap-2 pt-3 border-t border-gray-700/50">
          <button className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-indigo-300 bg-indigo-900/30 hover:bg-indigo-900/50 border border-indigo-700/50 rounded-lg transition-colors">
            <ListChecks className="w-3.5 h-3.5" />
            Add to Watchlist
          </button>
          <button
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-300 bg-gray-800/50 hover:bg-gray-800 border border-gray-700 rounded-lg transition-colors"
            onClick={() => setChartModalOpen(true)}
          >
            View Chart
          </button>
        </div>
      </div>
      {/* Chart Modal */}
      {chartModalOpen && (
        <div className="fixed inset-0 z-[101] min-h-screen h-screen w-screen bg-black/70">
          <div className="absolute inset-0 min-h-screen h-screen w-screen flex items-stretch justify-stretch">
            <div className="bg-gray-900 border border-gray-700 rounded-t-2xl shadow-2xl w-full min-h-screen h-screen mx-auto relative animate-slideUp flex flex-col">
              <button
                className="absolute top-4 right-4 text-gray-400 hover:text-white text-2xl font-bold z-10"
                onClick={() => setChartModalOpen(false)}
                aria-label="Close chart modal"
              >
                &times;
              </button>
              <div className="flex-1 flex flex-col justify-center items-center pt-16 pb-8 px-8 overflow-y-auto w-full">
                <h4 className="text-2xl font-bold mb-2 flex items-center gap-2 text-center w-full">
                  {ticker} Chart
                </h4>
                <p className="text-sm text-gray-300 mb-4 text-center max-w-xl w-full">
                  {signal}
                </p>
                <div className="flex items-center justify-between w-full max-w-md mx-auto mb-8">
                  <span className="text-lg font-bold text-white">{change}</span>
                  <span className={`text-sm font-semibold ${color} flex items-center`}>
                    {type === 'Bullish' ? <ArrowUpRight className="w-4 h-4 mr-1" /> : type === 'Bearish' ? <ArrowDownRight className="w-4 h-4 mr-1" /> : null}
                    {type}
                  </span>
                </div>
                {/* Chart Placeholder */}
                <div className="w-full max-w-md h-64 bg-gray-800 border border-gray-700 rounded-xl flex items-center justify-center mb-8">
                  <span className="text-gray-400 text-lg">[Signal Chart Placeholder]</span>
                </div>
                {/* Confluence List */}
                <div className="flex flex-wrap gap-2 justify-center mb-8">
                  {confluence.map((c, i) => (
                    <span key={i} className="text-xs text-indigo-300 bg-indigo-900/50 px-3 py-1 rounded-full border border-indigo-700">
                      {c}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
          <style jsx>{`
            @keyframes slideUp {
              from { transform: translateY(100%); opacity: 0; }
              to { transform: translateY(0); opacity: 1; }
            }
            .animate-slideUp {
              animation: slideUp 0.4s cubic-bezier(0.4, 0.8, 0.2, 1) both;
            }
          `}</style>
        </div>
      )}
    </>
  );
};

// 4. Main Application Layout
export default function App() {
  const { modalOpen, setModalOpen } = useUI();
  const [selectedPulse, setSelectedPulse] = React.useState<null | typeof mockPulse[0]>(null);
  const [signalFeedInfoOpen, setSignalFeedInfoOpen] = React.useState(false);
  const [marketPulseInfoOpen, setMarketPulseInfoOpen] = React.useState(false);
  
  // Example descriptions for each index
  const pulseDescriptions: Record<string, string> = {
    'S&P 500': 'The S&P 500 is a stock market index tracking the performance of 500 large companies listed on stock exchanges in the United States. It is widely regarded as the best single gauge of large-cap U.S. equities.',
    'VIX (Fear Index)': 'The VIX, or Volatility Index, measures the market’s expectation of volatility over the next 30 days. It is often referred to as the "fear index" and spikes during market turmoil.',
    '10-Yr Yield': 'The 10-Year Treasury Yield reflects the return on investment for U.S. government bonds maturing in 10 years. It is a key indicator for interest rates and economic outlook.',
    'Bitcoin': 'Bitcoin (BTC) is the world’s largest cryptocurrency by market capitalization. It is a decentralized digital currency that operates without a central bank and is traded globally 24/7. Bitcoin is often seen as a store of value and a hedge against inflation.',
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white font-sans">

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto">
        <div className="space-y-8 p-4 sm:p-8 md:mt-10">
          
          {/* Global Market Pulse */}
          <CollapsibleSection
            title={
              <span className="flex items-center gap-2">
                <TrendingUp className="w-6 h-6 text-green-400" />
                Market Pulse
              </span>
            }
            infoButton={
              <button
                type="button"
                className="p-1 rounded-full hover:bg-gray-800 transition ml-4"
                title="Learn more about Market Pulse"
                aria-label="More info about Market Pulse"
                onClick={() => setMarketPulseInfoOpen(true)}
              >
                <Info className="w-5 h-5 text-orange-300" />
              </button>
            }
          >
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {mockPulse.map((pulse, index) => (
                <MarketPulseCard
                  key={index}
                  {...pulse}
                  onClick={() => {
                    setSelectedPulse(pulse);
                    setModalOpen(true);
                  }}
                />
              ))}
            {/* Market Pulse Info Modal (renders outside the collapsible content so it shows even when collapsed) */}
            </div>
          </CollapsibleSection>
          {/* Market Pulse Info Modal (refactored to InfoModal) */}
          <InfoModal
            open={marketPulseInfoOpen}
            onClose={() => setMarketPulseInfoOpen(false)}
            title={<><Info className="w-6 h-6 text-orange-300" />About Market Pulse</>}
            ariaLabel="About Market Pulse"
          >
            <div className="w-full max-w-2xl mx-auto space-y-6">
              <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
                <h5 className="text-lg font-bold text-green-300 mb-2">S&P 500</h5>
                <p className="text-sm text-gray-300">The S&P 500 is a stock market index tracking the performance of 500 large companies listed on stock exchanges in the United States. It is widely regarded as the best single gauge of large-cap U.S. equities.</p>
              </div>
              <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
                <h5 className="text-lg font-bold text-green-300 mb-2">VIX (Fear Index)</h5>
                <p className="text-sm text-gray-300">The VIX, or Volatility Index, measures the market’s expectation of volatility over the next 30 days. It is often referred to as the "fear index" and spikes during market turmoil.</p>
              </div>
              <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
                <h5 className="text-lg font-bold text-green-300 mb-2">10-Year Treasury Yield</h5>
                <p className="text-sm text-gray-300">The 10-Year Treasury Yield reflects the return on investment for U.S. government bonds maturing in 10 years. It is a key indicator for interest rates and economic outlook.</p>
              </div>
              <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
                <h5 className="text-lg font-bold text-green-300 mb-2">Bitcoin</h5>
                <p className="text-sm text-gray-300">Bitcoin (BTC) is the world’s largest cryptocurrency by market capitalization. It is a decentralized digital currency that operates without a central bank and is traded globally 24/7. Bitcoin is often seen as a store of value and a hedge against inflation.</p>
              </div>
              <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
                <h5 className="text-lg font-bold text-green-300 mb-2">How to Use</h5>
                <p className="text-sm text-gray-300">Monitor these indices to understand the current market environment. Rising S&P 500 values indicate bullish sentiment, while spikes in the VIX suggest increased fear or volatility. The 10-Year Yield reflects interest rate expectations and economic outlook.</p>
              </div>
            </div>
          </InfoModal>

          {/* Modal for Market Pulse Item Info */}
          {modalOpen && selectedPulse && (
            <div className="fixed inset-0 z-[100] min-h-screen h-screen w-screen bg-black/70">
              <div className="absolute inset-0 min-h-screen h-screen w-screen flex items-stretch justify-stretch">
                <div className="bg-gray-900 border border-gray-700 rounded-t-2xl shadow-2xl w-full min-h-screen h-screen mx-auto relative animate-slideUp flex flex-col">
                  <button
                    className="absolute top-4 right-4 text-gray-400 hover:text-white text-2xl font-bold z-10"
                    onClick={() => setModalOpen(false)}
                    aria-label="Close info modal"
                  >
                    &times;
                  </button>
                  <div className="flex-1 flex flex-col justify-center items-center pt-16 pb-8 px-8 overflow-y-auto w-full">
                    <h4 className="text-2xl font-bold mb-2 flex items-center gap-2 text-center w-full">
                      {selectedPulse.index}
                    </h4>
                    <p className="text-sm text-gray-300 mb-4 text-center max-w-xl w-full">
                      {pulseDescriptions[selectedPulse.index] || 'No description available.'}
                    </p>
                    <div className="flex items-center justify-between w-full max-w-md mx-auto mb-8">
                      <span className="text-lg font-bold text-white">{selectedPulse.value}</span>
                      <span className={`text-sm font-semibold ${selectedPulse.color} flex items-center`}>
                        {selectedPulse.color.includes('green') ? <ArrowUpRight className="w-4 h-4 mr-1" /> : <ArrowDownRight className="w-4 h-4 mr-1" />}
                        {selectedPulse.change}
                      </span>
                    </div>
                    {/* Chart Placeholder */}
                    <div className="w-full max-w-md h-64 bg-gray-800 border border-gray-700 rounded-xl flex items-center justify-center mb-8">
                      <span className="text-gray-400 text-lg">[Stock Chart Placeholder]</span>
                    </div>
                  </div>
                </div>
              </div>
              <style jsx>{`
                @keyframes slideUp {
                  from { transform: translateY(100%); opacity: 0; }
                  to { transform: translateY(0); opacity: 1; }
                }
                .animate-slideUp {
                  animation: slideUp 0.4s cubic-bezier(0.4, 0.8, 0.2, 1) both;
                }
              `}</style>
            </div>
          )}

          {/* Real-time Confluence Feed */}
          <CollapsibleSection
            title={
              <span className="flex items-center gap-2">
                <ListChecks className="w-6 h-6 text-indigo-400" />
                Live Setup Scans
              </span>
            }
            infoButton={
              <button
                type="button"
                className="p-1 rounded-full hover:bg-gray-800 transition ml-4"
                title="Learn more about Live Setup Scans"
                aria-label="More info about Live Setup Scans"
                onClick={() => setSignalFeedInfoOpen(true)}
              >
                <Info className="w-5 h-5 text-orange-300" />
              </button>
            }
          >
            <div className="space-y-6">
              {mockSignals.map((signal, index) => (
                <SignalFeedItem key={index} {...signal} />
              ))}
              <div className="text-center p-4">
                <p className="text-indigo-400 font-semibold flex items-center justify-center">
                  <ListChecks className="w-5 h-5 mr-2" />
                  View & Customize Watchlist Scans
                </p>
              </div>
              {/* Info Modal for Live Setup Scans - renders outside collapsible content */}
            </div>
          </CollapsibleSection>
          {/* Info Modal for Live Setup Scans (refactored into InfoModal) */}
          <InfoModal
            open={signalFeedInfoOpen}
            onClose={() => setSignalFeedInfoOpen(false)}
            title={<><Info className="w-6 h-6 text-orange-300" />About Live Setup Scans</>}
            ariaLabel="About Live Setup Scans"
          >
            <div className="w-full max-w-2xl mx-auto space-y-6">
              <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
                <h5 className="text-lg font-bold text-indigo-300 mb-2">What is the Live Setup Scans Feed?</h5>
                <p className="text-sm text-gray-300">The Live Setup Scans section provides real-time actionable trading setups detected by our AI. Each card summarizes a unique market opportunity, including the ticker, setup type, confluence factors, timeframe, and recent price change. Use these signals to quickly identify high-probability entries, reversals, breakouts, and consolidations across the market.</p>
              </div>
              <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
                <h5 className="text-lg font-bold text-indigo-300 mb-2">How to Use</h5>
                <p className="text-sm text-gray-300">Review the confluence factors for each setup to understand why the signal was generated. Add setups to your watchlist or view charts for deeper analysis. The feed updates continuously to reflect the latest market conditions.</p>
              </div>
            </div>
          </InfoModal>
          
          {/* Legal Disclaimer */}
          <div className="p-4 bg-orange-900/40 border border-orange-700/50 text-orange-100 text-xs text-center shadow-lg rounded-lg mt-8">
              <p className="font-medium">
                ⚠️ Disclaimer: This data is for informational/testing purposes and is NOT financial advice.
              </p>
          </div>
        </div>
      </div>
      {/* Hide BottomNav when modal is open */}
      {!modalOpen && (
        <div className="fixed bottom-0 left-0 w-full z-40">
          {/* ...existing BottomNav code... */}
        </div>
      )}
    </div>
  );
}

// Note: InfoModal component has been extracted to components/InfoModal.tsx
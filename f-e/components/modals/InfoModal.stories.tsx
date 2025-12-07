import React from 'react';
import InfoModal from './InfoModal';

export default {
  title: 'Components/InfoModal',
  component: InfoModal,
};

export const Default = () => (
  <InfoModal open={true} onClose={() => {}} title={<><span>ℹ️</span> About Modal</>} ariaLabel="About Modal">
    <div className="w-full max-w-2xl mx-auto space-y-6">
      <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
        <h5 className="text-lg font-bold text-green-300 mb-2">S&P 500</h5>
        <p className="text-sm text-gray-300">The S&P 500 is a stock market index tracking the performance of 500 large companies listed on stock exchanges in the United States.</p>
      </div>
    </div>
  </InfoModal>
);

import React from 'react';

const SlideViewIllustration: React.FC = () => {
  return (
    <svg
      width="100%"
      height="80"
      viewBox="0 0 400 80"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="mt-4"
    >
      {/* Sliding Cards */}
      <g>
        <g transform="translate(0,0)">
          <animateTransform
            attributeName="transform"
            type="translate"
            values="0,0;-200,0;0,0"
            dur="4s"
            repeatCount="indefinite"
          />
          
          {/* Card 1 */}
          <rect x="10" y="10" width="80" height="60" rx="8" fill="#f3f4f6" className="dark:fill-gray-700" />
          <text x="50" y="35" textAnchor="middle" fontSize="12" fill="#374151" className="dark:fill-gray-300">Chat 1</text>
          <text x="50" y="50" textAnchor="middle" fontSize="10" fill="#6b7280" className="dark:fill-gray-400">Jan 1</text>
          
          {/* Card 2 */}
          <rect x="110" y="10" width="80" height="60" rx="8" fill="#f3f4f6" className="dark:fill-gray-700" />
          <text x="150" y="35" textAnchor="middle" fontSize="12" fill="#374151" className="dark:fill-gray-300">Chat 2</text>
          <text x="150" y="50" textAnchor="middle" fontSize="10" fill="#6b7280" className="dark:fill-gray-400">Jan 2</text>
          
          {/* Card 3 */}
          <rect x="210" y="10" width="80" height="60" rx="8" fill="#f3f4f6" className="dark:fill-gray-700" />
          <text x="250" y="35" textAnchor="middle" fontSize="12" fill="#374151" className="dark:fill-gray-300">Chat 3</text>
          <text x="250" y="50" textAnchor="middle" fontSize="10" fill="#6b7280" className="dark:fill-gray-400">Jan 3</text>
          
          {/* Card 4 */}
          <rect x="310" y="10" width="80" height="60" rx="8" fill="#f3f4f6" className="dark:fill-gray-700" />
          <text x="350" y="35" textAnchor="middle" fontSize="12" fill="#374151" className="dark:fill-gray-300">Chat 4</text>
          <text x="350" y="50" textAnchor="middle" fontSize="10" fill="#6b7280" className="dark:fill-gray-400">Jan 4</text>
        </g>
      </g>
      
      {/* Arrows */}
      <polygon points="380,40 390,35 390,45" fill="#9ca3af" className="dark:fill-gray-400" />
      <polygon points="10,40 0,35 0,45" fill="#9ca3af" className="dark:fill-gray-400" />
    </svg>
  );
};

export default SlideViewIllustration;
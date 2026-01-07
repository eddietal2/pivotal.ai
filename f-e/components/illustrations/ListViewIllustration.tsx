import React from 'react';

const ListViewIllustration: React.FC = () => {
  return (
    <svg
      width="100%"
      height="200"
      viewBox="0 0 200 280"
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
            values="0,0;0,-70;0,0"
            dur="4s"
            repeatCount="indefinite"
          />
          
          {/* Card 1 */}
          <rect x="10" y="10" width="180" height="60" rx="8" fill="#f3f4f6" className="dark:fill-gray-700" />
          <text x="20" y="35" textAnchor="start" fontSize="12" fill="#374151" className="dark:fill-gray-300">Chat 1</text>
          <text x="20" y="50" textAnchor="start" fontSize="10" fill="#6b7280" className="dark:fill-gray-400">Jan 1 - 10:30 AM</text>
          
          {/* Card 2 */}
          <rect x="10" y="80" width="180" height="60" rx="8" fill="#f3f4f6" className="dark:fill-gray-700" />
          <text x="20" y="105" textAnchor="start" fontSize="12" fill="#374151" className="dark:fill-gray-300">Chat 2</text>
          <text x="20" y="120" textAnchor="start" fontSize="10" fill="#6b7280" className="dark:fill-gray-400">Jan 2 - 5:15 PM</text>
          
          {/* Card 3 */}
          <rect x="10" y="150" width="180" height="60" rx="8" fill="#f3f4f6" className="dark:fill-gray-700" />
          <text x="20" y="175" textAnchor="start" fontSize="12" fill="#374151" className="dark:fill-gray-300">Chat 3</text>
          <text x="20" y="190" textAnchor="start" fontSize="10" fill="#6b7280" className="dark:fill-gray-400">Jan 3 - 2:45 PM</text>
          
          {/* Card 4 */}
          <rect x="10" y="220" width="180" height="60" rx="8" fill="#f3f4f6" className="dark:fill-gray-700" />
          <text x="20" y="245" textAnchor="start" fontSize="12" fill="#374151" className="dark:fill-gray-300">Chat 4</text>
          <text x="20" y="260" textAnchor="start" fontSize="10" fill="#6b7280" className="dark:fill-gray-400">Jan 4 - 8:00 AM</text>
        </g>
      </g>
      
      {/* Arrows */}
      <polygon points="100,10 95,0 105,0" fill="#9ca3af" className="dark:fill-gray-400" />
      <polygon points="100,270 95,280 105,280" fill="#9ca3af" className="dark:fill-gray-400" />
    </svg>
  );
};

export default ListViewIllustration;
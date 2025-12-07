import React from 'react';
import { Info } from 'lucide-react';
import { ChevronDown } from 'lucide-react';
import SignalEducationChart from './SignalEducationChart';

interface SignalEducationCardProps {
  title: string;
  subtitle?: string;
  description: string;
  examples?: string[];
  badge?: string;
  Icon?: React.ComponentType<any>;
}

const SignalEducationCard: React.FC<SignalEducationCardProps> = ({ title, subtitle, description, examples = [], badge, Icon }) => {
  const [isOpen, setIsOpen] = React.useState(false);
  return (
    <article
      role="article"
      aria-labelledby={`card-${title.replace(/\s+/g, '-')}`}
      className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4 shadow-sm"
    >
      <header className="flex items-start justify-between gap-2 mb-2">
        <div>
          <h3 id={`card-${title.replace(/\s+/g, '-')}`} className="text-sm font-semibold text-gray-900 dark:text-white">
            {/* Icon affordance */}
            <div className="mb-1 flex justify-between items-center">
              <div className="text-sm text-gray-500 dark:text-gray-400">{Icon ? <Icon className="w-5 h-5" /> : <Info className="w-4 h-4 text-gray-400" />}</div>
            </div>
            {title}
          </h3>
          {subtitle && <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{subtitle}</div>}
        </div>
        <div className="ml-auto flex items-center gap-2">
          {badge && (
            <div className="text-[11px] font-semibold inline-flex items-center px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-900 dark:text-indigo-200 text-indigo-800 border border-indigo-200 dark:border-indigo-700">
              {badge}
            </div>
          )}
          <button
            aria-label={`Toggle ${title}`}
            aria-expanded={isOpen}
            aria-controls={`card-content-${title.replace(/\s+/g, '-')}`}
            className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
            onClick={() => setIsOpen((s) => !s)}
          >
            <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
          </button>
        </div>
      </header>
      <div
        data-role="card-content"
        data-expanded={isOpen}
        aria-hidden={!isOpen}
        data-testid={`card-content-${title.replace(/\s+/g, '-')}`}
        id={`card-content-${title.replace(/\s+/g, '-')}`}
        className={`transition-all duration-200 overflow-hidden ${isOpen ? 'max-h-[500px]' : 'max-h-0'}`}
      >
        <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">{description}</p>

        {/* Chart placeholder rendered inside collapsible area */}
        <div className="mb-3">
          <SignalEducationChart className="w-full" />
        </div>

        {examples && examples.length > 0 && (
          <ul className="text-xs text-gray-600 dark:text-gray-400 list-disc pl-4 space-y-1">
            {examples.map((ex, i) => (
              <li key={i}>{ex}</li>
            ))}
          </ul>
        )}
      </div>

    </article>
  );
};

export default SignalEducationCard;

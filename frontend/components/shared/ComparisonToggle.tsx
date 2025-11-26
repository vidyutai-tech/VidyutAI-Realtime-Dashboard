import React from 'react';
import { BarChart2, Clock, AlertTriangle } from 'lucide-react';

type ComparisonMode = 'conventional' | 'historical' | 'worst-case';

interface ComparisonToggleProps {
  mode: ComparisonMode;
  onChange: (mode: ComparisonMode) => void;
}

const ComparisonToggle: React.FC<ComparisonToggleProps> = ({ mode, onChange }) => {
  const options: Array<{ value: ComparisonMode; label: string; icon: React.ReactNode; description: string }> = [
    {
      value: 'conventional',
      label: 'vs Conventional',
      icon: <BarChart2 className="w-4 h-4" />,
      description: 'Compare with traditional EMS',
    },
    {
      value: 'historical',
      label: 'vs Historical',
      icon: <Clock className="w-4 h-4" />,
      description: 'Compare with past performance',
    },
    {
      value: 'worst-case',
      label: 'vs Worst-case',
      icon: <AlertTriangle className="w-4 h-4" />,
      description: 'Compare with worst scenario',
    },
  ];

  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-2 shadow-sm">
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300 px-3">Comparison:</span>
        <div className="flex gap-2 flex-1">
          {options.map((option) => (
            <button
              key={option.value}
              onClick={() => onChange(option.value)}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                mode === option.value
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
              title={option.description}
            >
              {option.icon}
              <span>{option.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ComparisonToggle;


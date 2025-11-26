import React from 'react';
import { Activity, TrendingUp, Battery, DollarSign, AlertCircle, CheckCircle2 } from 'lucide-react';

interface SituationSummaryStripProps {
  gridCondition: 'stable' | 'weak' | 'outage_likely';
  forecastedPeak: { time: string; value: number; unit: string };
  batteryLifeImpact: number; // percentage
  marketPriceSignal?: { current: number; trend: 'up' | 'down' | 'stable'; unit: string };
}

const SituationSummaryStrip: React.FC<SituationSummaryStripProps> = ({
  gridCondition,
  forecastedPeak,
  batteryLifeImpact,
  marketPriceSignal,
}) => {
  const getGridConditionConfig = () => {
    switch (gridCondition) {
      case 'stable':
        return { label: 'Stable', color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400', icon: CheckCircle2 };
      case 'weak':
        return { label: 'Weak Grid', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400', icon: AlertCircle };
      case 'outage_likely':
        return { label: 'Outage Likely', color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400', icon: AlertCircle };
      default:
        return { label: 'Unknown', color: 'bg-gray-100 text-gray-800', icon: Activity };
    }
  };

  const gridConfig = getGridConditionConfig();
  const GridIcon = gridConfig.icon;

  return (
    <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-800 dark:via-gray-800 dark:to-gray-800 border border-blue-200 dark:border-gray-700 rounded-xl shadow-sm p-4 mb-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        {/* Grid Condition */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Grid Condition:</span>
          </div>
          <span className={`px-3 py-1.5 rounded-lg text-sm font-semibold flex items-center gap-1.5 ${gridConfig.color}`}>
            <GridIcon className="w-4 h-4" />
            {gridConfig.label}
          </span>
        </div>

        {/* Forecasted Peak */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-orange-600 dark:text-orange-400" />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Forecasted Peak:</span>
          </div>
          <span className="px-3 py-1.5 bg-white dark:bg-gray-700 rounded-lg text-sm font-semibold text-gray-900 dark:text-white border border-gray-200 dark:border-gray-600">
            {forecastedPeak.time} • {forecastedPeak.value} {forecastedPeak.unit}
          </span>
        </div>

        {/* Battery Life Impact */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Battery className="w-5 h-5 text-green-600 dark:text-green-400" />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Battery Life Impact:</span>
          </div>
          <span className={`px-3 py-1.5 rounded-lg text-sm font-semibold ${
            batteryLifeImpact < 5 
              ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' 
              : batteryLifeImpact < 10
              ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
              : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
          }`}>
            {batteryLifeImpact.toFixed(2)}% cycle cost
          </span>
        </div>

        {/* Market Price Signal */}
        {marketPriceSignal && (
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Market Price:</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-3 py-1.5 bg-white dark:bg-gray-700 rounded-lg text-sm font-semibold text-gray-900 dark:text-white border border-gray-200 dark:border-gray-600">
                ₹{marketPriceSignal.current.toFixed(2)}/{marketPriceSignal.unit}
              </span>
              {marketPriceSignal.trend === 'up' && (
                <TrendingUp className="w-4 h-4 text-red-500" />
              )}
              {marketPriceSignal.trend === 'down' && (
                <TrendingUp className="w-4 h-4 text-green-500 rotate-180" />
              )}
              {marketPriceSignal.trend === 'stable' && (
                <div className="w-4 h-4 border-t-2 border-gray-400" />
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SituationSummaryStrip;


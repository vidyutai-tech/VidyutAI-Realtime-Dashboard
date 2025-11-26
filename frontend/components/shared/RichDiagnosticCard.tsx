import React, { useState } from 'react';
import { TrendingUp, TrendingDown, Minus, AlertTriangle, CheckCircle2, Eye, X } from 'lucide-react';
import Card from '../ui/Card';
import Skeleton from '../ui/Skeleton';

interface TrendData {
  value: number;
  change: number; // percentage change over 7 days
  direction: 'up' | 'down' | 'stable';
}

interface ThresholdBand {
  healthy: { min: number; max: number };
  slight: { min: number; max: number };
  observe: { min: number; max: number };
  critical: { min: number; max: number };
}

interface RichDiagnosticCardProps {
  title: string;
  value: number;
  unit: string;
  icon: React.ReactNode;
  trend: TrendData;
  thresholdBand: ThresholdBand;
  condition: 'healthy' | 'slight' | 'observe' | 'critical';
  rootCauses?: string[];
  isLoading: boolean;
  onViewDiagnostics?: () => void;
}

const RichDiagnosticCard: React.FC<RichDiagnosticCardProps> = ({
  title,
  value,
  unit,
  icon,
  trend,
  thresholdBand,
  condition,
  rootCauses = [],
  isLoading,
  onViewDiagnostics,
}) => {
  const [showDiagnostics, setShowDiagnostics] = useState(false);

  const getConditionConfig = () => {
    switch (condition) {
      case 'healthy':
        return {
          label: 'Healthy',
          color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
          icon: CheckCircle2,
          barColor: 'bg-green-500',
        };
      case 'slight':
        return {
          label: 'Slight Degradation',
          color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
          icon: AlertTriangle,
          barColor: 'bg-yellow-500',
        };
      case 'observe':
        return {
          label: 'Observe',
          color: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
          icon: AlertTriangle,
          barColor: 'bg-orange-500',
        };
      case 'critical':
        return {
          label: 'Critical',
          color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
          icon: AlertTriangle,
          barColor: 'bg-red-500',
        };
    }
  };

  const conditionConfig = getConditionConfig();
  const ConditionIcon = conditionConfig.icon;

  const getTrendIcon = () => {
    switch (trend.direction) {
      case 'up':
        return <TrendingUp className="w-4 h-4 text-green-500" />;
      case 'down':
        return <TrendingDown className="w-4 h-4 text-red-500" />;
      default:
        return <Minus className="w-4 h-4 text-gray-500" />;
    }
  };

  const getValuePosition = () => {
    // Calculate position within threshold band
    const { healthy, slight, observe, critical } = thresholdBand;
    const totalRange = critical.min;
    const position = ((value - critical.min) / (100 - critical.min)) * 100;
    return Math.max(0, Math.min(100, position));
  };

  if (isLoading) {
    return (
      <Card>
        <Skeleton className="h-32 w-full" />
      </Card>
    );
  }

  return (
    <>
      <Card className="relative overflow-hidden">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg">{icon}</div>
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{title}</p>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-3xl font-bold text-gray-900 dark:text-white">
                  {value.toFixed(2)}
                </span>
                <span className="text-lg text-gray-500 dark:text-gray-400">{unit}</span>
              </div>
            </div>
          </div>
          <span className={`px-3 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 ${conditionConfig.color}`}>
            <ConditionIcon className="w-4 h-4" />
            {conditionConfig.label}
          </span>
        </div>

        {/* Trend Indicator */}
        <div className="flex items-center gap-2 mb-4 text-sm">
          {getTrendIcon()}
          <span className="text-gray-600 dark:text-gray-400">
            7-day trend: <span className={`font-semibold ${trend.direction === 'up' ? 'text-green-600' : trend.direction === 'down' ? 'text-red-600' : 'text-gray-600'}`}>
              {trend.change > 0 ? '+' : ''}{trend.change.toFixed(2)}%
            </span>
          </span>
        </div>

        {/* Threshold Band Visualization */}
        <div className="mb-4">
          <div className="relative h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            {/* Threshold bands */}
            <div className="absolute inset-0 flex">
              <div className="bg-red-500" style={{ width: `${(thresholdBand.critical.max - thresholdBand.critical.min) / 100 * 100}%` }} />
              <div className="bg-orange-500" style={{ width: `${(thresholdBand.observe.max - thresholdBand.observe.min) / 100 * 100}%` }} />
              <div className="bg-yellow-500" style={{ width: `${(thresholdBand.slight.max - thresholdBand.slight.min) / 100 * 100}%` }} />
              <div className="bg-green-500 flex-1" />
            </div>
            {/* Current value indicator */}
            <div
              className="absolute top-0 bottom-0 w-1 bg-gray-900 dark:bg-white z-10"
              style={{ left: `${getValuePosition()}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
            <span>0%</span>
            <span>100%</span>
          </div>
        </div>

        {/* View Diagnostics Button */}
        {onViewDiagnostics && (
          <button
            onClick={() => setShowDiagnostics(true)}
            className="w-full mt-4 px-4 py-2 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
          >
            <Eye className="w-4 h-4" />
            View Diagnostics
          </button>
        )}
      </Card>

      {/* Diagnostics Modal */}
      {showDiagnostics && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-6 rounded-t-2xl flex items-center justify-between">
              <div className="flex items-center gap-3">
                {icon}
                <h3 className="text-xl font-bold">{title} Diagnostics</h3>
              </div>
              <button
                onClick={() => setShowDiagnostics(false)}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Current Status */}
              <div>
                <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Current Status</h4>
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Current Value</span>
                    <span className="text-2xl font-bold text-gray-900 dark:text-white">
                      {value.toFixed(2)} {unit}
                    </span>
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Condition</span>
                    <span className={`px-3 py-1 rounded-lg text-sm font-semibold ${conditionConfig.color}`}>
                      {conditionConfig.label}
                    </span>
                  </div>
                </div>
              </div>

              {/* Root Cause Classification */}
              {rootCauses.length > 0 && (
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Root Cause Classification</h4>
                  <div className="space-y-2">
                    {rootCauses.map((cause, index) => (
                      <div
                        key={index}
                        className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg p-3 border border-blue-200 dark:border-blue-800"
                      >
                        <div className="flex items-start gap-3">
                          <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center flex-shrink-0 text-xs font-semibold">
                            {index + 1}
                          </div>
                          <p className="text-sm text-gray-700 dark:text-gray-300 flex-1">{cause}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Threshold Bands */}
              <div>
                <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Threshold Bands</h4>
                <div className="space-y-2">
                  <div className="flex items-center justify-between p-2 bg-green-50 dark:bg-green-900/20 rounded">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Healthy</span>
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {thresholdBand.healthy.min}% - {thresholdBand.healthy.max}%
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Slight Degradation</span>
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {thresholdBand.slight.min}% - {thresholdBand.slight.max}%
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-2 bg-orange-50 dark:bg-orange-900/20 rounded">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Observe</span>
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {thresholdBand.observe.min}% - {thresholdBand.observe.max}%
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-2 bg-red-50 dark:bg-red-900/20 rounded">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Critical</span>
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {thresholdBand.critical.min}% - {thresholdBand.critical.max}%
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default RichDiagnosticCard;


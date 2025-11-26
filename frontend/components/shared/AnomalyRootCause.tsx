import React from 'react';
import { AlertTriangle, Info, XCircle, CheckCircle2, TrendingUp, TrendingDown } from 'lucide-react';
import Card from '../ui/Card';

interface RootCause {
  id: string;
  anomalyType: string;
  severity: 'low' | 'medium' | 'high';
  deviation: number; // percentage
  detectedAt: string;
  rootCause: string;
  possibleCauses: string[];
  recommendedAction: string;
  confidence: number; // 0-100
}

interface AnomalyRootCauseProps {
  anomalies: RootCause[];
  isLoading?: boolean;
}

const AnomalyRootCause: React.FC<AnomalyRootCauseProps> = ({
  anomalies,
  isLoading = false,
}) => {
  const getSeverityConfig = (severity: RootCause['severity']) => {
    switch (severity) {
      case 'high':
        return {
          color: 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800',
          textColor: 'text-red-800 dark:text-red-300',
          icon: XCircle,
          badge: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
        };
      case 'medium':
        return {
          color: 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800',
          textColor: 'text-yellow-800 dark:text-yellow-300',
          icon: AlertTriangle,
          badge: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
        };
      case 'low':
        return {
          color: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800',
          textColor: 'text-blue-800 dark:text-blue-300',
          icon: Info,
          badge: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
        };
    }
  };

  if (isLoading) {
    return (
      <Card title="Anomaly Root Cause Analysis">
        <div className="space-y-4">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="h-32 bg-gray-100 dark:bg-gray-700 rounded-lg animate-pulse" />
          ))}
        </div>
      </Card>
    );
  }

  if (anomalies.length === 0) {
    return (
      <Card title="Anomaly Root Cause Analysis">
        <div className="flex flex-col items-center justify-center text-center py-12 text-gray-500 dark:text-gray-400">
          <CheckCircle2 className="w-16 h-16 text-green-500 mb-3" />
          <p className="font-semibold text-lg">No Anomalies Detected</p>
          <p className="text-sm mt-1">All systems operating within normal parameters</p>
        </div>
      </Card>
    );
  }

  return (
    <Card title="Anomaly Root Cause Analysis">
      <div className="space-y-4">
        {anomalies.map((anomaly) => {
          const config = getSeverityConfig(anomaly.severity);
          const Icon = config.icon;

          return (
            <div
              key={anomaly.id}
              className={`rounded-xl p-5 border-2 ${config.color} transition-all hover:shadow-lg`}
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-start gap-3 flex-1">
                  <div className={`p-2 rounded-lg ${config.badge}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-semibold text-gray-900 dark:text-white text-lg">
                        {anomaly.anomalyType}
                      </h4>
                      <span className={`px-2 py-0.5 rounded text-xs font-semibold ${config.badge}`}>
                        {anomaly.severity.toUpperCase()}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Detected: {new Date(anomaly.detectedAt).toLocaleString()}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <div className={`text-2xl font-bold ${config.textColor}`}>
                    {anomaly.deviation > 0 ? '+' : ''}{anomaly.deviation.toFixed(2)}%
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">Deviation</div>
                </div>
              </div>

              {/* Root Cause Explanation */}
              <div className="mb-4 p-4 bg-white/70 dark:bg-gray-800/70 rounded-lg border border-gray-200 dark:border-gray-700">
                <div className="flex items-start gap-2 mb-2">
                  <TrendingUp className="w-4 h-4 text-gray-500 dark:text-gray-400 mt-0.5" />
                  <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">Root Cause:</span>
                </div>
                <p className="text-sm text-gray-800 dark:text-gray-200 leading-relaxed">
                  {anomaly.rootCause}
                </p>
              </div>

              {/* Possible Causes */}
              {anomaly.possibleCauses.length > 0 && (
                <div className="mb-4">
                  <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Possible Contributing Factors:
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {anomaly.possibleCauses.map((cause, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg text-xs font-medium"
                      >
                        {cause}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Recommended Action */}
              <div className="p-3 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                <div className="flex items-start gap-2">
                  <Info className="w-4 h-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-xs font-semibold text-blue-900 dark:text-blue-300 mb-1">
                      Recommended Action:
                    </p>
                    <p className="text-sm text-blue-800 dark:text-blue-200">
                      {anomaly.recommendedAction}
                    </p>
                  </div>
                </div>
              </div>

              {/* Confidence Indicator */}
              <div className="mt-3 flex items-center justify-between">
                <span className="text-xs text-gray-600 dark:text-gray-400">Model Confidence</span>
                <div className="flex items-center gap-2">
                  <div className="w-32 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all ${
                        anomaly.confidence >= 80
                          ? 'bg-green-500'
                          : anomaly.confidence >= 60
                          ? 'bg-yellow-500'
                          : 'bg-red-500'
                      }`}
                      style={{ width: `${anomaly.confidence}%` }}
                    />
                  </div>
                  <span className="text-xs font-semibold text-gray-700 dark:text-gray-300 w-12 text-right">
                    {Number(anomaly.confidence).toFixed(2)}%
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
};

export default AnomalyRootCause;


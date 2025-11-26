import React, { useState, useEffect } from 'react';
import { AlertTriangle, TrendingDown, Brain, BarChart3, Info, ChevronDown, ChevronUp, Loader } from 'lucide-react';
import Card from '../ui/Card';

interface AnomalyData {
  anomalyScore: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  detectedAt: string;
  dataType: string;
}

interface RULData {
  rulDays: number;
  rulConfidence: number;
  featureDrift: number;
  estimatedFailureDate: string;
  equipmentType: string;
}

interface FaultClassification {
  faultClassification: Array<{
    name: string;
    probability: number;
  }>;
  topFault: {
    name: string;
    probability: number;
  };
  confidence: number;
}

interface MLAlertCardProps {
  alert: {
    id: string;
    message: string;
    timestamp: string;
    severity: string;
    device_id?: string;
  };
  onAcknowledge?: (alertId: string) => void;
}

const MLAlertCard: React.FC<MLAlertCardProps> = ({ alert, onAcknowledge }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [anomalyData, setAnomalyData] = useState<AnomalyData | null>(null);
  const [rulData, setRulData] = useState<RULData | null>(null);
  const [faultClassification, setFaultClassification] = useState<FaultClassification | null>(null);
  const [llmExplanation, setLlmExplanation] = useState<string | null>(null);

  useEffect(() => {
    if (isExpanded && !anomalyData) {
      loadMLAnalysis();
    }
  }, [isExpanded]);

  const loadMLAnalysis = async () => {
    setIsLoading(true);
    try {
      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001/api/v1';
      const response = await fetch(`${API_BASE_URL}/ml-alerts/full-analysis`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          dataType: detectDataType(alert.message),
          equipmentType: detectEquipmentType(alert.message),
          metrics: {},
          historicalData: [],
        }),
      });

      if (response.ok) {
        const result = await response.json();
        setAnomalyData(result.data.anomaly);
        setRulData(result.data.rul);
        setFaultClassification(result.data.faultClassification);
        setLlmExplanation(result.data.explanation.text);
      }
    } catch (error) {
      console.error('Failed to load ML analysis:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const detectDataType = (message: string): string => {
    const lower = message.toLowerCase();
    if (lower.includes('harmonic') || lower.includes('inverter')) return 'inverter_harmonics';
    if (lower.includes('temp') || lower.includes('thermal')) return 'thermal_drift';
    if (lower.includes('solar') || lower.includes('pv') || lower.includes('panel')) return 'pv_soiling';
    if (lower.includes('vibration') || lower.includes('vib')) return 'vibration_spectral';
    return 'general_anomaly';
  };

  const detectEquipmentType = (message: string): string => {
    const lower = message.toLowerCase();
    if (lower.includes('inverter')) return 'inverter';
    if (lower.includes('motor')) return 'motor';
    if (lower.includes('battery')) return 'battery';
    if (lower.includes('panel') || lower.includes('solar')) return 'solar_panel';
    return 'equipment';
  };

  const getSeverityConfig = (severity: string) => {
    switch (severity) {
      case 'critical':
        return {
          color: 'border-red-500 bg-red-50 dark:bg-red-900/20',
          textColor: 'text-red-800 dark:text-red-300',
          badge: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
        };
      case 'high':
        return {
          color: 'border-orange-500 bg-orange-50 dark:bg-orange-900/20',
          textColor: 'text-orange-800 dark:text-orange-300',
          badge: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
        };
      case 'medium':
        return {
          color: 'border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20',
          textColor: 'text-yellow-800 dark:text-yellow-300',
          badge: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
        };
      default:
        return {
          color: 'border-blue-500 bg-blue-50 dark:bg-blue-900/20',
          textColor: 'text-blue-800 dark:text-blue-300',
          badge: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
        };
    }
  };

  const formatFaultName = (name: string): string => {
    return name
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const config = getSeverityConfig(alert.severity);

  return (
    <div
      className={`rounded-xl border-l-4 p-5 cursor-pointer transition-all ${config.color} ${
        isExpanded ? 'shadow-lg' : 'hover:shadow-md'
      }`}
      onClick={() => setIsExpanded(!isExpanded)}
    >
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3 flex-1">
          <AlertTriangle className="w-6 h-6 text-red-500 flex-shrink-0 mt-1" />
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold text-gray-900 dark:text-white">{alert.message}</h3>
              <span className={`px-2 py-0.5 rounded text-xs font-semibold ${config.badge}`}>
                {alert.severity.toUpperCase()}
              </span>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {alert.device_id || 'Device'} • {new Date(alert.timestamp).toLocaleString()}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isExpanded ? (
            <ChevronUp className="w-5 h-5 text-gray-500" />
          ) : (
            <ChevronDown className="w-5 h-5 text-gray-500" />
          )}
        </div>
      </div>

      {/* Expanded ML Analysis */}
      {isExpanded && (
        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 space-y-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader className="w-6 h-6 animate-spin text-blue-600" />
              <span className="ml-2 text-gray-600 dark:text-gray-400">Running ML analysis...</span>
            </div>
          ) : (
            <>
              {/* Anomaly Detection */}
              {anomalyData && (
                <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                  <div className="flex items-center gap-2 mb-3">
                    <Brain className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    <h4 className="font-semibold text-gray-900 dark:text-white">Anomaly Detection</h4>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Anomaly Score</p>
                      <div className="flex items-baseline gap-2">
                        <span className="text-2xl font-bold text-gray-900 dark:text-white">
                          {(anomalyData.anomalyScore * 100).toFixed(2)}%
                        </span>
                        <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full ${
                              anomalyData.anomalyScore > 0.85
                                ? 'bg-red-500'
                                : anomalyData.anomalyScore > 0.75
                                ? 'bg-orange-500'
                                : anomalyData.anomalyScore > 0.65
                                ? 'bg-yellow-500'
                                : 'bg-green-500'
                            }`}
                            style={{ width: `${anomalyData.anomalyScore * 100}%` }}
                          />
                        </div>
                      </div>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Data Type</p>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {anomalyData.dataType.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* RUL Estimation */}
              {rulData && (
                <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                  <div className="flex items-center gap-2 mb-3">
                    <TrendingDown className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                    <h4 className="font-semibold text-gray-900 dark:text-white">Remaining Useful Life (RUL)</h4>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">RUL</p>
                      <p className="text-xl font-bold text-gray-900 dark:text-white">{rulData.rulDays} days</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Confidence</p>
                      <p className="text-xl font-bold text-gray-900 dark:text-white">
                        {(rulData.rulConfidence * 100).toFixed(2)}%
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Feature Drift</p>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full ${
                              rulData.featureDrift > 0.7 ? 'bg-red-500' : rulData.featureDrift > 0.5 ? 'bg-yellow-500' : 'bg-green-500'
                            }`}
                            style={{ width: `${rulData.featureDrift * 100}%` }}
                          />
                        </div>
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                          {(rulData.featureDrift * 100).toFixed(2)}%
                        </span>
                      </div>
                    </div>
                  </div>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-2">
                    Estimated failure: {new Date(rulData.estimatedFailureDate).toLocaleDateString()}
                  </p>
                </div>
              )}

              {/* Fault Classification */}
              {faultClassification && (
                <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                  <div className="flex items-center gap-2 mb-3">
                    <BarChart3 className="w-5 h-5 text-green-600 dark:text-green-400" />
                    <h4 className="font-semibold text-gray-900 dark:text-white">Fault Classification</h4>
                    <span className="ml-auto text-xs text-gray-600 dark:text-gray-400">
                      Confidence: {Number(faultClassification.confidence).toFixed(2)}%
                    </span>
                  </div>
                  <div className="space-y-2">
                    {faultClassification.faultClassification.slice(0, 5).map((fault, index) => (
                      <div key={index} className="flex items-center gap-3">
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-medium text-gray-900 dark:text-white">
                              {formatFaultName(fault.name)}
                            </span>
                            <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                              {(fault.probability * 100).toFixed(2)}%
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                            <div
                              className={`h-2 rounded-full ${
                                index === 0 ? 'bg-green-500' : 'bg-gray-400'
                              }`}
                              style={{ width: `${fault.probability * 100}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* LLM Explanation */}
              {llmExplanation && (
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
                  <div className="flex items-center gap-2 mb-3">
                    <Info className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    <h4 className="font-semibold text-gray-900 dark:text-white">AI Explanation</h4>
                  </div>
                  <div className="text-sm text-gray-800 dark:text-gray-200 whitespace-pre-line">
                    {llmExplanation.split('\n').map((line, i) => {
                      if (line.startsWith('**') && line.endsWith('**')) {
                        return (
                          <p key={i} className="font-semibold text-gray-900 dark:text-white mt-2 mb-1">
                            {line.replace(/\*\*/g, '')}
                          </p>
                        );
                      }
                      if (line.startsWith('•')) {
                        return (
                          <p key={i} className="ml-4 text-gray-700 dark:text-gray-300">
                            {line}
                          </p>
                        );
                      }
                      return (
                        <p key={i} className="text-gray-700 dark:text-gray-300 mb-1">
                          {line}
                        </p>
                      );
                    })}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default MLAlertCard;


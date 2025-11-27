import React, { useContext, useMemo } from 'react';
import { AppContext } from '../../contexts/AppContext';
import Card from '../ui/Card';
import { Activity, AlertTriangle, CheckCircle, TrendingDown, TrendingUp } from 'lucide-react';

interface PowerQualityMetric {
  label: string;
  value: number;
  unit: string;
  status: 'excellent' | 'good' | 'fair' | 'poor' | 'critical';
  threshold: { min: number; max: number };
}

const PowerQualityCard: React.FC = () => {
  const { latestTelemetry, healthStatus } = useContext(AppContext)!;

  // Calculate power quality metrics from telemetry
  const powerQualityMetrics = useMemo(() => {
    const voltage = latestTelemetry?.metrics?.voltage ?? 415;
    const frequency = latestTelemetry?.metrics?.frequency ?? 50.0;
    const thd = latestTelemetry?.metrics?.thd ?? 3.0;
    const powerFactor = latestTelemetry?.metrics?.power_factor ?? 0.95;
    const voltageUnbalance = latestTelemetry?.metrics?.voltage_unbalance ?? 1.5;
    
    // Voltage quality assessment (415V nominal, ±5% tolerance)
    const voltageDeviation = Math.abs(voltage - 415) / 415 * 100;
    const voltageQuality = voltageDeviation <= 2 ? 'excellent' : 
                          voltageDeviation <= 3 ? 'good' : 
                          voltageDeviation <= 5 ? 'fair' : 
                          voltageDeviation <= 7 ? 'poor' : 'critical';
    
    // Frequency stability assessment (50Hz nominal, ±0.5Hz tolerance)
    const frequencyDeviation = Math.abs(frequency - 50.0);
    const frequencyQuality = frequencyDeviation <= 0.1 ? 'excellent' : 
                            frequencyDeviation <= 0.2 ? 'good' : 
                            frequencyDeviation <= 0.3 ? 'fair' : 
                            frequencyDeviation <= 0.5 ? 'poor' : 'critical';
    
    // THD assessment (should be < 5% for good quality)
    const thdQuality = thd <= 3 ? 'excellent' : 
                      thd <= 5 ? 'good' : 
                      thd <= 8 ? 'fair' : 
                      thd <= 10 ? 'poor' : 'critical';
    
    // Power Factor assessment (target > 0.95)
    const pfQuality = powerFactor >= 0.95 ? 'excellent' : 
                     powerFactor >= 0.90 ? 'good' : 
                     powerFactor >= 0.85 ? 'fair' : 
                     powerFactor >= 0.80 ? 'poor' : 'critical';
    
    // Voltage Unbalance assessment (target < 2%)
    const unbalanceQuality = voltageUnbalance <= 1 ? 'excellent' : 
                            voltageUnbalance <= 2 ? 'good' : 
                            voltageUnbalance <= 3 ? 'fair' : 
                            voltageUnbalance <= 4 ? 'poor' : 'critical';
    
    // Calculate overall Power Quality Index (0-100)
    const voltageScore = voltageQuality === 'excellent' ? 100 : 
                        voltageQuality === 'good' ? 85 : 
                        voltageQuality === 'fair' ? 70 : 
                        voltageQuality === 'poor' ? 50 : 25;
    
    const frequencyScore = frequencyQuality === 'excellent' ? 100 : 
                          frequencyQuality === 'good' ? 85 : 
                          frequencyQuality === 'fair' ? 70 : 
                          frequencyQuality === 'poor' ? 50 : 25;
    
    const thdScore = thdQuality === 'excellent' ? 100 : 
                    thdQuality === 'good' ? 85 : 
                    thdQuality === 'fair' ? 70 : 
                    thdQuality === 'poor' ? 50 : 25;
    
    const pfScore = pfQuality === 'excellent' ? 100 : 
                   pfQuality === 'good' ? 85 : 
                   pfQuality === 'fair' ? 70 : 
                   pfQuality === 'poor' ? 50 : 25;
    
    const unbalanceScore = unbalanceQuality === 'excellent' ? 100 : 
                          unbalanceQuality === 'good' ? 85 : 
                          unbalanceQuality === 'fair' ? 70 : 
                          unbalanceQuality === 'poor' ? 50 : 25;
    
    const powerQualityIndex = Math.round((voltageScore + frequencyScore + thdScore + pfScore + unbalanceScore) / 5);
    
    return {
      powerQualityIndex,
      metrics: [
        {
          label: 'Voltage Quality',
          value: voltage,
          unit: 'V',
          status: voltageQuality,
          threshold: { min: 394, max: 436 }, // ±5% of 415V
          deviation: voltageDeviation,
        },
        {
          label: 'Frequency Stability',
          value: frequency,
          unit: 'Hz',
          status: frequencyQuality,
          threshold: { min: 49.5, max: 50.5 },
          deviation: frequencyDeviation,
        },
        {
          label: 'Total Harmonic Distortion',
          value: thd,
          unit: '%',
          status: thdQuality,
          threshold: { min: 0, max: 5 },
          deviation: thd,
        },
        {
          label: 'Power Factor',
          value: powerFactor,
          unit: '',
          status: pfQuality,
          threshold: { min: 0.80, max: 1.0 },
          deviation: (1 - powerFactor) * 100,
        },
        {
          label: 'Voltage Unbalance',
          value: voltageUnbalance,
          unit: '%',
          status: unbalanceQuality,
          threshold: { min: 0, max: 2 },
          deviation: voltageUnbalance,
        },
      ] as (PowerQualityMetric & { deviation: number })[],
    };
  }, [latestTelemetry]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'excellent': return 'text-green-600 dark:text-green-400';
      case 'good': return 'text-blue-600 dark:text-blue-400';
      case 'fair': return 'text-yellow-600 dark:text-yellow-400';
      case 'poor': return 'text-orange-600 dark:text-orange-400';
      case 'critical': return 'text-red-600 dark:text-red-400';
      default: return 'text-gray-600 dark:text-gray-400';
    }
  };

  const getStatusBgColor = (status: string) => {
    switch (status) {
      case 'excellent': return 'bg-green-100 dark:bg-green-900/30';
      case 'good': return 'bg-blue-100 dark:bg-blue-900/30';
      case 'fair': return 'bg-yellow-100 dark:bg-yellow-900/30';
      case 'poor': return 'bg-orange-100 dark:bg-orange-900/30';
      case 'critical': return 'bg-red-100 dark:bg-red-900/30';
      default: return 'bg-gray-100 dark:bg-gray-900/30';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'excellent': return <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />;
      case 'good': return <CheckCircle className="w-5 h-5 text-blue-600 dark:text-blue-400" />;
      case 'fair': return <AlertTriangle className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />;
      case 'poor': return <AlertTriangle className="w-5 h-5 text-orange-600 dark:text-orange-400" />;
      case 'critical': return <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />;
      default: return <Activity className="w-5 h-5 text-gray-600 dark:text-gray-400" />;
    }
  };

  const overallStatus = powerQualityMetrics.powerQualityIndex >= 85 ? 'excellent' :
                       powerQualityMetrics.powerQualityIndex >= 70 ? 'good' :
                       powerQualityMetrics.powerQualityIndex >= 50 ? 'fair' : 'poor';

  return (
    <Card title="Power Quality Monitoring">
      {/* Overall Power Quality Index */}
      <div className={`mb-6 p-4 rounded-lg border-2 ${getStatusBgColor(overallStatus)} border-current ${getStatusColor(overallStatus)}`}>
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-semibold uppercase tracking-wide">Power Quality Index</span>
          {getStatusIcon(overallStatus)}
        </div>
        <div className="flex items-baseline space-x-2">
          <span className="text-4xl font-bold">{powerQualityMetrics.powerQualityIndex}</span>
          <span className="text-lg text-gray-600 dark:text-gray-400">/ 100</span>
        </div>
        <div className="mt-2 text-xs text-gray-600 dark:text-gray-400">
          {overallStatus === 'excellent' && '✓ Excellent power quality - All parameters within optimal range'}
          {overallStatus === 'good' && '✓ Good power quality - Minor deviations detected'}
          {overallStatus === 'fair' && '⚠ Fair power quality - Some parameters need attention'}
          {overallStatus === 'poor' && '⚠ Poor power quality - Immediate action recommended'}
        </div>
      </div>

      {/* Individual Metrics */}
      <div className="space-y-4">
        {powerQualityMetrics.metrics.map((metric, index) => (
          <div key={index} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <span className="font-semibold text-gray-900 dark:text-white">{metric.label}</span>
                {getStatusIcon(metric.status)}
              </div>
              <div className={`px-2 py-1 rounded text-xs font-medium ${getStatusBgColor(metric.status)} ${getStatusColor(metric.status)}`}>
                {metric.status.toUpperCase()}
              </div>
            </div>
            <div className="flex items-baseline space-x-2">
              <span className="text-2xl font-bold text-gray-900 dark:text-white">
                {metric.value.toFixed(metric.unit === 'V' ? 1 : metric.unit === 'Hz' ? 2 : metric.unit === '' ? 3 : 2)}
              </span>
              <span className="text-sm text-gray-600 dark:text-gray-400">{metric.unit || ''}</span>
            </div>
            <div className="mt-2">
              <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400 mb-1">
                <span>Threshold: {metric.threshold.min} - {metric.threshold.max} {metric.unit}</span>
                <span className={metric.deviation > (metric.threshold.max - metric.threshold.min) / 2 ? 'text-red-600 dark:text-red-400' : ''}>
                  {metric.label === 'Power Factor' ? `Value: ${metric.value.toFixed(3)}` : `Deviation: ${metric.deviation.toFixed(2)} ${metric.unit === 'V' ? '%' : metric.unit === 'Hz' ? 'Hz' : metric.unit === '' ? '' : '%'}`}
                </span>
              </div>
              {/* Progress bar showing quality level */}
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full transition-all ${
                    metric.status === 'excellent' ? 'bg-green-500' :
                    metric.status === 'good' ? 'bg-blue-500' :
                    metric.status === 'fair' ? 'bg-yellow-500' :
                    metric.status === 'poor' ? 'bg-orange-500' : 'bg-red-500'
                  }`}
                  style={{ 
                    width: `${Math.min(100, Math.max(0, 
                      ((metric.value - metric.threshold.min) / (metric.threshold.max - metric.threshold.min)) * 100
                    ))}%` 
                  }}
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Information Footer */}
      <div className="mt-6 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-xs text-gray-600 dark:text-gray-400">
        <p className="font-semibold mb-1">Power Quality Monitoring:</p>
        <ul className="list-disc list-inside space-y-1">
          <li>Voltage: Monitors sag/swell conditions (±5% tolerance)</li>
          <li>Frequency: Tracks grid stability (50Hz ±0.5Hz)</li>
          <li>THD: Measures harmonic distortion (target &lt;5%)</li>
          <li>Power Factor: Indicates energy efficiency (target &gt;0.95)</li>
          <li>Voltage Unbalance: Detects phase imbalances (target &lt;2%)</li>
        </ul>
        <p className="mt-2 italic">Real-time monitoring helps prevent equipment failures and ensures compliance with industry standards.</p>
      </div>
    </Card>
  );
};

export default PowerQualityCard;


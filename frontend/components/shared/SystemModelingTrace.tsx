import React from 'react';
import { ComposedChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Area } from 'recharts';
import Card from '../ui/Card';

interface ModelingDataPoint {
  timestamp: string;
  predicted: number;
  actual: number;
  confidenceUpper: number;
  confidenceLower: number;
}

interface SystemModelingTraceProps {
  data: ModelingDataPoint[];
  title: string;
  unit: string;
  isLoading?: boolean;
}

const SystemModelingTrace: React.FC<SystemModelingTraceProps> = ({
  data,
  title,
  unit,
  isLoading = false,
}) => {
  // Calculate model confidence
  const calculateConfidence = () => {
    if (data.length === 0) return 0;
    const deviations = data.map(d => Math.abs(d.actual - d.predicted) / d.predicted);
    const avgDeviation = deviations.reduce((a, b) => a + b, 0) / deviations.length;
    return Math.max(0, Math.min(100, (1 - avgDeviation) * 100));
  };

  const modelConfidence = calculateConfidence();

  const chartData = data.map(d => ({
    time: new Date(d.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    timestamp: d.timestamp,
    predicted: d.predicted,
    actual: d.actual,
    confidenceUpper: d.confidenceUpper,
    confidenceLower: d.confidenceLower,
    // Create band data by combining upper and lower
    confidenceBand: [d.confidenceLower, d.confidenceUpper],
  }));

  return (
    <Card title={title}>
      {/* Model Confidence Badge */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="px-3 py-1.5 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <span className="text-xs font-medium text-blue-700 dark:text-blue-300">Model Confidence</span>
            <span className="ml-2 text-lg font-bold text-blue-600 dark:text-blue-400">
              {modelConfidence.toFixed(2)}%
            </span>
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            {data.length} data points
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="h-80 flex items-center justify-center">
          <div className="text-gray-500 dark:text-gray-400">Loading modeling data...</div>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={400}>
          <ComposedChart data={chartData}>
            <defs>
              <linearGradient id="confidenceGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.05} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" className="stroke-gray-300 dark:stroke-gray-600" />
            <XAxis
              dataKey="time"
              label={{ value: 'Time', position: 'insideBottom', offset: -5 }}
              tick={{ fill: 'currentColor', fontSize: 12 }}
              interval="preserveStartEnd"
            />
            <YAxis
              label={{ value: `${title} (${unit})`, angle: -90, position: 'insideLeft' }}
              tick={{ fill: 'currentColor' }}
              tickFormatter={(value) => Number(value).toFixed(2)}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                border: '1px solid #ccc',
                borderRadius: '8px',
              }}
              formatter={(value: any) => Number(value).toFixed(2)}
              labelFormatter={(label) => {
                const point = chartData.find(d => d.time === label);
                return point ? new Date(point.timestamp).toLocaleString() : label;
              }}
            />
            <Legend />
            
            {/* Confidence Band */}
            <Area
              type="monotone"
              dataKey="confidenceUpper"
              stroke="#3b82f6"
              strokeWidth={1}
              strokeDasharray="2 2"
              fill="url(#confidenceGradient)"
              fillOpacity={0.2}
              connectNulls
              name="Confidence Band"
            />
            <Area
              type="monotone"
              dataKey="confidenceLower"
              stroke="#3b82f6"
              strokeWidth={1}
              strokeDasharray="2 2"
              fill="#ffffff"
              fillOpacity={1}
              connectNulls
            />
            
            {/* Predicted Line (dashed) */}
            <Line
              type="monotone"
              dataKey="predicted"
              stroke="#3b82f6"
              strokeWidth={2}
              strokeDasharray="5 5"
              dot={false}
              name="Predicted"
            />
            
            {/* Actual Line (solid) */}
            <Line
              type="monotone"
              dataKey="actual"
              stroke="#10b981"
              strokeWidth={2}
              dot={{ fill: '#10b981', r: 3 }}
              name="Actual"
            />
          </ComposedChart>
        </ResponsiveContainer>
      )}

      {/* Statistics */}
      {!isLoading && data.length > 0 && (
        <div className="mt-4 grid grid-cols-3 gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <div>
            <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Mean Absolute Error</p>
            <p className="text-lg font-semibold text-gray-900 dark:text-white">
              {(
                data.reduce((sum, d) => sum + Math.abs(d.actual - d.predicted), 0) / data.length
              ).toFixed(2)} {unit}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Max Deviation</p>
            <p className="text-lg font-semibold text-gray-900 dark:text-white">
              {Math.max(...data.map(d => Math.abs(d.actual - d.predicted))).toFixed(2)} {unit}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">RMSE</p>
            <p className="text-lg font-semibold text-gray-900 dark:text-white">
              {Math.sqrt(
                data.reduce((sum, d) => sum + Math.pow(d.actual - d.predicted, 2), 0) / data.length
              ).toFixed(2)} {unit}
            </p>
          </div>
        </div>
      )}
    </Card>
  );
};

export default SystemModelingTrace;


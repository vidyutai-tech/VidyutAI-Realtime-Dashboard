import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Area, AreaChart } from 'recharts';
import Card from '../ui/Card';
import { Sun, Droplets, Thermometer, TrendingDown } from 'lucide-react';

interface DegradationDataPoint {
  date: string;
  soilingIndex: number; // 0-1, where 1 is clean
  thermalDerate: number; // percentage
  efficiency: number; // percentage
}

interface SolarDegradationCurvesProps {
  data: DegradationDataPoint[];
  isLoading?: boolean;
}

const SolarDegradationCurves: React.FC<SolarDegradationCurvesProps> = ({
  data,
  isLoading = false,
}) => {
  const chartData = data.map(d => ({
    date: new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    fullDate: d.date,
    soilingIndex: d.soilingIndex * 100, // Convert to percentage
    thermalDerate: d.thermalDerate,
    efficiency: d.efficiency,
  }));

  // Calculate trends
  const calculateTrend = (values: number[]) => {
    if (values.length < 2) return 0;
    const first = values[0];
    const last = values[values.length - 1];
    return ((last - first) / first) * 100;
  };

  const soilingTrend = calculateTrend(data.map(d => d.soilingIndex));
  const efficiencyTrend = calculateTrend(data.map(d => d.efficiency));

  return (
    <Card title="Solar Degradation Analysis">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
          <div className="flex items-center gap-2 mb-2">
            <Droplets className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Soiling Index</span>
          </div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            {(data[data.length - 1]?.soilingIndex * 100 || 0).toFixed(2)}%
          </div>
          <div className={`text-xs mt-1 ${soilingTrend < 0 ? 'text-red-600' : 'text-green-600'}`}>
            {soilingTrend > 0 ? '↑' : '↓'} {Math.abs(soilingTrend).toFixed(2)}% vs baseline
          </div>
        </div>

        <div className="bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 rounded-lg p-4 border border-orange-200 dark:border-orange-800">
          <div className="flex items-center gap-2 mb-2">
            <Thermometer className="w-5 h-5 text-orange-600 dark:text-orange-400" />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Thermal Derate</span>
          </div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            {data[data.length - 1]?.thermalDerate.toFixed(2) || 0}%
          </div>
          <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
            Temperature impact
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-lg p-4 border border-green-200 dark:border-green-800">
          <div className="flex items-center gap-2 mb-2">
            <TrendingDown className="w-5 h-5 text-green-600 dark:text-green-400" />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Efficiency Trend</span>
          </div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            {data[data.length - 1]?.efficiency.toFixed(2) || 0}%
          </div>
          <div className={`text-xs mt-1 ${efficiencyTrend < 0 ? 'text-red-600' : 'text-green-600'}`}>
            {efficiencyTrend > 0 ? '↑' : '↓'} {Math.abs(efficiencyTrend).toFixed(2)}% degradation
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="h-80 flex items-center justify-center">
          <div className="text-gray-500 dark:text-gray-400">Loading degradation data...</div>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={400}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-gray-300 dark:stroke-gray-600" />
            <XAxis
              dataKey="date"
              label={{ value: 'Date', position: 'insideBottom', offset: -5 }}
              tick={{ fill: 'currentColor', fontSize: 12 }}
              interval="preserveStartEnd"
            />
            <YAxis
              label={{ value: 'Percentage (%)', angle: -90, position: 'insideLeft' }}
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
            />
            <Legend />
            <Line
              type="monotone"
              dataKey="soilingIndex"
              stroke="#3b82f6"
              strokeWidth={2}
              dot={{ fill: '#3b82f6', r: 4 }}
              name="Soiling Index (%)"
            />
            <Line
              type="monotone"
              dataKey="thermalDerate"
              stroke="#f59e0b"
              strokeWidth={2}
              dot={{ fill: '#f59e0b', r: 4 }}
              name="Thermal Derate (%)"
            />
            <Line
              type="monotone"
              dataKey="efficiency"
              stroke="#10b981"
              strokeWidth={2}
              dot={{ fill: '#10b981', r: 4 }}
              name="Efficiency (%)"
            />
          </LineChart>
        </ResponsiveContainer>
      )}

      {/* Interpretation */}
      {!isLoading && data.length > 0 && (
        <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
          <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
            <Sun className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            Degradation Analysis
          </h4>
          <div className="text-sm text-gray-700 dark:text-gray-300 space-y-1">
            <p>
              <strong>Soiling Index:</strong> {data[data.length - 1].soilingIndex < 0.85 
                ? 'Moderate soiling detected. Consider cleaning to restore 5-8% efficiency.'
                : data[data.length - 1].soilingIndex < 0.95
                ? 'Light soiling present. Monitor for degradation.'
                : 'Panels are clean. Optimal performance.'}
            </p>
            <p>
              <strong>Thermal Derate:</strong> Operating at {data[data.length - 1].thermalDerate.toFixed(2)}% derate due to temperature.
              {data[data.length - 1].thermalDerate > 15 ? ' High temperature impact - consider ventilation.' : ' Within normal range.'}
            </p>
            <p>
              <strong>Efficiency Trend:</strong> {efficiencyTrend < -2 
                ? `Degrading at ${Math.abs(efficiencyTrend).toFixed(2)}% per period. Investigate root cause.`
                : efficiencyTrend < -0.5
                ? 'Slight degradation observed. Monitor closely.'
                : 'Stable efficiency. No significant degradation.'}
            </p>
          </div>
        </div>
      )}
    </Card>
  );
};

export default SolarDegradationCurves;


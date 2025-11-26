import React, { useState, useRef } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts';
import { ZoomIn, Download, AlertTriangle } from 'lucide-react';
import Card from '../ui/Card';

interface Anomaly {
  timestamp: string;
  type: string;
  severity: 'low' | 'medium' | 'high';
  description: string;
}

interface TelemetryPoint {
  timestamp: string;
  voltage?: number;
  current?: number;
  frequency?: number;
  pv_generation?: number;
  net_load?: number;
  battery_discharge?: number;
  soc?: number;
  forecast?: {
    voltage?: number;
    current?: number;
    frequency?: number;
  };
}

interface EnhancedTelemetryChartProps {
  data: TelemetryPoint[];
  anomalies?: Anomaly[];
  theme: 'light' | 'dark';
  isLoading?: boolean;
}

const EnhancedTelemetryChart: React.FC<EnhancedTelemetryChartProps> = ({
  data,
  anomalies = [],
  theme,
  isLoading = false,
}) => {
  const [selectedAxes, setSelectedAxes] = useState<Set<string>>(new Set(['voltage', 'current']));
  const [showAnomalies, setShowAnomalies] = useState(true);
  const [showForecast, setShowForecast] = useState(true);
  const chartRef = useRef<any>(null);

  const availableAxes = [
    { key: 'voltage', label: 'Voltage (V)', color: '#8884d8', yAxisId: 'left' },
    { key: 'current', label: 'Current (A)', color: '#82ca9d', yAxisId: 'right' },
    { key: 'frequency', label: 'Frequency (Hz)', color: '#ffc658', yAxisId: 'right' },
    { key: 'pv_generation', label: 'PV Generation (kW)', color: '#ff7300', yAxisId: 'left' },
    { key: 'net_load', label: 'Net Load (kW)', color: '#00ff00', yAxisId: 'left' },
    { key: 'battery_discharge', label: 'Battery Discharge (kW)', color: '#0088fe', yAxisId: 'right' },
    { key: 'soc', label: 'SoC (%)', color: '#ff00ff', yAxisId: 'right' },
  ];

  const handleAxisToggle = (key: string) => {
    const newSelected = new Set(selectedAxes);
    if (newSelected.has(key)) {
      newSelected.delete(key);
    } else {
      newSelected.add(key);
    }
    setSelectedAxes(newSelected);
  };

  const handleZoomToEvent = (anomaly: Anomaly) => {
    // Find the index of the anomaly in the data
    const index = data.findIndex(d => d.timestamp === anomaly.timestamp);
    if (index !== -1 && chartRef.current) {
      // Scroll to the anomaly (this would need chart library specific implementation)
      console.log('Zooming to event at index:', index);
      // In a real implementation, you'd use the chart library's zoom/pan API
    }
  };

  const gridColor = theme === 'dark' ? '#4A5568' : '#e2e8f0';
  const textColor = theme === 'dark' ? '#A0AEC0' : '#4A5568';

  return (
    <Card title="Real-time Telemetry" className="relative">
      {/* Controls */}
      <div className="mb-4 space-y-3">
        {/* Multi-axis Selector */}
        <div>
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
            Select Metrics:
          </label>
          <div className="flex flex-wrap gap-2">
            {availableAxes.map((axis) => (
              <button
                key={axis.key}
                onClick={() => handleAxisToggle(axis.key)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  selectedAxes.has(axis.key)
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                {axis.label}
              </button>
            ))}
          </div>
        </div>

        {/* Toggle Options */}
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={showAnomalies}
              onChange={(e) => setShowAnomalies(e.target.checked)}
              className="w-4 h-4 text-blue-600 rounded"
            />
            <span className="text-sm text-gray-700 dark:text-gray-300">Show Anomalies</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={showForecast}
              onChange={(e) => setShowForecast(e.target.checked)}
              className="w-4 h-4 text-blue-600 rounded"
            />
            <span className="text-sm text-gray-700 dark:text-gray-300">Show Forecast</span>
          </label>
        </div>
      </div>

      {/* Chart */}
      <div className="h-96" ref={chartRef}>
        <ResponsiveContainer>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
            <XAxis
              dataKey="timestamp"
              label={{ value: 'Time', position: 'insideBottom', offset: -5 }}
              stroke={textColor}
              tick={{ fill: textColor }}
              tickFormatter={(value) => {
                const date = new Date(value);
                return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
              }}
            />
            <YAxis
              yAxisId="left"
              stroke="#8884d8"
              label={{ value: 'Voltage/Power', angle: -90, position: 'insideLeft', fill: '#8884d8' }}
              tickFormatter={(value) => Number(value).toFixed(2)}
            />
            <YAxis
              yAxisId="right"
              orientation="right"
              stroke="#82ca9d"
              label={{ value: 'Current/Frequency/SoC', angle: -90, position: 'insideRight', fill: '#82ca9d' }}
              tickFormatter={(value) => Number(value).toFixed(2)}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: theme === 'dark' ? '#1A202C' : '#FFFFFF',
                border: `1px solid ${gridColor}`,
              }}
              labelFormatter={(value) => {
                const date = new Date(value);
                return date.toLocaleString();
              }}
            />
            <Legend />

            {/* Main data lines */}
            {selectedAxes.has('voltage') && (
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="voltage"
                stroke="#8884d8"
                dot={false}
                name="Voltage (V)"
              />
            )}
            {selectedAxes.has('current') && (
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="current"
                stroke="#82ca9d"
                dot={false}
                name="Current (A)"
              />
            )}
            {selectedAxes.has('frequency') && (
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="frequency"
                stroke="#ffc658"
                dot={false}
                name="Frequency (Hz)"
              />
            )}
            {selectedAxes.has('pv_generation') && (
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="pv_generation"
                stroke="#ff7300"
                dot={false}
                name="PV Generation (kW)"
              />
            )}
            {selectedAxes.has('net_load') && (
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="net_load"
                stroke="#00ff00"
                dot={false}
                name="Net Load (kW)"
              />
            )}
            {selectedAxes.has('battery_discharge') && (
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="battery_discharge"
                stroke="#0088fe"
                dot={false}
                name="Battery Discharge (kW)"
              />
            )}
            {selectedAxes.has('soc') && (
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="soc"
                stroke="#ff00ff"
                dot={false}
                name="SoC (%)"
              />
            )}

            {/* Forecast lines (dashed) */}
            {showForecast && selectedAxes.has('voltage') && (
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="forecast.voltage"
                stroke="#8884d8"
                strokeDasharray="5 5"
                dot={false}
                name="Voltage Forecast"
              />
            )}
            {showForecast && selectedAxes.has('current') && (
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="forecast.current"
                stroke="#82ca9d"
                strokeDasharray="5 5"
                dot={false}
                name="Current Forecast"
              />
            )}

            {/* Anomaly reference lines */}
            {showAnomalies &&
              anomalies.map((anomaly, index) => (
                <ReferenceLine
                  key={index}
                  x={anomaly.timestamp}
                  stroke={anomaly.severity === 'high' ? '#ef4444' : anomaly.severity === 'medium' ? '#f59e0b' : '#3b82f6'}
                  strokeDasharray="3 3"
                  label={{ value: anomaly.type, position: 'top' }}
                />
              ))}
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Anomalies List */}
      {showAnomalies && anomalies.length > 0 && (
        <div className="mt-4 border-t border-gray-200 dark:border-gray-700 pt-4">
          <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Anomalies Detected</h4>
          <div className="space-y-2 max-h-32 overflow-y-auto">
            {anomalies.map((anomaly, index) => (
              <div
                key={index}
                className={`flex items-center justify-between p-2 rounded-lg ${
                  anomaly.severity === 'high'
                    ? 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'
                    : anomaly.severity === 'medium'
                    ? 'bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800'
                    : 'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800'
                }`}
              >
                <div className="flex items-center gap-2 flex-1">
                  <AlertTriangle
                    className={`w-4 h-4 ${
                      anomaly.severity === 'high'
                        ? 'text-red-600 dark:text-red-400'
                        : anomaly.severity === 'medium'
                        ? 'text-yellow-600 dark:text-yellow-400'
                        : 'text-blue-600 dark:text-blue-400'
                    }`}
                  />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{anomaly.type}</p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">{anomaly.description}</p>
                  </div>
                </div>
                <button
                  onClick={() => handleZoomToEvent(anomaly)}
                  className="p-1.5 hover:bg-white/50 dark:hover:bg-gray-700/50 rounded transition-colors"
                  title="Zoom to event"
                >
                  <ZoomIn className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
};

export default EnhancedTelemetryChart;


import React, { useContext, useEffect, useState } from 'react';
import { AppContext } from '../../contexts/AppContext';
import { fetchTimeseries } from '../../services/api';
import Card from '../ui/Card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import Skeleton from '../ui/Skeleton';

const PowerQualityTrends: React.FC = () => {
  const { selectedSite } = useContext(AppContext)!;
  const [trendData, setTrendData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'6h' | '24h'>('6h');

  useEffect(() => {
    const loadTrendData = async () => {
      if (!selectedSite) return;
      
      setIsLoading(true);
      try {
        const data = await fetchTimeseries(selectedSite.id, `last_${timeRange}`);
        
        // Process data to extract power quality metrics
        const processedData = data.map((point: any) => {
          const voltage = point.metrics?.voltage ?? 415;
          const frequency = point.metrics?.frequency ?? 50.0;
          const thd = point.metrics?.thd ?? 3.0;
          const powerFactor = point.metrics?.power_factor ?? 0.95;
          const voltageUnbalance = point.metrics?.voltage_unbalance ?? 1.5;
          
          // Calculate quality scores
          const voltageDeviation = Math.abs(voltage - 415) / 415 * 100;
          const frequencyDeviation = Math.abs(frequency - 50.0);
          
          const voltageScore = voltageDeviation <= 2 ? 100 : 
                              voltageDeviation <= 3 ? 85 : 
                              voltageDeviation <= 5 ? 70 : 
                              voltageDeviation <= 7 ? 50 : 25;
          
          const frequencyScore = frequencyDeviation <= 0.1 ? 100 : 
                                frequencyDeviation <= 0.2 ? 85 : 
                                frequencyDeviation <= 0.3 ? 70 : 
                                frequencyDeviation <= 0.5 ? 50 : 25;
          
          const thdScore = thd <= 3 ? 100 : 
                          thd <= 5 ? 85 : 
                          thd <= 8 ? 70 : 
                          thd <= 10 ? 50 : 25;
          
          const pfScore = powerFactor >= 0.95 ? 100 : 
                         powerFactor >= 0.90 ? 85 : 
                         powerFactor >= 0.85 ? 70 : 
                         powerFactor >= 0.80 ? 50 : 25;
          
          const unbalanceScore = voltageUnbalance <= 1 ? 100 : 
                                voltageUnbalance <= 2 ? 85 : 
                                voltageUnbalance <= 3 ? 70 : 
                                voltageUnbalance <= 4 ? 50 : 25;
          
          const overallScore = Math.round((voltageScore + frequencyScore + thdScore + pfScore + unbalanceScore) / 5);
          
          return {
            time: new Date(point.timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
            timestamp: point.timestamp,
            voltage,
            frequency,
            thd,
            powerFactor,
            voltageUnbalance,
            qualityIndex: overallScore,
          };
        });
        
        setTrendData(processedData);
      } catch (error) {
        console.error('Failed to load power quality trends:', error);
        setTrendData([]);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadTrendData();
  }, [selectedSite, timeRange]);

  if (isLoading) {
    return (
      <Card title="Power Quality Trends">
        <Skeleton className="h-80 w-full" />
      </Card>
    );
  }

  return (
    <Card title="Power Quality Trends">
      {/* Time Range Selector */}
      <div className="mb-4 flex justify-end">
        <div className="inline-flex rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 p-1">
          <button
            onClick={() => setTimeRange('6h')}
            className={`px-3 py-1 rounded-md text-sm font-medium transition-all ${
              timeRange === '6h'
                ? 'bg-blue-600 text-white'
                : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            6 Hours
          </button>
          <button
            onClick={() => setTimeRange('24h')}
            className={`px-3 py-1 rounded-md text-sm font-medium transition-all ${
              timeRange === '24h'
                ? 'bg-blue-600 text-white'
                : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            24 Hours
          </button>
        </div>
      </div>

      {/* Quality Index Chart */}
      <div className="mb-6">
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Overall Quality Index</h3>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={trendData}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-gray-300 dark:stroke-gray-600" />
            <XAxis 
              dataKey="time" 
              tick={{ fill: 'currentColor', fontSize: 12 }}
              interval="preserveStartEnd"
            />
            <YAxis 
              domain={[0, 100]}
              label={{ value: 'Quality Index', angle: -90, position: 'insideLeft' }}
              tick={{ fill: 'currentColor' }}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'rgba(255, 255, 255, 0.95)', 
                border: '1px solid #ccc',
                borderRadius: '8px'
              }}
              formatter={(value: any) => [`${value}/100`, 'Quality Index']}
            />
            <Line 
              type="monotone" 
              dataKey="qualityIndex" 
              stroke="#8b5cf6" 
              strokeWidth={2}
              dot={false}
              name="Quality Index"
            />
            <Line 
              type="monotone" 
              dataKey="85" 
              stroke="#10b981" 
              strokeWidth={1}
              strokeDasharray="5 5"
              dot={false}
              name="Good Threshold"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Individual Metrics Chart */}
      <div>
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Detailed Metrics</h3>
        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={trendData}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-gray-300 dark:stroke-gray-600" />
            <XAxis 
              dataKey="time" 
              tick={{ fill: 'currentColor', fontSize: 12 }}
              interval="preserveStartEnd"
            />
            <YAxis 
              yAxisId="left"
              label={{ value: 'Voltage (V) / Frequency (Hz)', angle: -90, position: 'insideLeft' }}
              tick={{ fill: 'currentColor' }}
            />
            <YAxis 
              yAxisId="right"
              orientation="right"
              label={{ value: 'THD (%) / PF / Unbalance (%)', angle: 90, position: 'insideRight' }}
              tick={{ fill: 'currentColor' }}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'rgba(255, 255, 255, 0.95)', 
                border: '1px solid #ccc',
                borderRadius: '8px'
              }}
            />
            <Legend />
            <Line yAxisId="left" type="monotone" dataKey="voltage" stroke="#f59e0b" strokeWidth={2} dot={false} name="Voltage (V)" />
            <Line yAxisId="left" type="monotone" dataKey="frequency" stroke="#3b82f6" strokeWidth={2} dot={false} name="Frequency (Hz)" />
            <Line yAxisId="right" type="monotone" dataKey="thd" stroke="#ef4444" strokeWidth={2} dot={false} name="THD (%)" />
            <Line yAxisId="right" type="monotone" dataKey="powerFactor" stroke="#10b981" strokeWidth={2} dot={false} name="Power Factor" />
            <Line yAxisId="right" type="monotone" dataKey="voltageUnbalance" stroke="#8b5cf6" strokeWidth={2} dot={false} name="Voltage Unbalance (%)" />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
};

export default PowerQualityTrends;


import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import { TrendingDown, Zap, DollarSign, Leaf } from 'lucide-react';
import Card from '../components/ui/Card';

const ImpactPage: React.FC = () => {
  const [timeRange, setTimeRange] = useState<'daily' | 'weekly' | 'monthly'>('daily');

  // Power Flow Data - Optimized vs Conventional
  const powerFlowData = [
    {
      component: 'Renewable',
      optimized: 1500,
      conventional: 1200,
    },
    {
      component: 'Battery',
      optimized: -400,
      conventional: 200,
    },
    {
      component: 'Load',
      optimized: 800,
      conventional: 800,
    },
    {
      component: 'Grid',
      optimized: -300,
      conventional: 400,
    },
  ];

  // Energy Consumption Data
  const energyData = [
    {
      component: 'Renewable Energy',
      optimized: 1800,
      conventional: 1400,
    },
    {
      component: 'Battery Energy',
      optimized: -600,
      conventional: 300,
    },
    {
      component: 'Load Energy',
      optimized: 1200,
      conventional: 1200,
    },
    {
      component: 'Grid Energy',
      optimized: -400,
      conventional: 600,
    },
  ];

  // Cost Comparison Data
  const costData = [
    {
      type: 'Optimized',
      cost: 8160,
      savings: 0,
    },
    {
      type: 'Conventional',
      cost: 12220,
      savings: 4060,
    },
  ];

  // Carbon Emissions Data
  const emissionsData = [
    {
      type: 'Optimized',
      emissions: 0.005,
    },
    {
      type: 'Conventional',
      emissions: 0.024,
    },
  ];

  // Calculate savings
  const totalSavings = costData[1].cost - costData[0].cost;
  const emissionReduction = ((emissionsData[1].emissions - emissionsData[0].emissions) / emissionsData[1].emissions * 100).toFixed(1);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-gray-800 p-3 border border-gray-200 dark:border-gray-700 rounded shadow-lg">
          <p className="font-semibold text-gray-900 dark:text-white">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} style={{ color: entry.color }} className="text-sm">
              {entry.name}: {entry.value.toFixed(2)} {entry.dataKey === 'emissions' ? 'Mega kg CO₂' : entry.dataKey.includes('cost') ? '₹' : 'kW'}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Impact Analysis</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Comparative analysis of Optimized vs Conventional Energy Management
          </p>
        </div>
        <div className="flex space-x-2">
          {(['daily', 'weekly', 'monthly'] as const).map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                timeRange === range
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
              }`}
            >
              {range.charAt(0).toUpperCase() + range.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm">Cost Savings</p>
              <p className="text-3xl font-bold mt-1">₹{(totalSavings / 1000).toFixed(1)}K</p>
              <p className="text-green-100 text-xs mt-1">vs Conventional</p>
            </div>
            <DollarSign className="w-12 h-12 text-green-200" />
          </div>
        </Card>

        <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm">Energy Efficiency</p>
              <p className="text-3xl font-bold mt-1">94.2%</p>
              <p className="text-blue-100 text-xs mt-1">+12% improvement</p>
            </div>
            <Zap className="w-12 h-12 text-blue-200" />
          </div>
        </Card>

        <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-sm">CO₂ Reduction</p>
              <p className="text-3xl font-bold mt-1">{emissionReduction}%</p>
              <p className="text-purple-100 text-xs mt-1">Lower emissions</p>
            </div>
            <Leaf className="w-12 h-12 text-purple-200" />
          </div>
        </Card>

        <Card className="bg-gradient-to-br from-orange-500 to-orange-600 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-100 text-sm">Grid Export</p>
              <p className="text-3xl font-bold mt-1">400kW</p>
              <p className="text-orange-100 text-xs mt-1">Revenue generation</p>
            </div>
            <TrendingDown className="w-12 h-12 text-orange-200" />
          </div>
        </Card>
      </div>

      {/* Power Flow Comparison */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Power Flow - Optimized EMS
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={powerFlowData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-gray-300 dark:stroke-gray-600" />
              <XAxis 
                dataKey="component" 
                className="text-xs"
                tick={{ fill: 'currentColor' }}
              />
              <YAxis 
                label={{ value: 'Power (kW)', angle: -90, position: 'insideLeft' }}
                tick={{ fill: 'currentColor' }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Bar dataKey="optimized" name="Optimized" fill="#3b82f6" />
            </BarChart>
          </ResponsiveContainer>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-4">
            <strong>Insight:</strong> Negative values indicate power being sold to grid or charging battery. 
            Optimized flow prioritizes renewable energy and minimizes grid dependency.
          </p>
        </Card>

        <Card>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Power Flow - Conventional EMS
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={powerFlowData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-gray-300 dark:stroke-gray-600" />
              <XAxis 
                dataKey="component" 
                className="text-xs"
                tick={{ fill: 'currentColor' }}
              />
              <YAxis 
                label={{ value: 'Power (kW)', angle: -90, position: 'insideLeft' }}
                tick={{ fill: 'currentColor' }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Bar dataKey="conventional" name="Conventional" fill="#10b981" />
            </BarChart>
          </ResponsiveContainer>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-4">
            <strong>Insight:</strong> Conventional system relies more on grid power and less on battery optimization,
            resulting in higher operational costs.
          </p>
        </Card>
      </div>

      {/* Energy Consumption & Production */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Total Energy - Optimized EMS
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={energyData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-gray-300 dark:stroke-gray-600" />
              <XAxis 
                dataKey="component" 
                className="text-xs"
                tick={{ fill: 'currentColor' }}
                angle={-15}
                textAnchor="end"
                height={80}
              />
              <YAxis 
                label={{ value: 'Energy (kWh)', angle: -90, position: 'insideLeft' }}
                tick={{ fill: 'currentColor' }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Bar dataKey="optimized" name="Optimized" fill="#8b5cf6" />
            </BarChart>
          </ResponsiveContainer>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-4">
            <strong>Insight:</strong> Higher renewable energy utilization and intelligent battery management
            result in net energy export to grid.
          </p>
        </Card>

        <Card>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Total Energy - Conventional EMS
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={energyData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-gray-300 dark:stroke-gray-600" />
              <XAxis 
                dataKey="component" 
                className="text-xs"
                tick={{ fill: 'currentColor' }}
                angle={-15}
                textAnchor="end"
                height={80}
              />
              <YAxis 
                label={{ value: 'Energy (kWh)', angle: -90, position: 'insideLeft' }}
                tick={{ fill: 'currentColor' }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Bar dataKey="conventional" name="Conventional" fill="#f59e0b" />
            </BarChart>
          </ResponsiveContainer>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-4">
            <strong>Insight:</strong> Conventional system imports more energy from grid and underutilizes
            renewable sources, leading to higher costs and emissions.
          </p>
        </Card>
      </div>

      {/* Cost & Emissions Comparison */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Cost Breakdown Comparison
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={costData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-gray-300 dark:stroke-gray-600" />
              <XAxis 
                dataKey="type" 
                tick={{ fill: 'currentColor' }}
              />
              <YAxis 
                label={{ value: 'Cost (₹)', angle: -90, position: 'insideLeft' }}
                tick={{ fill: 'currentColor' }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Bar dataKey="cost" name="Total Cost" fill="#3b82f6">
                {costData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={index === 0 ? '#10b981' : '#ef4444'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <div className="mt-4 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
            <p className="text-sm text-green-800 dark:text-green-400 font-semibold">
              💰 Savings: ₹{(totalSavings / 1000).toFixed(2)}K ({((totalSavings / costData[1].cost) * 100).toFixed(1)}% reduction)
            </p>
            <p className="text-xs text-green-700 dark:text-green-500 mt-1">
              Optimized EMS reduces operational costs through intelligent power routing and peak shaving.
            </p>
          </div>
        </Card>

        <Card>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Carbon Emissions Comparison
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={emissionsData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-gray-300 dark:stroke-gray-600" />
              <XAxis 
                dataKey="type" 
                tick={{ fill: 'currentColor' }}
              />
              <YAxis 
                label={{ value: 'CO₂ (Mega kg)', angle: -90, position: 'insideLeft' }}
                tick={{ fill: 'currentColor' }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Bar dataKey="emissions" name="Emissions" fill="#8b5cf6">
                {emissionsData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={index === 0 ? '#10b981' : '#ef4444'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <div className="mt-4 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
            <p className="text-sm text-green-800 dark:text-green-400 font-semibold">
              🌱 Emission Reduction: {emissionReduction}% lower CO₂
            </p>
            <p className="text-xs text-green-700 dark:text-green-500 mt-1">
              Optimized EMS significantly reduces carbon footprint by maximizing renewable energy usage
              and minimizing grid dependency during peak hours.
            </p>
          </div>
        </Card>
      </div>

      {/* Summary Insights */}
      <Card className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20">
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
          📊 Key Takeaways
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white font-bold">
              1
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 dark:text-white">Cost Efficiency</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Optimized EMS saves ₹{(totalSavings / 1000).toFixed(1)}K per day through intelligent power routing
                and peak demand management.
              </p>
            </div>
          </div>
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0 w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold">
              2
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 dark:text-white">Energy Independence</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Maximizes renewable energy utilization, reducing grid dependency by 66% compared to conventional systems.
              </p>
            </div>
          </div>
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0 w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center text-white font-bold">
              3
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 dark:text-white">Environmental Impact</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Reduces carbon emissions by {emissionReduction}%, contributing to sustainability goals
                and cleaner energy future.
              </p>
            </div>
          </div>
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0 w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center text-white font-bold">
              4
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 dark:text-white">Revenue Generation</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Exports excess power to grid during peak hours, creating additional revenue streams
                from renewable generation.
              </p>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default ImpactPage;


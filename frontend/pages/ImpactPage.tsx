import React, { useState, useContext } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell, PieChart, Pie } from 'recharts';
import { Download, FileText, Sun, Battery, Droplet, Power, Fuel, Home, Info } from 'lucide-react';
import Card from '../components/ui/Card';
import { generateImpactPDF } from '../utils/pdfGenerator';
import { AppContext } from '../contexts/AppContext';

const ImpactPage: React.FC = () => {
  const { selectedSite } = useContext(AppContext)!;
  const [timeRange, setTimeRange] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  const [includeHydrogen, setIncludeHydrogen] = useState(false);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  
  // Calculate time multiplier for scaling data
  const timeMultiplier = timeRange === 'daily' ? 1 : timeRange === 'weekly' ? 7 : 30;
  const timeUnit = timeRange === 'daily' ? '/day' : timeRange === 'weekly' ? '/week' : '/month';

  // System Configuration Components
  const systemComponents = [
    { name: 'Solar PV', icon: Sun, description: 'Harnessing renewable energy from the sun', color: 'from-yellow-500 to-orange-500' },
    { name: 'Battery Storage', icon: Battery, description: 'Storing excess energy for later use', color: 'from-blue-500 to-cyan-500' },
    { name: 'Hydrogen Storage', icon: Droplet, description: 'Long-term energy storage and clean fuel', color: 'from-teal-500 to-green-500' },
    { name: 'The Grid', icon: Power, description: 'Connecting to main power supply for stability', color: 'from-indigo-500 to-purple-500' },
    { name: 'Diesel Generator', icon: Fuel, description: 'Backup power for critical situations', color: 'from-red-500 to-orange-500' },
    { name: 'Load Control', icon: Home, description: 'Meeting energy demands optimally', color: 'from-green-500 to-emerald-500' },
  ];

  // Cost Comparison Data - Three Cases with Demand Response (Dynamic based on timeRange)
  const demandResponseCostData = [
    { case: 'Case 1', label: 'Conventional EMS', cost: 1.75 * timeMultiplier, color: '#10b981' },
    { case: 'Case 2', label: 'With Demand Mgmt', cost: 1.4 * timeMultiplier, savings: 20, color: '#3b82f6' },
    { case: 'Case 3', label: 'Demand + DG Disabled', cost: 1.58 * timeMultiplier, savings: 10, color: '#8b5cf6' },
  ];

  // Load Shifting Cost Data (Dynamic based on timeRange)
  const loadShiftingCostData = [
    { case: 'Case 1', label: 'Conventional EMS', cost: 1.75 * timeMultiplier, color: '#10b981' },
    { case: 'Case 2', label: 'With Demand Mgmt', cost: 1.59 * timeMultiplier, savings: 9, color: '#3b82f6' },
    { case: 'Case 3', label: 'Demand + DG Disabled', cost: 1.75 * timeMultiplier, savings: 0, color: '#8b5cf6' },
  ];

  // Carbon Emission Data - Three Cases (Dynamic based on timeRange)
  const emissionComparisonData = [
    { case: 'Case 1', label: 'Conventional EMS', emissions: 9500 * timeMultiplier, color: '#854d0e' },
    { case: 'Case 2', label: 'With Demand Mgmt', emissions: 8360 * timeMultiplier, savings: 12, color: '#92400e' },
    { case: 'Case 3', label: 'Demand + DG Disabled', emissions: 6840 * timeMultiplier, savings: 28, color: '#a16207' },
  ];

  // Component-Level Cost Breakdown (INR) - Monthly base from PPT, scaled to timeRange
  // Monthly values from PPT: Grid 53468.60, Solar 41325.00, Battery O&M 26822.68, etc.
  const componentCostData = includeHydrogen ? [
    { component: 'Grid Cost', ruleBased: 53468.60 / 30 * timeMultiplier, optimized: 33723.79 / 30 * timeMultiplier, hydrogenOpt: 22646.72 / 30 * timeMultiplier },
    { component: 'Solar Cost', ruleBased: 41325.00 / 30 * timeMultiplier, optimized: 41325.00 / 30 * timeMultiplier, hydrogenOpt: 41325.00 / 30 * timeMultiplier },
    { component: 'Battery O&M', ruleBased: 26822.68 / 30 * timeMultiplier, optimized: 18498.40 / 30 * timeMultiplier, hydrogenOpt: 18498.40 / 30 * timeMultiplier },
    { component: 'Fuel Cell O&M', ruleBased: 0, optimized: 0, hydrogenOpt: 2397.60 / 30 * timeMultiplier },
    { component: 'Electrolyzer O&M', ruleBased: 0, optimized: 0, hydrogenOpt: 869.15 / 30 * timeMultiplier },
  ] : [
    { component: 'Grid Cost', ruleBased: 53468.60 / 30 * timeMultiplier, optimized: 33723.79 / 30 * timeMultiplier },
    { component: 'Solar Cost', ruleBased: 41325.00 / 30 * timeMultiplier, optimized: 41325.00 / 30 * timeMultiplier },
    { component: 'Battery O&M', ruleBased: 26822.68 / 30 * timeMultiplier, optimized: 18498.40 / 30 * timeMultiplier },
    { component: 'Diesel Fuel', ruleBased: 0, optimized: 0 },
  ];

  // Component-Level Emissions (kg CO2) - Monthly base from PPT, scaled to timeRange
  // Monthly values from PPT: Grid 6272.74, Battery 88.16, PV 725.00, etc.
  const componentEmissionsData = [
    { component: 'Grid', ruleBased: 6272.74 / 30 * timeMultiplier, optimized: 5615.74 / 30 * timeMultiplier, difference: -657.0 / 30 * timeMultiplier },
    { component: 'Battery', ruleBased: 88.16 / 30 * timeMultiplier, optimized: 106.16 / 30 * timeMultiplier, difference: 18.0 / 30 * timeMultiplier },
    { component: 'PV', ruleBased: 725.00 / 30 * timeMultiplier, optimized: 725.00 / 30 * timeMultiplier, difference: 0 },
    { component: 'Fuel Cell', ruleBased: 39.96 / 30 * timeMultiplier, optimized: 39.96 / 30 * timeMultiplier, difference: 0 },
    { component: 'Diesel', ruleBased: 0, optimized: 0, difference: 0 },
  ];

  // Total Cost Calculations (Monthly base, scaled to timeRange)
  const totalCostRuleBased = 121616.28 / 30 * timeMultiplier;
  const totalCostOptimized = 93547.19 / 30 * timeMultiplier;
  const totalCostHydrogen = 85736.88 / 30 * timeMultiplier;

  // Cost per kWh (independent of time range)
  const costPerKwhRuleBased = 4.85;
  const costPerKwhOptimized = 3.73;
  const costPerKwhHydrogen = 3.42;

  // Total Emissions (Monthly base, scaled to timeRange)
  const totalEmissionsRuleBased = 7125.86 / 30 * timeMultiplier;
  const totalEmissionsOptimized = 6486.86 / 30 * timeMultiplier;
  const emissionIntensityRuleBased = 0.2839; // Per kWh, time-independent
  const emissionIntensityOptimized = 0.2584; // Per kWh, time-independent

  // Savings Percentages
  const costSavingsVsRuleBased = ((totalCostRuleBased - totalCostOptimized) / totalCostRuleBased * 100);
  const additionalSavingsWithHydrogen = ((totalCostOptimized - totalCostHydrogen) / totalCostOptimized * 100);
  const emissionReduction = ((totalEmissionsRuleBased - totalEmissionsOptimized) / totalEmissionsRuleBased * 100);

  // Calculate current metrics
  const currentCost = includeHydrogen ? totalCostHydrogen : totalCostOptimized;
  const currentCostPerKwh = includeHydrogen ? costPerKwhHydrogen : costPerKwhOptimized;
  const totalSavings = totalCostRuleBased - currentCost;

  const formatNumber = (value: number): string => {
    return value.toLocaleString('en-IN', { maximumFractionDigits: 2 });
  };

  const formatCurrency = (value: number): string => {
    return `₹${formatNumber(value)}`;
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-gray-800 p-3 border border-gray-200 dark:border-gray-700 rounded shadow-lg">
          <p className="font-semibold text-gray-900 dark:text-white">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} style={{ color: entry.color }} className="text-sm">
              {entry.name}: {entry.value.toFixed(2)} {entry.unit || ''}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  // Donut Chart for Savings
  const DonutChart = ({ percentage, label, color = '#10b981' }: { percentage: number; label: string; color?: string }) => {
    const data = [
      { name: 'Savings', value: percentage },
      { name: 'Remaining', value: 100 - percentage },
    ];

    return (
      <div className="flex flex-col items-center">
        <ResponsiveContainer width={200} height={200}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={80}
              startAngle={90}
              endAngle={-270}
              dataKey="value"
            >
              <Cell fill={color} />
              <Cell fill="#e5e7eb" />
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <div className="absolute mt-16">
          <p className="text-3xl font-bold text-gray-900 dark:text-white">{percentage.toFixed(2)}%</p>
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-400 text-center mt-2 max-w-xs">{label}</p>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Impact Analysis</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Comprehensive analysis of cost & carbon reduction through smart energy management
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">Time Range:</span>
            <div className="flex space-x-2">
              {(['daily', 'weekly', 'monthly'] as const).map((range) => (
                <button
                  key={range}
                  onClick={() => setTimeRange(range)}
                  className={`px-4 py-2 rounded-lg font-medium transition-all duration-300 ${
                    timeRange === range
                      ? 'bg-blue-600 text-white shadow-lg scale-105'
                      : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600 hover:scale-105'
                  }`}
                >
                  {range.charAt(0).toUpperCase() + range.slice(1)}
                </button>
              ))}
            </div>
          </div>
      </div>

      {/* System Configuration */}
      <Card>
        <div className="p-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Integrated System Configuration
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Our energy management system integrates several key components for optimal energy flow
          </p>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {systemComponents.map((component) => {
              const Icon = component.icon;
              return (
                <div key={component.name} className="flex flex-col items-center text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className={`w-16 h-16 rounded-full bg-gradient-to-br ${component.color} flex items-center justify-center mb-3`}>
                    <Icon className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="font-semibold text-sm text-gray-900 dark:text-white mb-1">{component.name}</h3>
                  <p className="text-xs text-gray-600 dark:text-gray-400">{component.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </Card>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <div className="p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-400">Cost per kWh</h3>
              <FileText className="w-5 h-5 text-blue-600" />
            </div>
            <p className="text-3xl font-bold text-gray-900 dark:text-white">
              ₹{currentCostPerKwh.toFixed(2)}
            </p>
            <p className="text-sm text-green-600 mt-1">
              ↓ {costSavingsVsRuleBased.toFixed(2)}% vs rule-based
            </p>
          </div>
        </Card>

        <Card>
          <div className="p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-400">Total Savings</h3>
              <Download className="w-5 h-5 text-green-600" />
            </div>
            <p className="text-3xl font-bold text-gray-900 dark:text-white">
              ₹{(totalSavings / 1000).toFixed(2)}K
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {timeRange.charAt(0).toUpperCase() + timeRange.slice(1)} operational savings
            </p>
          </div>
        </Card>

        <Card>
          <div className="p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-400">Emission Reduction</h3>
              <Droplet className="w-5 h-5 text-teal-600" />
            </div>
            <p className="text-3xl font-bold text-gray-900 dark:text-white">
              {emissionReduction.toFixed(2)}%
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              -{(totalEmissionsRuleBased - totalEmissionsOptimized).toFixed(0)} kg CO₂
            </p>
          </div>
        </Card>

        <Card>
          <div className="p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-400">Emission Intensity</h3>
              <Power className="w-5 h-5 text-purple-600" />
            </div>
            <p className="text-3xl font-bold text-gray-900 dark:text-white">
              {emissionIntensityOptimized.toFixed(4)}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              kg CO₂/kWh
            </p>
          </div>
        </Card>
      </div>

      {/* Hydrogen Fuel Cell Toggle */}
      <Card>
        <div className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Hydrogen Fuel Cell Integration
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {includeHydrogen 
                  ? 'Showing optimization with hydrogen fuel cell integration'
                  : 'Toggle to see impact of hydrogen fuel cell integration'}
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={includeHydrogen}
                onChange={(e) => setIncludeHydrogen(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-14 h-7 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:start-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all dark:border-gray-600 peer-checked:bg-teal-600"></div>
            </label>
          </div>

          {includeHydrogen && (
            <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Rule-Based Cost</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">₹{costPerKwhRuleBased}</p>
                <p className="text-xs text-gray-500 mt-1">per kWh</p>
              </div>
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Optimized (Battery Only)</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">₹{costPerKwhOptimized}</p>
                <p className="text-xs text-green-600 mt-1">-{costSavingsVsRuleBased.toFixed(2)}%</p>
              </div>
              <div className="p-4 bg-teal-50 dark:bg-teal-900/20 rounded-lg">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">With Hydrogen Fuel Cell</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">₹{costPerKwhHydrogen}</p>
                <p className="text-xs text-green-600 mt-1">Additional -{additionalSavingsWithHydrogen.toFixed(2)}%</p>
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Cost Reduction Analysis - Three Cases */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                  Cost Reduction: Demand-Side Response
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Optimizing energy consumption during high grid charges
                </p>
              </div>
              <span className="text-xs px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 rounded-full font-semibold">
                {timeRange.charAt(0).toUpperCase() + timeRange.slice(1)} Analysis
              </span>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={demandResponseCostData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="case" tick={{ fill: 'currentColor', fontSize: 12 }} />
                <YAxis 
                  label={{ value: `Cost (Lakh ₹${timeUnit})`, angle: -90, position: 'insideLeft' }}
                  tick={{ fill: 'currentColor' }}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="cost" name="Cost" radius={[8, 8, 0, 0]}>
                  {demandResponseCostData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            <div className="mt-4 flex justify-around text-center">
              {demandResponseCostData.map((item, idx) => (
                <div key={idx}>
                  <p className="text-xs text-gray-500">{item.label}</p>
                  {item.savings !== undefined && (
                    <p className="text-lg font-bold text-green-600">-{item.savings}%</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </Card>

        <Card>
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                  Cost Reduction: Load Shifting
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Distributing energy usage to hours of low charges for savings
                </p>
              </div>
              <span className="text-xs px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 rounded-full font-semibold">
                {timeRange.charAt(0).toUpperCase() + timeRange.slice(1)} Analysis
              </span>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={loadShiftingCostData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="case" tick={{ fill: 'currentColor', fontSize: 12 }} />
                <YAxis 
                  label={{ value: `Cost (Lakh ₹${timeUnit})`, angle: -90, position: 'insideLeft' }}
                  tick={{ fill: 'currentColor' }}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="cost" name="Cost" radius={[8, 8, 0, 0]}>
                  {loadShiftingCostData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            <div className="mt-4 flex justify-around text-center">
              {loadShiftingCostData.map((item, idx) => (
                <div key={idx}>
                  <p className="text-xs text-gray-500">{item.label}</p>
                  {item.savings !== undefined && (
                    <p className="text-lg font-bold text-green-600">-{item.savings}%</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </Card>
      </div>

      {/* Carbon Emission Reduction */}
      <Card>
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                Carbon Emission Reduction
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Decreasing environmental footprint through efficient energy use
              </p>
            </div>
            <span className="text-xs px-3 py-1 bg-teal-100 dark:bg-teal-900/30 text-teal-800 dark:text-teal-300 rounded-full font-semibold">
              {timeRange.charAt(0).toUpperCase() + timeRange.slice(1)} Analysis
            </span>
          </div>
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={emissionComparisonData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="case" tick={{ fill: 'currentColor', fontSize: 12 }} />
              <YAxis 
                label={{ value: `Emission (kg${timeUnit})`, angle: -90, position: 'insideLeft' }}
                tick={{ fill: 'currentColor' }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="emissions" name="Emissions" radius={[8, 8, 0, 0]}>
                {emissionComparisonData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <div className="mt-4 flex justify-around text-center">
            {emissionComparisonData.map((item, idx) => (
              <div key={idx}>
                <p className="text-xs text-gray-500">{item.label}</p>
                {item.savings !== undefined && (
                  <p className="text-lg font-bold text-green-600">-{item.savings}%</p>
                )}
              </div>
            ))}
          </div>
        </div>
      </Card>

      {/* Savings Donut Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <div className="p-6 flex flex-col items-center">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6">
              Cost Savings vs Rule-Based Optimization
            </h3>
            <div className="relative">
              <DonutChart
                percentage={costSavingsVsRuleBased}
                label="Cost reduction compared to rule-based optimization"
                color="#10b981"
              />
            </div>
          </div>
        </Card>

        {includeHydrogen && (
          <Card>
            <div className="p-6 flex flex-col items-center">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6">
                Additional Savings with Hydrogen Fuel Cell
              </h3>
              <div className="relative">
                <DonutChart
                  percentage={additionalSavingsWithHydrogen}
                  label="Additional savings with hydrogen fuel cell integration"
                  color="#14b8a6"
                />
              </div>
            </div>
          </Card>
        )}
      </div>

      {/* Component-Level Cost Breakdown */}
      <Card>
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">
              Component-Level Cost Breakdown
            </h3>
            <span className="text-xs px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 rounded-full font-semibold">
              {timeRange.charAt(0).toUpperCase() + timeRange.slice(1)} Analysis
            </span>
          </div>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={componentCostData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis type="number" tick={{ fill: 'currentColor' }} label={{ value: `Cost (INR${timeUnit})`, position: 'insideBottom', offset: -5 }} />
              <YAxis type="category" dataKey="component" tick={{ fill: 'currentColor', fontSize: 11 }} width={100} />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Bar dataKey="ruleBased" name="Rule-Based" fill="#ef4444" radius={[0, 4, 4, 0]} />
              <Bar dataKey="optimized" name="Optimized" fill="#3b82f6" radius={[0, 4, 4, 0]} />
              {includeHydrogen && <Bar dataKey="hydrogenOpt" name="With Hydrogen" fill="#14b8a6" radius={[0, 4, 4, 0]} />}
            </BarChart>
          </ResponsiveContainer>
          <div className="mt-6 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
            <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Summary</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <p className="text-gray-600 dark:text-gray-400">Rule-Based Total</p>
                <p className="text-lg font-bold text-gray-900 dark:text-white">₹{formatNumber(totalCostRuleBased)}</p>
              </div>
              <div>
                <p className="text-gray-600 dark:text-gray-400">Optimized Total</p>
                <p className="text-lg font-bold text-gray-900 dark:text-white">₹{formatNumber(totalCostOptimized)}</p>
              </div>
              {includeHydrogen && (
                <div>
                  <p className="text-gray-600 dark:text-gray-400">With Hydrogen</p>
                  <p className="text-lg font-bold text-gray-900 dark:text-white">₹{formatNumber(totalCostHydrogen)}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </Card>

      {/* Component-Level Emissions Breakdown */}
      <Card>
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">
              Component-Level CO₂ Emissions Comparison
            </h3>
            <span className="text-xs px-3 py-1 bg-teal-100 dark:bg-teal-900/30 text-teal-800 dark:text-teal-300 rounded-full font-semibold">
              {timeRange.charAt(0).toUpperCase() + timeRange.slice(1)} Analysis
            </span>
          </div>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={componentEmissionsData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="component" tick={{ fill: 'currentColor' }} />
              <YAxis 
                label={{ value: `Emissions (kg CO₂${timeUnit})`, angle: -90, position: 'insideLeft' }}
                tick={{ fill: 'currentColor' }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Bar dataKey="ruleBased" name="Rule-Based" fill="#dc2626" radius={[8, 8, 0, 0]} />
              <Bar dataKey="optimized" name="CO₂ Optimized" fill="#10b981" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
          <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <h4 className="font-semibold text-gray-900 dark:text-white mb-3">Key Findings</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-700 dark:text-gray-300">
                  <strong>Grid Emissions:</strong> Reduced by 657 kg CO₂ through optimized grid usage
                </p>
              </div>
              <div>
                <p className="text-gray-700 dark:text-gray-300">
                  <strong>Total Reduction:</strong> 9.87% lower overall emissions ({(totalEmissionsRuleBased - totalEmissionsOptimized).toFixed(0)} kg CO₂)
                </p>
              </div>
              <div>
                <p className="text-gray-700 dark:text-gray-300">
                  <strong>Emission Intensity:</strong> {emissionIntensityOptimized.toFixed(4)} kg/kWh (from {emissionIntensityRuleBased.toFixed(4)})
                </p>
              </div>
              <div>
                <p className="text-gray-700 dark:text-gray-300">
                  <strong>Cost Impact:</strong> Less than 0.3% difference, proving viability of sustainable management
                </p>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* PHES vs BESS Comparison */}
      <Card>
        <div className="p-6">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
            Storage Technology Comparison: PHES vs BESS
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
            Comparative analysis of Pumped Hydro Energy Storage (PHES) and Battery Energy Storage Systems (BESS) for long-term project viability
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-bold text-gray-900 dark:text-white">PHES Cost</h4>
                <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">3.83</span>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">INR/kWh</p>
              <p className="text-xs text-gray-500 dark:text-gray-500">Achieved at 3.83 INR/kWh during the simulated month of operation</p>
            </div>
            <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-bold text-gray-900 dark:text-white">BESS Cost</h4>
                <span className="text-2xl font-bold text-purple-600 dark:text-purple-400">4.31</span>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">INR/kWh</p>
              <p className="text-xs text-gray-500 dark:text-gray-500">Computed at 4.31 INR/kWh, indicating higher operational expenses</p>
            </div>
          </div>
          <div className="mt-6 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-bold text-gray-900 dark:text-white mb-1">Cost Reduction</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">PHES demonstrated a 12.53% lower operational cost compared to BESS</p>
              </div>
              <span className="text-3xl font-bold text-green-600 dark:text-green-400">12.53%</span>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-500 mt-3">
              Storage selection should prioritize techno-economic factors over mere efficiency figures for long-term success. BESS offers superior efficiency but carries a higher operational cost.
            </p>
          </div>
        </div>
      </Card>

      {/* Key Insights */}
      <Card>
        <div className="p-6">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
            Key Insights & Objectives
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex flex-col items-center text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <div className="w-12 h-12 bg-green-600 rounded-full flex items-center justify-center mb-3">
                <FileText className="w-6 h-6 text-white" />
              </div>
              <h4 className="font-bold text-gray-900 dark:text-white mb-2">Minimize Cost</h4>
              <p className="text-sm text-gray-700 dark:text-gray-300">
                Optimization algorithm prioritizes reducing operational expenses through intelligent resource allocation and demand-side management
              </p>
            </div>
            <div className="flex flex-col items-center text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center mb-3">
                <Droplet className="w-6 h-6 text-white" />
              </div>
              <h4 className="font-bold text-gray-900 dark:text-white mb-2">Minimize Emissions</h4>
              <p className="text-sm text-gray-700 dark:text-gray-300">
                Decrease environmental impact by optimizing renewable energy sources and reducing reliance on fossil fuels
              </p>
            </div>
            <div className="flex flex-col items-center text-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
              <div className="w-12 h-12 bg-purple-600 rounded-full flex items-center justify-center mb-3">
                <Power className="w-6 h-6 text-white" />
              </div>
              <h4 className="font-bold text-gray-900 dark:text-white mb-2">Improve Performance</h4>
              <p className="text-sm text-gray-700 dark:text-gray-300">
                Enhance grid stability and ensure continuous power supply, even during peak demand or system disturbances
              </p>
            </div>
          </div>
        </div>
      </Card>

      {/* Conclusion */}
      <Card>
        <div className="p-6 bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
            Overall Conclusion
          </h3>
          <div className="space-y-3 text-gray-700 dark:text-gray-300">
            <p>
              ✅ The optimized approach achieves <strong>significant emission reductions</strong> with virtually no cost penalty (less than 0.3% difference), proving the viability of sustainable energy management at scale.
            </p>
            <p>
              ✅ <strong>Hydrogen fuel cell integration</strong> provides an additional {additionalSavingsWithHydrogen.toFixed(2)}% cost savings, demonstrating superior economic performance for long-term energy storage.
            </p>
            <p>
              ✅ Strategic load management and demand-side response can achieve up to <strong>28% carbon emission reduction</strong> while maintaining operational efficiency.
            </p>
            <p>
              ✅ The optimized system reduces cost per kWh from ₹{costPerKwhRuleBased} to ₹{currentCostPerKwh.toFixed(2)}, a <strong>{costSavingsVsRuleBased.toFixed(2)}% improvement</strong> over conventional systems.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default ImpactPage;

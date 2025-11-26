import React, { useState, useEffect, useContext } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell, LineChart, Line } from 'recharts';
import { TrendingDown, Zap, DollarSign, Leaf, Download, FileText } from 'lucide-react';
import Card from '../components/ui/Card';
import ImpactKPIStrip from '../components/shared/ImpactKPIStrip';
import ComparisonToggle from '../components/shared/ComparisonToggle';
import EnrichedInsights from '../components/shared/EnrichedInsights';
import { generateImpactPDF } from '../utils/pdfGenerator';
import { AppContext } from '../contexts/AppContext';

type ComparisonMode = 'conventional' | 'historical' | 'worst-case';

const ImpactPage: React.FC = () => {
  const { selectedSite } = useContext(AppContext)!;
  const [timeRange, setTimeRange] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  const [comparisonMode, setComparisonMode] = useState<ComparisonMode>('conventional');
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

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

  // Calculate KPIs
  const kpis = {
    netDailySavings: totalSavings,
    batteryLifeImpact: 2.3, // percentage per day
    renewableUtilization: 87.5, // percentage
    carbonAvoided: parseFloat(emissionReduction) * 0.5, // kg CO2 (simplified calculation)
  };

  // Get comparison data based on mode
  const getComparisonData = () => {
    switch (comparisonMode) {
      case 'conventional':
        return {
          label: 'Conventional EMS',
          color: '#ef4444',
          data: powerFlowData,
          dataKey: 'conventional',
        };
      case 'historical':
        return {
          label: 'Historical Average',
          color: '#f59e0b',
          data: powerFlowData.map(d => ({ ...d, historical: d.optimized * 0.85 })), // 15% worse
          dataKey: 'historical',
        };
      case 'worst-case':
        return {
          label: 'Worst-case Scenario',
          color: '#dc2626',
          data: powerFlowData.map(d => ({ ...d, worstCase: d.optimized * 0.7 })), // 30% worse
          dataKey: 'worstCase',
        };
    }
  };

  const comparisonData = getComparisonData();

  // Enriched insights
  const enrichedInsights = [
    {
      id: '1',
      category: 'battery' as const,
      title: 'Battery Utilization Strategy',
      description: 'Battery utilization reduced grid dependency by 43%, mainly during 13:00–16:00 when PV was 80–90% of nameplate. Intelligent discharge during peak tariff hours (₹8.5/kWh) saved ₹1,250 over 4-hour window.',
      metrics: [
        { label: 'Grid Reduction', value: '43%' },
        { label: 'Peak Window', value: '13:00-16:00' },
        { label: 'PV Utilization', value: '80-90%' },
        { label: 'Savings', value: '₹1,250' },
      ],
      timeWindow: '13:00-16:00',
    },
    {
      id: '2',
      category: 'cost' as const,
      title: 'Conventional EMS Cost Penalty',
      description: 'Conventional EMS under-charges battery during low-price periods (₹4.2/kWh, 02:00-06:00) → observed 22% cost penalty. Optimized system pre-charges battery during off-peak, reducing peak-hour grid draw by 180 kW.',
      metrics: [
        { label: 'Cost Penalty', value: '22%' },
        { label: 'Low Price Window', value: '02:00-06:00' },
        { label: 'Peak Reduction', value: '180 kW' },
        { label: 'Tariff', value: '₹4.2/kWh' },
      ],
      timeWindow: '02:00-06:00',
    },
    {
      id: '3',
      category: 'renewable' as const,
      title: 'Renewable Energy Maximization',
      description: 'Optimized EMS achieved 87.5% renewable utilization vs 65% conventional. Key strategy: curtailment avoidance during midday peak (12:00-14:00) by routing excess PV to battery instead of grid export.',
      metrics: [
        { label: 'Optimized', value: '87.5%' },
        { label: 'Conventional', value: '65%' },
        { label: 'Improvement', value: '+22.5%' },
        { label: 'Peak Window', value: '12:00-14:00' },
      ],
      timeWindow: '12:00-14:00',
    },
    {
      id: '4',
      category: 'grid' as const,
      title: 'Grid Stability Contribution',
      description: 'Reduced peak grid import by 320 kW during evening peak (18:00-20:00), contributing to grid stability. Battery discharge strategy aligned with demand response signals, avoiding ₹2.5/kWh peak surcharge.',
      metrics: [
        { label: 'Peak Reduction', value: '320 kW' },
        { label: 'Peak Window', value: '18:00-20:00' },
        { label: 'Surcharge Avoided', value: '₹2.5/kWh' },
        { label: 'Grid Support', value: 'Active' },
      ],
      timeWindow: '18:00-20:00',
    },
  ];

  const handleDownloadPDF = async () => {
    setIsGeneratingPDF(true);
    try {
      await generateImpactPDF({
        title: 'Impact Analysis Report',
        siteName: selectedSite?.name || 'Site',
        dateRange: timeRange === 'daily' ? 'Today' : timeRange === 'weekly' ? 'Last 7 Days' : 'Last 30 Days',
        kpis,
        comparisonMode: comparisonData.label,
        insights: enrichedInsights.map(i => ({
          title: i.title,
          description: i.description,
        })),
      });
    } catch (error) {
      console.error('Failed to generate PDF:', error);
      alert('Failed to generate PDF. Please try again.');
    } finally {
      setIsGeneratingPDF(false);
    }
  };

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
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Impact Analysis</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Comparative analysis of Optimized vs {comparisonData.label} Energy Management
          </p>
        </div>
        <div className="flex items-center gap-3">
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
          <button
            onClick={handleDownloadPDF}
            disabled={isGeneratingPDF}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-lg font-medium transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isGeneratingPDF ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Generating...</span>
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                <FileText className="w-4 h-4" />
                <span>Download PDF Report</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* KPI Strip */}
      <ImpactKPIStrip
        netDailySavings={kpis.netDailySavings}
        batteryLifeImpact={kpis.batteryLifeImpact}
        renewableUtilization={kpis.renewableUtilization}
        carbonAvoided={kpis.carbonAvoided}
      />

      {/* Comparison Toggle */}
      <ComparisonToggle mode={comparisonMode} onChange={setComparisonMode} />

      {/* Power Flow Comparison - Side by Side */}
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
        </Card>

        <Card>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Power Flow - {comparisonData.label}
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={comparisonData.data}>
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
              <Bar dataKey={comparisonData.dataKey} name={comparisonData.label} fill={comparisonData.color} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Comparison Chart - Overlay */}
      <Card>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Direct Comparison: Optimized vs {comparisonData.label}
        </h3>
        <ResponsiveContainer width="100%" height={350}>
          <BarChart data={powerFlowData}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-gray-300 dark:stroke-gray-600" />
            <XAxis 
              dataKey="component" 
              tick={{ fill: 'currentColor' }}
            />
            <YAxis 
              label={{ value: 'Power (kW)', angle: -90, position: 'insideLeft' }}
              tick={{ fill: 'currentColor' }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Bar dataKey="optimized" name="Optimized" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            <Bar dataKey={comparisonData.dataKey} 
                 name={comparisonData.label} 
                 fill={comparisonData.color} 
                 radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </Card>

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
        </Card>

        <Card>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Total Energy - {comparisonData.label}
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={comparisonMode === 'conventional' ? energyData : energyData.map(d => ({
              ...d,
              [comparisonData.dataKey]: d.optimized * (comparisonMode === 'historical' ? 0.85 : 0.7),
            }))}>
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
              <Bar dataKey={comparisonMode === 'conventional' ? 'conventional' : comparisonData.dataKey} 
                   name={comparisonData.label} 
                   fill={comparisonData.color} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Energy Comparison - Overlay */}
      <Card>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Energy Comparison: Optimized vs {comparisonData.label}
        </h3>
        <ResponsiveContainer width="100%" height={350}>
          <BarChart data={comparisonMode === 'conventional' ? energyData : energyData.map(d => ({
            ...d,
            [comparisonData.dataKey]: d.optimized * (comparisonMode === 'historical' ? 0.85 : 0.7),
          }))}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-gray-300 dark:stroke-gray-600" />
            <XAxis 
              dataKey="component" 
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
            <Bar dataKey="optimized" name="Optimized" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
            <Bar dataKey={comparisonMode === 'conventional' ? 'conventional' : comparisonData.dataKey} 
                 name={comparisonData.label} 
                 fill={comparisonData.color} 
                 radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </Card>

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

      {/* Enriched Insights */}
      <EnrichedInsights insights={enrichedInsights} />
    </div>
  );
};

export default ImpactPage;


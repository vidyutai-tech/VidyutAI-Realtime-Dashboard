import React, { useState, useEffect, useContext } from 'react';
import { Sun, Zap, BatteryCharging, Shield, Check, X, Bot, Server, Activity, DollarSign, Info } from 'lucide-react';
import PowerQualityCard from '../components/shared/PowerQualityCard';
import PowerQualityTrends from '../components/shared/PowerQualityTrends';
import Card from '../components/ui/Card';
import Skeleton from '../components/ui/Skeleton';
import { acceptRLSuggestion, rejectRLSuggestion } from '../services/api';
import { AppContext } from '../contexts/AppContext';
import EnergyFlowDiagram from '../components/shared/EnergyFlowDiagram';
import { formatCurrency } from '../utils/currency';
import DiagnosticAssistant from '../components/shared/DiagnosticAssistant';
import RLTuningCard from '../components/shared/RLTuningCard';
import { RLSuggestion } from '../types';
import RLSuggestionsCard from '@/components/shared/RLSuggestionsCard';
import WeatherCard from '@/components/shared/WeatherCard';
import SituationSummaryStrip from '../components/shared/SituationSummaryStrip';
import ExplainableSuggestion from '../components/shared/ExplainableSuggestion';
import ControlActionTimeline from '../components/shared/ControlActionTimeline';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const SummaryCard: React.FC<{ title: string; value: string | number; unit: string; icon: React.ReactNode; isLoading: boolean }> = ({ title, value, unit, icon, isLoading }) => (
  <Card className="flex flex-col">
    {isLoading ? (
      <>
        <Skeleton className="h-8 w-3/4 mb-2" />
        <Skeleton className="h-12 w-1/2" />
      </>
    ) : (
      <>
        <div className="flex items-center justify-between text-gray-500 dark:text-gray-400">
          <span className="text-sm font-medium">{title}</span>
          {icon}
        </div>
        <div className="mt-2">
          <span className="text-3xl font-bold text-gray-900 dark:text-white">{value}</span>
          <span className="ml-2 text-lg text-gray-600 dark:text-gray-300">{unit}</span>
        </div>
      </>
    )}
  </Card>
);

const HealthBar: React.FC<{ label: string; value: number; icon: React.ReactNode }> = ({ label, value, icon }) => {
  let barColor = 'bg-green-500';
  if (value < 90) barColor = 'bg-yellow-500';
  if (value < 75) barColor = 'bg-red-500';

  return (
    <li className="flex items-center space-x-4">
      <div className="text-blue-500">{icon}</div>
      <div className="flex-1">
        <div className="flex justify-between text-sm mb-1">
          <span className="font-medium text-gray-700 dark:text-gray-300">{label}</span>
          <span className="font-semibold text-gray-800 dark:text-gray-200">{value.toFixed(2)}%</span>
        </div>
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
          <div className={`${barColor} h-2 rounded-full`} style={{ width: `${value}%` }}></div>
        </div>
      </div>
    </li>
  );
};


const DashboardPage: React.FC = () => {
  // UPDATED: Use the 'suggestions' array and its setter from context
  const { healthStatus, latestTelemetry, suggestions, setSuggestions, currency, selectedSite } = useContext(AppContext)!;
  const isLoading = healthStatus === null;
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [isAssistantOpen, setAssistantOpen] = useState(false);
  const [showExplainable, setShowExplainable] = useState(false);
  
  // Calculate situation summary data
  const situationData = {
    gridCondition: (() => {
      const gridDraw = healthStatus?.grid_draw || 0;
      if (gridDraw < 50) return 'stable' as const;
      if (gridDraw < 150) return 'weak' as const;
      return 'outage_likely' as const;
    })(),
    forecastedPeak: {
      time: '14:00-16:00',
      value: 420,
      unit: 'kW',
    },
    batteryLifeImpact: (() => {
      // Calculate based on battery usage
      const soc = healthStatus?.battery_soc || latestTelemetry?.metrics.soc_batt || 0;
      const discharge = latestTelemetry?.metrics.battery_discharge || 0;
      return Math.min(15, (discharge / 100) * 2 + (100 - soc) * 0.1);
    })(),
    marketPriceSignal: {
      current: 8.5,
      trend: 'up' as const,
      unit: 'kWh',
    },
  };

  // Find the latest suggestion that is still 'pending'
  const latestSuggestion = suggestions.find(s => s.status === 'pending');

  // This logic for calculating live flows is great
  const liveFlows = {
    grid_to_load: healthStatus?.grid_draw ?? 0,
    pv_to_load: Math.max(0, Math.min(latestTelemetry?.metrics.pv_generation ?? 0, latestTelemetry?.metrics.net_load ?? 0)),
    pv_to_battery: Math.max(0, (latestTelemetry?.metrics.pv_generation ?? 0) - (latestTelemetry?.metrics.net_load ?? 0)),
    battery_to_load: latestTelemetry?.metrics.battery_discharge ?? 0,
    battery_to_grid: 0,
    pv_to_grid: 0,
  };

  const handleAction = async (suggestion: RLSuggestion, action: 'accept' | 'reject') => {
    if (!selectedSite) return;
    setIsActionLoading(true);

    // Optimistic UI update: remove the suggestion from the list immediately
    setSuggestions(prev => prev.filter(s => s.id !== suggestion.id));

    try {
      if (action === 'accept') {
        await acceptRLSuggestion(selectedSite.id, suggestion.id);
      } else {
        await rejectRLSuggestion(selectedSite.id, suggestion.id);
      }
    } catch (err) {
      console.error(`Failed to ${action} suggestion.`);
      // If the API call fails, add the suggestion back to the list to show the error
      setSuggestions(prev => [suggestion, ...prev]);
    } finally {
      setIsActionLoading(false);
    }
  };

 return (
    <>
      <div className="space-y-6">
        {/* Situation Summary Strip */}
        {!isLoading && (
          <SituationSummaryStrip
            gridCondition={situationData.gridCondition}
            forecastedPeak={situationData.forecastedPeak}
            batteryLifeImpact={situationData.batteryLifeImpact}
            marketPriceSignal={situationData.marketPriceSignal}
          />
        )}

        {/* Row 1: KPIs */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <SummaryCard title="Site Health" value={healthStatus?.site_health?.toFixed(2) ?? 0} unit="%" icon={<Shield className="w-6 h-6 text-green-500" />} isLoading={isLoading} />
          <SummaryCard 
            title="Power Quality" 
            value={(() => {
              // Calculate power quality index from telemetry
              const voltage = latestTelemetry?.metrics?.voltage ?? 415;
              const frequency = latestTelemetry?.metrics?.frequency ?? 50.0;
              const thd = latestTelemetry?.metrics?.thd ?? 3.0;
              const voltageDeviation = Math.abs(voltage - 415) / 415 * 100;
              const frequencyDeviation = Math.abs(frequency - 50.0);
              const powerFactor = latestTelemetry?.metrics?.power_factor ?? 0.95;
              const voltageUnbalance = latestTelemetry?.metrics?.voltage_unbalance ?? 1.5;
              const voltageScore = voltageDeviation <= 2 ? 100 : voltageDeviation <= 5 ? 70 : voltageDeviation <= 7 ? 50 : 25;
              const frequencyScore = frequencyDeviation <= 0.2 ? 100 : frequencyDeviation <= 0.3 ? 70 : frequencyDeviation <= 0.5 ? 50 : 25;
              const thdScore = thd <= 5 ? 100 : thd <= 8 ? 70 : thd <= 10 ? 50 : 25;
              const pfScore = powerFactor >= 0.95 ? 100 : powerFactor >= 0.90 ? 85 : powerFactor >= 0.85 ? 70 : powerFactor >= 0.80 ? 50 : 25;
              const unbalanceScore = voltageUnbalance <= 1 ? 100 : voltageUnbalance <= 2 ? 85 : voltageUnbalance <= 3 ? 70 : voltageUnbalance <= 4 ? 50 : 25;
              return Math.round((voltageScore + frequencyScore + thdScore + pfScore + unbalanceScore) / 5);
            })()} 
            unit="/100" 
            icon={<Activity className="w-6 h-6 text-purple-500" />} 
            isLoading={isLoading} 
          />
          <SummaryCard title="Battery SoC" value={healthStatus?.battery_soc?.toFixed(2) ?? 0} unit="%" icon={<BatteryCharging className="w-6 h-6 text-blue-500" />} isLoading={isLoading} />
          <SummaryCard title="Today's PV Gen" value={healthStatus?.pv_generation_today?.toFixed(2) ?? 0} unit="kWh" icon={<Sun className="w-6 h-6 text-orange-400" />} isLoading={isLoading} />
        </div>

        {/* Row 2: Power Quality Monitoring */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <PowerQualityCard />
          <PowerQualityTrends />
        </div>

        {/* Row 3: RL Suggestions & Analysis */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          
          {/* Left Column (Spans 2/3 of the width) */}
          <div className="lg:col-span-2 space-y-6">
            {/* Enhanced RL Suggestions with Explainability */}
            <div className="relative">
              <RLSuggestionsCard />
              {latestSuggestion && (
                <div className="absolute top-4 right-4">
                  <button
                    onClick={() => setShowExplainable(true)}
                    className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 dark:bg-blue-900/30 hover:bg-blue-100 dark:hover:bg-blue-900/50 text-blue-700 dark:text-blue-300 rounded-lg text-sm font-medium transition-colors border border-blue-200 dark:border-blue-800"
                  >
                    <Info className="w-4 h-4" />
                    Why this action?
                  </button>
                </div>
              )}
            </div>
            
            {/* Cost Analysis */}
            <Card title="Daily Cost Analysis">
              <ResponsiveContainer width="100%" height={280}>
                <BarChart 
                  data={[
                    { hour: '00:00', cost: 120, savings: 45 },
                    { hour: '06:00', cost: 85, savings: 60 },
                    { hour: '12:00', cost: 45, savings: 95 },
                    { hour: '18:00', cost: 150, savings: 30 },
                    { hour: '23:00', cost: 110, savings: 50 },
                  ]}
                >
                  <CartesianGrid strokeDasharray="3 3" className="stroke-gray-300 dark:stroke-gray-600" />
                  <XAxis 
                    dataKey="hour" 
                    label={{ value: 'Hour', position: 'insideBottom', offset: -5 }}
                    tick={{ fill: 'currentColor' }} 
                  />
                  <YAxis 
                    label={{ value: 'Cost (₹)', angle: -90, position: 'insideLeft' }} 
                    tick={{ fill: 'currentColor' }}
                    tickFormatter={(value) => Number(value).toFixed(2)}
                  />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="cost" name="Actual Cost" fill="#ef4444" />
                  <Bar dataKey="savings" name="Savings vs Conv." fill="#10b981" />
                </BarChart>
              </ResponsiveContainer>
              <div className="mt-4 p-3 bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 rounded-lg">
                <p className="text-sm font-semibold text-gray-900 dark:text-white">
                  Total Daily Savings: ₹4,060 (33.2% reduction vs conventional EMS)
                </p>
              </div>
            </Card>
          </div>

          {/* Right Column (Spans 1/3 of the width) */}
          <div className="space-y-6">
            <Card title="Subsystem Health Status">
              {isLoading ? (
                <div className="space-y-6 p-2">
                  {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
                </div>
              ) : (
                <ul className="space-y-6">
                  <HealthBar label="PV System" value={healthStatus?.pv_health ?? 0} icon={<Sun className="w-6 h-6" />} />
                  <HealthBar label="Battery SOH" value={healthStatus?.battery_soh ?? 0} icon={<BatteryCharging className="w-6 h-6" />} />
                  <HealthBar label="Inverter" value={healthStatus?.inverter_health ?? 0} icon={<Server className="w-6 h-6" />} />
                  <HealthBar label="EV Charger" value={healthStatus?.ev_charger_health ?? 0} icon={<Zap className="w-6 h-6" />} />
                </ul>
              )}
            </Card>
            <RLTuningCard />
          </div>

        </div>

        {/* Control Action Timeline */}
        <ControlActionTimeline />
      </div>

      {/* Explainable Suggestion Modal */}
      {showExplainable && latestSuggestion && (
        <ExplainableSuggestion
          suggestion={latestSuggestion}
          onClose={() => setShowExplainable(false)}
        />
      )}

      {/* Floating Action Button and Modal (This part is correct) */}
      <div className="fixed bottom-6 right-6 z-40">
        <button
          onClick={() => setAssistantOpen(true)}
          className="flex items-center justify-center w-14 h-14 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 transition-transform transform hover:scale-110"
          aria-label="Open AI Diagnostic Assistant"
        >
          <Bot className="w-7 h-7" />
        </button>
      </div>
      <DiagnosticAssistant isOpen={isAssistantOpen} onClose={() => setAssistantOpen(false)} />
    </>
  );
};

export default DashboardPage;
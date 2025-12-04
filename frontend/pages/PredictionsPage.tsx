import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Battery, Zap, AlertTriangle, Loader, TrendingDown, Activity } from 'lucide-react';
import Card from '../components/ui/Card';
import ActionableInsights from '../components/shared/ActionableInsights';
import { getBatteryRULDashboard, getSolarDegradationDashboard, getEnergyLossDashboard } from '../services/api';
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

type PredictionType = 'battery' | 'solar' | 'loss';

const PredictionsPage: React.FC = () => {
  const navigate = useNavigate();
  const [selectedType, setSelectedType] = useState<PredictionType>('battery');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  
  // Prediction horizon controls
  const [batteryCycles, setBatteryCycles] = useState(50); // Number of samples
  const [solarYears, setSolarYears] = useState(26); // 0-25 years
  const [lossLoadPoints, setLossLoadPoints] = useState(30); // Number of load points
  
  // Data states
  const [batteryData, setBatteryData] = useState<any>(null);
  const [solarData, setSolarData] = useState<any>(null);
  const [lossData, setLossData] = useState<any>(null);

  // Load data on mount
  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    setLoading(true);
    setError('');
    
    try {
      const [battery, solar, loss] = await Promise.all([
        getBatteryRULDashboard().catch(e => ({ error: e.message })),
        getSolarDegradationDashboard().catch(e => ({ error: e.message })),
        getEnergyLossDashboard().catch(e => ({ error: e.message }))
      ]);
      
      if (!battery.error) setBatteryData(battery);
      if (!solar.error) setSolarData(solar);
      if (!loss.error) setLossData(loss);
      
      if (battery.error && solar.error && loss.error) {
        setError('Failed to load prediction models. Please ensure models are trained.');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load predictions');
    } finally {
      setLoading(false);
    }
  };

  const formatNumber = (num: number, decimals = 2) => {
    return num.toLocaleString('en-IN', { maximumFractionDigits: decimals });
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-gray-800 p-3 border border-gray-200 dark:border-gray-700 rounded shadow-lg">
          <p className="font-semibold text-gray-900 dark:text-white">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} style={{ color: entry.color }} className="text-sm">
              {entry.name}: {formatNumber(entry.value)}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  const PredictionCard = ({
    type,
    icon: Icon,
    title,
    description,
    color,
    available
  }: {
    type: PredictionType;
    icon: React.ElementType;
    title: string;
    description: string;
    color: string;
    available: boolean;
  }) => (
    <Card 
      className={`cursor-pointer transition-all duration-300 ${
        selectedType === type 
          ? `border-2 ${color} shadow-lg` 
          : 'border-2 border-gray-200 dark:border-gray-700 hover:shadow-md'
      } ${!available ? 'opacity-50' : ''}`}
      onClick={() => available && setSelectedType(type)}
    >
      <div className="p-6">
        <div className="flex items-center space-x-4">
          <div className={`p-4 rounded-lg ${color.replace('border-', 'bg-').replace('600', '100')} dark:${color.replace('border-', 'bg-').replace('600', '900/30')}`}>
            <Icon className={`w-8 h-8 ${color.replace('border-', 'text-')}`} />
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-1">
              {title}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {description}
            </p>
          </div>
          {selectedType === type && (
            <div className="flex items-center justify-center w-8 h-8 bg-blue-600 text-white rounded-full">
              <Activity className="w-5 h-5" />
            </div>
          )}
        </div>
      </div>
    </Card>
  );

  return (
    <div className="min-h-full bg-gradient-to-br from-purple-50 via-white to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 -m-4 md:-m-6 lg:-m-8 p-4 md:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => navigate('/ai-ml-insights')}
            className="flex items-center text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-4"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back to AI/ML Insights
          </button>
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
            AI Predictions
          </h1>
          <p className="text-gray-600 dark:text-gray-400 text-lg">
            Advanced ML models for predictive analytics and diagnostics
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-red-800 dark:text-red-300">{error}</p>
          </div>
        )}

        {loading && (
          <div className="flex justify-center items-center py-12">
            <Loader className="w-12 h-12 animate-spin text-blue-600" />
          </div>
        )}

        {!loading && (
          <>
            {/* Model Selection Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              <PredictionCard
                type="battery"
                icon={Battery}
                title="Battery RUL"
                description="Remaining Useful Life prediction"
                color="border-blue-600"
                available={!!batteryData}
              />
              <PredictionCard
                type="solar"
                icon={Zap}
                title="Solar Degradation"
                description="Panel performance over time"
                color="border-amber-600"
                available={!!solarData}
              />
              <PredictionCard
                type="loss"
                icon={AlertTriangle}
                title="Energy Loss"
                description="Distribution system losses"
                color="border-red-600"
                available={!!lossData}
              />
            </div>

            {/* Battery RUL Visualization */}
            {selectedType === 'battery' && batteryData && (
              <div className="space-y-6">
                <Card>
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex-1">
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                          Battery Remaining Useful Life Prediction
                        </h2>
                        <p className="text-gray-600 dark:text-gray-400">
                          Predicting battery health degradation over usage cycles
                        </p>
                      </div>
                      <div className="flex items-center gap-4">
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                            Data Points
                          </label>
                          <select
                            value={batteryCycles}
                            onChange={(e) => setBatteryCycles(parseInt(e.target.value))}
                            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                          >
                            <option value={20}>20 points</option>
                            <option value={50}>50 points</option>
                            <option value={100}>100 points</option>
                          </select>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-gray-600 dark:text-gray-400">Model Accuracy</p>
                          <p className="text-2xl font-bold text-green-600">
                            R² = {(batteryData.model_info.r2 * 100).toFixed(1)}%
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="h-96">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={batteryData.predictions.slice(0, batteryCycles)}>
                          <defs>
                            <linearGradient id="colorRUL" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                          <XAxis 
                            dataKey="cycle_count" 
                            label={{ value: 'Charge/Discharge Cycles', position: 'insideBottom', offset: -5 }}
                            tick={{ fontSize: 12 }}
                          />
                          <YAxis 
                            label={{ value: 'RUL (hours)', angle: -90, position: 'insideLeft' }}
                            tick={{ fontSize: 12 }}
                          />
                          <Tooltip content={<CustomTooltip />} />
                          <Legend />
                          <Area 
                            type="monotone" 
                            dataKey="rul_hours" 
                            name="Remaining Useful Life"
                            stroke="#3b82f6" 
                            strokeWidth={2}
                            fill="url(#colorRUL)"
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                      <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Model Type</p>
                        <p className="text-lg font-bold text-gray-900 dark:text-white">Random Forest</p>
                      </div>
                      <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Mean Error</p>
                        <p className="text-lg font-bold text-gray-900 dark:text-white">
                          ±{formatNumber(batteryData.model_info.mae)} hours
                        </p>
                      </div>
                      <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Training Samples</p>
                        <p className="text-lg font-bold text-gray-900 dark:text-white">5,000</p>
                      </div>
                    </div>
                  </div>
                </Card>

                <Card>
                  <div className="p-6">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                      Key Insights
                    </h3>
                    <div className="space-y-3 text-gray-700 dark:text-gray-300">
                      <p>• Battery RUL decreases with usage cycles, temperature exposure, and age</p>
                      <p>• Maintaining optimal temperature (20-30°C) extends battery life significantly</p>
                      <p>• High discharge rates accelerate degradation</p>
                      <p>• Regular monitoring helps predict replacement needs and prevent failures</p>
                    </div>
                  </div>
                </Card>
              </div>
            )}

            {/* Solar Degradation Visualization */}
            {selectedType === 'solar' && solarData && (
              <div className="space-y-6">
                <Card>
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex-1">
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                          Solar Panel Degradation Analysis
                        </h2>
                        <p className="text-gray-600 dark:text-gray-400">
                          Performance decline prediction over panel lifetime
                        </p>
                      </div>
                      <div className="flex items-center gap-4">
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                            Forecast Horizon
                          </label>
                          <select
                            value={solarYears}
                            onChange={(e) => setSolarYears(parseInt(e.target.value))}
                            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                          >
                            <option value={6}>5 years</option>
                            <option value={11}>10 years</option>
                            <option value={16}>15 years</option>
                            <option value={21}>20 years</option>
                            <option value={26}>25 years</option>
                          </select>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-gray-600 dark:text-gray-400">Model Accuracy</p>
                          <p className="text-2xl font-bold text-amber-600">
                            R² = {(solarData.model_info.r2 * 100).toFixed(1)}%
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="h-96">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={solarData.predictions.slice(0, solarYears)}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                          <XAxis 
                            dataKey="age_years" 
                            label={{ value: 'Panel Age (years)', position: 'insideBottom', offset: -5 }}
                            tick={{ fontSize: 12 }}
                          />
                          <YAxis 
                            yAxisId="left"
                            label={{ value: 'Efficiency (%)', angle: -90, position: 'insideLeft' }}
                            tick={{ fontSize: 12 }}
                            domain={[0, 20]}
                          />
                          <YAxis 
                            yAxisId="right"
                            orientation="right"
                            label={{ value: 'Degradation (%)', angle: 90, position: 'insideRight' }}
                            tick={{ fontSize: 12 }}
                          />
                          <Tooltip content={<CustomTooltip />} />
                          <Legend />
                          <Line 
                            yAxisId="left"
                            type="monotone" 
                            dataKey="efficiency_current" 
                            name="Current Efficiency"
                            stroke="#10b981" 
                            strokeWidth={3}
                            dot={false}
                          />
                          <Line 
                            yAxisId="right"
                            type="monotone" 
                            dataKey="degradation_percent" 
                            name="Degradation %"
                            stroke="#f59e0b" 
                            strokeWidth={2}
                            strokeDasharray="5 5"
                            dot={false}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                      <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Model Type</p>
                        <p className="text-lg font-bold text-gray-900 dark:text-white">Gradient Boosting</p>
                      </div>
                      <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Mean Error</p>
                        <p className="text-lg font-bold text-gray-900 dark:text-white">
                          ±{formatNumber(solarData.model_info.mae)}%
                        </p>
                      </div>
                      <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Expected Degradation</p>
                        <p className="text-lg font-bold text-gray-900 dark:text-white">0.5-0.8% / year</p>
                      </div>
                    </div>
                  </div>
                </Card>

                <Card>
                  <div className="p-6">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                      Key Insights
                    </h3>
                    <div className="space-y-3 text-gray-700 dark:text-gray-300">
                      <p>• Solar panels typically degrade 0.5-0.8% annually</p>
                      <p>• Dust accumulation can reduce efficiency by up to 15%</p>
                      <p>• High temperatures accelerate performance decline</p>
                      <p>• Regular cleaning and maintenance optimize long-term performance</p>
                      <p>• Expected lifetime: 25-30 years with 80% efficiency retention</p>
                    </div>
                  </div>
                </Card>
              </div>
            )}

            {/* Energy Loss Visualization */}
            {selectedType === 'loss' && lossData && (
              <div className="space-y-6">
                <Card>
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex-1">
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                          Energy Loss Analysis
                        </h2>
                        <p className="text-gray-600 dark:text-gray-400">
                          Distribution system losses across varying load conditions
                        </p>
                      </div>
                      <div className="flex items-center gap-4">
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                            Load Range
                          </label>
                          <select
                            value={lossLoadPoints}
                            onChange={(e) => setLossLoadPoints(parseInt(e.target.value))}
                            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                          >
                            <option value={15}>50-250 kW</option>
                            <option value={30}>50-500 kW</option>
                            <option value={50}>50-800 kW</option>
                          </select>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-gray-600 dark:text-gray-400">Model Accuracy</p>
                          <p className="text-2xl font-bold text-red-600">
                            R² = {(lossData.model_info.r2 * 100).toFixed(1)}%
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="h-96">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={lossData.predictions.slice(0, lossLoadPoints)}>
                          <defs>
                            <linearGradient id="colorLoss" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
                              <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                            </linearGradient>
                            <linearGradient id="colorEfficiency" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                              <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                          <XAxis 
                            dataKey="load_kw" 
                            label={{ value: 'Load (kW)', position: 'insideBottom', offset: -5 }}
                            tick={{ fontSize: 12 }}
                          />
                          <YAxis 
                            label={{ value: 'Percentage (%)', angle: -90, position: 'insideLeft' }}
                            tick={{ fontSize: 12 }}
                          />
                          <Tooltip content={<CustomTooltip />} />
                          <Legend />
                          <Area 
                            type="monotone" 
                            dataKey="loss_percent" 
                            name="Loss %"
                            stroke="#ef4444" 
                            strokeWidth={2}
                            fill="url(#colorLoss)"
                          />
                          <Area 
                            type="monotone" 
                            dataKey="efficiency_percent" 
                            name="Efficiency %"
                            stroke="#10b981" 
                            strokeWidth={2}
                            fill="url(#colorEfficiency)"
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                      <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Model Type</p>
                        <p className="text-lg font-bold text-gray-900 dark:text-white">Gradient Boosting</p>
                      </div>
                      <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Mean Error</p>
                        <p className="text-lg font-bold text-gray-900 dark:text-white">
                          ±{formatNumber(lossData.model_info.mae)}%
                        </p>
                      </div>
                      <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Typical Loss Range</p>
                        <p className="text-lg font-bold text-gray-900 dark:text-white">2-8%</p>
                      </div>
                    </div>
                  </div>
                </Card>

                <Card>
                  <div className="p-6">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                      Key Insights
                    </h3>
                    <div className="space-y-3 text-gray-700 dark:text-gray-300">
                      <p>• Energy losses increase with cable length and load current</p>
                      <p>• Poor power factor leads to higher reactive power losses</p>
                      <p>• Transformer overloading significantly increases losses</p>
                      <p>• Voltage deviations from nominal reduce system efficiency</p>
                      <p>• Optimal loading: 50-75% of transformer capacity</p>
                    </div>
                  </div>
                </Card>
              </div>
            )}

            {/* Info Card */}
            <Card className="mt-8">
              <div className="p-6 bg-blue-50 dark:bg-blue-900/20">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-3">
                  About These Predictions
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm text-gray-700 dark:text-gray-300">
                  <div>
                    <h4 className="font-semibold mb-2">Battery RUL</h4>
                    <p>Uses Random Forest algorithm to predict remaining battery life based on usage patterns, temperature, and aging factors.</p>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">Solar Degradation</h4>
                    <p>Gradient Boosting model forecasts panel performance decline due to environmental conditions and aging.</p>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">Energy Loss</h4>
                    <p>Analyzes distribution losses from cables, transformers, and power quality issues for optimization.</p>
                  </div>
                </div>
              </div>
            </Card>

            {/* Actionable Insights */}
            <ActionableInsights 
              context="predictions" 
              predictionData={{
                battery: batteryData,
                solar: solarData,
                loss: lossData
              }}
              compact={true}
            />
          </>
        )}
      </div>
    </div>
  );
};

export default PredictionsPage;

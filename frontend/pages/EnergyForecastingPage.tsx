import React, { useState, useEffect, useContext, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, TrendingUp, Sun, Zap, Activity, Loader, BarChart3, Sparkles } from 'lucide-react';
import Card from '../components/ui/Card';
import { AppContext } from '../contexts/AppContext';
import ActionableInsights from '../components/shared/ActionableInsights';
import { 
  forecastEnergy, 
  getForecastSummary, 
  explainForecast,
  getAIServiceURL,
  ForecastResponse
} from '../services/api';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Area,
  AreaChart,
} from 'recharts';

const EnergyForecastingPage: React.FC = () => {
  const navigate = useNavigate();
  const { selectedSite, theme } = useContext(AppContext)!;
  
  const [selectedType, setSelectedType] = useState<'production' | 'consumption'>('consumption'); // consumption = demand
  const [forecastHours, setForecastHours] = useState<number>(24);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  
  // Forecast data states - load from localStorage on mount
  const [productionForecast, setProductionForecast] = useState<any>(() => {
    const saved = localStorage.getItem('productionForecast');
    return saved ? JSON.parse(saved) : null;
  });
  const [consumptionForecast, setConsumptionForecast] = useState<any>(() => {
    const saved = localStorage.getItem('consumptionForecast');
    return saved ? JSON.parse(saved) : null;
  });
  const [aiExplanation, setAiExplanation] = useState<string>('');
  const [explaining, setExplaining] = useState(false);

  const gridColor = theme === 'dark' ? '#374151' : '#e5e7eb';
  const textColor = theme === 'dark' ? '#9ca3af' : '#6b7281';

  // Auto-load forecast on mount if not already loaded
  useEffect(() => {
    if (!consumptionForecast && !loading) {
      handleForecast('consumption');
    }
  }, []);

  // Save forecasts to localStorage when they change
  useEffect(() => {
    if (productionForecast) {
      localStorage.setItem('productionForecast', JSON.stringify(productionForecast));
    }
  }, [productionForecast]);

  useEffect(() => {
    if (consumptionForecast) {
      localStorage.setItem('consumptionForecast', JSON.stringify(consumptionForecast));
    }
  }, [consumptionForecast]);

  // Auto-refresh forecast every 10 minutes
  useEffect(() => {
    const interval = setInterval(() => {
      if (selectedType === 'production' && productionForecast) {
        handleForecast('production');
      } else if (selectedType === 'consumption' && consumptionForecast) {
        handleForecast('consumption');
      }
    }, 600000); // 10 minutes

    return () => clearInterval(interval);
  }, [selectedType, productionForecast, consumptionForecast]);

  const handleForecast = async (type: 'production' | 'consumption') => {
    setLoading(true);
    setError('');
    
    try {
      const result = await forecastEnergy({
        site_id: selectedSite?.id || null,
        forecast_type: type,
        forecast_horizon_hours: forecastHours
      });

      if (result.success && result.data) {
        // Update corresponding state
        if (type === 'production') {
          setProductionForecast(result);
        } else {
          setConsumptionForecast(result);
        }

        // Auto-generate AI explanation for the forecast
        if (result.summary) {
          handleExplainForecast(result);
        }
      }
    } catch (err: any) {
      setError(err.message || `Failed to generate ${type} forecast`);
    } finally {
      setLoading(false);
    }
  };

  const handleExplainForecast = async (forecastData: any) => {
    setExplaining(true);
    try {
      const explanation = await explainForecast(forecastData);
      if (explanation.success && explanation.explanation) {
        setAiExplanation(explanation.explanation);
      }
    } catch (err) {
      console.error('Failed to get AI explanation:', err);
    } finally {
      setExplaining(false);
    }
  };

  const formatChartData = (forecast: any) => {
    if (!forecast || !forecast.data) return [];
    
    return forecast.data.map((item: any, index: number) => {
      // Parse timestamp or create from current date + hour offset
      const timestamp = item.timestamp ? new Date(item.timestamp) : new Date(Date.now() + (item.hour * 3600000));
      const displayTime = timestamp.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: false 
      });
      const displayDate = timestamp.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric' 
      });
      
      return {
        time: displayTime,
        date: displayDate,
        fullLabel: `${displayDate} ${displayTime}`,
        hour: item.hour,
        value: item.value,
        lower: item.confidence_lower || item.value * 0.9,
        upper: item.confidence_upper || item.value * 1.1,
        timestamp: timestamp.toISOString()
      };
    });
  };

  const formatNumber = (value: number | null | undefined): string => {
    if (value === null || value === undefined || isNaN(value)) return '-';
    return value.toLocaleString('en-IN', { maximumFractionDigits: 2 });
  };

  const currentForecast = useMemo(() => {
    switch (selectedType) {
      case 'production': return productionForecast;
      case 'consumption': return consumptionForecast;
      default: return null;
    }
  }, [selectedType, productionForecast, consumptionForecast]);

  const chartData = useMemo(() => {
    return formatChartData(currentForecast);
  }, [currentForecast]);

  const ForecastCard = ({ 
    type, 
    icon: Icon, 
    colorClasses,
    title, 
    description 
  }: { 
    type: 'production' | 'consumption';
    icon: React.ElementType;
    colorClasses: {
      border: string;
      bg: string;
      icon: string;
      button: string;
    };
    title: string;
    description: string;
  }) => {
    const forecast = type === 'production' ? productionForecast : consumptionForecast;
    const summary = forecast?.summary;

    return (
      <Card className={`border-2 ${selectedType === type ? colorClasses.border : 'border-gray-200 dark:border-gray-700'}`}>
        <div className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center">
              <div className={`w-12 h-12 rounded-lg ${colorClasses.bg} flex items-center justify-center mr-3`}>
                <Icon className={`w-6 h-6 ${colorClasses.icon}`} />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">{description}</p>
              </div>
            </div>
            <button
              onClick={() => {
                setSelectedType(type);
                if (!forecast) {
                  handleForecast(type);
                }
              }}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                selectedType === type
                  ? `${colorClasses.button} text-white`
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              {forecast ? 'View' : 'Forecast'}
            </button>
          </div>

          {summary && (
            <div className="grid grid-cols-2 gap-3 mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">24h Total</p>
                <p className="text-lg font-bold text-gray-900 dark:text-white">
                  {formatNumber(summary.total_24h)} kWh
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Peak</p>
                <p className="text-lg font-bold text-gray-900 dark:text-white">
                  {formatNumber(summary.peak)} kW
                  <span className="text-xs font-normal text-gray-500 ml-1">
                    @ {summary.peak_hour}:00
                  </span>
                </p>
              </div>
            </div>
          )}
        </div>
      </Card>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-4">
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
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Energy Forecasting Analysis
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Forecast energy production and consumption using ML models trained on IITGN data
          </p>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-800 dark:text-red-300">
            {error}
          </div>
        )}

        {/* Forecast Type Selection */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <ForecastCard
            type="production"
            icon={Sun}
            colorClasses={{
              border: "border-yellow-500",
              bg: "bg-yellow-100 dark:bg-yellow-900/30",
              icon: "text-yellow-600 dark:text-yellow-400",
              button: "bg-yellow-600 hover:bg-yellow-700"
            }}
            title="Energy Production"
            description="Solar/Renewable generation forecast"
          />
          <ForecastCard
            type="consumption"
            icon={Zap}
            colorClasses={{
              border: "border-green-500",
              bg: "bg-green-100 dark:bg-green-900/30",
              icon: "text-green-600 dark:text-green-400",
              button: "bg-green-600 hover:bg-green-700"
            }}
            title="Energy Demand"
            description="Actual energy demand forecast"
          />
        </div>

        {/* Controls */}
        <Card className="mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Forecast Horizon
                </label>
                <select
                  value={forecastHours}
                  onChange={(e) => setForecastHours(parseInt(e.target.value))}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value={6}>6 hours</option>
                  <option value={12}>12 hours</option>
                  <option value={24}>24 hours</option>
                  <option value={48}>48 hours</option>
                  <option value={72}>72 hours</option>
                  <option value={168}>7 days</option>
                </select>
              </div>
              <button
                onClick={() => handleForecast(selectedType)}
                disabled={loading}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 flex items-center space-x-2 mt-6"
              >
                {loading ? (
                  <>
                    <Loader className="w-5 h-5 animate-spin" />
                    <span>Forecasting...</span>
                  </>
                ) : (
                  <>
                    <TrendingUp className="w-5 h-5" />
                    <span>Generate {selectedType.charAt(0).toUpperCase() + selectedType.slice(1)} Forecast</span>
                  </>
                )}
              </button>
            </div>
            
            {currentForecast && currentForecast.summary && (
              <div className="text-sm text-gray-600 dark:text-gray-400">
                <p>Model: <span className="font-semibold">Time-Series Analysis</span></p>
                {currentForecast.model_info?.r2 && (
                  <p>Accuracy: <span className="font-semibold">{(currentForecast.model_info.r2 * 100).toFixed(1)}%</span></p>
                )}
              </div>
            )}
          </div>
        </Card>

        {/* Forecast Chart */}
        {currentForecast && chartData.length > 0 && (
          <Card className="mb-6">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                    {selectedType.charAt(0).toUpperCase() + selectedType.slice(1)} Forecast
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {forecastHours}-hour forecast with confidence intervals
                  </p>
                </div>
              </div>
              
              <div className="h-96 mt-6">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="colorProduction" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#eab308" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#eab308" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorConsumption" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                    <XAxis 
                      dataKey="fullLabel" 
                      stroke={textColor}
                      tick={{ fontSize: 10 }}
                      interval={Math.max(1, Math.floor(forecastHours / 12))}
                      angle={-45}
                      textAnchor="end"
                      height={80}
                      label={{ value: 'Date & Time', position: 'insideBottom', offset: -10, fill: textColor }}
                    />
                    <YAxis 
                      stroke={textColor}
                      tick={{ fontSize: 12 }}
                      label={{ value: 'Power (kW)', angle: -90, position: 'insideLeft', fill: textColor }}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: theme === 'dark' ? '#1f2937' : '#ffffff', 
                        border: `1px solid ${gridColor}`,
                        borderRadius: '8px'
                      }}
                      formatter={(value: any) => `${formatNumber(value)} kW`}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="upper" 
                      stroke="none" 
                      fill={`url(#color${selectedType.charAt(0).toUpperCase() + selectedType.slice(1)})`}
                      fillOpacity={0.1}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="value" 
                      stroke={selectedType === 'production' ? '#eab308' : '#10b981'}
                      strokeWidth={2}
                      fill={`url(#color${selectedType.charAt(0).toUpperCase() + selectedType.slice(1)})`}
                      fillOpacity={0.6}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="lower" 
                      stroke="none" 
                      fill={theme === 'dark' ? '#1f2937' : '#ffffff'}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="value" 
                      stroke={selectedType === 'production' ? '#eab308' : '#10b981'}
                      strokeWidth={2}
                      dot={false}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </Card>
        )}

        {/* Summary Metrics */}
        {currentForecast && currentForecast.summary && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card>
              <div className="p-4">
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Total Forecast</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {formatNumber(currentForecast.summary.total_24h)} kWh
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Over {forecastHours} hours</p>
              </div>
            </Card>
            <Card>
              <div className="p-4">
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Average</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {formatNumber(currentForecast.summary.average)} kW
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Mean power level</p>
              </div>
            </Card>
            <Card>
              <div className="p-4">
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Peak</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {formatNumber(currentForecast.summary.peak)} kW
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">At {currentForecast.summary.peak_hour}:00</p>
              </div>
            </Card>
            <Card>
              <div className="p-4">
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Minimum</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {formatNumber(currentForecast.summary.min)} kW
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">At {currentForecast.summary.min_hour}:00</p>
              </div>
            </Card>
          </div>
        )}


        {/* Empty State */}
        {!currentForecast && !loading && (
          <Card>
            <div className="text-center py-12">
              <TrendingUp className="w-16 h-16 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                No Forecast Generated Yet
              </h3>
              <p className="text-gray-500 dark:text-gray-400 mb-4">
                Select a forecast type and click "Generate Forecast" to begin
              </p>
            </div>
          </Card>
        )}

        {/* Actionable Insights */}
        <ActionableInsights 
          context="forecast" 
          forecastData={currentForecast as ForecastResponse | null}
          compact={true}
        />
      </div>
    </div>
  );
};

export default EnergyForecastingPage;


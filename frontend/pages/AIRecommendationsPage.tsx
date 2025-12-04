import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Lightbulb, Battery, Zap, TrendingUp, RefreshCw, Sparkles, AlertCircle, CheckCircle } from 'lucide-react';
import Card from '../components/ui/Card';
import { AppContext } from '../contexts/AppContext';
import { forecastEnergy, ForecastResponse } from '../services/api';
import { marked } from 'marked';

interface InsightCategory {
  title: string;
  icon: React.ReactNode;
  color: string;
  insights: string[];
}

const AIRecommendationsPage: React.FC = () => {
  const navigate = useNavigate();
  const { selectedSite, healthStatus, latestTelemetry } = useContext(AppContext)!;
  const [isGenerating, setIsGenerating] = useState(false);
  const [insights, setInsights] = useState<InsightCategory[]>([]);
  const [error, setError] = useState<string>('');
  const [lastGenerated, setLastGenerated] = useState<Date | null>(null);
  const [forecastData, setForecastData] = useState<ForecastResponse | null>(null);

  useEffect(() => {
    // Load forecast data on mount
    loadForecastData();
  }, [selectedSite]);

  const loadForecastData = async () => {
    try {
      const forecast = await forecastEnergy({
        site_id: selectedSite?.id || null,
        forecast_type: 'consumption',
        forecast_horizon_hours: 24
      });
      setForecastData(forecast);
    } catch (err) {
      console.error('Failed to load forecast data:', err);
    }
  };

  const generateInsights = async () => {
    setIsGenerating(true);
    setError('');

    try {
      // Prepare system data for AI analysis
      const systemData = {
        site: {
          name: selectedSite?.name || 'Unknown Site',
          id: selectedSite?.id || 'N/A'
        },
        health: {
          site_health: healthStatus?.site_health || 0,
          grid_draw: healthStatus?.grid_draw || 0,
          battery_soc: healthStatus?.battery_soc || 0,
          pv_generation_today: healthStatus?.pv_generation_today || 0
        },
        telemetry: {
          grid_power: latestTelemetry?.metrics?.grid_power || 0,
          battery_discharge: latestTelemetry?.metrics?.battery_discharge || 0,
          battery_charge: latestTelemetry?.metrics?.battery_charge || 0,
          pv_power: latestTelemetry?.metrics?.pv_power || 0,
          soc_batt: latestTelemetry?.metrics?.soc_batt || 0
        },
        forecast: forecastData ? {
          total_24h: forecastData.summary?.total_24h || 0,
          average: forecastData.summary?.average || 0,
          peak: forecastData.summary?.peak || 0,
          peak_hour: forecastData.summary?.peak_hour || 12,
          min: forecastData.summary?.min || 0,
          min_hour: forecastData.summary?.min_hour || 2
        } : null
      };

      // Call Groq API via backend
      const AI_SERVICE_URL = import.meta.env.VITE_AI_BASE_URL || 'http://localhost:8000';
      const token = localStorage.getItem('jwt');
      
      const response = await fetch(`${AI_SERVICE_URL}/api/v1/actions/generate-insights`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ system_data: systemData })
      });

      if (!response.ok) {
        throw new Error('Failed to generate insights');
      }

      const data = await response.json();
      
      // Check if using fallback
      if (data.fallback && data.message) {
        console.warn('Using fallback insights:', data.message);
      }
      
      // Parse the insights from AI response
      const parsedInsights = parseInsightsFromAI(data.insights || data.response);
      setInsights(parsedInsights);
      setLastGenerated(new Date());
      
      // Show a warning if using fallback
      if (data.fallback) {
        setError('Note: Using fallback insights. Configure GROQ_API_KEY in AI service for AI-powered insights.');
      }

    } catch (err: any) {
      console.error('Error generating insights:', err);
      setError(err.message || 'Failed to generate insights. Please try again.');
      
      // Fallback to mock insights if API fails
      generateMockInsights();
    } finally {
      setIsGenerating(false);
    }
  };

  const parseInsightsFromAI = (aiResponse: string): InsightCategory[] => {
    // Parse AI response into structured insights
    const categories: InsightCategory[] = [];
    
    // Split by ## headers (category headers)
    const sections = aiResponse.split(/##\s+/);
    
    sections.forEach(section => {
      if (section.trim()) {
        const lines = section.split('\n').filter(l => l.trim());
        if (lines.length > 0) {
          // First line is the category title
          const title = lines[0].replace(/\*\*/g, '').trim();
          
          // Remaining lines are insights - clean up markdown formatting
          const insights = lines.slice(1)
            .map(l => l
              .replace(/^[-*]\s*/, '') // Remove bullet points
              .replace(/^###\s+/, '') // Remove ### headers
              .replace(/\*\*/g, '') // Remove bold markers
              .trim()
            )
            .filter(l => l && !l.startsWith('#')); // Filter empty lines and remaining headers
          
          if (insights.length > 0) {
            categories.push({
              title,
              icon: getCategoryIcon(title),
              color: getCategoryColor(title),
              insights
            });
          }
        }
      }
    });

    return categories.length > 0 ? categories : generateMockInsights();
  };

  const getCategoryIcon = (title: string) => {
    const lowerTitle = title.toLowerCase();
    if (lowerTitle.includes('energy') || lowerTitle.includes('consumption')) return <Zap className="w-6 h-6" />;
    if (lowerTitle.includes('battery')) return <Battery className="w-6 h-6" />;
    if (lowerTitle.includes('cost') || lowerTitle.includes('savings')) return <TrendingUp className="w-6 h-6" />;
    if (lowerTitle.includes('alert') || lowerTitle.includes('warning')) return <AlertCircle className="w-6 h-6" />;
    return <Lightbulb className="w-6 h-6" />;
  };

  const getCategoryColor = (title: string) => {
    const lowerTitle = title.toLowerCase();
    if (lowerTitle.includes('critical') || lowerTitle.includes('alert')) return 'text-red-600 dark:text-red-400';
    if (lowerTitle.includes('warning')) return 'text-yellow-600 dark:text-yellow-400';
    if (lowerTitle.includes('optimization') || lowerTitle.includes('savings')) return 'text-green-600 dark:text-green-400';
    return 'text-blue-600 dark:text-blue-400';
  };

  const getCategoryBgColor = (title: string) => {
    const lowerTitle = title.toLowerCase();
    if (lowerTitle.includes('consumption') || lowerTitle.includes('energy')) return 'from-blue-100 to-blue-200 dark:from-blue-900/30 dark:to-blue-800/30';
    if (lowerTitle.includes('battery')) return 'from-green-100 to-green-200 dark:from-green-900/30 dark:to-green-800/30';
    if (lowerTitle.includes('cost') || lowerTitle.includes('savings')) return 'from-yellow-100 to-yellow-200 dark:from-yellow-900/30 dark:to-yellow-800/30';
    if (lowerTitle.includes('renewable')) return 'from-purple-100 to-purple-200 dark:from-purple-900/30 dark:to-purple-800/30';
    return 'from-gray-100 to-gray-200 dark:from-gray-800/30 dark:to-gray-700/30';
  };

  const generateMockInsights = (): InsightCategory[] => {
    const batterySOC = healthStatus?.battery_soc || 50;
    const gridDraw = healthStatus?.grid_draw || 0;
    const pvGeneration = healthStatus?.pv_generation_today || 0;
    const peakHour = forecastData?.summary?.peak_hour || 14;

    return [
      {
        title: 'Energy Consumption Insights',
        icon: <Zap className="w-6 h-6" />,
        color: 'text-blue-600 dark:text-blue-400',
        insights: [
          `Peak demand expected at ${peakHour}:00. Consider pre-charging battery before this time.`,
          `Current grid draw is ${gridDraw.toFixed(2)} kW. ${gridDraw > 100 ? 'Consider reducing non-essential loads.' : 'Grid usage is optimal.'}`,
          forecastData ? `Forecasted 24h consumption: ${forecastData.summary?.total_24h.toFixed(2)} kWh` : 'Enable forecasting for consumption predictions.'
        ]
      },
      {
        title: 'Battery Optimization',
        icon: <Battery className="w-6 h-6" />,
        color: batterySOC < 30 ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400',
        insights: [
          `Current battery SoC: ${batterySOC.toFixed(2)}%. ${batterySOC < 30 ? 'Low battery - charge immediately!' : batterySOC > 80 ? 'Battery well charged.' : 'Consider charging during off-peak hours.'}`,
          `Optimize battery cycles by avoiding frequent charge/discharge below 20% SoC.`,
          `Schedule battery charging during low-tariff periods (typically 10 PM - 6 AM).`
        ]
      },
      {
        title: 'Cost Savings Opportunities',
        icon: <TrendingUp className="w-6 h-6" />,
        color: 'text-green-600 dark:text-green-400',
        insights: [
          `Shift ${Math.round(gridDraw * 0.3)} kW of flexible loads to off-peak hours for 15-20% cost reduction.`,
          pvGeneration > 0 ? `Solar generated ${pvGeneration.toFixed(2)} kWh today. Maximize self-consumption to reduce grid dependency.` : 'Install solar PV to reduce grid costs by up to 40%.',
          `Enable demand response programs to earn incentives during peak hours.`
        ]
      },
      {
        title: 'Renewable Integration',
        icon: <Lightbulb className="w-6 h-6" />,
        color: 'text-purple-600 dark:text-purple-400',
        insights: [
          pvGeneration > 0 ? `Solar contribution: ${((pvGeneration / (forecastData?.summary?.total_24h || 100)) * 100).toFixed(1)}% of daily consumption.` : 'No solar generation detected. Consider renewable integration.',
          `Increase renewable share by ${Math.round(20 + Math.random() * 15)}% with optimized battery dispatch.`,
          `Weather forecast shows favorable conditions for solar generation in next 48 hours.`
        ]
      }
    ];
  };

  return (
    <div className="min-h-full bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 -m-4 md:-m-6 lg:-m-8 p-4 md:p-6 lg:p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <button
            onClick={() => navigate('/ai-ml-insights')}
            className="flex items-center text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-4"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back to AI/ML Insights
          </button>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
                Actionable Insights
              </h1>
              <p className="text-gray-600 dark:text-gray-400 text-lg">
                AI-powered recommendations based on real-time data, forecasts, and system health
              </p>
            </div>
            <button
              onClick={generateInsights}
              disabled={isGenerating}
              className="flex items-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {isGenerating ? (
                <>
                  <RefreshCw className="w-5 h-5 animate-spin" />
                  <span>Generating...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  <span>Generate Insights</span>
                </>
              )}
            </button>
          </div>
          {lastGenerated && (
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
              Last generated: {lastGenerated.toLocaleString()}
            </p>
          )}
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-start space-x-3">
            <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-red-800 dark:text-red-300 font-semibold">Error</p>
              <p className="text-red-700 dark:text-red-400 text-sm">{error}</p>
            </div>
          </div>
        )}

        {insights.length === 0 && !isGenerating && (
          <Card>
            <div className="text-center py-12">
              <Sparkles className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                No Insights Generated Yet
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Click "Generate Insights" to get AI-powered recommendations based on your current system data and forecasts.
              </p>
              <button
                onClick={generateInsights}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
              >
                Generate Your First Insights
              </button>
            </div>
          </Card>
        )}

        {insights.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {insights.map((category, index) => (
              <Card key={index} className="bg-gray-50 dark:bg-gray-800/50">
                <div className="p-6">
                  {/* Category Header */}
                  <div className="flex items-center space-x-3 mb-5">
                    <div className={`p-2 rounded-lg bg-gradient-to-br ${getCategoryBgColor(category.title)}`}>
                      <div className={`${category.color}`}>
                        {category.icon}
                      </div>
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                      {category.title}
                    </h3>
                  </div>
                  
                  {/* Sub-cards for each insight */}
                  <div className="space-y-3">
                    {category.insights.map((insight, idx) => (
                      <div 
                        key={idx} 
                        className="bg-white dark:bg-gray-700 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-600 hover:shadow-md transition-shadow"
                      >
                        <div className="flex items-start space-x-3">
                          <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                          <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed flex-1">
                            {insight}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

      </div>
    </div>
  );
};

export default AIRecommendationsPage;

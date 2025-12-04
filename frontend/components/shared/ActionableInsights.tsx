import React, { useState, useContext } from 'react';
import { Lightbulb, Battery, Zap, TrendingUp, RefreshCw, Sparkles, AlertCircle, CheckCircle, AlertTriangle } from 'lucide-react';
import Card from '../ui/Card';
import { AppContext } from '../../contexts/AppContext';
import { forecastEnergy, ForecastResponse } from '../../services/api';

interface InsightCategory {
  title: string;
  icon: React.ReactNode;
  color: string;
  insights: string[];
}

interface ActionableInsightsProps {
  context?: 'forecast' | 'predictions';
  forecastData?: ForecastResponse | null;
  predictionData?: any;
  compact?: boolean; // If true, shows single list instead of 4 categories
}

const ActionableInsights: React.FC<ActionableInsightsProps> = ({ 
  context = 'forecast',
  forecastData,
  predictionData,
  compact = false
}) => {
  const { selectedSite, healthStatus, latestTelemetry } = useContext(AppContext)!;
  const [isGenerating, setIsGenerating] = useState(false);
  const [insights, setInsights] = useState<InsightCategory[]>([]);
  const [error, setError] = useState<string>('');
  const [lastGenerated, setLastGenerated] = useState<Date | null>(null);

  const generateInsights = async () => {
    setIsGenerating(true);
    setError('');

    try {
      // Load forecast data if not provided
      let currentForecast = forecastData;
      if (!currentForecast && context === 'forecast') {
        try {
          currentForecast = await forecastEnergy({
            site_id: selectedSite?.id || null,
            forecast_type: 'consumption',
            forecast_horizon_hours: 24
          });
        } catch (err) {
          console.error('Failed to load forecast:', err);
        }
      }

      // Prepare system data for AI analysis
      // For compact forecast mode, only include forecast data (not dashboard data)
      const systemData: any = {
        site: {
          name: selectedSite?.name || 'Unknown Site',
          id: selectedSite?.id || 'N/A'
        },
        context: context === 'forecast' ? 'energy_forecasting' : 'ai_predictions'
      };

      // Only include health & telemetry for non-compact mode (dedicated Actionable Insights page)
      if (!compact) {
        systemData.health = {
          site_health: healthStatus?.site_health || 0,
          grid_draw: healthStatus?.grid_draw || 0,
          battery_soc: healthStatus?.battery_soc || 0,
          pv_generation_today: healthStatus?.pv_generation_today || 0
        };
        systemData.telemetry = {
          battery_discharge: latestTelemetry?.metrics?.battery_discharge || 0,
          pv_generation: latestTelemetry?.metrics?.pv_generation || 0,
          soc_batt: latestTelemetry?.metrics?.soc_batt || 0,
          voltage: latestTelemetry?.metrics?.voltage || 0,
          current: latestTelemetry?.metrics?.current || 0
        };
      }

      // Add forecast data if available
      if (currentForecast) {
        systemData.forecast = {
          total_24h: currentForecast.summary?.total_24h || 0,
          average: currentForecast.summary?.average || 0,
          peak: currentForecast.summary?.peak || 0,
          peak_hour: currentForecast.summary?.peak_hour || 12,
          min: currentForecast.summary?.min || 0,
          min_hour: currentForecast.summary?.min_hour || 2
        };
      }

      // Add prediction data if available
      if (predictionData) {
        systemData.predictions = predictionData;
      }

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
      if (compact) {
        // For compact mode, extract insights as a flat list
        const compactList = parseCompactInsightsFromAI(data.insights || data.response);
        setInsights([{
          title: 'Key Insights',
          icon: <Lightbulb className="w-6 h-6" />,
          color: 'text-blue-600 dark:text-blue-400',
          insights: compactList
        }]);
      } else {
        const parsedInsights = parseInsightsFromAI(data.insights || data.response, context);
        setInsights(parsedInsights);
      }
      setLastGenerated(new Date());
      
      // Show a warning if using fallback
      if (data.fallback) {
        setError('Note: Using fallback insights. Configure GROQ_API_KEY in AI service for AI-powered insights.');
      }

    } catch (err: any) {
      console.error('Error generating insights:', err);
      setError(err.message || 'Failed to generate insights. Please try again.');
      
      // Fallback to mock insights if API fails
      if (compact) {
        // For compact mode, use generateCompactInsights based on context
        let compactList: string[] = [];
        
        if (context === 'forecast') {
          let fallbackForecast = forecastData;
          if (!fallbackForecast) {
            try {
              fallbackForecast = await forecastEnergy({
                site_id: selectedSite?.id || null,
                forecast_type: 'consumption',
                forecast_horizon_hours: 24
              });
            } catch (err) {
              console.error('Failed to load forecast for fallback:', err);
            }
          }
          compactList = generateCompactInsights('forecast', fallbackForecast);
        } else if (context === 'predictions') {
          // For predictions, use predictionData
          compactList = generateCompactInsights('predictions', null);
        }
        
        setInsights([{
          title: 'Key Insights',
          icon: <Lightbulb className="w-6 h-6" />,
          color: 'text-blue-600 dark:text-blue-400',
          insights: compactList
        }]);
      } else {
        // For full mode, use generateMockInsights
        let fallbackForecast = forecastData;
        if (!fallbackForecast && context === 'forecast') {
          try {
            fallbackForecast = await forecastEnergy({
              site_id: selectedSite?.id || null,
              forecast_type: 'consumption',
              forecast_horizon_hours: 24
            });
          } catch (err) {
            console.error('Failed to load forecast for fallback:', err);
          }
        }
        setInsights(generateMockInsights(context, fallbackForecast));
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const parseCompactInsightsFromAI = (aiResponse: string): string[] => {
    // Extract all insights as a flat list
    const insights: string[] = [];
    const lines = aiResponse.split('\n').filter(l => l.trim());
    
    lines.forEach(line => {
      const cleaned = line
        .replace(/^[-*]\s*/, '')
        .replace(/^###\s+/, '')
        .replace(/^##\s+/, '')
        .replace(/\*\*/g, '')
        .trim();
      
      if (cleaned && !cleaned.startsWith('#') && cleaned.length > 10) {
        insights.push(cleaned);
      }
    });
    
    return insights.slice(0, 8); // Limit to 8 crisp insights
  };

  const parseInsightsFromAI = (aiResponse: string, contextType: string): InsightCategory[] => {
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

    return categories.length > 0 ? categories : generateMockInsights(contextType, forecastData);
  };

  const getCategoryIcon = (title: string) => {
    const lowerTitle = title.toLowerCase();
    if (lowerTitle.includes('energy') || lowerTitle.includes('consumption') || lowerTitle.includes('demand')) return <Zap className="w-6 h-6" />;
    if (lowerTitle.includes('battery')) return <Battery className="w-6 h-6" />;
    if (lowerTitle.includes('cost') || lowerTitle.includes('savings')) return <TrendingUp className="w-6 h-6" />;
    if (lowerTitle.includes('alert') || lowerTitle.includes('warning')) return <AlertCircle className="w-6 h-6" />;
    if (lowerTitle.includes('forecast') || lowerTitle.includes('prediction')) return <TrendingUp className="w-6 h-6" />;
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
    if (lowerTitle.includes('consumption') || lowerTitle.includes('energy') || lowerTitle.includes('demand')) return 'from-blue-100 to-blue-200 dark:from-blue-900/30 dark:to-blue-800/30';
    if (lowerTitle.includes('battery')) return 'from-green-100 to-green-200 dark:from-green-900/30 dark:to-green-800/30';
    if (lowerTitle.includes('cost') || lowerTitle.includes('savings')) return 'from-yellow-100 to-yellow-200 dark:from-yellow-900/30 dark:to-yellow-800/30';
    if (lowerTitle.includes('renewable') || lowerTitle.includes('forecast') || lowerTitle.includes('prediction')) return 'from-purple-100 to-purple-200 dark:from-purple-900/30 dark:to-purple-800/30';
    return 'from-gray-100 to-gray-200 dark:from-gray-800/30 dark:to-gray-700/30';
  };

  const generateCompactInsights = (contextType: string, currentForecast?: ForecastResponse | null): string[] => {
    const batterySOC = healthStatus?.battery_soc || 50;
    const pvGeneration = healthStatus?.pv_generation_today || 0;

    if (contextType === 'forecast') {
      const peakHour = currentForecast?.summary?.peak_hour || 14;
      const minHour = currentForecast?.summary?.min_hour || 2;
      const peakDemand = currentForecast?.summary?.peak || 0;
      const minDemand = currentForecast?.summary?.min || 0;
      const avgDemand = currentForecast?.summary?.average || 0;
      const total24h = currentForecast?.summary?.total_24h || 0;

      return [
        `⚡ Peak demand of ${peakDemand.toFixed(1)} kW at ${peakHour}:00 - Pre-charge battery by ${peakHour - 2}:00`,
        `💰 Shift ${(peakDemand * 0.25).toFixed(1)} kW load to off-peak hours for 15-18% cost savings`,
        `🔋 ${batterySOC < 30 ? `Critical: Charge battery now to ${batterySOC.toFixed(0)}%` : `Battery at ${batterySOC.toFixed(0)}% - Optimal for peak support`}`,
        `📊 Minimum demand ${minDemand.toFixed(1)} kW at ${minHour}:00 - Best time for battery charging`,
        `📈 Average demand ${avgDemand.toFixed(1)} kW - Peak is ${((peakDemand / avgDemand - 1) * 100).toFixed(0)}% higher`,
        pvGeneration > 0 ? `☀️ Solar offset: ${((pvGeneration / total24h) * 100).toFixed(1)}% - Target 40% for optimal savings` : `☀️ Add solar PV to offset 30-40% of ${total24h.toFixed(0)} kWh daily consumption`
      ];
    } else if (contextType === 'predictions') {
      // For predictions context, generate insights from predictionData ONLY
      const battData = predictionData?.battery;
      const solarData = predictionData?.solar;
      const lossData = predictionData?.loss;
      const insights: string[] = [];

      if (battData?.predictions && battData.predictions.length > 0) {
        const initialRUL = battData.predictions[0]?.rul_hours || 0;
        const finalRUL = battData.predictions[battData.predictions.length - 1]?.rul_hours || 0;
        const degradationPct = initialRUL > 0 ? ((initialRUL - finalRUL) / initialRUL * 100) : 0;
        insights.push(
          `🔋 Battery RUL: ${finalRUL.toFixed(0)}h remaining - ${finalRUL < 500 ? '⚠️ Schedule replacement soon' : 'Healthy lifespan'}`,
          `📉 Degradation: ${degradationPct.toFixed(1)}% over ${battData.predictions.length} cycles - Maintain 20-30°C to minimize wear`
        );
      }

      if (solarData?.predictions && solarData.predictions.length > 0) {
        const initialEff = solarData.predictions[0]?.efficiency_current || 18;
        const finalEff = solarData.predictions[solarData.predictions.length - 1]?.efficiency_current || 16;
        const yearsAnalyzed = solarData.predictions.length;
        const annualDeg = yearsAnalyzed > 0 ? ((initialEff - finalEff) / yearsAnalyzed).toFixed(3) : '0';
        insights.push(
          `☀️ Solar: ${finalEff.toFixed(2)}% efficiency - ${parseFloat(annualDeg) > 0.8 ? '⚠️ Inspect panels' : '✓ Normal degradation'}`,
          `🔧 Annual degradation: ${annualDeg}%/year - ${parseFloat(annualDeg) > 0.8 ? 'Above standard (inspect)' : 'Within 0.5-0.8% standard'}`
        );
      }

      if (lossData?.predictions && lossData.predictions.length > 0) {
        const avgLoss = lossData.predictions.reduce((sum: number, p: any) => sum + (p.loss_percent || 0), 0) / lossData.predictions.length;
        const optimalLoad = lossData.predictions.find((p: any) => p.loss_percent === Math.min(...lossData.predictions.map((p: any) => p.loss_percent || 0)));
        insights.push(
          `⚡ Energy loss: ${avgLoss.toFixed(2)}% avg - ${avgLoss > 5 ? '⚠️ Review system efficiency' : '✓ Efficient operation'}`,
          optimalLoad ? `🎯 Optimal at ${optimalLoad.load_kw.toFixed(0)} kW load (${optimalLoad.loss_percent.toFixed(2)}% loss) - Target this range` : '🎯 Operate at 50-75% transformer capacity'
        );
      }

      if (insights.length === 0) {
        insights.push('📊 Run predictions above to generate actionable insights based on equipment health forecasts');
      }

      return insights;
    }
    
    return ['📊 Generate forecast or predictions to see insights'];
  };

  const generateMockInsights = (contextType: string, currentForecast?: ForecastResponse | null): InsightCategory[] => {
    const batterySOC = healthStatus?.battery_soc || 50;
    const gridDraw = healthStatus?.grid_draw || 0;
    const pvGeneration = healthStatus?.pv_generation_today || 0;

    if (contextType === 'forecast') {
      // Generate insights based on actual forecast data
      const peakHour = currentForecast?.summary?.peak_hour || 14;
      const minHour = currentForecast?.summary?.min_hour || 2;
      const peakDemand = currentForecast?.summary?.peak || 0;
      const minDemand = currentForecast?.summary?.min || 0;
      const avgDemand = currentForecast?.summary?.average || 0;
      const total24h = currentForecast?.summary?.total_24h || 0;
      const demandVariability = peakDemand > 0 ? ((peakDemand - minDemand) / peakDemand * 100).toFixed(1) : 0;

      return [
        {
          title: 'Peak Demand Management',
          icon: <TrendingUp className="w-6 h-6" />,
          color: 'text-red-600 dark:text-red-400',
          insights: [
            `Peak demand of ${peakDemand.toFixed(2)} kW expected at ${peakHour}:00. Pre-charge battery by ${peakHour - 2}:00 to avoid grid stress.`,
            `Demand variability is ${demandVariability}%. High variability suggests opportunities for load shifting.`,
            `Schedule heavy equipment operation during low-demand period (${minHour}:00 - ${peakHour - 3}:00).`
          ]
        },
        {
          title: 'Energy Cost Optimization',
          icon: <TrendingUp className="w-6 h-6" />,
          color: 'text-green-600 dark:text-green-400',
          insights: [
            `Minimum demand of ${minDemand.toFixed(2)} kW at ${minHour}:00 - ideal for battery charging to save ${((peakDemand - minDemand) * 0.3 * 5).toFixed(2)} INR.`,
            `Shifting ${(peakDemand * 0.25).toFixed(2)} kW load from peak (${peakHour}:00) to off-peak could reduce daily costs by 15-18%.`,
            `Total forecasted consumption: ${total24h.toFixed(2)} kWh. Battery dispatch can offset ${(total24h * 0.2).toFixed(2)} kWh from grid.`
          ]
        },
        {
          title: 'Battery Strategy',
          icon: <Battery className="w-6 h-6" />,
          color: batterySOC < 30 ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400',
          insights: [
            `Current SoC: ${batterySOC.toFixed(1)}%. ${batterySOC < 30 ? `Charge immediately to meet ${peakHour}:00 peak demand!` : `Sufficient charge available for peak demand support.`}`,
            `Optimal discharge window: ${peakHour - 1}:00 to ${peakHour + 2}:00 to shave ${(peakDemand * 0.3).toFixed(2)} kW from peak.`,
            `Charge during ${minHour}:00 - ${minHour + 4}:00 when demand is ${minDemand.toFixed(2)} kW to minimize grid impact.`
          ]
        },
        {
          title: 'Load Pattern Analysis',
          icon: <Zap className="w-6 h-6" />,
          color: 'text-blue-600 dark:text-blue-400',
          insights: [
            `Average demand: ${avgDemand.toFixed(2)} kW. Peak is ${((peakDemand / avgDemand - 1) * 100).toFixed(1)}% higher than average.`,
            `Base load: ${minDemand.toFixed(2)} kW. Consider renewable sources to cover ${Math.min(100, (minDemand / avgDemand * 100)).toFixed(1)}% of base load.`,
            pvGeneration > 0 ? `Solar offset: ${((pvGeneration / total24h) * 100).toFixed(1)}% of forecasted consumption. Target 40% for optimal savings.` : 'No solar generation. PV installation could offset 30-40% of forecasted demand.'
          ]
        }
      ];
    } else {
      // Generate insights based on actual prediction data
      const battData = predictionData?.battery;
      const solarData = predictionData?.solar;
      const lossData = predictionData?.loss;

      const batteryInsights: string[] = [];
      const solarInsights: string[] = [];
      const lossInsights: string[] = [];
      const combinedInsights: string[] = [];

      if (battData?.predictions && battData.predictions.length > 0) {
        const initialRUL = battData.predictions[0]?.rul_hours || 0;
        const finalRUL = battData.predictions[battData.predictions.length - 1]?.rul_hours || 0;
        const degradationRate = initialRUL > 0 ? ((initialRUL - finalRUL) / initialRUL * 100).toFixed(1) : 0;
        const cyclesAnalyzed = battData.predictions.length;

        batteryInsights.push(
          `Battery RUL: ${initialRUL.toFixed(0)} hours initially, declining to ${finalRUL.toFixed(0)} hours over ${cyclesAnalyzed} cycles (${degradationRate}% degradation).`,
          `Current degradation rate: ${(parseFloat(degradationRate as string) / cyclesAnalyzed).toFixed(2)}% per cycle. Maintain temperature 20-30°C to reduce rate.`,
          finalRUL < 500 ? `⚠️ RUL below 500 hours. Schedule battery replacement within ${Math.ceil(finalRUL / 24)} days.` : `Battery health stable. Projected lifespan: ${Math.ceil(finalRUL / 24)} days remaining.`
        );
      } else {
        batteryInsights.push('Load Battery RUL predictions to analyze degradation trends and maintenance needs.');
      }

      if (solarData?.predictions && solarData.predictions.length > 0) {
        const initialEff = solarData.predictions[0]?.efficiency_current || 18;
        const finalEff = solarData.predictions[solarData.predictions.length - 1]?.efficiency_current || 16;
        const yearsAnalyzed = solarData.predictions.length;
        const annualDegradation = yearsAnalyzed > 0 ? ((initialEff - finalEff) / yearsAnalyzed).toFixed(3) : 0;

        solarInsights.push(
          `Solar efficiency: ${initialEff.toFixed(2)}% initially, declining to ${finalEff.toFixed(2)}% over ${yearsAnalyzed} years.`,
          `Annual degradation: ${annualDegradation}% per year. Industry standard: 0.5-0.8%. ${parseFloat(annualDegradation as string) > 0.8 ? '⚠️ Above standard - inspect panels!' : '✓ Within acceptable range.'}`,
          `At current rate, panels will retain ${(finalEff - (parseFloat(annualDegradation as string) * 5)).toFixed(2)}% efficiency at year ${yearsAnalyzed + 5}. Plan maintenance accordingly.`
        );
      } else {
        solarInsights.push('Load Solar Degradation predictions to track panel performance over time.');
      }

      if (lossData?.predictions && lossData.predictions.length > 0) {
        const avgLoss = lossData.predictions.reduce((sum: number, p: any) => sum + (p.loss_percent || 0), 0) / lossData.predictions.length;
        const maxLoss = Math.max(...lossData.predictions.map((p: any) => p.loss_percent || 0));
        const optimalLoad = lossData.predictions.find((p: any) => p.loss_percent === Math.min(...lossData.predictions.map((p: any) => p.loss_percent || 0)));
        const avgEfficiency = lossData.predictions.reduce((sum: number, p: any) => sum + (p.efficiency_percent || 0), 0) / lossData.predictions.length;

        lossInsights.push(
          `Average energy loss: ${avgLoss.toFixed(2)}% across load range. Peak loss: ${maxLoss.toFixed(2)}% at high loads.`,
          optimalLoad ? `Optimal efficiency at ${optimalLoad.load_kw.toFixed(0)} kW load (${optimalLoad.loss_percent.toFixed(2)}% loss). Target this load range for operations.` : 'Operate within 50-75% transformer capacity for optimal efficiency.',
          `System efficiency: ${avgEfficiency.toFixed(2)}%. ${avgEfficiency < 95 ? '⚠️ Review cable sizing and transformer loading.' : '✓ Efficient operation maintained.'}`
        );
      } else {
        lossInsights.push('Load Energy Loss predictions to identify efficiency optimization opportunities.');
      }

      // Combined strategic insights
      combinedInsights.push(
        `Integrate predictions: ${battData ? 'Battery health tracking active. ' : ''}${solarData ? 'Solar monitoring active. ' : ''}${lossData ? 'Loss analysis active.' : ''}`,
        'Use predictive maintenance to reduce downtime by 30-40% compared to reactive maintenance.',
        `Optimize asset lifecycle: Battery replacement planning + Solar cleaning schedule + Loss minimization = 20-25% cost reduction.`
      );

      return [
        {
          title: 'Battery Health & Maintenance',
          icon: <Battery className="w-6 h-6" />,
          color: battData?.predictions?.[battData.predictions.length - 1]?.rul_hours < 500 ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400',
          insights: batteryInsights
        },
        {
          title: 'Solar Performance Tracking',
          icon: <Zap className="w-6 h-6" />,
          color: 'text-yellow-600 dark:text-yellow-400',
          insights: solarInsights
        },
        {
          title: 'System Efficiency Analysis',
          icon: <AlertTriangle className="w-6 h-6" />,
          color: lossData?.predictions?.reduce((sum: number, p: any) => sum + (p.loss_percent || 0), 0) / (lossData?.predictions?.length || 1) > 5 ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400',
          insights: lossInsights
        },
        {
          title: 'Strategic Recommendations',
          icon: <Lightbulb className="w-6 h-6" />,
          color: 'text-purple-600 dark:text-purple-400',
          insights: combinedInsights
        }
      ];
    }
  };

  return (
    <Card className="mt-6">
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1">
              Actionable Insights
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              AI-powered recommendations based on {context === 'forecast' ? 'forecast data' : context === 'predictions' ? 'prediction models' : 'real-time system data'}
            </p>
          </div>
          <button
            onClick={generateInsights}
            disabled={isGenerating}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all text-sm"
          >
            {isGenerating ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Generating...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Generate Insights</span>
              </>
            )}
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-start space-x-2">
            <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
            <p className="text-red-700 dark:text-red-400 text-sm">{error}</p>
          </div>
        )}

        {insights.length === 0 && !isGenerating && (
          <div className="text-center py-8">
            <Sparkles className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              Click "Generate Insights" to get AI-powered recommendations
            </p>
          </div>
        )}

        {insights.length > 0 && (
          <>
            {compact ? (
              // Compact mode: Single vertical list
              <div className="space-y-2">
                {insights[0]?.insights.map((insight, idx) => (
                  <div 
                    key={idx} 
                    className="bg-white dark:bg-gray-700 rounded-lg p-3 shadow-sm border border-gray-200 dark:border-gray-600 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start space-x-2">
                      <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                      <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed flex-1">
                        {insight}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              // Full mode: 2x2 grid with categories
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {insights.map((category, index) => (
                  <div key={index} className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4">
                    {/* Category Header */}
                    <div className="flex items-center space-x-2 mb-3">
                      <div className={`p-1.5 rounded-lg bg-gradient-to-br ${getCategoryBgColor(category.title)}`}>
                        <div className={`${category.color}`}>
                          {category.icon}
                        </div>
                      </div>
                      <h4 className="text-lg font-bold text-gray-900 dark:text-white">
                        {category.title}
                      </h4>
                    </div>
                    
                    {/* Sub-cards for each insight */}
                    <div className="space-y-2">
                      {category.insights.map((insight, idx) => (
                        <div 
                          key={idx} 
                          className="bg-white dark:bg-gray-700 rounded-lg p-3 shadow-sm border border-gray-200 dark:border-gray-600 hover:shadow-md transition-shadow"
                        >
                          <div className="flex items-start space-x-2">
                            <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                            <p className="text-gray-700 dark:text-gray-300 text-xs leading-relaxed flex-1">
                              {insight}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {lastGenerated && (
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-4 text-center">
            Last generated: {lastGenerated.toLocaleString()}
          </p>
        )}
      </div>
    </Card>
  );
};

export default ActionableInsights;


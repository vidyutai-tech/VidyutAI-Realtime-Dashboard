import React, { useState, useContext, useEffect } from 'react';
import Card from '../components/ui/Card';
import { Battery, Loader, AlertTriangle } from 'lucide-react';
import { getBatteryRULDashboard } from '../services/api';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Area, AreaChart, ReferenceLine } from 'recharts';
import { AppContext } from '../contexts/AppContext';

const PredictionsPage: React.FC = () => {
    const { theme } = useContext(AppContext)!;
    const gridColor = theme === 'dark' ? '#374151' : '#e5e7eb';
    const textColor = theme === 'dark' ? '#9ca3af' : '#6b7281';
    const bgColor = theme === 'dark' ? '#1f2937' : '#ffffff';

    // State for Battery RUL Model
    const [batteryRULData, setBatteryRULData] = useState<{
        predictions: Array<{ timestamp: string; prediction: number; ci_lower: number; ci_upper: number; actual?: number }>;
        summary: { test_mae: number; test_rmse: number; test_r2: number };
    } | null>(null);
    const [isBatteryRULLoading, setIsBatteryRULLoading] = useState(false);
    const [batteryRULError, setBatteryRULError] = useState(false);

    // Auto-load on mount
    useEffect(() => {
        handleBatteryRUL();
    }, []);

    const handleBatteryRUL = async () => {
        setIsBatteryRULLoading(true);
        setBatteryRULData(null);
        setBatteryRULError(false);
        try {
            const result = await getBatteryRULDashboard();
            setBatteryRULData({
                predictions: result.predictions,
                summary: result.summary
            });
        } catch (e) { 
            setBatteryRULError(true); 
        }
        finally { setIsBatteryRULLoading(false); }
    };

    // Prepare chart data with historical (actual) and future (predicted) sections
    const prepareChartData = () => {
        if (!batteryRULData) return [];

        const predictions = batteryRULData.predictions;
        const data: Array<{
            index: number;
            timestamp: string;
            health: number | null;
            predicted: number | null;
            ci_lower: number | null;
            ci_upper: number | null;
            isHistorical: boolean;
            isPresent: boolean;
        }> = [];

        // Find the present point (where we transition from historical to predicted)
        const presentIndex = Math.floor(predictions.length * 0.7); // 70% historical, 30% future
        
        // Add historical data (State of Health)
        for (let i = 0; i < presentIndex; i++) {
            const pred = predictions[i];
            data.push({
                index: i,
                timestamp: new Date(pred.timestamp).toLocaleString('en-US', { 
                    month: 'short', 
                    day: 'numeric', 
                    hour: '2-digit', 
                    minute: '2-digit' 
                }),
                health: pred.actual ?? pred.prediction, // Use actual if available, else prediction
                predicted: null,
                ci_lower: null,
                ci_upper: null,
                isHistorical: true,
                isPresent: false
            });
        }

        // Add present marker
        const presentPred = predictions[presentIndex];
        data.push({
            index: presentIndex,
            timestamp: 'Present',
            health: presentPred.actual ?? presentPred.prediction,
            predicted: presentPred.prediction,
            ci_lower: presentPred.ci_lower,
            ci_upper: presentPred.ci_upper,
            isHistorical: false,
            isPresent: true
        });

        // Add future predictions (Remaining Useful Life)
        for (let i = presentIndex + 1; i < predictions.length; i++) {
            const pred = predictions[i];
            data.push({
                index: i,
                timestamp: new Date(pred.timestamp).toLocaleString('en-US', { 
                    month: 'short', 
                    day: 'numeric', 
                    hour: '2-digit', 
                    minute: '2-digit' 
                }),
                health: null,
                predicted: pred.prediction,
                ci_lower: pred.ci_lower,
                ci_upper: pred.ci_upper,
                isHistorical: false,
                isPresent: false
            });
        }

        return data;
    };

    const chartData = prepareChartData();
    
    // Calculate max health for Beginning of Life line
    const maxHealth = chartData.length > 0 
        ? Math.max(...chartData.map(d => d.health ?? d.predicted ?? 0).filter(v => v > 0))
        : 100;
    
    // Calculate min health for End of Life line (typically 0 or threshold)
    const minHealth = 0;
    const endOfLifeThreshold = maxHealth * 0.2; // 20% of max as EOL threshold

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-4 md:p-6 lg:p-8">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-6">
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                        Battery Remaining Useful Life (RUL) Prediction
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400">
                        State of Health Estimation and Remaining Useful Life Prediction using Machine Learning
                    </p>
                </div>

                {/* Main Chart Card */}
                <Card className="mb-6">
                    <div className="p-6">
                        {isBatteryRULLoading && (
                            <div className="flex items-center justify-center h-96">
                                <Loader className="w-8 h-8 animate-spin text-green-500" />
                    </div>
                        )}

                        {batteryRULError && (
                            <div className="flex flex-col items-center justify-center h-96 text-red-500">
                                <AlertTriangle className="w-12 h-12 mb-4" />
                                <p className="text-lg font-semibold">Failed to load Battery RUL data</p>
                                <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                                    Please ensure the model is trained by running train_battery_rul.py
                                </p>
                                <button 
                                    onClick={handleBatteryRUL}
                                    className="mt-4 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md font-semibold"
                                >
                                    Retry
                    </button>
                            </div>
                        )}

                        {batteryRULData && chartData.length > 0 && (
                            <div>
                                {/* Chart Legend */}
                                <div className="flex items-center justify-between mb-4 flex-wrap gap-4">
                                    <div className="flex items-center gap-4">
                                        <div className="flex items-center gap-2">
                                            <div className="w-4 h-0.5 bg-black dark:bg-white"></div>
                                            <span className="text-sm text-gray-700 dark:text-gray-300">State of Health (Historical)</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div className="w-4 h-0.5 border-dashed border-2 border-blue-600"></div>
                                            <span className="text-sm text-gray-700 dark:text-gray-300">Remaining Useful Life (Predicted)</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div className="w-4 h-2 bg-blue-200 dark:bg-blue-900/30"></div>
                                            <span className="text-sm text-gray-700 dark:text-gray-300">Confidence Interval</span>
                                        </div>
                                    </div>
                                    {batteryRULData.summary && (
                                        <div className="text-xs text-gray-500 dark:text-gray-400">
                                            <span className="font-semibold">Model Performance: </span>
                                            R² = {(batteryRULData.summary.test_r2 * 100).toFixed(1)}% | 
                                            MAE = {batteryRULData.summary.test_mae.toFixed(2)}h | 
                                            RMSE = {batteryRULData.summary.test_rmse.toFixed(2)}h
                                        </div>
                                    )}
                    </div>

                                {/* Chart with two sections */}
                                <div className="relative border-2 border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden bg-white dark:bg-gray-800">
                                    {/* Historical Section Background (White) */}
                                    {(() => {
                                        const presentIdx = chartData.findIndex(d => d.isPresent);
                                        const historicalPercent = presentIdx > 0 ? (presentIdx / chartData.length) * 100 : 70;
                                        return (
                                            <div 
                                                className="absolute left-0 top-0 bottom-0 bg-white dark:bg-gray-800 z-0"
                                                style={{ width: `${historicalPercent}%` }}
                                            />
                                        );
                                    })()}
                                    {/* Future Section Background (Blue Gradient) */}
                                    {(() => {
                                        const presentIdx = chartData.findIndex(d => d.isPresent);
                                        const historicalPercent = presentIdx > 0 ? (presentIdx / chartData.length) * 100 : 70;
                                        const futurePercent = 100 - historicalPercent;
                                        return (
                                            <div 
                                                className="absolute right-0 top-0 bottom-0 bg-gradient-to-r from-blue-50 via-blue-100 to-blue-200 dark:from-blue-900/20 dark:via-blue-800/30 dark:to-blue-700/40 z-0"
                                                style={{ 
                                                    width: `${futurePercent}%`,
                                                    left: `${historicalPercent}%`
                                                }}
                                            />
                                        );
                                    })()}
                                    <div className="relative z-10">
                                        <ResponsiveContainer width="100%" height={500}>
                                            <AreaChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                                            <defs>
                                                <linearGradient id="colorHistorical" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#1f2937" stopOpacity={0.1}/>
                                                    <stop offset="95%" stopColor="#1f2937" stopOpacity={0}/>
                                                </linearGradient>
                                                <linearGradient id="colorPredicted" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2}/>
                                                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                                                </linearGradient>
                                            </defs>
                                            <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                                            
                                            {/* X Axis */}
                                        <XAxis 
                                                dataKey="timestamp" 
                                          stroke={textColor} 
                                                tick={{ fontSize: 11 }}
                                                interval={Math.max(1, Math.floor(chartData.length / 12))}
                                                label={{ value: 'Time', position: 'insideBottom', offset: -10, fill: textColor, fontSize: 12 }}
                                        />
                                            
                                            {/* Y Axis */}
                                        <YAxis 
                                          stroke={textColor} 
                                                tick={{ fontSize: 11 }}
                                                label={{ value: 'Health / RUL (Hours)', angle: -90, position: 'insideLeft', fill: textColor, fontSize: 12 }}
                                                domain={[minHealth, maxHealth * 1.1]}
                                            />
                                            
                                        <Tooltip 
                                                contentStyle={{ 
                                                    backgroundColor: bgColor, 
                                                    border: `1px solid ${gridColor}`,
                                                    borderRadius: '8px'
                                                }}
                                                formatter={(value: any, name: string) => {
                                                    if (name === 'health') return [`${Number(value).toFixed(2)}h`, 'State of Health'];
                                                    if (name === 'predicted') return [`${Number(value).toFixed(2)}h`, 'Predicted RUL'];
                                                    return [value, name];
                                                }}
                                            />

                                            {/* Beginning of Life Reference Line */}
                                            <ReferenceLine 
                                                y={maxHealth} 
                                                stroke="#10b981" 
                                                strokeDasharray="5 5" 
                                                strokeWidth={2}
                                                label={{ value: "Beginning of Life", position: "topRight", fill: textColor, fontSize: 10 }}
                                            />

                                            {/* End of Life Reference Line */}
                                            <ReferenceLine 
                                                y={endOfLifeThreshold} 
                                                stroke="#ef4444" 
                                                strokeDasharray="5 5" 
                                                strokeWidth={2}
                                                label={{ value: "End of Life", position: "bottomRight", fill: textColor, fontSize: 10 }}
                                            />

                                            {/* Present Marker - Vertical Line */}
                                            {chartData.find(d => d.isPresent) && (
                                                <ReferenceLine 
                                                    x={chartData.findIndex(d => d.isPresent)} 
                                                    stroke="#f59e0b" 
                                                    strokeWidth={2}
                                                    label={{ value: "Present", position: "top", fill: "#f59e0b", fontSize: 11, fontWeight: 'bold' }}
                                                />
                                            )}

                                            {/* Confidence Interval Area (Future predictions only) */}
                                            <Area
                                                type="monotone"
                                                dataKey="ci_upper"
                                                stroke="none"
                                                fill="url(#colorPredicted)"
                                                fillOpacity={0.15}
                                                connectNulls={false}
                                            />
                                            <Area
                                                type="monotone"
                                                dataKey="ci_lower"
                                                stroke="none"
                                                fill={bgColor}
                                                fillOpacity={1}
                                                connectNulls={false}
                                            />

                                            {/* Historical State of Health Line (Solid) */}
                                            <Line
                                                type="monotone"
                                                dataKey="health"
                                                stroke="#000000"
                                                strokeWidth={3}
                                                dot={false}
                                                connectNulls={false}
                                                name="State of Health"
                                            />

                                            {/* Predicted RUL Line (Dashed) */}
                                            <Line
                                                type="monotone"
                                                dataKey="predicted"
                                                stroke="#3b82f6"
                                                strokeWidth={2.5}
                                                strokeDasharray="8 4"
                                                dot={false}
                                                connectNulls={false}
                                                name="Remaining Useful Life"
                                            />

                                            {/* End of Life Intersection Point */}
                                            {(() => {
                                                const eolPoint = chartData.find((d, idx) => {
                                                    if (!d.predicted) return false;
                                                    const next = chartData[idx + 1];
                                                    return d.predicted > endOfLifeThreshold && 
                                                           next && next.predicted <= endOfLifeThreshold;
                                                });
                                                if (eolPoint) {
                                                    const eolIndex = chartData.indexOf(eolPoint);
                                                    return (
                                                        <ReferenceLine 
                                                            x={eolIndex} 
                                                            y={endOfLifeThreshold} 
                                                            stroke="#ef4444" 
                                                            strokeWidth={3}
                                                            shape={<circle r={5} fill="#ef4444" />}
                                                        />
                                                    );
                                                }
                                                return null;
                                            })()}
                                        </AreaChart>
                                </ResponsiveContainer>
                                    </div>

                                    {/* Section Labels */}
                                    <div className="absolute top-4 left-4 bg-white/90 dark:bg-gray-800/90 px-3 py-1.5 rounded-md border border-gray-200 dark:border-gray-700 shadow-sm">
                                        <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">Post → State of Health Estimation</span>
                                    </div>
                                    <div className="absolute top-4 right-4 bg-blue-100/90 dark:bg-blue-900/40 px-3 py-1.5 rounded-md border border-blue-300 dark:border-blue-700 shadow-sm">
                                        <span className="text-xs font-semibold text-blue-700 dark:text-blue-300">Future → Remaining Useful Life Prediction</span>
                                    </div>
                                    {/* Time Labels at bottom */}
                                    <div className="absolute bottom-2 left-4 text-xs text-gray-500 dark:text-gray-400 font-medium">
                                        Post
                                    </div>
                                    <div className="absolute bottom-2 right-4 text-xs text-gray-500 dark:text-gray-400 font-medium">
                                        Future
                                    </div>
                                </div>
                                </div>
                            )}
                    </div>
                </Card>

                {/* Model Info Card */}
                {batteryRULData && (
                    <Card>
                        <div className="p-6">
                            <div className="flex items-center mb-4">
                                <Battery className="w-6 h-6 mr-3 text-green-500"/>
                                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                                    Model Information
                                </h3>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Model Type</h4>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">RandomForest Regressor</p>
                                </div>
                                <div>
                                    <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Features</h4>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">69 engineered features (rolling stats, battery metrics)</p>
                                </div>
                                <div>
                                    <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Training Data</h4>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">Synthetic dataset with hourly timeseries</p>
                                </div>
                                <div>
                                    <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Output</h4>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">RUL in hours with 95% confidence intervals</p>
                                </div>
                            </div>
                        </div>
                    </Card>
                )}
            </div>
        </div>
    );
};

export default PredictionsPage;

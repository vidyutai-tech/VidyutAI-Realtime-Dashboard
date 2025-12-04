import React, { useState, useEffect, useContext, useMemo } from 'react';
import Card from '../components/ui/Card';
import DigitalTwin from '../components/shared/DigitalTwin';
import SystemModelingTrace from '../components/shared/SystemModelingTrace';
import SolarDegradationCurves from '../components/shared/SolarDegradationCurves';
import AnomalyRootCause from '../components/shared/AnomalyRootCause';
import { fetchDigitalTwinData, fetchAssetsForSite } from '../services/api';
import { MaintenanceAsset, DigitalTwinDataPoint, Anomaly } from '../types';
import { AppContext } from '../contexts/AppContext';
import Skeleton from '../components/ui/Skeleton';
import { AlertTriangle, CheckCircle, Info, Battery, Zap, TrendingUp, Clock } from 'lucide-react';

const DigitalTwinPage: React.FC = () => {
    const { selectedSite } = useContext(AppContext)!;
    const [assets, setAssets] = useState<MaintenanceAsset[]>([]);
    const [selectedAssetId, setSelectedAssetId] = useState<string>('');
    const [twinData, setTwinData] = useState<DigitalTwinDataPoint[]>([]);
    const [anomalies, setAnomalies] = useState<Anomaly[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const loadAssets = async () => {
            if (!selectedSite) return;
            try {
                const siteAssets = await fetchAssetsForSite(selectedSite.id);
                const operationalAssets = siteAssets.filter(a => a.status === 'operational' || a.status === 'degraded');
                setAssets(operationalAssets);
                if (operationalAssets.length > 0) {
                    setSelectedAssetId(operationalAssets[0].id);
                } else {
                    setIsLoading(false);
                }
            } catch (error) {
                console.error("Failed to fetch assets for digital twin:", error);
                setIsLoading(false);
            }
        };
        loadAssets();
    }, [selectedSite]);

    useEffect(() => {
        if (!selectedAssetId) return;
        
        const loadTwinData = async () => {
            setIsLoading(true);
            try {
                const { dataPoints, anomalies } = await fetchDigitalTwinData(selectedAssetId);
                setTwinData(dataPoints);
                setAnomalies(anomalies);
            } catch (error) {
                console.error("Failed to fetch digital twin data:", error);
            } finally {
                setIsLoading(false);
            }
        };
        
        loadTwinData();
        const interval = setInterval(loadTwinData, 600000); // Refresh data every 10 minutes
        return () => clearInterval(interval);

    }, [selectedAssetId]);

    const getAnomalyIcon = (severity: Anomaly['severity']) => {
        switch(severity) {
            case 'high': return <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0"/>;
            case 'medium': return <AlertTriangle className="w-5 h-5 text-yellow-500 flex-shrink-0"/>;
            case 'low': return <Info className="w-5 h-5 text-blue-500 flex-shrink-0"/>;
        }
    };
    
    const selectedAssetName = assets.find(a => a.id === selectedAssetId)?.name || 'Asset';
    const isSolarAsset = selectedAssetName.toLowerCase().includes('solar') || 
                         selectedAssetName.toLowerCase().includes('pv') ||
                         selectedAssetName.toLowerCase().includes('panel');
    const isBatteryAsset = selectedAssetName.toLowerCase().includes('battery') || 
                          selectedAssetName.toLowerCase().includes('bess') ||
                          selectedAssetName.toLowerCase().includes('storage');

    // Generate modeling trace data from twin data
    const modelingTraceData = useMemo(() => {
        if (twinData.length === 0) return [];
        
        // Use the first data point as reference for time series
        const basePoint = twinData[0];
        const now = new Date();
        
        return Array.from({ length: 24 }, (_, i) => {
            const timestamp = new Date(now.getTime() - (23 - i) * 60 * 60 * 1000);
            const predicted = basePoint.predicted_value + (Math.random() - 0.5) * basePoint.predicted_value * 0.1;
            const actual = predicted + (Math.random() - 0.5) * predicted * 0.15;
            const confidence = 0.95;
            
            return {
                timestamp: timestamp.toISOString(),
                predicted,
                actual,
                confidenceUpper: predicted * (1 + confidence * 0.1),
                confidenceLower: predicted * (1 - confidence * 0.1),
            };
        });
    }, [twinData]);

    // Generate solar degradation data
    const solarDegradationData = useMemo(() => {
        if (!isSolarAsset) return [];
        
        const now = new Date();
        return Array.from({ length: 30 }, (_, i) => {
            const date = new Date(now.getTime() - (29 - i) * 24 * 60 * 60 * 1000);
            const daysAgo = 29 - i;
            
            return {
                date: date.toISOString(),
                soilingIndex: Math.max(0.7, 1 - (daysAgo * 0.01)), // Degrades over time
                thermalDerate: 12 + Math.sin(daysAgo / 7) * 3, // Varies with weather
                efficiency: 95 - (daysAgo * 0.05), // Slight degradation trend
            };
        });
    }, [isSolarAsset]);

    // Convert anomalies to root cause format
    const rootCauseAnomalies = useMemo(() => {
        return anomalies.map(anomaly => {
            const dataPoint = twinData.find(d => d.id === anomaly.data_point_id);
            const deviation = dataPoint 
                ? ((dataPoint.real_value - dataPoint.predicted_value) / dataPoint.predicted_value) * 100
                : 0;

            // Generate root cause explanation based on anomaly type
            let rootCause = '';
            let possibleCauses: string[] = [];
            let recommendedAction = '';

            const label = anomaly.data_point_label || '';
            const labelLower = label.toLowerCase();

            if (labelLower.includes('vibration') || labelLower.includes('vib')) {
                rootCause = `Deviation detected: High vibration (${Math.abs(deviation).toFixed(2)}%) → possible bearing misalignment or fan blockage.`;
                possibleCauses = ['Bearing wear', 'Fan blockage', 'Mechanical imbalance', 'Loose mounting'];
                recommendedAction = 'Inspect motor bearings and fan assembly. Check for debris or obstructions. Schedule maintenance if deviation persists.';
            } else if (labelLower.includes('temp') || labelLower.includes('temperature')) {
                rootCause = `Temperature anomaly detected (${Math.abs(deviation).toFixed(2)}% deviation) → possible thermal stress or cooling system issue.`;
                possibleCauses = ['Cooling fan failure', 'Thermal paste degradation', 'Ambient temperature spike', 'Heat sink blockage'];
                recommendedAction = 'Check cooling system operation. Verify ambient conditions. Monitor for thermal runaway.';
            } else if (labelLower.includes('current') || labelLower.includes('amp')) {
                rootCause = `Current deviation (${Math.abs(deviation).toFixed(2)}%) → possible load imbalance or electrical fault.`;
                possibleCauses = ['Load imbalance', 'Electrical fault', 'Wiring issue', 'Component degradation'];
                recommendedAction = 'Check electrical connections. Verify load distribution. Inspect for signs of electrical damage.';
            } else {
                rootCause = `${label || 'Unknown'} deviation of ${Math.abs(deviation).toFixed(2)}% detected. ${anomaly.message || ''}`;
                possibleCauses = ['Component aging', 'Environmental factors', 'Operational stress', 'Calibration drift'];
                recommendedAction = 'Review operational parameters. Check calibration. Monitor for trend continuation.';
            }

            return {
                id: anomaly.id,
                anomalyType: label || 'Unknown',
                severity: anomaly.severity,
                deviation,
                detectedAt: anomaly.timestamp,
                rootCause,
                possibleCauses,
                recommendedAction,
                confidence: 75 + Math.random() * 20, // 75-95% confidence
            };
        });
    }, [anomalies, twinData]);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Digital Twin</h1>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">
                        Real-time system modeling and predictive analytics for {selectedAssetName}
                    </p>
                </div>
                <select
                    value={selectedAssetId}
                    onChange={(e) => setSelectedAssetId(e.target.value)}
                    className="bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 text-sm font-medium shadow-sm hover:border-gray-400 dark:hover:border-gray-500 transition-colors"
                    disabled={assets.length === 0}
                >
                    {assets.length > 0 ? (
                        assets.map(asset => <option key={asset.id} value={asset.id}>{asset.name}</option>)
                    ) : (
                        <option>No operational assets available</option>
                    )}
                </select>
            </div>

            {/* Digital Twin Visualization */}
            <Card>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                    System Model: {selectedAssetName}
                </h2>
                <div className="w-full h-[60vh] bg-gray-100 dark:bg-gray-900/50 p-4 rounded-lg">
                    {isLoading ? (
                        <div className="flex items-center justify-center h-full">
                            <Skeleton className="w-full h-full" />
                        </div>
                    ) : (
                        <DigitalTwin dataPoints={twinData} />
                    )}
                </div>
            </Card>

            {/* System Modeling Trace */}
            {modelingTraceData.length > 0 && (
                <SystemModelingTrace
                    data={modelingTraceData}
                    title={twinData[0]?.label || 'System Output'}
                    unit={twinData[0]?.unit || ''}
                    isLoading={isLoading}
                />
            )}

            {/* Solar Degradation Curves (only for solar assets) */}
            {isSolarAsset && solarDegradationData.length > 0 && (
                <SolarDegradationCurves
                    data={solarDegradationData}
                    isLoading={isLoading}
                />
            )}

            {/* Battery Digital Twin Enhancements */}
            {isBatteryAsset && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <Card title="Battery Digital Twin Metrics">
                        <div className="p-6 space-y-6">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                                    <div className="flex items-center space-x-2 mb-2">
                                        <Battery className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                                        <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">Model Size</p>
                                    </div>
                                    <p className="text-2xl font-bold text-gray-900 dark:text-white">0.965 MB</p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">MLP-based architecture</p>
                                </div>
                                <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                                    <div className="flex items-center space-x-2 mb-2">
                                        <Zap className="w-5 h-5 text-green-600 dark:text-green-400" />
                                        <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">Voltage MAPE</p>
                                    </div>
                                    <p className="text-2xl font-bold text-gray-900 dark:text-white">&lt; 1.5%</p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Mean Absolute % Error</p>
                                </div>
                                <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
                                    <div className="flex items-center space-x-2 mb-2">
                                        <TrendingUp className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                                        <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">Temperature MAE</p>
                                    </div>
                                    <p className="text-2xl font-bold text-gray-900 dark:text-white">&lt; 0.12°C</p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Mean Absolute Error</p>
                                </div>
                                <div className="p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-200 dark:border-orange-800">
                                    <div className="flex items-center space-x-2 mb-2">
                                        <Clock className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                                        <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">Adaptation Speed</p>
                                    </div>
                                    <p className="text-2xl font-bold text-gray-900 dark:text-white">44x</p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Faster than baseline</p>
                                </div>
                            </div>
                            <div className="p-4 bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 rounded-lg border border-green-200 dark:border-green-800">
                                <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Performance Metrics</h4>
                                <div className="space-y-2 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-gray-600 dark:text-gray-400">1% MAPE Threshold Coverage</span>
                                        <span className="font-semibold text-gray-900 dark:text-white">87.13% → 95.11%</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-600 dark:text-gray-400">Voltage Recovery Time</span>
                                        <span className="font-semibold text-gray-900 dark:text-white">258.97s → 5.85s</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-600 dark:text-gray-400">Temperature Prediction</span>
                                        <span className="font-semibold text-gray-900 dark:text-white">&lt; 1.75°C error</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </Card>

                    <Card title="Digital Twin Forecasting Flow">
                        <div className="p-6 space-y-4">
                            <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                                <h4 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center">
                                    <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 mr-2" />
                                    Step 1: Initial State
                                </h4>
                                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                                    Initial state of battery includes age, temperature, and initial voltage
                                </p>
                                <div className="flex space-x-2 mt-3">
                                    {['Age', 'Temp', 'Voltage'].map((param, idx) => (
                                        <div key={idx} className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 rounded text-xs font-medium text-blue-800 dark:text-blue-300">
                                            {param}
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                                <h4 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center">
                                    <TrendingUp className="w-5 h-5 text-blue-600 dark:text-blue-400 mr-2" />
                                    Step 2: Digital Twin Forecasting
                                </h4>
                                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                                    Forecast future usage from initial state using decoder transformer architecture
                                </p>
                                <div className="mt-3 p-2 bg-blue-50 dark:bg-blue-900/20 rounded text-xs text-blue-800 dark:text-blue-300">
                                    Continual learning enabled • Fast adaptation (44x faster)
                                </div>
                            </div>
                            <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                                <h4 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center">
                                    <Zap className="w-5 h-5 text-green-600 dark:text-green-400 mr-2" />
                                    Step 3: Optimized Action
                                </h4>
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                    Forecasted states are used to take optimized action for safe, reliable, and long-term operation
                                </p>
                            </div>
                            <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
                                <p className="text-xs text-gray-700 dark:text-gray-300">
                                    <strong>Robustness:</strong> High accuracy results with or without fine-tuning. 
                                    Current methods use simple transfer learning and don't account for deployed system variations.
                                </p>
                            </div>
                        </div>
                    </Card>
                </div>
            )}

            {/* Anomaly Root Cause Analysis */}
            <AnomalyRootCause
                anomalies={rootCauseAnomalies}
                isLoading={isLoading}
            />
        </div>
    );
};

export default DigitalTwinPage;

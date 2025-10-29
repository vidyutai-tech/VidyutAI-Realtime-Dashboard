import React, { useState, useEffect, useContext } from 'react';
import Card from '../components/ui/Card';
import DigitalTwin from '../components/shared/DigitalTwin';
import { fetchDigitalTwinData, fetchAssetsForSite } from '../services/api';
import { MaintenanceAsset, DigitalTwinDataPoint, Anomaly } from '../types';
import { AppContext } from '../contexts/AppContext';
import Skeleton from '../components/ui/Skeleton';
import { AlertTriangle, CheckCircle, Info } from 'lucide-react';

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
        const interval = setInterval(loadTwinData, 5000); // Refresh data every 5 seconds
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

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
                <Card>
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-2xl font-bold">Digital Twin: {selectedAssetName}</h2>
                        <select
                            value={selectedAssetId}
                            onChange={(e) => setSelectedAssetId(e.target.value)}
                            className="bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md px-3 py-1.5 text-sm"
                            disabled={assets.length === 0}
                        >
                            {assets.length > 0 ? (
                                assets.map(asset => <option key={asset.id} value={asset.id}>{asset.name}</option>)
                            ) : (
                                <option>No operational assets available</option>
                            )}
                        </select>
                    </div>
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
            </div>
            <div className="lg:col-span-1">
                <Card title="Detected Anomalies">
                    {isLoading ? (
                         <div className="space-y-4">
                            {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}
                         </div>
                    ) : anomalies.length === 0 ? (
                        <div className="flex flex-col items-center justify-center text-center h-48 text-gray-500 dark:text-gray-400">
                           <CheckCircle className="w-12 h-12 text-green-500 mb-2"/>
                           <p className="font-semibold">No Anomalies Detected</p>
                           <p className="text-sm">{selectedAssetName} is operating within healthy parameters.</p>
                        </div>
                    ) : (
                        <ul className="space-y-4">
                            {anomalies.map(anomaly => (
                                <li key={anomaly.id} className="flex items-start space-x-3">
                                    {getAnomalyIcon(anomaly.severity)}
                                    <div>
                                        <p className="font-semibold">{anomaly.data_point_label} Deviation</p>
                                        <p className="text-sm text-gray-600 dark:text-gray-300">{anomaly.message}</p>
                                        <p className="text-xs text-gray-400 dark:text-gray-500">{new Date(anomaly.timestamp).toLocaleString()}</p>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                </Card>
            </div>
        </div>
    );
};

export default DigitalTwinPage;

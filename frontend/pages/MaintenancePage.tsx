import React, { useState, useEffect, useContext } from 'react';
import { Wrench, CheckCircle, HardDrive, Zap, AlertTriangle } from 'lucide-react';
import Card from '../components/ui/Card';
import Skeleton from '../components/ui/Skeleton';
import { fetchAssetsForSite, scheduleMaintenance } from '../services/api';
import { MaintenanceAsset } from '../types';
import { AppContext } from '../contexts/AppContext';

const MaintenancePage: React.FC = () => {
  const [assets, setAssets] = useState<MaintenanceAsset[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [scheduled, setScheduled] = useState<Record<string, boolean>>({});
  const { selectedSite } = useContext(AppContext)!;

  useEffect(() => {
    const loadAssets = async () => {
      if (!selectedSite) return;
      try {
        setIsLoading(true);
        const data = await fetchAssetsForSite(selectedSite.id);
        setAssets(data.sort((a,b) => b.failure_probability - a.failure_probability));
      } catch (error) {
        console.error("Failed to fetch maintenance assets:", error);
      } finally {
        setIsLoading(false);
      }
    };
    loadAssets();
  }, [selectedSite]);

  const handleSchedule = async (assetId: string) => {
    if (!selectedSite) return;
    try {
      await scheduleMaintenance(selectedSite.id, assetId);
      setScheduled(prev => ({...prev, [assetId]: true}));
    } catch (error) {
        console.error("Failed to schedule maintenance:", error);
    }
  };
  
  const getStatusIcon = (status: MaintenanceAsset['status']) => {
      switch(status) {
          case 'operational': return <div className="flex items-center text-green-500"><Zap className="w-4 h-4 mr-2"/> Operational</div>;
          case 'degraded': return <div className="flex items-center text-yellow-500"><AlertTriangle className="w-4 h-4 mr-2"/> Degraded</div>;
          case 'offline': return <div className="flex items-center text-red-500"><Wrench className="w-4 h-4 mr-2"/> Offline</div>;
      }
  }

  return (
    <Card title="Maintenance Priority List">
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-gray-100 dark:bg-gray-700 text-xs text-gray-500 dark:text-gray-300 uppercase">
            <tr>
              <th className="p-3">Rank</th>
              <th className="p-3">Asset Details</th>
              <th className="p-3">Status</th>
              <th className="p-3">Failure Probability</th>
              <th className="p-3 text-center">Action</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              [...Array(5)].map((_, i) => (
                <tr key={i} className="border-b border-gray-200 dark:border-gray-700">
                  <td className="p-3"><Skeleton className="h-5 w-8" /></td>
                  <td className="p-3"><Skeleton className="h-5 w-48" /></td>
                  <td className="p-3"><Skeleton className="h-5 w-24" /></td>
                  <td className="p-3"><Skeleton className="h-5 w-32" /></td>
                  <td className="p-3"><Skeleton className="h-8 w-36 mx-auto" /></td>
                </tr>
              ))
            ) : (
              assets.map(asset => (
                <tr key={asset.id} className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800">
                  <td className="p-3 font-bold text-lg">{asset.rank}</td>
                  <td className="p-3">
                    <p className="font-medium text-gray-900 dark:text-white">{asset.name} ({asset.type})</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Model: {asset.modelNumber} | Installed: {new Date(asset.installDate).toLocaleDateString()}</p>
                  </td>
                  <td className="p-3 text-sm font-semibold">{getStatusIcon(asset.status)}</td>
                  <td className="p-3">
                    <div className="flex items-center">
                      <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2.5">
                        <div className="bg-red-500 h-2.5 rounded-full" style={{ width: `${asset.failure_probability * 100}%` }}></div>
                      </div>
                      <span className="ml-3 font-semibold text-red-500 dark:text-red-400">{(asset.failure_probability * 100).toFixed(2)}%</span>
                    </div>
                  </td>
                  <td className="p-3 text-center">
                    {scheduled[asset.id] ? (
                        <div className="flex items-center justify-center text-green-500">
                            <CheckCircle className="w-5 h-5 mr-2" />
                            <span>Scheduled</span>
                        </div>
                    ) : (
                        <button 
                            onClick={() => handleSchedule(asset.id)}
                            className="flex items-center justify-center px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm font-medium"
                        >
                            <Wrench className="w-4 h-4 mr-2" />
                            Schedule
                        </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </Card>
  );
};

export default MaintenancePage;

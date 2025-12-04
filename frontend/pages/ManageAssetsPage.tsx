import React, { useContext, useState, useEffect } from 'react';
import { AppContext } from '../contexts/AppContext';
import { MaintenanceAsset } from '../types';
import Card from '../components/ui/Card';
import { PlusCircle, Edit, Trash2, Zap, AlertTriangle, Wrench, HardDrive } from 'lucide-react';
import AssetEditorModal from '../components/shared/AssetEditorModal';
import { fetchAssetsForSite, deleteAsset } from '../services/api';
import Skeleton from '../components/ui/Skeleton';

const ManageAssetsPage: React.FC = () => {
    const { selectedSite } = useContext(AppContext)!;
    const [assets, setAssets] = useState<MaintenanceAsset[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedAsset, setSelectedAsset] = useState<MaintenanceAsset | null>(null);

    useEffect(() => {
        const loadAssets = async () => {
            if (!selectedSite) return;
            setIsLoading(true);
            try {
                const data = await fetchAssetsForSite(selectedSite.id);
                setAssets(data);
            } catch (error) {
                console.error("Failed to fetch assets:", error);
            } finally {
                setIsLoading(false);
            }
        };
        loadAssets();
    }, [selectedSite]);

    const handleOpenModal = (asset: MaintenanceAsset | null = null) => {
        setSelectedAsset(asset);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setSelectedAsset(null);
        setIsModalOpen(false);
    };
    
    const handleSaveAsset = (savedAsset: MaintenanceAsset) => {
        const isNew = !assets.some(a => a.id === savedAsset.id);
        if (isNew) {
            setAssets(prev => [...prev, savedAsset]);
        } else {
            setAssets(prev => prev.map(a => a.id === savedAsset.id ? savedAsset : a));
        }
    };

    const handleDelete = async (assetId: string) => {
        if (window.confirm("Are you sure you want to delete this asset?")) {
            try {
                await deleteAsset(assetId);
                setAssets(prev => prev.filter(a => a.id !== assetId));
            } catch (error) {
                console.error("Failed to delete asset:", error);
            }
        }
    };
    
    const getStatusInfo = (status: MaintenanceAsset['status']) => {
        if (!status) return { icon: <HardDrive className="w-4 h-4 text-gray-500"/>, text: 'Unknown', color: 'text-gray-500' };
        
        switch (status) {
            case 'operational': return { icon: <Zap className="w-4 h-4 text-green-500"/>, text: 'Operational', color: 'text-green-500' };
            case 'online': return { icon: <Zap className="w-4 h-4 text-green-500"/>, text: 'Online', color: 'text-green-500' };
            case 'degraded': return { icon: <AlertTriangle className="w-4 h-4 text-yellow-500"/>, text: 'Degraded', color: 'text-yellow-500' };
            case 'warning': return { icon: <AlertTriangle className="w-4 h-4 text-yellow-500"/>, text: 'Warning', color: 'text-yellow-500' };
            case 'offline': return { icon: <Wrench className="w-4 h-4 text-red-500"/>, text: 'Offline', color: 'text-red-500' };
            case 'maintenance': return { icon: <Wrench className="w-4 h-4 text-blue-500"/>, text: 'Maintenance', color: 'text-blue-500' };
            case 'error': return { icon: <AlertTriangle className="w-4 h-4 text-red-500"/>, text: 'Error', color: 'text-red-500' };
            default: return { icon: <HardDrive className="w-4 h-4 text-gray-500"/>, text: status, color: 'text-gray-500' };
        }
    }

    return (
        <>
            <Card>
                <div className="flex justify-between items-center mb-4">
                    <div>
                        <h2 className="text-2xl font-bold">Manage Assets</h2>
                        <p className="text-gray-500 dark:text-gray-400">For site: {selectedSite?.name}</p>
                    </div>
                    <button onClick={() => handleOpenModal()} className="flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-medium">
                        <PlusCircle className="w-5 h-5 mr-2" />
                        Add New Asset
                    </button>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-100 dark:bg-gray-700 text-xs text-gray-500 dark:text-gray-300 uppercase">
                            <tr>
                                <th className="p-3">Asset Name</th>
                                <th className="p-3">Type</th>
                                <th className="p-3">Model</th>
                                <th className="p-3">Install Date</th>
                                <th className="p-3">Status</th>
                                <th className="p-3 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {isLoading ? (
                                [...Array(4)].map((_, i) => (
                                    <tr key={i} className="border-b border-gray-200 dark:border-gray-700"><td colSpan={6} className="p-3"><Skeleton className="h-6 w-full"/></td></tr>
                                ))
                            ) : (
                                assets.map(asset => {
                                    const statusInfo = getStatusInfo(asset.status);
                                    return (
                                        <tr key={asset.id} className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800">
                                            <td className="p-3 font-medium text-gray-900 dark:text-white">{asset.name || 'Unnamed Asset'}</td>
                                            <td className="p-3 text-gray-500 dark:text-gray-400">{asset.type || '-'}</td>
                                            <td className="p-3 text-gray-500 dark:text-gray-400">{asset.modelNumber || '-'}</td>
                                            <td className="p-3 text-gray-500 dark:text-gray-400">
                                                {asset.installDate 
                                                    ? (isNaN(new Date(asset.installDate).getTime()) 
                                                        ? '-' 
                                                        : new Date(asset.installDate).toLocaleDateString())
                                                    : '-'
                                                }
                                            </td>
                                            <td className={`p-3 font-semibold flex items-center ${statusInfo.color}`}>{statusInfo.icon} <span className="ml-2">{statusInfo.text}</span></td>
                                            <td className="p-3 text-right">
                                                <button onClick={() => handleOpenModal(asset)} className="p-2 text-gray-500 hover:text-blue-600"><Edit className="w-5 h-5"/></button>
                                                <button onClick={() => handleDelete(asset.id)} className="p-2 text-gray-500 hover:text-red-600"><Trash2 className="w-5 h-5"/></button>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </Card>
            {isModalOpen && (
                <AssetEditorModal
                    asset={selectedAsset}
                    onClose={handleCloseModal}
                    onSave={handleSaveAsset}
                />
            )}
        </>
    );
};

export default ManageAssetsPage;

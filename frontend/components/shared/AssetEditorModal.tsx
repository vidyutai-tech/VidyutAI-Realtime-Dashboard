import React, { useState, useContext } from 'react';
import Modal from '../ui/Modal';
import { MaintenanceAsset } from '../../types';
import { AppContext } from '../../contexts/AppContext';
import { createAsset, updateAsset } from '../../services/api';

interface AssetEditorModalProps {
    asset: MaintenanceAsset | null;
    onClose: () => void;
    onSave: (asset: MaintenanceAsset) => void;
}

const AssetEditorModal: React.FC<AssetEditorModalProps> = ({ asset, onClose, onSave }) => {
    const { selectedSite } = useContext(AppContext)!;
    const [formData, setFormData] = useState({
        name: asset?.name || '',
        type: asset?.type || 'Motor',
        modelNumber: asset?.modelNumber || '',
        installDate: asset?.installDate ? new Date(asset.installDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        status: asset?.status || 'operational',
    });
    const [isLoading, setIsLoading] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedSite) return;
        setIsLoading(true);
        try {
            if (asset) { // Editing existing asset
                const updatedAssetData = {
                    ...asset,
                    ...formData,
                };
                const savedAsset = await updateAsset(updatedAssetData);
                onSave(savedAsset);
            } else { // Creating new asset
                const newAssetData = {
                    ...formData,
                    siteId: selectedSite.id,
                };
                const savedAsset = await createAsset(newAssetData);
                onSave(savedAsset);
            }
            onClose();
        } catch (error) {
            console.error("Failed to save asset:", error);
        } finally {
            setIsLoading(false);
        }
    };

    // FIX: Replaced invalid <style jsx> tag with standard Tailwind utility classes.
    const inputFieldClasses = "mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500";

    return (
        <Modal isOpen={true} onClose={onClose} title={asset ? 'Edit Asset' : 'Add New Asset'}>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Asset Name</label>
                        <input type="text" id="name" name="name" value={formData.name} onChange={handleChange} required className={inputFieldClasses}/>
                    </div>
                    <div>
                        <label htmlFor="type" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Asset Type</label>
                        <select id="type" name="type" value={formData.type} onChange={handleChange} className={inputFieldClasses}>
                            <option>Motor</option>
                            <option>Inverter</option>
                            <option>Battery</option>
                            <option>HVAC</option>
                            <option>Turbine</option>
                             <option>Mechanical</option>
                        </select>
                    </div>
                     <div>
                        <label htmlFor="modelNumber" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Model Number</label>
                        <input type="text" id="modelNumber" name="modelNumber" value={formData.modelNumber} onChange={handleChange} required className={inputFieldClasses}/>
                    </div>
                    <div>
                        <label htmlFor="installDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Installation Date</label>
                        <input type="date" id="installDate" name="installDate" value={formData.installDate} onChange={handleChange} required className={inputFieldClasses}/>
                    </div>
                     <div className="md:col-span-2">
                        <label htmlFor="status" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Status</label>
                        <select id="status" name="status" value={formData.status} onChange={handleChange} className={inputFieldClasses}>
                            <option value="operational">Operational</option>
                            <option value="online">Online</option>
                            <option value="degraded">Degraded</option>
                            <option value="offline">Offline</option>
                            <option value="maintenance">Maintenance</option>
                        </select>
                    </div>
                </div>
                 <div className="flex justify-end pt-4 space-x-2">
                    <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600">Cancel</button>
                    <button type="submit" disabled={isLoading} className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50">
                        {isLoading ? 'Saving...' : 'Save Asset'}
                    </button>
                </div>
            </form>
        </Modal>
    );
};

export default AssetEditorModal;
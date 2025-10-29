import React, { useContext, useState } from 'react';
import { AppContext } from '../contexts/AppContext';
import { Site } from '../types';
import Card from '../components/ui/Card';
import { PlusCircle, Edit, Trash2, Zap, AlertTriangle, Wrench, MapPin } from 'lucide-react';
import SiteEditorModal from '../components/shared/SiteEditorModal';
import { deleteSite } from '../services/api';

const ManageSitesPage: React.FC = () => {
    const { sites, setSites } = useContext(AppContext)!;
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedSite, setSelectedSite] = useState<Site | null>(null);

    const handleOpenModal = (site: Site | null = null) => {
        setSelectedSite(site);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setSelectedSite(null);
        setIsModalOpen(false);
    };

    const handleDelete = async (siteId: string) => {
        if (window.confirm("Are you sure you want to delete this site? This action cannot be undone.")) {
            try {
                await deleteSite(siteId);
                setSites(prev => prev.filter(s => s.id !== siteId));
            } catch (error) {
                console.error("Failed to delete site:", error);
                // In a real app, show a toast notification
            }
        }
    };
    
    const getStatusInfo = (status: Site['status']) => {
        switch (status) {
            case 'online': return { icon: <Zap className="w-4 h-4 text-green-500"/>, text: 'Online', color: 'text-green-500' };
            case 'maintenance': return { icon: <Wrench className="w-4 h-4 text-yellow-500"/>, text: 'Maintenance', color: 'text-yellow-500' };
            case 'offline': return { icon: <AlertTriangle className="w-4 h-4 text-red-500"/>, text: 'Offline', color: 'text-red-500' };
        }
    }

    return (
        <>
            <Card>
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-2xl font-bold">Manage Sites</h2>
                    <button onClick={() => handleOpenModal()} className="flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-medium">
                        <PlusCircle className="w-5 h-5 mr-2" />
                        Add New Site
                    </button>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-100 dark:bg-gray-700 text-xs text-gray-500 dark:text-gray-300 uppercase">
                            <tr>
                                <th className="p-3">Site Name</th>
                                <th className="p-3">Location</th>
                                <th className="p-3">Status</th>
                                <th className="p-3 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {sites.map(site => {
                                const statusInfo = getStatusInfo(site.status);
                                return (
                                    <tr key={site.id} className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800">
                                        <td className="p-3 font-medium text-gray-900 dark:text-white">{site.name}</td>
                                        <td className="p-3 text-gray-500 dark:text-gray-400 flex items-center"><MapPin className="w-4 h-4 mr-2" /> {site.location}</td>
                                        <td className={`p-3 font-semibold flex items-center ${statusInfo.color}`}>{statusInfo.icon} <span className="ml-2">{statusInfo.text}</span></td>
                                        <td className="p-3 text-right">
                                            <button onClick={() => handleOpenModal(site)} className="p-2 text-gray-500 hover:text-blue-600"><Edit className="w-5 h-5"/></button>
                                            <button onClick={() => handleDelete(site.id)} className="p-2 text-gray-500 hover:text-red-600"><Trash2 className="w-5 h-5"/></button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </Card>
            {isModalOpen && (
                <SiteEditorModal
                    site={selectedSite}
                    onClose={handleCloseModal}
                />
            )}
        </>
    );
};

export default ManageSitesPage;

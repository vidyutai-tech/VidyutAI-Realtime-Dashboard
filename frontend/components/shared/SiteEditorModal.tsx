import React, { useState, useContext } from 'react';
import Modal from '../ui/Modal';
import { Site } from '../../types';
import { AppContext } from '../../contexts/AppContext';
import { createSite, updateSite } from '../../services/api';

interface SiteEditorModalProps {
    site: Site | null;
    onClose: () => void;
}

const SiteEditorModal: React.FC<SiteEditorModalProps> = ({ site, onClose }) => {
    const { setSites } = useContext(AppContext)!;
    const [formData, setFormData] = useState<Omit<Site, 'id'>>({
        name: site?.name || '',
        location: site?.location || '',
        status: site?.status || 'online',
    });
    const [isLoading, setIsLoading] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            if (site) { // Editing existing site
                const updatedSite = await updateSite({ ...formData, id: site.id });
                setSites(prev => prev.map(s => s.id === site.id ? updatedSite : s));
            } else { // Creating new site
                const newSite = await createSite(formData);
                setSites(prev => [...prev, newSite]);
            }
            onClose();
        } catch (error) {
            console.error("Failed to save site:", error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Modal isOpen={true} onClose={onClose} title={site ? 'Edit Site' : 'Add New Site'}>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Site Name</label>
                    <input type="text" id="name" name="name" value={formData.name} onChange={handleChange} required className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"/>
                </div>
                <div>
                    <label htmlFor="location" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Location</label>
                    <input type="text" id="location" name="location" value={formData.location} onChange={handleChange} required className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"/>
                </div>
                <div>
                     <label htmlFor="status" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Status</label>
                     <select id="status" name="status" value={formData.status} onChange={handleChange} className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500">
                        <option value="online">Online</option>
                        <option value="maintenance">Maintenance</option>
                        <option value="offline">Offline</option>
                     </select>
                </div>
                 <div className="flex justify-end pt-4 space-x-2">
                    <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600">Cancel</button>
                    <button type="submit" disabled={isLoading} className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50">
                        {isLoading ? 'Saving...' : 'Save Site'}
                    </button>
                </div>
            </form>
        </Modal>
    );
};

export default SiteEditorModal;

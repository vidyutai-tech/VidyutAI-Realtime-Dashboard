import React, { useContext } from 'react';
import { AppContext } from '../contexts/AppContext';
import { Site } from '../types';
import { MapPin, Zap, AlertTriangle, Wrench, ArrowRight } from 'lucide-react';
import Skeleton from '../components/ui/Skeleton';

const SiteSelectPage: React.FC = () => {
    const { sites, selectSite, logout } = useContext(AppContext)!;
    const isLoading = sites.length === 0;

    const getStatusStyles = (status: Site['status']) => {
        switch (status) {
            case 'online': return { icon: <Zap className="w-4 h-4 text-green-400" />, text: 'Online', color: 'text-green-400' };
            case 'maintenance': return { icon: <Wrench className="w-4 h-4 text-yellow-400" />, text: 'Maintenance', color: 'text-yellow-400' };
            case 'offline': return { icon: <AlertTriangle className="w-4 h-4 text-red-400" />, text: 'Offline', color: 'text-red-400' };
        }
    }

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900 p-4">
            <div className="w-full max-w-4xl">
                <div className="text-center mb-8">
                    <h1 className="text-4xl font-bold text-gray-800 dark:text-white">Select a Site</h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-2">Choose which facility you would like to monitor.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
                    {isLoading ? (
                        [...Array(4)].map((_, i) => <Skeleton key={i} className="h-48 w-full" />)
                    ) : (
                        sites.map(site => {
                            const statusInfo = getStatusStyles(site.status);
                            const isSelectable = site.status !== 'offline';
                            return (
                                <button
                                    key={site.id}
                                    onClick={() => isSelectable && selectSite(site)}
                                    disabled={!isSelectable}
                                    className={`group text-left p-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 transition-all duration-300 ${isSelectable ? 'hover:shadow-xl hover:border-blue-500 hover:-translate-y-1 cursor-pointer' : 'opacity-50 cursor-not-allowed'}`}
                                >
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <h2 className="text-xl font-bold text-gray-900 dark:text-white">{site.name}</h2>
                                            <div className="flex items-center text-sm text-gray-500 dark:text-gray-400 mt-1">
                                                <MapPin className="w-4 h-4 mr-2" />
                                                {site.location}
                                            </div>
                                        </div>
                                        <div className={`flex items-center text-sm font-semibold ${statusInfo.color}`}>
                                            {statusInfo.icon}
                                            <span className="ml-2">{statusInfo.text}</span>
                                        </div>
                                    </div>
                                    <div className="mt-8 flex justify-end items-center">
                                        <span className={`text-blue-500 font-semibold text-sm ${isSelectable ? 'group-hover:mr-2 transition-all' : ''}`}>
                                            {isSelectable ? 'Go to Dashboard' : 'Site Unavailable'}
                                        </span>
                                        {isSelectable && <ArrowRight className="w-5 h-5 text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity" />}
                                    </div>
                                </button>
                            )
                        })
                    )}
                </div>
                 <div className="text-center mt-8">
                    <button onClick={logout} className="text-sm text-gray-500 dark:text-gray-400 hover:underline">
                        Log out
                    </button>
                </div>
                
                {/* Footer with IITGN Logo */}
                <div className="mt-12 pt-6 border-t border-gray-200 dark:border-gray-700">
                    <div className="flex flex-col md:flex-row items-center justify-between space-y-3 md:space-y-0">
                        <div className="text-sm text-gray-600 dark:text-gray-400 text-center md:text-left">
                            © {new Date().getFullYear()} VidyutAI. All rights reserved.
                        </div>
                        <div className="flex items-center space-x-3">
                            <span className="text-sm text-gray-600 dark:text-gray-400">
                                Developed at
                            </span>
                            <img 
                                src="/IITGN_logo.webp" 
                                alt="IIT Gandhinagar" 
                                className="h-8 w-auto opacity-80 hover:opacity-100 transition-opacity"
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default SiteSelectPage;

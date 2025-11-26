import React, { useState, useEffect, useContext } from 'react';
import Card from '../components/ui/Card';
import { AppContext } from '../contexts/AppContext';
import { getUserProfile } from '../services/api';
import { Building, Workflow } from 'lucide-react';

const ProfilePage: React.FC = () => {
    const { currentUser } = useContext(AppContext)!;
    const [userProfile, setUserProfile] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const loadProfile = async () => {
            try {
                const profile = await getUserProfile();
                setUserProfile(profile);
            } catch (error) {
                console.error('Failed to load user profile:', error);
            } finally {
                setIsLoading(false);
            }
        };
        loadProfile();
    }, []);

    const getSiteTypeLabel = (siteType: string) => {
        const labels: Record<string, string> = {
            'home': 'Home',
            'college': 'College',
            'small_industry': 'Small Industry',
            'large_industry': 'Large Industry',
            'power_plant': 'Power Plant',
            'other': 'Other'
        };
        return labels[siteType] || siteType;
    };

    const getWorkflowLabel = (workflow: string) => {
        const labels: Record<string, string> = {
            'plan_new': 'Plan a New Energy System',
            'optimize_existing': 'Optimize Existing System'
        };
        return labels[workflow] || workflow;
    };

    return (
        <div className="space-y-6">
            <Card title="User Profile">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-600 dark:text-gray-300">Full Name</label>
                        <input 
                            type="text" 
                            value={currentUser?.name || 'N/A'} 
                            disabled 
                            className="mt-1 block w-full px-3 py-2 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm opacity-70" 
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-600 dark:text-gray-300">Email Address</label>
                        <input 
                            type="email" 
                            value={currentUser?.email || 'N/A'} 
                            disabled 
                            className="mt-1 block w-full px-3 py-2 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm opacity-70" 
                        />
                    </div>
                </div>
            </Card>

            {isLoading ? (
                <Card title="Wizard Information">
                    <p className="text-gray-600 dark:text-gray-400">Loading...</p>
                </Card>
            ) : userProfile ? (
                <Card title="Post-Login Wizard Information">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-2">
                                <Building className="w-4 h-4 inline mr-2" />
                                Site Type
                            </label>
                            <div className="px-3 py-2 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md">
                                <span className="text-blue-900 dark:text-blue-300 font-semibold">
                                    {getSiteTypeLabel(userProfile.site_type)}
                                </span>
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-2">
                                <Workflow className="w-4 h-4 inline mr-2" />
                                Workflow Preference
                            </label>
                            <div className="px-3 py-2 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md">
                                <span className="text-green-900 dark:text-green-300 font-semibold">
                                    {getWorkflowLabel(userProfile.workflow_preference)}
                                </span>
                            </div>
                        </div>
                    </div>
                    {userProfile.created_at && (
                        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                Profile created: {new Date(userProfile.created_at).toLocaleDateString()}
                            </p>
                        </div>
                    )}
                </Card>
            ) : (
                <Card title="Post-Login Wizard Information">
                    <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                        <p className="text-yellow-800 dark:text-yellow-300">
                            No wizard information found. Please complete the Post-Login Wizard to set your preferences.
                        </p>
                    </div>
                </Card>
            )}

            <Card title="Update Password">
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-600 dark:text-gray-300">Current Password</label>
                        <input type="password" placeholder="••••••••" className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-600 dark:text-gray-300">New Password</label>
                        <input type="password" placeholder="••••••••" className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" />
                    </div>
                </div>
                <button className="mt-6 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm font-medium">Save Changes</button>
            </Card>
        </div>
    );
};

export default ProfilePage;
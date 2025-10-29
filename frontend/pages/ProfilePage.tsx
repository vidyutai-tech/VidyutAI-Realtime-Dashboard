import React from 'react';
import Card from '../components/ui/Card';

const ProfilePage: React.FC = () => {
  return (
    <div className="space-y-6">
      <Card title="Profile Settings">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
                <label className="block text-sm font-medium text-gray-600 dark:text-gray-300">Full Name</label>
                <input type="text" value="Operator User" disabled className="mt-1 block w-full px-3 py-2 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm opacity-70" />
            </div>
             <div>
                <label className="block text-sm font-medium text-gray-600 dark:text-gray-300">Email Address</label>
                <input type="email" value="operator@ems.com" disabled className="mt-1 block w-full px-3 py-2 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm opacity-70" />
            </div>
        </div>
        <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
            <h4 className="text-md font-semibold mb-4">Update Password</h4>
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
        </div>
      </Card>
    </div>
  );
};

export default ProfilePage;
import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, AlertTriangle, AreaChart, Wrench, Bot, SlidersHorizontal, Settings, X, Bolt, Share2, Building, HardDrive, TrendingUp, Zap, Users } from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  setSidebarOpen: (isOpen: boolean) => void;
}

const mainNavItems = [
  { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
  { name: 'Site Detail', path: '/site-detail', icon: AreaChart },
  { name: 'Impact Analysis', path: '/impact', icon: TrendingUp },
  { name: 'Digital Twin', path: '/digital-twin', icon: Share2 },
  { name: 'Demand Optimization', path: '/demand-optimization', icon: Users },
  { name: 'Source Optimization', path: '/source-optimization', icon: Zap },
  { name: 'Alerts', path: '/alerts', icon: AlertTriangle },
  { name: 'Maintenance', path: '/maintenance', icon: Wrench },
  { name: 'Simulator', path: '/simulator', icon: SlidersHorizontal },
  { name: 'Predictions', path: '/predictions', icon: Bot },
];

const managementNavItems = [
    { name: 'Sites', path: '/manage-sites', icon: Building },
    { name: 'Assets', path: '/manage-assets', icon: HardDrive },
    { name: 'Settings', path: '/settings', icon: Settings },
];

const Sidebar: React.FC<SidebarProps> = ({ isOpen, setSidebarOpen }) => {
  const NavItem: React.FC<{ item: typeof mainNavItems[0] }> = ({ item }) => (
    <NavLink
      to={item.path}
      className={({ isActive }) =>
        `flex items-center px-4 py-3 text-sm font-medium transition-colors duration-150 ${
          isActive
            ? 'bg-blue-600 text-white'
            : 'text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white'
        }`
      }
      onClick={() => { if (window.innerWidth < 768) setSidebarOpen(false); }}
    >
      <item.icon className="w-5 h-5 mr-3" />
      <span>{item.name}</span>
    </NavLink>
  );

  return (
    <>
      <div
        className={`fixed inset-0 z-20 bg-black bg-opacity-50 transition-opacity md:hidden ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={() => setSidebarOpen(false)}
      ></div>
      <aside
        className={`fixed top-0 left-0 z-30 h-full w-64 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 flex flex-col flex-shrink-0 transition-transform duration-300 ease-in-out md:relative md:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        aria-label="Sidebar"
      >
        <div className="flex items-center justify-between p-4 h-20 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-center w-full">
            <img src="/VidyutAI Logo.png" className="h-16 w-auto" alt="VidyutAI" />
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="md:hidden p-1 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
        <div className="overflow-y-auto flex-1">
            <nav className="mt-4">
              <ul>
                {mainNavItems.map((item) => (
                  <li key={item.name}>
                    <NavItem item={item} />
                  </li>
                ))}
              </ul>
            </nav>
            <div className="px-4 mt-6">
                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Management</h3>
            </div>
            <nav className="mt-2">
                 <ul>
                    {managementNavItems.map((item) => (
                      <li key={item.name}>
                        <NavItem item={item} />
                      </li>
                    ))}
                  </ul>
            </nav>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;

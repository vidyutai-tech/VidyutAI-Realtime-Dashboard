import React, { useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, LayoutDashboard, AreaChart, TrendingUp, Share2, SlidersHorizontal, AlertTriangle, Wrench, Building, HardDrive, Settings, ArrowLeft } from 'lucide-react';
import Card from '../components/ui/Card';
import { AppContext } from '../contexts/AppContext';

const UnifiedDashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { sites, selectedSite, selectSite } = useContext(AppContext)!;

  const sections = [
    {
      id: 'operations',
      title: 'Real-Time Operations',
      items: [
        {
          id: 'dashboard',
          title: 'Operations Dashboard',
          description: 'Real-time grid condition, PV generation, Battery SoC, power flow, and dispatch suggestions',
          icon: LayoutDashboard,
          path: '/dashboard',
          color: 'from-blue-500 to-blue-600'
        },
        {
          id: 'site-detail',
          title: 'Site Detail',
          description: 'Health index, telemetry (voltage, current, frequency, SoC), anomalies, power distribution, FFT spectrogram',
          icon: AreaChart,
          path: '/site-detail',
          color: 'from-green-500 to-green-600'
        }
      ]
    },
    {
      id: 'analysis',
      title: 'Analysis & Modeling',
      items: [
        {
          id: 'impact',
          title: 'Impact Analysis',
          description: 'Savings, battery life, renewable utilization, carbon avoided. Compare Optimized vs Conventional EMS',
          icon: TrendingUp,
          path: '/impact',
          color: 'from-purple-500 to-purple-600'
        },
        {
          id: 'digital-twin',
          title: 'Digital Twin',
          description: 'Temperature, vibration, efficiency, power output metrics with prediction confidence bands',
          icon: Share2,
          path: '/digital-twin',
          color: 'from-teal-500 to-teal-600'
        },
        {
          id: 'simulator',
          title: 'Simulator',
          description: 'Input PV curtailment, battery target SoC, grid price adjustments. Output predicted outcome (24h)',
          icon: SlidersHorizontal,
          path: '/simulator',
          color: 'from-orange-500 to-orange-600'
        }
      ]
    },
    {
      id: 'monitoring',
      title: 'Monitoring & Maintenance',
      items: [
        {
          id: 'alerts',
          title: 'Alerts',
          description: 'Real-time alerts and notifications for system anomalies and critical events',
          icon: AlertTriangle,
          path: '/alerts',
          color: 'from-red-500 to-red-600'
        },
        {
          id: 'maintenance',
          title: 'Maintenance',
          description: 'Preventive and predictive maintenance scheduling and tracking',
          icon: Wrench,
          path: '/maintenance',
          color: 'from-yellow-500 to-yellow-600'
        }
      ]
    },
    {
      id: 'management',
      title: 'Management',
      items: [
        {
          id: 'sites',
          title: 'Sites',
          description: 'Multi-site view and management',
          icon: Building,
          path: '/manage-sites',
          color: 'from-indigo-500 to-indigo-600'
        },
        {
          id: 'assets',
          title: 'Assets',
          description: 'Asset directory and management',
          icon: HardDrive,
          path: '/manage-assets',
          color: 'from-pink-500 to-pink-600'
        },
        {
          id: 'settings',
          title: 'Settings',
          description: 'User settings, system settings, and UserProfile defaults',
          icon: Settings,
          path: '/settings',
          color: 'from-gray-500 to-gray-600'
        }
      ]
    }
  ];

  return (
    <div className="min-h-full bg-gradient-to-br from-orange-50 via-white to-amber-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 -m-4 md:-m-6 lg:-m-8 p-4 md:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <button
            onClick={() => navigate('/main-options')}
            className="flex items-center text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-4"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back to Main Options
          </button>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
                Unified Dashboard (EDA)
              </h1>
              <p className="text-gray-600 dark:text-gray-400 text-lg">
                Exploratory Data Analysis dashboard with real-time monitoring, visualizations, and comprehensive energy metrics using simulated IoT data (10-minute intervals)
              </p>
            </div>
            {sites && sites.length > 0 && (
              <div className="mt-4 md:mt-0">
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Select Site
                </label>
                <select
                  value={selectedSite?.id || ''}
                  onChange={(e) => {
                    const site = sites.find(s => s.id === e.target.value);
                    if (site) selectSite(site);
                  }}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white min-w-[200px]"
                >
                  <option value="">Select a site...</option>
                  {sites.map((site) => (
                    <option key={site.id} value={site.id}>
                      {site.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </div>

        {sections.map((section) => (
          <div key={section.id} className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              {section.title}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {section.items.map((item) => {
                const Icon = item.icon;
                return (
                  <Card 
                    key={item.id} 
                    className="hover:shadow-xl transition-all duration-300 cursor-pointer group border hover:border-orange-400" 
                    onClick={() => navigate(item.path)}
                  >
                    <div className="p-6">
                      <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${item.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                        <Icon className="w-6 h-6 text-white" />
                      </div>
                      <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                        {item.title}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                        {item.description}
                      </p>
                      <div className="flex items-center text-orange-600 dark:text-orange-400 font-semibold text-sm group-hover:translate-x-2 transition-transform">
                        <span>Open</span>
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>
        ))}

        <div className="mt-8 p-6 bg-orange-50 dark:bg-orange-900/20 rounded-xl border border-orange-200 dark:border-orange-800">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
            📊 Unified Dashboard Overview
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-gray-700 dark:text-gray-300 text-sm">
            <div>
              <p className="font-semibold mb-1">5.1 Real-Time Operations</p>
              <p>Grid condition, PV generation, Battery SoC, Power flow, Real-time dispatch suggestions, Subsystem health, RL Strategy sliders, Daily cost analysis</p>
            </div>
            <div>
              <p className="font-semibold mb-1">5.2 Site Detail</p>
              <p>Health index (battery, inverter, motor), Telemetry, Anomalies, Power distribution, Motor vibration FFT Spectrogram</p>
            </div>
            <div>
              <p className="font-semibold mb-1">5.3 Impact Analysis</p>
              <p>Savings, Battery life, Renewable utilization, Carbon avoided. Compare Optimized vs Conventional EMS. Daily/Weekly/Monthly toggles</p>
            </div>
            <div>
              <p className="font-semibold mb-1">5.4 Digital Twin</p>
              <p>Temperature, Vibration, Efficiency, Power Output metrics with Prediction confidence band</p>
            </div>
            <div>
              <p className="font-semibold mb-1">5.5 Advanced Modeling</p>
              <p>Motor vibration diagnosis (RandomForest), Multi-sensor diagnosis (XGBoost), Solar power forecasting (LSTM)</p>
            </div>
            <div>
              <p className="font-semibold mb-1">5.6-5.8 Other Tools</p>
              <p>Simulator, Alerts & Maintenance, Sites/Assets/Settings management</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UnifiedDashboardPage;


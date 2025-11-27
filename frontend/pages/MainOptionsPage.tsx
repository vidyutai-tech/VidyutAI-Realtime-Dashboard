import React, { useContext, useState, useEffect, useRef } from 'react';
import { useNavigate, NavLink } from 'react-router-dom';
import { ArrowRight, BarChart3, TrendingUp, Brain, LayoutDashboard, UserCircle, LogOut } from 'lucide-react';
import Card from '../components/ui/Card';
import { AppContext } from '../contexts/AppContext';

const MainOptionsPage: React.FC = () => {
  const navigate = useNavigate();
  const context = useContext(AppContext);
  const [isProfileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const options = [
    {
      id: 'planning',
      title: 'Planning Wizard',
      description: 'Create a new energy system plan with site type selection, load profiling, energy sources selection, and AI-powered recommendations',
      icon: BarChart3,
      path: '/planning-wizard',
      color: 'from-blue-500 to-blue-600',
      steps: '4-Step Process'
    },
    {
      id: 'optimization',
      title: 'Optimization Flow',
      description: 'Optimize your existing energy system for cost, CO2 emissions, or both. Setup optimization parameters and run analysis',
      icon: TrendingUp,
      path: '/optimization-flow',
      color: 'from-green-500 to-green-600',
      steps: 'O1 → O2 → Advanced'
    },
    {
      id: 'ai-insights',
      title: 'AI/ML Insights',
      description: 'Get AI-powered predictions, recommendations, renewable optimization, and natural language explanations',
      icon: Brain,
      path: '/ai-ml-insights',
      color: 'from-purple-500 to-purple-600',
      steps: 'Predictions & Recommendations'
    },
    {
      id: 'dashboard',
      title: 'Unified Dashboard (EDA)',
      description: 'Exploratory Data Analysis dashboard with real-time monitoring, visualizations, and comprehensive energy metrics',
      icon: LayoutDashboard,
      path: '/unified-dashboard',
      color: 'from-orange-500 to-orange-600',
      steps: '8 Sub-Modules'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex flex-col">
      {/* Header with Logout and Profile */}
      <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 h-16 flex items-center justify-between px-4 md:px-6 flex-shrink-0">
        <div className="flex items-center">
          <img src="/VidyutAI Logo.png" className="h-12 w-auto" alt="VidyutAI" />
        </div>
        <div className="flex items-center space-x-4">
          <div className="relative" ref={profileRef}>
            <button 
              onClick={() => setProfileOpen(!isProfileOpen)} 
              className="flex items-center p-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <UserCircle className="w-8 h-8 text-gray-400 dark:text-gray-500"/>
              <span className="ml-2 text-sm font-medium hidden sm:block text-gray-700 dark:text-gray-300">
                {context?.currentUser?.email || 'Guest'}
              </span>
            </button>
            {isProfileOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-800 rounded-md shadow-lg border border-gray-200 dark:border-gray-700 z-50">
                <div className="p-2 border-b border-gray-200 dark:border-gray-700">
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">{context?.currentUser?.name || 'Guest User'}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{context?.currentUser?.email || 'No email'}</p>
                </div>
                <ul className="py-1">
                  <li>
                    <NavLink
                      to="/profile"
                      onClick={() => {
                        setProfileOpen(false);
                        navigate('/profile');
                      }}
                      className="flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                      <UserCircle className="w-4 h-4 mr-3" />
                      Profile
                    </NavLink>
                  </li>
                  <li>
                    <button
                      onClick={() => {
                        if (context?.logout) {
                          context.logout();
                        }
                        setProfileOpen(false);
                      }}
                      className="w-full text-left flex items-center px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                      <LogOut className="w-4 h-4 mr-3" />
                      Logout
                    </button>
                  </li>
                </ul>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-7xl mx-auto p-4 md:p-6 lg:p-8">
          <div className="mb-8 text-center">
            <h1 className="text-5xl font-bold text-gray-900 dark:text-white mb-3">
              Welcome to VidyutAI
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-400">
              Choose a pipeline to get started with your energy management
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {options.map((option) => {
              const Icon = option.icon;
              return (
                <Card 
                  key={option.id} 
                  className="hover:shadow-2xl transition-all duration-300 cursor-pointer group border-2 hover:border-blue-400" 
                  onClick={() => navigate(option.path)}
                >
                  <div className="p-8">
                    <div className={`w-20 h-20 rounded-2xl bg-gradient-to-br ${option.color} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-lg`}>
                      <Icon className="w-10 h-10 text-white" />
                    </div>
                    <div className="mb-2">
                      <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                        {option.steps}
                      </span>
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
                      {option.title}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 mb-6 leading-relaxed">
                      {option.description}
                    </p>
                    <div className="flex items-center text-blue-600 dark:text-blue-400 font-semibold group-hover:translate-x-2 transition-transform">
                      <span>Get Started</span>
                      <ArrowRight className="w-5 h-5 ml-2" />
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>

          <div className="mt-8 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
              💡 How It Works
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-gray-700 dark:text-gray-300">
              <div>
                <p className="font-semibold mb-1">1. Planning Wizard</p>
                <p className="text-sm">Design your energy system from scratch with step-by-step guidance and AI recommendations.</p>
              </div>
              <div>
                <p className="font-semibold mb-1">2. Optimization Flow</p>
                <p className="text-sm">Optimize existing systems by configuring parameters and running cost/CO2 analysis.</p>
              </div>
              <div>
                <p className="font-semibold mb-1">3. AI/ML Insights</p>
                <p className="text-sm">Leverage machine learning for predictions, anomaly detection, and intelligent insights.</p>
              </div>
              <div>
                <p className="font-semibold mb-1">4. Unified Dashboard</p>
                <p className="text-sm">Monitor your energy system in real-time with comprehensive EDA and visualizations.</p>
              </div>
            </div>
          </div>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              You can return to this page anytime to switch between pipelines
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MainOptionsPage;

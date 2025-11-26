import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Settings, TrendingUp, Users, Zap, ArrowLeft } from 'lucide-react';
import Card from '../components/ui/Card';

const OptimizationFlowPage: React.FC = () => {
  const navigate = useNavigate();

  const options = [
    {
      id: 'setup',
      title: 'Optimization Setup',
      description: 'Configure optimization parameters, load data, tariffs, and system parameters',
      icon: Settings,
      path: '/optimization-setup',
      color: 'from-blue-500 to-blue-600',
      step: 'O1'
    },
    {
      id: 'results',
      title: 'Optimization Results',
      description: 'View optimization results, KPIs, cost savings, and emissions analysis',
      icon: TrendingUp,
      path: '/optimization-results',
      color: 'from-green-500 to-green-600',
      step: 'O2'
    },
    {
      id: 'demand',
      title: 'Demand Optimization',
      description: 'Optimize energy demand patterns, load shifting, and demand management strategies',
      icon: Users,
      path: '/demand-optimization',
      color: 'from-purple-500 to-purple-600',
      step: 'Advanced'
    },
    {
      id: 'source',
      title: 'Source Optimization',
      description: 'Optimize energy source mix (solar, battery, grid, diesel) for cost and CO2',
      icon: Zap,
      path: '/source-optimization',
      color: 'from-orange-500 to-orange-600',
      step: 'Advanced'
    }
  ];

  return (
    <div className="min-h-full bg-gradient-to-br from-green-50 via-white to-emerald-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 -m-4 md:-m-6 lg:-m-8 p-4 md:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <button
            onClick={() => navigate('/main-options')}
            className="flex items-center text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-4"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back to Main Options
          </button>
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
            Optimization Flow
          </h1>
          <p className="text-gray-600 dark:text-gray-400 text-lg">
            Optimize your energy system for cost, CO2 emissions, or both
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {options.map((option) => {
            const Icon = option.icon;
            return (
              <Card 
                key={option.id} 
                className="hover:shadow-2xl transition-all duration-300 cursor-pointer group border-2 hover:border-green-400" 
                onClick={() => navigate(option.path)}
              >
                <div className="p-8">
                  <div className="flex items-center justify-between mb-4">
                    <div className={`w-16 h-16 rounded-xl bg-gradient-to-br ${option.color} flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg`}>
                      <Icon className="w-8 h-8 text-white" />
                    </div>
                    <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-3 py-1 rounded-full">
                      {option.step}
                    </span>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
                    {option.title}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-6 leading-relaxed">
                    {option.description}
                  </p>
                  <div className="flex items-center text-green-600 dark:text-green-400 font-semibold group-hover:translate-x-2 transition-transform">
                    <span>Get Started</span>
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </div>
                </div>
              </Card>
            );
          })}
        </div>

        <div className="mt-8 p-6 bg-green-50 dark:bg-green-900/20 rounded-xl border border-green-200 dark:border-green-800">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
            📊 Optimization Flow Process
          </h3>
          <div className="space-y-3 text-gray-700 dark:text-gray-300">
            <div className="flex items-start">
              <span className="font-semibold text-green-600 dark:text-green-400 mr-3">O1:</span>
              <div>
                <p className="font-semibold">Optimization Setup</p>
                <p className="text-sm">Configure load data, tariffs, PV/battery/grid parameters. Auto-load from planning if available.</p>
              </div>
            </div>
            <div className="flex items-start">
              <span className="font-semibold text-green-600 dark:text-green-400 mr-3">O2:</span>
              <div>
                <p className="font-semibold">Optimization Results</p>
                <p className="text-sm">View KPIs: cost savings, emissions reduction, battery life impact, grid independence.</p>
              </div>
            </div>
            <div className="flex items-start">
              <span className="font-semibold text-green-600 dark:text-green-400 mr-3">Advanced:</span>
              <div>
                <p className="font-semibold">Demand & Source Optimization</p>
                <p className="text-sm">Specialized optimization for demand patterns and energy source mix.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OptimizationFlowPage;


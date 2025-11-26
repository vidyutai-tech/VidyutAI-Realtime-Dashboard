import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Zap, Settings, TrendingUp, BarChart3 } from 'lucide-react';
import Card from '../components/ui/Card';

const PlanningAndOptimizationPage: React.FC = () => {
  const navigate = useNavigate();

  const options = [
    {
      id: 'planning',
      title: 'Planning Wizard',
      description: 'Create a new energy system plan with load profiling and recommendations',
      icon: BarChart3,
      path: '/planning-wizard',
      color: 'from-blue-500 to-blue-600'
    },
    {
      id: 'optimization',
      title: 'Optimization Setup',
      description: 'Optimize your existing energy system for cost, CO2, or both',
      icon: TrendingUp,
      path: '/optimization-setup',
      color: 'from-green-500 to-green-600'
    },
    {
      id: 'demand-optimization',
      title: 'Demand Optimization',
      description: 'Optimize energy demand patterns and load management',
      icon: Zap,
      path: '/demand-optimization',
      color: 'from-purple-500 to-purple-600'
    },
    {
      id: 'source-optimization',
      title: 'Source Optimization',
      description: 'Optimize energy source mix (solar, battery, grid, diesel)',
      icon: Settings,
      path: '/source-optimization',
      color: 'from-orange-500 to-orange-600'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-4">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
            Planning & Optimization
          </h1>
          <p className="text-gray-600 dark:text-gray-400 text-lg">
            Choose your next step to plan or optimize your energy system
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {options.map((option) => {
            const Icon = option.icon;
            return (
              <Card key={option.id} className="hover:shadow-xl transition-all duration-300 cursor-pointer group" onClick={() => navigate(option.path)}>
                <div className="p-6">
                  <div className={`w-16 h-16 rounded-xl bg-gradient-to-br ${option.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                    <Icon className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                    {option.title}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-4">
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

        <div className="mt-8 p-6 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            💡 Quick Tips
          </h3>
          <ul className="space-y-2 text-gray-700 dark:text-gray-300">
            <li>• <strong>Planning Wizard:</strong> Use this for new installations or major system redesigns</li>
            <li>• <strong>Optimization Setup:</strong> Use this to optimize existing systems with your load profile data</li>
            <li>• <strong>Demand Optimization:</strong> Focus on load shifting and demand management strategies</li>
            <li>• <strong>Source Optimization:</strong> Optimize the mix of energy sources (solar, battery, grid, diesel)</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default PlanningAndOptimizationPage;


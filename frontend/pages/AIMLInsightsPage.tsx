import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Brain, TrendingUp, Battery, Zap, Lightbulb, ArrowLeft } from 'lucide-react';
import Card from '../components/ui/Card';

const AIMLInsightsPage: React.FC = () => {
  const navigate = useNavigate();

  const options = [
    {
      id: 'predictions',
      title: 'AI Predictions',
      description: 'Motor vibration diagnosis, multi-sensor diagnosis, and solar power forecasting using ML models',
      icon: Brain,
      path: '/predictions',
      color: 'from-purple-500 to-purple-600',
      category: 'Predictions'
    },
    {
      id: 'recommendations',
      title: 'Smart Recommendations',
      description: 'AI-powered recommendations for load shifting, tariff optimization, and battery tuning',
      icon: Lightbulb,
      path: '/ai-recommendations',
      color: 'from-blue-500 to-blue-600',
      category: 'Recommendations'
    },
    {
      id: 'renewable',
      title: 'Renewable Share Optimization',
      description: 'Optimize renewable energy share and maximize self-sustainability using ML insights',
      icon: Zap,
      path: '/renewable-optimization',
      color: 'from-green-500 to-green-600',
      category: 'Optimization'
    },
    {
      id: 'explanations',
      title: 'Natural Language Explanations',
      description: 'Get AI-generated explanations for recommendations and insights in plain language',
      icon: TrendingUp,
      path: '/ai-explanations',
      color: 'from-orange-500 to-orange-600',
      category: 'Insights'
    }
  ];

  return (
    <div className="min-h-full bg-gradient-to-br from-purple-50 via-white to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 -m-4 md:-m-6 lg:-m-8 p-4 md:p-6 lg:p-8">
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
            AI/ML Insights
          </h1>
          <p className="text-gray-600 dark:text-gray-400 text-lg">
            Get AI-powered predictions, recommendations, and intelligent insights for your energy system
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {options.map((option) => {
            const Icon = option.icon;
            return (
              <Card 
                key={option.id} 
                className="hover:shadow-2xl transition-all duration-300 cursor-pointer group border-2 hover:border-purple-400" 
                onClick={() => navigate(option.path)}
              >
                <div className="p-8">
                  <div className="flex items-center justify-between mb-4">
                    <div className={`w-16 h-16 rounded-xl bg-gradient-to-br ${option.color} flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg`}>
                      <Icon className="w-8 h-8 text-white" />
                    </div>
                    <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-3 py-1 rounded-full">
                      {option.category}
                    </span>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
                    {option.title}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-6 leading-relaxed">
                    {option.description}
                  </p>
                  <div className="flex items-center text-purple-600 dark:text-purple-400 font-semibold group-hover:translate-x-2 transition-transform">
                    <span>Explore</span>
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </div>
                </div>
              </Card>
            );
          })}
        </div>

        <div className="mt-8 p-6 bg-purple-50 dark:bg-purple-900/20 rounded-xl border border-purple-200 dark:border-purple-800">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
            🤖 AI/ML Insights Features
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-gray-700 dark:text-gray-300">
            <div>
              <p className="font-semibold mb-1">📊 Predictions</p>
              <p className="text-sm">Motor vibration diagnosis (RandomForest), Multi-sensor diagnosis (XGBoost), Solar power forecasting (LSTM)</p>
            </div>
            <div>
              <p className="font-semibold mb-1">💡 Recommendations</p>
              <p className="text-sm">Load shifting, Tariff optimization, Battery tuning based on planning + optimization + telemetry data</p>
            </div>
            <div>
              <p className="font-semibold mb-1">⚡ Renewable Optimization</p>
              <p className="text-sm">Maximize renewable energy share and self-sustainability using ML-driven insights</p>
            </div>
            <div>
              <p className="font-semibold mb-1">📝 Natural Language</p>
              <p className="text-sm">Get AI-generated explanations for all recommendations and insights in plain language</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIMLInsightsPage;


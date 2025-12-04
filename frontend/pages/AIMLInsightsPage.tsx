import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Brain, TrendingUp, Lightbulb, ArrowLeft, BarChart3, MessageSquare } from 'lucide-react';
import Card from '../components/ui/Card';

const AIMLInsightsPage: React.FC = () => {
  const navigate = useNavigate();

  const options = [
    {
      id: 'forecasting',
      title: 'Energy Forecasting',
      description: 'ML-powered forecasting for energy production, demand, and consumption using IITGN-trained models. Get accurate predictions with confidence intervals and AI-powered insights.',
      icon: BarChart3,
      path: '/energy-forecasting',
      color: 'from-indigo-500 via-purple-500 to-indigo-600',
      category: 'Forecasting',
      gradient: 'bg-gradient-to-br from-indigo-500 to-purple-600'
    },
    {
      id: 'predictions',
      title: 'AI Predictions',
      description: 'Advanced ML models for motor vibration diagnosis, multi-sensor fault detection, and solar power forecasting. Real-time diagnostics using RandomForest, XGBoost, and LSTM models.',
      icon: Brain,
      path: '/predictions',
      color: 'from-purple-500 via-pink-500 to-purple-600',
      category: 'Predictions',
      gradient: 'bg-gradient-to-br from-purple-500 to-pink-600'
    },
    {
      id: 'explanations',
      title: 'AI Explanations',
      description: 'Get natural language explanations for all AI recommendations and insights. Understand the reasoning behind predictions and actions in plain, actionable language powered by Groq AI.',
      icon: MessageSquare,
      path: '/ai-explanations',
      color: 'from-orange-500 via-amber-500 to-orange-600',
      category: 'Insights',
      gradient: 'bg-gradient-to-br from-orange-500 to-amber-600'
    }
  ];

  return (
    <div className="min-h-full bg-gradient-to-br from-purple-50 via-white to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 -m-4 md:-m-6 lg:-m-8 p-4 md:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Enhanced Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/main-options')}
            className="flex items-center text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-6 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back to Main Options
          </button>
          <div className="mb-4">
            <h1 className="text-5xl font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent mb-3">
              AI/ML Insights
            </h1>
            <p className="text-gray-600 dark:text-gray-400 text-xl max-w-3xl">
              Leverage advanced machine learning models and AI-powered analytics to optimize your energy management system with intelligent predictions, forecasts, and actionable insights.
            </p>
          </div>
        </div>

        {/* Enhanced Cards Grid - 2x2 Layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
          {options.map((option, index) => {
            const Icon = option.icon;
            return (
              <Card 
                key={option.id} 
                className="hover:shadow-2xl transition-all duration-300 cursor-pointer group border-2 border-gray-200 dark:border-gray-700 hover:border-transparent overflow-hidden relative" 
                onClick={() => navigate(option.path)}
              >
                {/* Gradient Background Overlay on Hover */}
                <div className={`absolute inset-0 ${option.gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-300`} />
                
                <div className="p-8 relative z-10">
                  <div className="flex items-start justify-between mb-5">
                    <div className={`w-16 h-16 rounded-2xl ${option.gradient} flex items-center justify-center group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 shadow-lg`}>
                      <Icon className="w-8 h-8 text-white" />
                    </div>
                    <span className="text-xs font-bold text-gray-600 dark:text-gray-300 bg-gradient-to-r from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-600 px-4 py-1.5 rounded-full border border-gray-300 dark:border-gray-600">
                      {option.category}
                    </span>
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                    {option.title}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-6 leading-relaxed text-sm">
                    {option.description}
                  </p>
                  <div className="flex items-center text-indigo-600 dark:text-indigo-400 font-semibold group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                    <span>Explore Features</span>
                    <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-2 transition-transform" />
                  </div>
                </div>
              </Card>
            );
          })}
        </div>

        {/* Enhanced Features Summary */}
        <div className="mt-10 p-8 bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 dark:from-gray-800 dark:via-gray-700 dark:to-gray-800 rounded-2xl border-2 border-indigo-200 dark:border-indigo-800 shadow-xl">
          <div className="flex items-center mb-6">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center mr-4">
              <Brain className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
              AI/ML Capabilities Overview
            </h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 text-gray-700 dark:text-gray-300">
            <div className="bg-white dark:bg-gray-800 p-5 rounded-xl border border-indigo-100 dark:border-indigo-900 shadow-sm">
              <div className="flex items-center mb-2">
                <BarChart3 className="w-5 h-5 text-indigo-600 dark:text-indigo-400 mr-2" />
                <p className="font-bold text-gray-900 dark:text-white">Energy Forecasting</p>
              </div>
              <p className="text-sm leading-relaxed">
                Production, demand, and consumption forecasting using IITGN-trained ML models with confidence intervals and time-series analysis.
              </p>
            </div>
            <div className="bg-white dark:bg-gray-800 p-5 rounded-xl border border-purple-100 dark:border-purple-900 shadow-sm">
              <div className="flex items-center mb-2">
                <Brain className="w-5 h-5 text-purple-600 dark:text-purple-400 mr-2" />
                <p className="font-bold text-gray-900 dark:text-white">ML Predictions</p>
              </div>
              <p className="text-sm leading-relaxed">
                RandomForest, XGBoost, and LSTM models for motor diagnostics, fault detection, and solar power forecasting.
              </p>
            </div>
            <div className="bg-white dark:bg-gray-800 p-5 rounded-xl border border-orange-100 dark:border-orange-900 shadow-sm">
              <div className="flex items-center mb-2">
                <MessageSquare className="w-5 h-5 text-orange-600 dark:text-orange-400 mr-2" />
                <p className="font-bold text-gray-900 dark:text-white">AI Explanations</p>
              </div>
              <p className="text-sm leading-relaxed">
                Natural language explanations powered by Groq AI for all recommendations, predictions, and insights.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIMLInsightsPage;


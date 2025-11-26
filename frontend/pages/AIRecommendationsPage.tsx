import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Lightbulb, Battery, Zap, TrendingUp } from 'lucide-react';
import Card from '../components/ui/Card';

const AIRecommendationsPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-full bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 -m-4 md:-m-6 lg:-m-8 p-4 md:p-6 lg:p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <button
            onClick={() => navigate('/ai-ml-insights')}
            className="flex items-center text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-4"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back to AI/ML Insights
          </button>
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
            Smart Recommendations
          </h1>
          <p className="text-gray-600 dark:text-gray-400 text-lg">
            AI-powered recommendations based on your planning, optimization, and telemetry data
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card title="Load Shifting">
            <div className="flex items-center mb-3">
              <TrendingUp className="w-6 h-6 text-blue-600 dark:text-blue-400 mr-2" />
              <h4 className="font-semibold text-gray-900 dark:text-white">Load Shifting</h4>
            </div>
            <p className="text-gray-600 dark:text-gray-400">
              Recommendations for shifting non-critical loads to off-peak hours to reduce costs and optimize grid usage.
            </p>
          </Card>
          <Card title="Tariff Optimization">
            <div className="flex items-center mb-3">
              <Zap className="w-6 h-6 text-yellow-600 dark:text-yellow-400 mr-2" />
              <h4 className="font-semibold text-gray-900 dark:text-white">Tariff Optimization</h4>
            </div>
            <p className="text-gray-600 dark:text-gray-400">
              Optimize energy consumption patterns based on time-of-use tariffs and dynamic pricing.
            </p>
          </Card>
          <Card title="Battery Tuning">
            <div className="flex items-center mb-3">
              <Battery className="w-6 h-6 text-green-600 dark:text-green-400 mr-2" />
              <h4 className="font-semibold text-gray-900 dark:text-white">Battery Tuning</h4>
            </div>
            <p className="text-gray-600 dark:text-gray-400">
              AI-driven recommendations for battery charging/discharging schedules to maximize lifespan and efficiency.
            </p>
          </Card>
        </div>

        <Card title="Coming Soon" className="mt-6">
          <p className="text-gray-600 dark:text-gray-400">
            This feature is under development. Recommendations will be generated based on your planning data, optimization results, and real-time telemetry.
          </p>
        </Card>
      </div>
    </div>
  );
};

export default AIRecommendationsPage;


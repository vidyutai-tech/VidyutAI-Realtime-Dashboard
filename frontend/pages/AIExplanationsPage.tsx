import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, MessageSquare } from 'lucide-react';
import Card from '../components/ui/Card';

const AIExplanationsPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-full bg-gradient-to-br from-orange-50 via-white to-amber-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 -m-4 md:-m-6 lg:-m-8 p-4 md:p-6 lg:p-8">
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
            Natural Language Explanations
          </h1>
          <p className="text-gray-600 dark:text-gray-400 text-lg">
            Get AI-generated explanations for recommendations and insights in plain language
          </p>
        </div>

        <Card title="Coming Soon" className="mt-6">
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            This feature will provide natural language explanations for:
          </p>
          <ul className="list-disc list-inside space-y-2 text-gray-600 dark:text-gray-400">
            <li>Why specific recommendations were made</li>
            <li>How optimization results were calculated</li>
            <li>What factors influenced predictions</li>
            <li>Plain-language summaries of complex ML insights</li>
          </ul>
        </Card>
      </div>
    </div>
  );
};

export default AIExplanationsPage;


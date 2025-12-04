import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Lightbulb, MessageSquare, Brain, Sparkles } from 'lucide-react';
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
            AI Explanations
          </h1>
          <p className="text-gray-600 dark:text-gray-400 text-lg">
            Natural language explanations for AI predictions and recommendations
          </p>
        </div>

        {/* Coming Soon Banner */}
        <div className="mb-8 p-8 bg-gradient-to-r from-orange-100 to-amber-100 dark:from-orange-900/30 dark:to-amber-900/30 rounded-2xl border-2 border-orange-300 dark:border-orange-700">
          <div className="flex items-center justify-center mb-4">
            <div className="p-4 bg-orange-600 text-white rounded-full">
              <Sparkles className="w-12 h-12" />
            </div>
          </div>
          <h2 className="text-3xl font-bold text-center text-gray-900 dark:text-white mb-3">
            Coming Soon
          </h2>
          <p className="text-center text-gray-700 dark:text-gray-300 text-lg max-w-2xl mx-auto">
            We're working on bringing you natural language AI explanations to help you understand predictions, recommendations, and optimization results in plain English.
          </p>
        </div>

        {/* Feature Preview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <div className="flex flex-col items-center text-center space-y-4 p-4">
              <div className="p-4 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <MessageSquare className="w-8 h-8 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="font-bold text-lg text-gray-900 dark:text-white">
                Natural Language Explanations
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Get easy-to-understand explanations for complex AI predictions and optimization results
              </p>
            </div>
          </Card>

          <Card>
            <div className="flex flex-col items-center text-center space-y-4 p-4">
              <div className="p-4 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                <Brain className="w-8 h-8 text-purple-600 dark:text-purple-400" />
              </div>
              <h3 className="font-bold text-lg text-gray-900 dark:text-white">
                Model Insights
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Understand how AI models make decisions and what factors influence their predictions
              </p>
            </div>
          </Card>

          <Card>
            <div className="flex flex-col items-center text-center space-y-4 p-4">
              <div className="p-4 bg-green-100 dark:bg-green-900/30 rounded-lg">
                <Lightbulb className="w-8 h-8 text-green-600 dark:text-green-400" />
              </div>
              <h3 className="font-bold text-lg text-gray-900 dark:text-white">
                Decision Insights
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Receive clear, decision-oriented insights based on AI analysis to improve your energy system
              </p>
            </div>
          </Card>
        </div>

        {/* What to Expect */}
        <Card>
          <div className="p-6">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              What to Expect
            </h3>
            <div className="space-y-4 text-gray-700 dark:text-gray-300">
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-orange-600 rounded-full mt-2"></div>
                <p>
                  <strong>Prediction Explanations:</strong> Understand why the AI predicted certain energy consumption patterns or equipment failures
                </p>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-orange-600 rounded-full mt-2"></div>
                <p>
                  <strong>Optimization Rationale:</strong> Learn why specific energy sources were prioritized in optimization results
                </p>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-orange-600 rounded-full mt-2"></div>
                <p>
                  <strong>Recommendation Context:</strong> Get detailed explanations for AI-generated recommendations with supporting data
                </p>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-orange-600 rounded-full mt-2"></div>
                <p>
                  <strong>Interactive Q&A:</strong> Ask follow-up questions about AI decisions and get instant, context-aware answers
                </p>
              </div>
            </div>
          </div>
        </Card>

        {/* Call to Action */}
        <div className="mt-8 text-center">
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            In the meantime, explore other AI/ML features
          </p>
          <button
            onClick={() => navigate('/ai-ml-insights')}
            className="px-6 py-3 bg-orange-600 text-white rounded-lg font-semibold hover:bg-orange-700 transition-colors"
          >
            Back to AI/ML Insights
          </button>
        </div>
      </div>
    </div>
  );
};

export default AIExplanationsPage;

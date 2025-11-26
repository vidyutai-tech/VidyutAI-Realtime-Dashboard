import React from 'react';
import { Lightbulb, TrendingUp, Battery, Zap, Clock } from 'lucide-react';
import Card from '../ui/Card';

interface Insight {
  id: string;
  category: 'battery' | 'cost' | 'renewable' | 'grid';
  title: string;
  description: string;
  metrics?: { label: string; value: string }[];
  timeWindow?: string;
}

interface EnrichedInsightsProps {
  insights: Insight[];
}

const EnrichedInsights: React.FC<EnrichedInsightsProps> = ({ insights }) => {
  const getCategoryIcon = (category: Insight['category']) => {
    switch (category) {
      case 'battery':
        return <Battery className="w-5 h-5 text-blue-600 dark:text-blue-400" />;
      case 'cost':
        return <TrendingUp className="w-5 h-5 text-green-600 dark:text-green-400" />;
      case 'renewable':
        return <Zap className="w-5 h-5 text-orange-600 dark:text-orange-400" />;
      case 'grid':
        return <Clock className="w-5 h-5 text-purple-600 dark:text-purple-400" />;
    }
  };

  const getCategoryColor = (category: Insight['category']) => {
    switch (category) {
      case 'battery':
        return 'from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 border-blue-200 dark:border-blue-800';
      case 'cost':
        return 'from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-green-200 dark:border-green-800';
      case 'renewable':
        return 'from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20 border-orange-200 dark:border-orange-800';
      case 'grid':
        return 'from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 border-purple-200 dark:border-purple-800';
    }
  };

  return (
    <Card title="Enriched Insights" className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20">
      <div className="space-y-4">
        {insights.map((insight) => (
          <div
            key={insight.id}
            className={`bg-gradient-to-r ${getCategoryColor(insight.category)} rounded-xl p-5 border-2`}
          >
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 mt-1">
                {getCategoryIcon(insight.category)}
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold text-gray-900 dark:text-white text-lg">
                    {insight.title}
                  </h4>
                  {insight.timeWindow && (
                    <span className="px-3 py-1 bg-white/50 dark:bg-gray-800/50 rounded-lg text-xs font-medium text-gray-700 dark:text-gray-300">
                      {insight.timeWindow}
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed mb-3">
                  {insight.description}
                </p>
                {insight.metrics && insight.metrics.length > 0 && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
                    {insight.metrics.map((metric, index) => (
                      <div
                        key={index}
                        className="bg-white/70 dark:bg-gray-800/70 rounded-lg p-3 border border-white/50 dark:border-gray-700/50"
                      >
                        <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">{metric.label}</p>
                        <p className="text-lg font-bold text-gray-900 dark:text-white">{metric.value}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
};

export default EnrichedInsights;


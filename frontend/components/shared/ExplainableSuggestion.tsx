import React, { useState } from 'react';
import { Info, X, TrendingUp, Zap, Battery, DollarSign, BarChart3 } from 'lucide-react';
import { RLSuggestion } from '../../types';

interface ExplainableSuggestionProps {
  suggestion: RLSuggestion;
  onClose: () => void;
}

const ExplainableSuggestion: React.FC<ExplainableSuggestionProps> = ({ suggestion, onClose }) => {
  // Extract explainability data from suggestion (mock for now, should come from backend)
  const explanation = {
    modelConfidence: 87.5,
    keyInputs: {
      pvForecast: { value: 450, unit: 'kW', time: 'Next 4 hours' },
      tariff: { value: 8.5, unit: '₹/kWh', time: 'Current' },
      loadForecast: { value: 380, unit: 'kW', time: 'Next 4 hours' },
    },
    expectedBatteryCycleCost: 2.3, // percentage
    expectedSavings: suggestion.expected_savings || 1250, // INR
    reasoning: [
      'High PV generation forecast (450 kW) exceeds load (380 kW)',
      'Current tariff (₹8.5/kWh) is above average, making battery discharge cost-effective',
      'Battery SoC (89%) allows discharge without risk',
      'Expected savings: ₹1,250 over next 4 hours',
    ],
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-6 rounded-t-2xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Info className="w-6 h-6" />
            <h3 className="text-xl font-bold">Why This Action?</h3>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Model Confidence */}
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Model Confidence</span>
              <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {Number(explanation.modelConfidence).toFixed(2)}%
              </span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                style={{ width: `${explanation.modelConfidence}%` }}
              />
            </div>
          </div>

          {/* Key Inputs */}
          <div>
            <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-blue-600" />
              Key Inputs
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20 rounded-lg p-4 border border-orange-200 dark:border-orange-800">
                <div className="flex items-center gap-2 mb-2">
                  <Zap className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                  <span className="text-xs font-medium text-gray-600 dark:text-gray-400">PV Forecast</span>
                </div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {explanation.keyInputs.pvForecast.value} {explanation.keyInputs.pvForecast.unit}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {explanation.keyInputs.pvForecast.time}
                </div>
              </div>

              <div className="bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 rounded-lg p-4 border border-purple-200 dark:border-purple-800">
                <div className="flex items-center gap-2 mb-2">
                  <DollarSign className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                  <span className="text-xs font-medium text-gray-600 dark:text-gray-400">Tariff</span>
                </div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {explanation.keyInputs.tariff.value} {explanation.keyInputs.tariff.unit}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {explanation.keyInputs.tariff.time}
                </div>
              </div>

              <div className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  <span className="text-xs font-medium text-gray-600 dark:text-gray-400">Load Forecast</span>
                </div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {explanation.keyInputs.loadForecast.value} {explanation.keyInputs.loadForecast.unit}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {explanation.keyInputs.loadForecast.time}
                </div>
              </div>
            </div>
          </div>

          {/* Expected Impact */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-4 border border-yellow-200 dark:border-yellow-800">
              <div className="flex items-center gap-2 mb-2">
                <Battery className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Battery Cycle Cost</span>
              </div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {Number(explanation.expectedBatteryCycleCost).toFixed(2)}%
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Expected degradation impact
              </div>
            </div>

            <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 border border-green-200 dark:border-green-800">
              <div className="flex items-center gap-2 mb-2">
                <DollarSign className="w-5 h-5 text-green-600 dark:text-green-400" />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Expected Savings</span>
              </div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                ₹{explanation.expectedSavings.toLocaleString()}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Over next 4 hours
              </div>
            </div>
          </div>

          {/* Reasoning */}
          <div>
            <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Decision Reasoning</h4>
            <ul className="space-y-2">
              {explanation.reasoning.map((reason, index) => (
                <li key={index} className="flex items-start gap-3 text-sm text-gray-700 dark:text-gray-300">
                  <div className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-blue-600 dark:text-blue-400 font-semibold text-xs">{index + 1}</span>
                  </div>
                  <span className="flex-1">{reason}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExplainableSuggestion;


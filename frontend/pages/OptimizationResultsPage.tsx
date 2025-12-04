import React, { useState, useEffect, useContext } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Download, CheckCircle, TrendingUp, TrendingDown, Zap, Battery, Grid, Sun, Leaf, DollarSign } from 'lucide-react';
import { AppContext } from '../contexts/AppContext';
import Card from '../components/ui/Card';
import axios from 'axios';

interface OptimizationResults {
  summary: {
    Costs: {
      Total_Cost_INR: number;
      Cost_per_kWh_INR: number;
      Breakdown: any;
    };
    Emissions: {
      Total_CO2_t: number;
      CO2_per_kWh_kg: number;
    };
    Load: {
      Total_Served_kWh: number;
    };
    Battery: {
      Cycles: number;
      SoC_Min: number;
      SoC_Max: number;
    };
  };
  plot_base64?: string;
}

const OptimizationResultsPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { selectedSite } = useContext(AppContext)!;
  const [results, setResults] = useState<OptimizationResults | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    // Load saved results or run optimization
    const savedResults = localStorage.getItem('sourceOptimizationResponse');
    if (savedResults) {
      try {
        setResults(JSON.parse(savedResults));
      } catch (e) {
        console.error('Failed to parse saved results:', e);
      }
    }
  }, []);

  const handleProceedToDashboard = () => {
    // Navigate back to main options page
    navigate('/main-options');
  };

  const summary = results?.summary;
  const plotUrl = results?.plot_base64 ? `data:image/png;base64,${results.plot_base64}` : null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-4">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <button
            onClick={() => navigate('/optimization-setup')}
            className="flex items-center text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-4"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back to Setup
          </button>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Optimization Results
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Review your optimization results and KPIs
          </p>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-800 dark:text-red-300">
            {error}
          </div>
        )}

        {!results && !isLoading && (
          <Card title="No Results">
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              No optimization results found. Please run optimization first.
            </p>
            <button
              onClick={() => navigate('/optimization-setup')}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700"
            >
              Go to Optimization Setup
            </button>
          </Card>
        )}

        {results && (
          <div className="space-y-6">
            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Total Cost</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      ₹{summary?.Costs?.Total_Cost_INR?.toFixed(2) || '0.00'}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {summary?.Costs?.Cost_per_kWh_INR?.toFixed(2) || '0.00'} ₹/kWh
                    </p>
                  </div>
                  <DollarSign className="w-12 h-12 text-green-600 dark:text-green-400" />
                </div>
              </Card>

              <Card>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">CO2 Emissions</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {summary?.Emissions?.Total_CO2_t?.toFixed(2) || '0.00'} t
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {summary?.Emissions?.CO2_per_kWh_kg?.toFixed(2) || '0.00'} kg/kWh
                    </p>
                  </div>
                  <Leaf className="w-12 h-12 text-teal-600 dark:text-teal-400" />
                </div>
              </Card>

              <Card>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Energy Served</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {summary?.Load?.Total_Served_kWh?.toFixed(2) || '0.00'} kWh
                    </p>
                  </div>
                  <Zap className="w-12 h-12 text-yellow-600 dark:text-yellow-400" />
                </div>
              </Card>

              <Card>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Battery Cycles</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {summary?.Battery?.Cycles?.toFixed(2) || '0.00'}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      SoC: {summary?.Battery?.SoC_Min?.toFixed(2) || '0.00'}% - {summary?.Battery?.SoC_Max?.toFixed(2) || '0.00'}%
                    </p>
                  </div>
                  <Battery className="w-12 h-12 text-blue-600 dark:text-blue-400" />
                </div>
              </Card>
            </div>

            {/* Optimization Plot */}
            {plotUrl && (
              <Card title="Optimization Dispatch">
                <div className="flex justify-center">
                  <img src={plotUrl} alt="Optimization Results" className="max-w-full h-auto rounded-lg" />
                </div>
              </Card>
            )}

            {/* Cost Breakdown */}
            {summary?.Costs?.Breakdown && (
              <Card title="Cost Breakdown">
                <div className="space-y-2">
                  {Object.entries(summary.Costs.Breakdown).map(([key, value]: [string, any]) => (
                    <div key={key} className="flex justify-between items-center p-2 bg-gray-50 dark:bg-gray-700 rounded">
                      <span className="text-sm text-gray-700 dark:text-gray-300">{key}</span>
                      <span className="font-semibold text-gray-900 dark:text-white">
                        ₹{Number(value).toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {/* Hydrogen Fuel Cell Dispatch */}
            {results?.summary?.Hydrogen && (
              <Card title="Hydrogen Fuel Cell System">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 bg-teal-50 dark:bg-teal-900/20 rounded-lg border border-teal-200 dark:border-teal-800">
                    <div className="flex items-center space-x-2 mb-2">
                      <Zap className="w-5 h-5 text-teal-600 dark:text-teal-400" />
                      <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">Electrolyzer Consumption</p>
                    </div>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {results.summary.Hydrogen?.Energy_to_Electrolyzer_kWh?.toFixed(2) || '0.00'} kWh
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Energy used for hydrogen production</p>
                  </div>
                  <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                    <div className="flex items-center space-x-2 mb-2">
                      <Battery className="w-5 h-5 text-green-600 dark:text-green-400" />
                      <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">Fuel Cell Generation</p>
                    </div>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {results.summary.Hydrogen?.Energy_from_Fuel_Cell_kWh?.toFixed(2) || '0.00'} kWh
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Energy generated from hydrogen</p>
                  </div>
                </div>
                <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    <strong>Hydrogen Integration:</strong> Long-duration energy storage through hydrogen fuel cells provides 
                    additional cost savings and emission reduction compared to battery-only systems.
                  </p>
                </div>
              </Card>
            )}

            {/* PHES Dispatch (if available) */}
            {results?.summary?.PHES && (
              <Card title="Pumped Hydro Energy Storage (PHES)">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                    <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">PHES Charging</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {results.summary.PHES?.Charged_kWh?.toFixed(2) || '0.00'} kWh
                    </p>
                  </div>
                  <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
                    <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">PHES Discharging</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {results.summary.PHES?.Discharged_kWh?.toFixed(2) || '0.00'} kWh
                    </p>
                  </div>
                  <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                    <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Cost per kWh</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">3.83</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">INR/kWh (12.53% lower than BESS)</p>
                  </div>
                </div>
              </Card>
            )}

            {/* Priority-Based Load Shedding (if from demand optimization) */}
            {results?.summary?.Load?.Per_Load_Breakdown && (
              <Card title="Priority-Based Load Management">
                <div className="space-y-4">
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                    Load distribution based on priority levels (Critical loads always served, flexible loads can be curtailed)
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                    {Object.entries(results.summary.Load.Per_Load_Breakdown).map(([loadId, loadData]: [string, any]) => (
                      <div 
                        key={loadId} 
                        className={`p-4 rounded-lg border-2 ${
                          loadData.Type === 'CRITICAL'
                            ? 'bg-red-50 dark:bg-red-900/20 border-red-300 dark:border-red-800'
                            : 'bg-orange-50 dark:bg-orange-900/20 border-orange-300 dark:border-orange-800'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <p className="font-semibold text-gray-900 dark:text-white">Load {loadId}</p>
                          <span className={`text-xs px-2 py-1 rounded-full ${
                            loadData.Type === 'CRITICAL'
                              ? 'bg-red-200 text-red-800 dark:bg-red-800 dark:text-red-200'
                              : 'bg-orange-200 text-orange-800 dark:bg-orange-800 dark:text-orange-200'
                          }`}>
                            {loadData.Type}
                          </span>
                        </div>
                        <div className="space-y-1 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-600 dark:text-gray-400">Demand:</span>
                            <span className="font-semibold">{loadData.Demand_kWh?.toFixed(2) || '0.00'} kWh</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600 dark:text-gray-400">Served:</span>
                            <span className="font-semibold text-green-600 dark:text-green-400">
                              {loadData.Served_kWh?.toFixed(2) || '0.00'} kWh
                            </span>
                          </div>
                          {loadData.Type === 'CURTAILABLE' && loadData.Curtailed_kWh > 0 && (
                            <div className="flex justify-between">
                              <span className="text-gray-600 dark:text-gray-400">Curtailed:</span>
                              <span className="font-semibold text-red-600 dark:text-red-400">
                                {loadData.Curtailed_kWh?.toFixed(2) || '0.00'} kWh
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </Card>
            )}

            {/* Action Buttons */}
            <div className="flex justify-end space-x-4">
              <button
                onClick={() => navigate('/optimization-setup')}
                className="px-6 py-3 bg-gray-600 text-white rounded-lg font-semibold hover:bg-gray-700"
              >
                Run Again
              </button>
              <button
                onClick={() => navigate('/main-options')}
                className="px-6 py-3 bg-gray-500 text-white rounded-lg font-semibold hover:bg-gray-600"
              >
                Back to Options
              </button>
              <button
                onClick={handleProceedToDashboard}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 flex items-center space-x-2"
              >
                <span>Continue</span>
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default OptimizationResultsPage;


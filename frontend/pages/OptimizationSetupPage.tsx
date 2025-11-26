import React, { useState, useEffect, useContext } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Upload, FileText, Settings, Zap, Battery, Grid, Sun, CheckCircle } from 'lucide-react';
import { AppContext } from '../contexts/AppContext';
import { saveOptimizationConfig, getLoadProfiles, getPlanningRecommendations } from '../services/api';
import Card from '../components/ui/Card';

const OptimizationSetupPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { selectedSite } = useContext(AppContext)!;
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');

  // Get planning recommendation from navigation state
  const planningRecommendation = (location.state as any)?.planningRecommendation;

  // Load profile and planning recommendation data
  const [loadProfiles, setLoadProfiles] = useState<any[]>([]);
  const [planningRecommendations, setPlanningRecommendations] = useState<any[]>([]);
  const [selectedLoadProfile, setSelectedLoadProfile] = useState<string>('');
  const [selectedPlanningRecommendation, setSelectedPlanningRecommendation] = useState<string>('');

  // Form data
  const [formData, setFormData] = useState({
    load_data: '',
    tariff_data: '',
    pv_parameters: '',
    battery_parameters: '',
    grid_parameters: '',
    objective: 'combination' as 'cost' | 'co2' | 'combination'
  });

  useEffect(() => {
    const loadData = async () => {
      try {
        const [profiles, recommendations] = await Promise.all([
          getLoadProfiles(selectedSite?.id).catch(err => {
            console.warn('Failed to load profiles:', err);
            return [];
          }),
          getPlanningRecommendations(selectedSite?.id).catch(err => {
            console.warn('Failed to load recommendations:', err);
            return [];
          })
        ]);
        setLoadProfiles(profiles);
        setPlanningRecommendations(recommendations);
        
        // If coming from planning wizard, pre-fill data
        if (planningRecommendation) {
          // Auto-select the load profile from planning
          if (planningRecommendation.load_profile_id) {
            setSelectedLoadProfile(planningRecommendation.load_profile_id);
          }
          
          // Auto-select the planning recommendation
          if (planningRecommendation.id) {
            setSelectedPlanningRecommendation(planningRecommendation.id);
          }
          
          // Pre-fill PV parameters from technical sizing
          if (planningRecommendation.technical_sizing?.solar_capacity_kw) {
            setFormData(prev => ({
              ...prev,
              pv_parameters: JSON.stringify({
                capacity: planningRecommendation.technical_sizing.solar_capacity_kw
              }, null, 2)
            }));
          }
          
          // Pre-fill battery parameters from technical sizing
          if (planningRecommendation.technical_sizing?.battery_capacity_kwh) {
            setFormData(prev => ({
              ...prev,
              battery_parameters: JSON.stringify({
                capacity: planningRecommendation.technical_sizing.battery_capacity_kwh
              }, null, 2)
            }));
          }
          
          // Pre-fill grid parameters from technical sizing
          if (planningRecommendation.technical_sizing?.grid_connection_kw) {
            setFormData(prev => ({
              ...prev,
              grid_parameters: JSON.stringify({
                connection: planningRecommendation.technical_sizing.grid_connection_kw
              }, null, 2)
            }));
          }
          
          // Map primary goal to objective
          const goalToObjective: Record<string, 'cost' | 'co2' | 'combination'> = {
            'savings': 'cost',
            'carbon_reduction': 'co2',
            'self_sustainability': 'combination',
            'reliability': 'combination'
          };
          setFormData(prev => ({
            ...prev,
            objective: goalToObjective[planningRecommendation.primary_goal] || 'combination'
          }));
        } else {
          // Auto-select if only one option (when not from planning)
          if (profiles.length === 1) {
            setSelectedLoadProfile(profiles[0].id);
          }
          if (recommendations.length === 1) {
            setSelectedPlanningRecommendation(recommendations[0].id);
          }
        }
      } catch (err: any) {
        console.error('Failed to load data:', err);
      }
    };
    loadData();
  }, [selectedSite, planningRecommendation]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFileUpload = (type: 'load' | 'tariff', file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      if (type === 'load') {
        setFormData(prev => ({ ...prev, load_data: content }));
      } else {
        setFormData(prev => ({ ...prev, tariff_data: content }));
      }
    };
    reader.readAsText(file);
  };

  const handleSubmit = async () => {
    if (!formData.load_data && !selectedLoadProfile) {
      setError('Please provide load data or select a load profile');
      return;
    }
    if (!formData.tariff_data) {
      setError('Please provide tariff data');
      return;
    }

    setError('');
    setIsLoading(true);

    try {
      // Validate JSON if provided
      if (formData.load_data) {
        try {
          JSON.parse(formData.load_data);
        } catch (e) {
          throw new Error('Invalid JSON in Load Data');
        }
      }
      if (formData.tariff_data) {
        try {
          JSON.parse(formData.tariff_data);
        } catch (e) {
          throw new Error('Invalid JSON in Tariff Data');
        }
      }

      const result = await saveOptimizationConfig({
        site_id: selectedSite?.id || null,
        load_profile_id: selectedLoadProfile || null,
        planning_recommendation_id: selectedPlanningRecommendation || null,
        load_data: formData.load_data || (selectedLoadProfile ? '{}' : ''),
        tariff_data: formData.tariff_data,
        pv_parameters: formData.pv_parameters || null,
        battery_parameters: formData.battery_parameters || null,
        grid_parameters: formData.grid_parameters || null,
        objective: formData.objective
      });

      // Navigate to source optimization page to run the optimization
      navigate('/source-optimization', { 
        state: { 
          configId: result.config.id,
          returnTo: '/main-options' // Allow returning to main options
        } 
      });
    } catch (err: any) {
      setError(err.message || 'Failed to save optimization config');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-4"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back
          </button>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Optimization Setup
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Configure your optimization parameters and load data
          </p>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-800 dark:text-red-300">
            {error}
          </div>
        )}

        {planningRecommendation && (
          <div className="mb-4 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
            <div className="flex items-start">
              <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 mr-2 mt-0.5" />
              <div>
                <p className="text-green-800 dark:text-green-300 font-semibold">
                  Data Pre-filled from Planning Wizard
                </p>
                <p className="text-green-700 dark:text-green-400 text-sm mt-1">
                  Your planning recommendation data has been automatically loaded. You can modify any fields as needed.
                </p>
              </div>
            </div>
          </div>
        )}

        <Card title="Optimization Configuration">
          <div className="space-y-6">
            {/* Load Profile Selection */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Load Profile
              </label>
              {loadProfiles.length > 0 ? (
                <select
                  value={selectedLoadProfile}
                  onChange={(e) => setSelectedLoadProfile(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="">Select a load profile...</option>
                  {loadProfiles.map(profile => (
                    <option key={profile.id} value={profile.id}>
                      {profile.name} ({profile.total_daily_energy_kwh.toFixed(2)} kWh/day)
                    </option>
                  ))}
                </select>
              ) : (
                <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg text-yellow-800 dark:text-yellow-300">
                  No load profiles found. Please create one in the Planning Wizard first.
                </div>
              )}
            </div>

            {/* Planning Recommendation Selection */}
            {planningRecommendations.length > 0 && (
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Planning Recommendation (Optional)
                </label>
                <select
                  value={selectedPlanningRecommendation}
                  onChange={(e) => setSelectedPlanningRecommendation(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="">None</option>
                  {planningRecommendations.map(rec => (
                    <option key={rec.id} value={rec.id}>
                      Recommendation {new Date(rec.created_at).toLocaleDateString()}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Load Data */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Load Data (JSON)
              </label>
              <textarea
                name="load_data"
                value={formData.load_data}
                onChange={handleInputChange}
                rows={4}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-mono text-sm"
                placeholder='{"hourly_load": [100, 120, ...]}'
              />
            </div>

            {/* Tariff Data */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Tariff Data (JSON) *
              </label>
              <textarea
                name="tariff_data"
                value={formData.tariff_data}
                onChange={handleInputChange}
                rows={4}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-mono text-sm"
                placeholder='{"hourly_tariff": [8.5, 8.5, ...]}'
                required
              />
            </div>

            {/* Objective */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Optimization Objective
              </label>
              <select
                name="objective"
                value={formData.objective}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="cost">Minimize Cost</option>
                <option value="co2">Minimize CO2 Emissions</option>
                <option value="combination">Cost & CO2 Combination</option>
              </select>
            </div>

            {/* Optional Parameters */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  PV Parameters (JSON, Optional)
                </label>
                <textarea
                  name="pv_parameters"
                  value={formData.pv_parameters}
                  onChange={handleInputChange}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-mono text-sm"
                  placeholder='{"capacity": 2000}'
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Battery Parameters (JSON, Optional)
                </label>
                <textarea
                  name="battery_parameters"
                  value={formData.battery_parameters}
                  onChange={handleInputChange}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-mono text-sm"
                  placeholder='{"capacity": 4000}'
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Grid Parameters (JSON, Optional)
                </label>
                <textarea
                  name="grid_parameters"
                  value={formData.grid_parameters}
                  onChange={handleInputChange}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-mono text-sm"
                  placeholder='{"connection": 2000}'
                />
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end">
              <button
                onClick={handleSubmit}
                disabled={isLoading}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 flex items-center space-x-2"
              >
                <span>Run Optimization</span>
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default OptimizationSetupPage;


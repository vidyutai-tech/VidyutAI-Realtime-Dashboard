import React, { useState, useEffect, useContext } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Upload, FileText, Settings, Zap, Battery, Grid, Sun, CheckCircle, Users } from 'lucide-react';
import { AppContext } from '../contexts/AppContext';
import { getLoadProfiles, getPlanningRecommendations } from '../services/api';
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

  // Common form data (shared between Demand and Source Optimization)
  const [formData, setFormData] = useState({
    // Basic Parameters
    weather: 'Sunny',
    num_days: 1,
    time_resolution_minutes: 60,
    profile_type: 'Auto detect',
    
    // System Configuration
    grid_connection: 2500,
    solar_connection: 2000,
    battery_capacity: 4000000,  // Wh
    battery_voltage: 100,
    diesel_capacity: 2200,
    storage_type: 'battery', // 'battery', 'phes', 'hybrid'
    phes_capacity: 10000, // kWh
    
    // Hydrogen System Parameters
    electrolyzer_capacity: 1000.0,
    fuel_cell_capacity: 1000.0,
    h2_tank_capacity: 100.0,
    fuel_cell_efficiency_percent: 0.60,
    
    // Cost Parameters
    fuel_price: 90,
    pv_energy_cost: 2.85,
    battery_om_cost: 6.085,
    fuel_cell_om_cost: 1.5,
    electrolyzer_om_cost: 0.5,
    
    // File upload
    uploadedFile: null as File | null,
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
          if (planningRecommendation.load_profile_id) {
            setSelectedLoadProfile(planningRecommendation.load_profile_id);
          }
          if (planningRecommendation.id) {
            setSelectedPlanningRecommendation(planningRecommendation.id);
          }
          
          // Pre-fill system configuration from technical sizing
          if (planningRecommendation.technical_sizing) {
            setFormData(prev => ({
              ...prev,
              solar_connection: planningRecommendation.technical_sizing.solar_capacity_kw || prev.solar_connection,
              battery_capacity: (planningRecommendation.technical_sizing.battery_capacity_kwh || 0) * 1000 || prev.battery_capacity,
              grid_connection: planningRecommendation.technical_sizing.grid_connection_kw || prev.grid_connection,
            }));
          }
        } else {
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
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? parseFloat(value) || 0 : value
    }));
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData(prev => ({
        ...prev,
        uploadedFile: file
      }));
    }
  };

  const handleNext = (optimizationType: 'demand' | 'source') => {
    // Validate required fields
    if (formData.num_days < 1 || formData.num_days > 30) {
      setError('Number of days must be between 1 and 30');
      return;
    }
    
    const validResolutions = [15, 30, 60];
    if (!validResolutions.includes(formData.time_resolution_minutes)) {
      setError('Time resolution must be 15, 30, or 60 minutes');
      return;
    }

    setError('');
    
    // Navigate directly to the optimization page with common data
    // Note: We don't save the config here because:
    // 1. The optimization endpoints receive all parameters directly
    // 2. load_data and tariff_data are provided via file upload or default profiles
    // 3. Saving can be done later if needed after optimization results
    navigate(`/${optimizationType}-optimization`, {
      state: {
        commonConfig: formData,
        uploadedFile: formData.uploadedFile,
        loadProfileId: selectedLoadProfile,
        planningRecommendationId: selectedPlanningRecommendation
      }
    });
  };

  const controlWrapperClass = "form-control space-y-2";
  const labelClass = "label-text text-sm font-medium text-base-content/70 mb-1.5";
  const inputClass = "w-full px-4 py-3 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder:text-gray-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all duration-200 shadow-sm hover:border-gray-300";
  const selectClass = "w-full px-4 py-3 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all duration-200 shadow-sm hover:border-gray-300";
  const fileInputClass = "file-input w-full rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all duration-200 shadow-sm hover:border-gray-300 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20";
  const sectionPanelClass = "space-y-4 rounded-2xl border border-base-200/60 bg-base-100/70 p-5 shadow-sm";

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-4">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <button
            onClick={() => navigate('/main-options')}
            className="flex items-center text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-4"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back to Main Options
          </button>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Optimization Setup
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Configure common parameters for optimization. Choose Demand or Source Optimization to proceed.
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

        <div className="space-y-8">
          {/* Basic Parameters */}
          <Card>
            <div className={sectionPanelClass}>
              <h3 className="text-lg font-semibold mb-4">Basic Parameters</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className={controlWrapperClass}>
                  <label className="label">
                    <span className={labelClass}>Weather Condition</span>
                  </label>
                  <select
                    name="weather"
                    value={formData.weather}
                    onChange={handleInputChange}
                    className={selectClass}
                  >
                    <option value="Sunny">Sunny</option>
                    <option value="Cloudy">Cloudy</option>
                    <option value="Rainy">Rainy</option>
                  </select>
                </div>

                <div className={controlWrapperClass}>
                  <label className="label">
                    <span className={labelClass}>Number of Days</span>
                  </label>
                  <input
                    type="number"
                    name="num_days"
                    value={formData.num_days}
                    onChange={handleInputChange}
                    className={inputClass}
                    min="1"
                    max="30"
                  />
                </div>

                <div className={controlWrapperClass}>
                  <label className="label">
                    <span className={labelClass}>Time Resolution (minutes)</span>
                  </label>
                  <select
                    name="time_resolution_minutes"
                    value={formData.time_resolution_minutes}
                    onChange={handleInputChange}
                    className={selectClass}
                  >
                    <option value="15">15 minutes</option>
                    <option value="30">30 minutes</option>
                    <option value="60">60 minutes</option>
                  </select>
                </div>

                <div className={controlWrapperClass}>
                  <label className="label">
                    <span className={labelClass}>Profile Type</span>
                  </label>
                  <select
                    name="profile_type"
                    value={formData.profile_type}
                    onChange={handleInputChange}
                    className={selectClass}
                  >
                    <option value="Auto detect">Auto detect</option>
                    <option value="Residential">Residential</option>
                    <option value="Commercial">Commercial</option>
                    <option value="Industrial">Industrial</option>
                  </select>
                </div>
              </div>
            </div>
          </Card>

          {/* System Configuration */}
          <Card>
            <div className={sectionPanelClass}>
              <h3 className="text-lg font-semibold mb-4">System Configuration</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className={controlWrapperClass}>
                  <label className="label">
                    <span className={labelClass}>Grid Connection (kW)</span>
                  </label>
                  <input
                    type="number"
                    name="grid_connection"
                    value={formData.grid_connection}
                    onChange={handleInputChange}
                    className={inputClass}
                    step="100"
                  />
                </div>

                <div className={controlWrapperClass}>
                  <label className="label">
                    <span className={labelClass}>Solar Connection (kW)</span>
                  </label>
                  <input
                    type="number"
                    name="solar_connection"
                    value={formData.solar_connection}
                    onChange={handleInputChange}
                    className={inputClass}
                    step="100"
                  />
                </div>

                <div className={controlWrapperClass}>
                  <label className="label">
                    <span className={labelClass}>Storage Type</span>
                  </label>
                  <select
                    name="storage_type"
                    value={formData.storage_type}
                    onChange={handleInputChange}
                    className={selectClass}
                  >
                    <option value="battery">Battery Energy Storage (BESS)</option>
                    <option value="phes">Pumped Hydro Energy Storage (PHES)</option>
                    <option value="hybrid">Hybrid (BESS + PHES)</option>
                  </select>
                  <label className="label">
                    <span className="label-text-alt">Select primary storage technology</span>
                  </label>
                </div>

                <div className={controlWrapperClass}>
                  <label className="label">
                    <span className={labelClass}>Battery Capacity (Wh)</span>
                  </label>
                  <input
                    type="number"
                    name="battery_capacity"
                    value={formData.battery_capacity}
                    onChange={handleInputChange}
                    className={inputClass}
                    step="1000"
                    disabled={formData.storage_type === 'phes'}
                  />
                  {formData.storage_type === 'phes' && (
                    <label className="label">
                      <span className="label-text-alt text-gray-500">Disabled for PHES-only mode</span>
                    </label>
                  )}
                </div>

                <div className={controlWrapperClass}>
                  <label className="label">
                    <span className={labelClass}>Battery Voltage (V)</span>
                  </label>
                  <input
                    type="number"
                    name="battery_voltage"
                    value={formData.battery_voltage}
                    onChange={handleInputChange}
                    className={inputClass}
                    step="10"
                    disabled={formData.storage_type === 'phes'}
                  />
                  {formData.storage_type === 'phes' && (
                    <label className="label">
                      <span className="label-text-alt text-gray-500">Disabled for PHES-only mode</span>
                    </label>
                  )}
                </div>

                {(formData.storage_type === 'phes' || formData.storage_type === 'hybrid') && (
                  <div className={controlWrapperClass}>
                    <label className="label">
                      <span className={labelClass}>PHES Capacity (kWh)</span>
                    </label>
                    <input
                      type="number"
                      name="phes_capacity"
                      value={formData.phes_capacity}
                      onChange={handleInputChange}
                      className={inputClass}
                      step="100"
                    />
                    <label className="label">
                      <span className="label-text-alt">Large-scale, long-duration pumped hydro storage</span>
                    </label>
                  </div>
                )}

                <div className={controlWrapperClass}>
                  <label className="label">
                    <span className={labelClass}>Diesel Capacity (kW)</span>
                  </label>
                  <input
                    type="number"
                    name="diesel_capacity"
                    value={formData.diesel_capacity}
                    onChange={handleInputChange}
                    className={inputClass}
                    step="100"
                  />
                </div>

                <div className={controlWrapperClass}>
                  <label className="label">
                    <span className={labelClass}>Electrolyzer Capacity (kW)</span>
                  </label>
                  <input
                    type="number"
                    name="electrolyzer_capacity"
                    value={formData.electrolyzer_capacity}
                    onChange={handleInputChange}
                    className={inputClass}
                    step="10"
                  />
                </div>

                <div className={controlWrapperClass}>
                  <label className="label">
                    <span className={labelClass}>Fuel Cell Capacity (kW)</span>
                  </label>
                  <input
                    type="number"
                    name="fuel_cell_capacity"
                    value={formData.fuel_cell_capacity}
                    onChange={handleInputChange}
                    className={inputClass}
                    step="10"
                  />
                </div>

                <div className={controlWrapperClass}>
                  <label className="label">
                    <span className={labelClass}>H2 Tank Capacity (kg)</span>
                  </label>
                  <input
                    type="number"
                    name="h2_tank_capacity"
                    value={formData.h2_tank_capacity}
                    onChange={handleInputChange}
                    className={inputClass}
                    step="1"
                  />
                </div>

                <div className={controlWrapperClass}>
                  <label className="label">
                    <span className={labelClass}>Fuel Cell Efficiency (0-1)</span>
                  </label>
                  <input
                    type="number"
                    name="fuel_cell_efficiency_percent"
                    value={formData.fuel_cell_efficiency_percent}
                    onChange={handleInputChange}
                    className={inputClass}
                    step="0.01"
                    min="0"
                    max="1"
                  />
                </div>
              </div>
            </div>
          </Card>

          {/* Cost Parameters */}
          <Card>
            <div className={sectionPanelClass}>
              <h3 className="text-lg font-semibold mb-4">Cost Parameters</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className={controlWrapperClass}>
                  <label className="label">
                    <span className={labelClass}>Fuel Price (Rs/L)</span>
                  </label>
                  <input
                    type="number"
                    name="fuel_price"
                    value={formData.fuel_price}
                    onChange={handleInputChange}
                    className={inputClass}
                    step="0.1"
                  />
                </div>

                <div className={controlWrapperClass}>
                  <label className="label">
                    <span className={labelClass}>PV Energy Cost (Rs/kWh)</span>
                  </label>
                  <input
                    type="number"
                    name="pv_energy_cost"
                    value={formData.pv_energy_cost}
                    onChange={handleInputChange}
                    className={inputClass}
                    step="0.01"
                  />
                </div>

                <div className={controlWrapperClass}>
                  <label className="label">
                    <span className={labelClass}>Battery O&M Cost (Rs/kWh)</span>
                  </label>
                  <input
                    type="number"
                    name="battery_om_cost"
                    value={formData.battery_om_cost}
                    onChange={handleInputChange}
                    className={inputClass}
                    step="0.001"
                  />
                </div>

                <div className={controlWrapperClass}>
                  <label className="label">
                    <span className={labelClass}>Fuel Cell O&M Cost (Rs/kWh)</span>
                  </label>
                  <input
                    type="number"
                    name="fuel_cell_om_cost"
                    value={formData.fuel_cell_om_cost}
                    onChange={handleInputChange}
                    className={inputClass}
                    step="0.1"
                  />
                </div>

                <div className={controlWrapperClass}>
                  <label className="label">
                    <span className={labelClass}>Electrolyzer O&M Cost (Rs/kWh)</span>
                  </label>
                  <input
                    type="number"
                    name="electrolyzer_om_cost"
                    value={formData.electrolyzer_om_cost}
                    onChange={handleInputChange}
                    className={inputClass}
                    step="0.1"
                  />
                </div>
              </div>
            </div>
          </Card>

          {/* File Upload */}
          <Card>
            <div className={sectionPanelClass}>
              <h3 className="text-lg font-semibold mb-4">Upload Custom Data (Optional)</h3>
              <div className={controlWrapperClass}>
                <label className="label">
                  <span className={labelClass}>Upload CSV file with Load and Price data</span>
                </label>
                <input
                  type="file"
                  accept=".csv,.xlsx"
                  onChange={handleFileUpload}
                  className={fileInputClass}
                />
                <label className="label">
                  <span className="label-text-alt">
                    For Source Optimization: CSV should have 'Load', 'Price', and optional 'Solar/PV' columns
                    <br />
                    For Demand Optimization: CSV should have Load1, Load2, Load3, Load4, Load5, Price columns
                  </span>
                </label>
              </div>
            </div>
          </Card>

          {/* Next Steps */}
          <Card>
            <div className="p-6">
              <h3 className="text-lg font-semibold mb-4">Choose Optimization Type</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Select the type of optimization you want to run with these common parameters.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button
                  onClick={() => handleNext('demand')}
                  disabled={isLoading}
                  className="p-6 rounded-xl border-2 border-blue-600 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-all disabled:opacity-50"
                >
                  <Users className="w-8 h-8 text-blue-600 dark:text-blue-400 mb-3" />
                  <h4 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                    Demand Optimization
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Optimize energy dispatch with multi-load prioritization (5 load profiles with curtailment penalties)
                  </p>
                </button>

                <button
                  onClick={() => handleNext('source')}
                  disabled={isLoading}
                  className="p-6 rounded-xl border-2 border-green-600 bg-green-50 dark:bg-green-900/20 hover:bg-green-100 dark:hover:bg-green-900/30 transition-all disabled:opacity-50"
                >
                  <Zap className="w-8 h-8 text-green-600 dark:text-green-400 mb-3" />
                  <h4 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                    Source Optimization
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Optimize energy sources (Grid, Solar, Battery, Diesel, Hydrogen) for cost or CO2 minimization
                  </p>
                </button>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default OptimizationSetupPage;

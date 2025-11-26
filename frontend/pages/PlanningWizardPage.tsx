import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Check, Zap, Battery, Fuel, Grid, Lightbulb, Fan, Monitor, Thermometer, Sparkles, UtensilsCrossed, Save } from 'lucide-react';
import { Appliance, PrimaryGoal, LoadProfile, PlanningRecommendation } from '../types';
import { savePlanningStep1, savePlanningStep2, savePlanningStep3, getLoadProfiles } from '../services/api';

const PlanningWizardPage: React.FC = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');

  // Step 1 State
  const [preferredSources, setPreferredSources] = useState<string[]>([]);
  const [primaryGoal, setPrimaryGoal] = useState<PrimaryGoal | null>(null);
  const [allowDiesel, setAllowDiesel] = useState(false);

  // Step 2 State
  const [appliances, setAppliances] = useState<Appliance[]>([]);
  const [loadProfileName, setLoadProfileName] = useState('My Load Profile');
  const [loadProfileId, setLoadProfileId] = useState<string | null>(null);

  // Step 3 State
  const [recommendation, setRecommendation] = useState<PlanningRecommendation | null>(null);

  const sourceOptions = [
    { id: 'solar', label: 'Solar PV', icon: <Zap className="w-6 h-6" /> },
    { id: 'battery', label: 'Battery', icon: <Battery className="w-6 h-6" /> },
    { id: 'grid', label: 'Grid Supply', icon: <Grid className="w-6 h-6" /> },
    { id: 'diesel', label: 'Diesel Generator', icon: <Fuel className="w-6 h-6" /> },
  ];

  const goalOptions: { value: PrimaryGoal; label: string; description: string }[] = [
    { value: 'savings', label: 'Cost Savings', description: 'Minimize energy costs' },
    { value: 'self_sustainability', label: 'Self-Sustainability', description: 'Maximize renewable energy usage' },
    { value: 'reliability', label: 'Reliability', description: 'Ensure continuous power supply' },
    { value: 'carbon_reduction', label: 'Carbon Reduction', description: 'Minimize environmental impact' },
  ];

  const categoryOptions = [
    { value: 'lighting', label: 'Lighting', icon: <Lightbulb className="w-5 h-5" /> },
    { value: 'fans', label: 'Fans', icon: <Fan className="w-5 h-5" /> },
    { value: 'it', label: 'IT Equipment', icon: <Monitor className="w-5 h-5" /> },
    { value: 'cooling_heating', label: 'Cooling/Heating', icon: <Thermometer className="w-5 h-5" /> },
    { value: 'cleaning', label: 'Cleaning', icon: <Sparkles className="w-5 h-5" /> },
    { value: 'kitchen_misc', label: 'Kitchen & Misc', icon: <UtensilsCrossed className="w-5 h-5" /> },
  ];

  const handleSourceToggle = (sourceId: string) => {
    if (sourceId === 'diesel' && !allowDiesel) {
      setAllowDiesel(true);
    }
    setPreferredSources(prev =>
      prev.includes(sourceId)
        ? prev.filter(s => s !== sourceId)
        : [...prev, sourceId]
    );
  };

  const handleStep1Next = async () => {
    if (preferredSources.length === 0) {
      setError('Please select at least one energy source');
      return;
    }
    if (!primaryGoal) {
      setError('Please select a primary goal');
      return;
    }

    setError('');
    setIsLoading(true);

    try {
      await savePlanningStep1({
        preferred_sources: preferredSources,
        primary_goal: primaryGoal,
        allow_diesel: allowDiesel
      });
      setStep(2);
    } catch (err: any) {
      setError(err.message || 'Failed to save step 1');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddAppliance = () => {
    setAppliances([...appliances, {
      id: `appliance-${Date.now()}`,
      category: 'kitchen_misc',
      name: '',
      power_rating: 0,
      quantity: 1,
      avg_hours: 0
    }]);
  };

  const handleApplianceChange = (index: number, field: keyof Appliance, value: any) => {
    const updated = [...appliances];
    updated[index] = { ...updated[index], [field]: value };
    setAppliances(updated);
  };

  const handleRemoveAppliance = (index: number) => {
    setAppliances(appliances.filter((_, i) => i !== index));
  };

  const handleStep2Next = async () => {
    if (appliances.length === 0) {
      setError('Please add at least one appliance');
      return;
    }

    const hasInvalid = appliances.some(a => !a.name || a.power_rating <= 0 || a.avg_hours <= 0);
    if (hasInvalid) {
      setError('Please fill all fields for all appliances');
      return;
    }

    setError('');
    setIsLoading(true);

    try {
      const result = await savePlanningStep2({
        name: loadProfileName,
        appliances: appliances.map(({ id, ...rest }) => rest)
      });
      setLoadProfileId(result.load_profile.id);
      setStep(3);
    } catch (err: any) {
      setError(err.message || 'Failed to save load profile');
    } finally {
      setIsLoading(false);
    }
  };

  const handleStep3Complete = async (action: 'save' | 'proceed_to_optimization') => {
    if (!loadProfileId) {
      setError('Load profile ID is missing');
      return;
    }

    setError('');
    setIsLoading(true);

    try {
      const result = await savePlanningStep3({
        load_profile_id: loadProfileId,
        preferred_sources: preferredSources,
        primary_goal: primaryGoal!,
        allow_diesel: allowDiesel,
        action
      });
      setRecommendation(result.recommendation);

      if (action === 'proceed_to_optimization') {
        // Navigate to optimization setup with planning data
        navigate('/optimization-setup', { state: { planningRecommendation: result.recommendation } });
      } else {
        // Navigate back to main options page
        navigate('/main-options');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to generate recommendation');
    } finally {
      setIsLoading(false);
    }
  };

  const calculateTotalEnergy = () => {
    return appliances.reduce((total, app) => {
      return total + (app.power_rating * app.quantity * app.avg_hours);
    }, 0);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Progress Indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-center space-x-4">
            {[1, 2, 3].map((s) => (
              <React.Fragment key={s}>
                <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold ${
                  step >= s ? 'bg-blue-600 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-500'
                }`}>
                  {step > s ? <Check className="w-6 h-6" /> : s}
                </div>
                {s < 3 && (
                  <div className={`w-24 h-1 ${step > s ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-700'}`} />
                )}
              </React.Fragment>
            ))}
          </div>
          <div className="flex justify-between mt-2 text-sm text-gray-600 dark:text-gray-400">
            <span>Energy Sources</span>
            <span>Load Profile</span>
            <span>Recommendation</span>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-800 dark:text-red-300">
            {error}
          </div>
        )}

        {/* Step 1: Energy Sources & Preferences */}
        {step === 1 && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Energy Sources & Preferences
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-8">
              Select your preferred energy sources and primary goal
            </p>

            <div className="space-y-6">
              {/* Preferred Sources */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">
                  Preferred Energy Sources
                </label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {sourceOptions.map((source) => (
                    <button
                      key={source.id}
                      onClick={() => handleSourceToggle(source.id)}
                      disabled={source.id === 'diesel' && !allowDiesel}
                      className={`p-4 rounded-xl border-2 transition-all ${
                        preferredSources.includes(source.id)
                          ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20'
                          : 'border-gray-200 dark:border-gray-700 hover:border-blue-300'
                      } ${source.id === 'diesel' && !allowDiesel ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      <div className="flex flex-col items-center space-y-2">
                        <div className={`p-2 rounded-lg ${
                          preferredSources.includes(source.id)
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
                        }`}>
                          {source.icon}
                        </div>
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                          {source.label}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Primary Goal */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">
                  Primary Goal
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {goalOptions.map((goal) => (
                    <button
                      key={goal.value}
                      onClick={() => setPrimaryGoal(goal.value)}
                      className={`p-4 rounded-xl border-2 transition-all text-left ${
                        primaryGoal === goal.value
                          ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20'
                          : 'border-gray-200 dark:border-gray-700 hover:border-blue-300'
                      }`}
                    >
                      <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                        {goal.label}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {goal.description}
                      </p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Allow Diesel Checkbox */}
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="allowDiesel"
                  checked={allowDiesel}
                  onChange={(e) => setAllowDiesel(e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded"
                />
                <label htmlFor="allowDiesel" className="text-sm text-gray-700 dark:text-gray-300">
                  Allow diesel generator as backup
                </label>
              </div>

              {/* Next Button */}
              <div className="flex justify-end">
                <button
                  onClick={handleStep1Next}
                  disabled={isLoading}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 flex items-center space-x-2"
                >
                  <span>Next</span>
                  <ArrowRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Appliances & Load Profile */}
        {step === 2 && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8">
            <button
              onClick={() => setStep(1)}
              className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-6 flex items-center"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              Back
            </button>

            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Appliances & Load Profile
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-8">
              Add your appliances to calculate daily energy consumption
            </p>

            <div className="space-y-6">
              {/* Load Profile Name */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Load Profile Name
                </label>
                <input
                  type="text"
                  value={loadProfileName}
                  onChange={(e) => setLoadProfileName(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="My Load Profile"
                />
              </div>

              {/* Appliances List */}
              <div>
                <div className="flex justify-between items-center mb-4">
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                    Appliances
                  </label>
                  <button
                    onClick={handleAddAppliance}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700"
                  >
                    + Add Appliance
                  </button>
                </div>

                <div className="space-y-4">
                  {appliances.map((appliance, index) => (
                    <div key={appliance.id || index} className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                        <div>
                          <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Category</label>
                          <select
                            value={appliance.category}
                            onChange={(e) => handleApplianceChange(index, 'category', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                          >
                            {categoryOptions.map(cat => (
                              <option key={cat.value} value={cat.value}>{cat.label}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Name</label>
                          <input
                            type="text"
                            value={appliance.name}
                            onChange={(e) => handleApplianceChange(index, 'name', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                            placeholder="Appliance name"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Power (kW)</label>
                          <input
                            type="number"
                            step="0.1"
                            value={appliance.power_rating}
                            onChange={(e) => handleApplianceChange(index, 'power_rating', parseFloat(e.target.value) || 0)}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                            placeholder="0.0"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Quantity</label>
                          <input
                            type="number"
                            value={appliance.quantity}
                            onChange={(e) => handleApplianceChange(index, 'quantity', parseInt(e.target.value) || 1)}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                            placeholder="1"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Hours/Day</label>
                          <div className="flex space-x-2">
                            <input
                              type="number"
                              step="0.5"
                              value={appliance.avg_hours}
                              onChange={(e) => handleApplianceChange(index, 'avg_hours', parseFloat(e.target.value) || 0)}
                              className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                              placeholder="0.0"
                            />
                            <button
                              onClick={() => handleRemoveAppliance(index)}
                              className="px-3 py-2 bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-200 dark:hover:bg-red-900/30"
                            >
                              ×
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Total Energy Display */}
              {appliances.length > 0 && (
                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                      Total Daily Energy Consumption:
                    </span>
                    <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                      {calculateTotalEnergy().toFixed(2)} kWh
                    </span>
                  </div>
                </div>
              )}

              {/* Next Button */}
              <div className="flex justify-end">
                <button
                  onClick={handleStep2Next}
                  disabled={isLoading || appliances.length === 0}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 flex items-center space-x-2"
                >
                  <span>Next</span>
                  <ArrowRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Planning Summary & Recommendation */}
        {step === 3 && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8">
            <button
              onClick={() => setStep(2)}
              className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-6 flex items-center"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              Back
            </button>

            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Planning Summary & Recommendation
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-8">
              Review your planning recommendation and choose next steps
            </p>

            {isLoading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-4 text-gray-600 dark:text-gray-400">Generating recommendation...</p>
              </div>
            ) : recommendation ? (
              <div className="space-y-6">
                {/* Technical Sizing */}
                <div className="p-6 bg-gray-50 dark:bg-gray-700 rounded-xl">
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Technical Sizing</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Solar Capacity</p>
                      <p className="text-lg font-semibold text-gray-900 dark:text-white">
                        {recommendation.technical_sizing.solar_capacity_kw.toFixed(2)} kW
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Battery Capacity</p>
                      <p className="text-lg font-semibold text-gray-900 dark:text-white">
                        {recommendation.technical_sizing.battery_capacity_kwh.toFixed(2)} kWh
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Inverter Capacity</p>
                      <p className="text-lg font-semibold text-gray-900 dark:text-white">
                        {recommendation.technical_sizing.inverter_capacity_kw.toFixed(2)} kW
                      </p>
                    </div>
                  </div>
                  <ul className="mt-4 space-y-2">
                    {recommendation.technical_sizing.recommendations.map((rec, i) => (
                      <li key={i} className="text-sm text-gray-700 dark:text-gray-300 flex items-start">
                        <Check className="w-4 h-4 mr-2 mt-0.5 text-green-600" />
                        {rec}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Economic Analysis */}
                <div className="p-6 bg-green-50 dark:bg-green-900/20 rounded-xl">
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Economic Analysis</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Total CAPEX</p>
                      <p className="text-lg font-semibold text-gray-900 dark:text-white">
                        ₹{recommendation.economic_analysis.total_capex.toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Payback Period</p>
                      <p className="text-lg font-semibold text-gray-900 dark:text-white">
                        {recommendation.economic_analysis.payback_period_years.toFixed(2)} years
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Monthly Savings</p>
                      <p className="text-lg font-semibold text-green-600 dark:text-green-400">
                        ₹{recommendation.economic_analysis.monthly_savings.toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Emissions Analysis */}
                <div className="p-6 bg-teal-50 dark:bg-teal-900/20 rounded-xl">
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Emissions Analysis</h3>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Annual CO₂ Reduction</p>
                      <p className="text-lg font-semibold text-gray-900 dark:text-white">
                        {recommendation.emissions_analysis.annual_co2_reduction_kg.toFixed(2)} kg
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Carbon Offset</p>
                      <p className="text-lg font-semibold text-teal-600 dark:text-teal-400">
                        {recommendation.emissions_analysis.carbon_offset_percentage.toFixed(2)}%
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Lifetime Reduction</p>
                      <p className="text-lg font-semibold text-gray-900 dark:text-white">
                        {recommendation.emissions_analysis.lifetime_co2_reduction_tonnes.toFixed(2)} tonnes
                      </p>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex justify-end space-x-4">
                  <button
                    onClick={() => navigate('/main-options')}
                    className="px-6 py-3 bg-gray-500 text-white rounded-lg font-semibold hover:bg-gray-600"
                  >
                    Back to Options
                  </button>
                  <button
                    onClick={() => handleStep3Complete('save')}
                    disabled={isLoading}
                    className="px-6 py-3 bg-gray-600 text-white rounded-lg font-semibold hover:bg-gray-700 disabled:opacity-50 flex items-center space-x-2"
                  >
                    <Save className="w-5 h-5" />
                    <span>Save Plan</span>
                  </button>
                  <button
                    onClick={() => handleStep3Complete('proceed_to_optimization')}
                    disabled={isLoading}
                    className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 flex items-center space-x-2"
                  >
                    <span>Proceed to Optimization</span>
                    <ArrowRight className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-gray-600 dark:text-gray-400 mb-4">Ready to generate recommendation</p>
                <button
                  onClick={() => handleStep3Complete('save')}
                  disabled={isLoading}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50"
                >
                  Generate Recommendation
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default PlanningWizardPage;


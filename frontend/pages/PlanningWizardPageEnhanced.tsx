import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Check, Zap, Battery, Fuel, Grid, Save, Home, School, Factory, Building2, Power, FileText, History, Plus, TrendingUp, DollarSign, Leaf, Trash2 } from 'lucide-react';
import { PrimaryGoal, SiteType } from '../types';
import { saveSiteTypeAndWorkflow } from '../services/api';
import Card from '../components/ui/Card';
import ApplianceSelector from '../components/shared/ApplianceSelector';
import { LoadProfileProvider, LoadProfileContext } from '../contexts/LoadProfileContext';
import { getUseCaseTemplate, UseCaseTemplate } from '../utils/useCaseTemplates';

const PlanningWizardContent: React.FC = () => {
  const navigate = useNavigate();
  const loadProfileContext = useContext(LoadProfileContext);
  if (!loadProfileContext) throw new Error('LoadProfileContext required');
  
  const { appliances, totalDailyConsumptionKWh, peakLoad, useCase, setUseCase } = loadProfileContext;
  
  const [step, setStep] = useState<0 | 1 | 2 | 3>(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [showPreviousPlans, setShowPreviousPlans] = useState(false);
  const [savedPlans, setSavedPlans] = useState<any[]>([]);

  // Step 0 State (Use Case Selection)
  const [selectedUseCase, setSelectedUseCase] = useState<'residential' | 'commercial' | 'industrial'>('residential');
  const [planName, setPlanName] = useState<string>('');

  // Step 1 State
  const [preferredSources, setPreferredSources] = useState<string[]>(['solar', 'battery', 'grid']);
  const [primaryGoal, setPrimaryGoal] = useState<PrimaryGoal | null>(null);
  const [allowDiesel, setAllowDiesel] = useState(false);
  const [includeHydrogen, setIncludeHydrogen] = useState(false);

  // Step 3 State (Technical Sizing & Economic Analysis)
  const [technicalSizing, setTechnicalSizing] = useState<any>(null);
  const [economicAnalysis, setEconomicAnalysis] = useState<any>(null);
  const [emissionsAnalysis, setEmissionsAnalysis] = useState<any>(null);

  const useCaseOptions = [
    { 
      value: 'residential' as const, 
      label: 'Residential', 
      icon: <Home className="w-8 h-8" />, 
      description: 'Home energy system',
      powerLevel: '2 kW',
      color: 'from-blue-500 to-cyan-500'
    },
    { 
      value: 'commercial' as const, 
      label: 'Commercial', 
      icon: <Building2 className="w-8 h-8" />, 
      description: 'Office/Retail building',
      powerLevel: '20 kW',
      color: 'from-purple-500 to-pink-500'
    },
    { 
      value: 'industrial' as const, 
      label: 'Industrial', 
      icon: <Factory className="w-8 h-8" />, 
      description: 'Manufacturing facility',
      powerLevel: '200 kW',
      color: 'from-orange-500 to-red-500'
    },
  ];

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

  const handleStep0Next = async () => {
    if (!planName.trim()) {
      setError('Please enter a plan name');
      return;
    }

    setError('');
    setUseCase(selectedUseCase);
    setStep(1);
  };

  const handleSourceToggle = (sourceId: string) => {
    setPreferredSources(prev =>
      prev.includes(sourceId)
        ? prev.filter(s => s !== sourceId)
        : [...prev, sourceId]
    );
  };

  const handleStep1Next = () => {
    if (preferredSources.length === 0) {
      setError('Please select at least one energy source');
      return;
    }
    if (!primaryGoal) {
      setError('Please select a primary goal');
      return;
    }

    setError('');
    setStep(2);
  };

  const handleStep2Next = () => {
    if (appliances.length === 0) {
      setError('Please add at least one appliance');
      return;
    }

    if (totalDailyConsumptionKWh < 0.1) {
      setError('Total consumption is too low. Please add more appliances or increase usage hours.');
      return;
    }

    setError('');
    setStep(3);
  };

  const handleGenerateRecommendation = async () => {
    setIsLoading(true);
    setError('');

    try {
      // Call backend technical sizing API
      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001/api/v1';
      const token = localStorage.getItem('jwt');

      const response = await fetch(`${API_BASE_URL}/planning/technical-sizing`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          total_energy_consumption_kwh: totalDailyConsumptionKWh,
          use_case: useCase,
          include_hydrogen: includeHydrogen,
        })
      });

      if (!response.ok) {
        throw new Error('Failed to calculate technical sizing');
      }

      const result = await response.json();
      
      if (result.success) {
        setTechnicalSizing(result.data.technical_analysis);
        setEconomicAnalysis(result.data.economic_analysis);
        setEmissionsAnalysis(result.data.emissions_analysis);
      } else {
        throw new Error(result.error || 'Calculation failed');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to generate recommendation');
    } finally {
      setIsLoading(false);
    }
  };

  const loadSavedPlans = () => {
    const plans: any[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith('plan_')) {
        try {
          const planData = JSON.parse(localStorage.getItem(key) || '{}');
          plans.push({ id: key, ...planData });
        } catch (e) {
          console.error('Failed to parse plan:', key);
        }
      }
    }
    // Sort by creation date (newest first)
    plans.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    setSavedPlans(plans);
  };

  const handleSavePlan = () => {
    // Save to localStorage
    const planData = {
      planName,
      useCase,
      powerLevel: useCaseOptions.find(u => u.value === useCase)?.powerLevel,
      appliances,
      totalDailyConsumptionKWh,
      peakLoad,
      preferredSources,
      primaryGoal,
      technicalSizing,
      economicAnalysis,
      emissionsAnalysis,
      createdAt: new Date().toISOString(),
    };

    localStorage.setItem(`plan_${Date.now()}`, JSON.stringify(planData));
    
    // Show success message and navigate
    alert('Plan saved successfully!');
    navigate('/main-options');
  };

  const handleDeletePlan = (planId: string) => {
    if (confirm('Are you sure you want to delete this plan?')) {
      localStorage.removeItem(planId);
      loadSavedPlans();
    }
  };

  const handleLoadPlan = (plan: any) => {
    // Load plan data into wizard
    setPlanName(plan.planName);
    setSelectedUseCase(plan.useCase);
    setUseCase(plan.useCase);
    setPreferredSources(plan.preferredSources || []);
    setPrimaryGoal(plan.primaryGoal);
    
    // Load appliances into context
    plan.appliances?.forEach((app: any) => {
      loadProfileContext.addAppliance(app);
    });
    
    setTechnicalSizing(plan.technicalSizing);
    setEconomicAnalysis(plan.economicAnalysis);
    setEmissionsAnalysis(plan.emissionsAnalysis);
    
    // Go to results step if recommendation exists
    if (plan.technicalSizing) {
      setStep(3);
    } else {
      setStep(2);
    }
    
    setShowPreviousPlans(false);
  };

  const handleProceedToOptimization = () => {
    // Navigate with planning data
    navigate('/optimization-setup', {
      state: {
        planningData: {
          useCase,
          totalDailyConsumptionKWh,
          peakLoad,
          technicalSizing,
          economicAnalysis,
        }
      }
    });
  };

  // Show saved plans view
  if (showPreviousPlans) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-4">
        <div className="max-w-6xl mx-auto">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">My Saved Plans</h1>
              <p className="text-gray-600 dark:text-gray-400">View and manage your energy planning plans</p>
            </div>
            <button
              onClick={() => {
                setShowPreviousPlans(false);
                setStep(0);
                loadProfileContext.clearAppliances();
                setPlanName('');
                setTechnicalSizing(null);
                setEconomicAnalysis(null);
                setEmissionsAnalysis(null);
              }}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 flex items-center space-x-2"
            >
              <Plus className="w-5 h-5" />
              <span>Create New Plan</span>
            </button>
          </div>

          {savedPlans.length === 0 ? (
            <Card>
              <div className="p-12 text-center">
                <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">No Plans Yet</h2>
                <p className="text-gray-600 dark:text-gray-400 mb-6">Create your first energy planning plan to get started</p>
                <button
                  onClick={() => setShowPreviousPlans(false)}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700"
                >
                  Create Your First Plan
                </button>
              </div>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {savedPlans.map((plan) => (
                <Card key={plan.id}>
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                          {plan.planName}
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                          {new Date(plan.createdAt).toLocaleDateString()} at {new Date(plan.createdAt).toLocaleTimeString()}
                        </p>
                        <span className="inline-block px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 rounded-full text-xs font-semibold">
                          {plan.useCase?.charAt(0).toUpperCase() + plan.useCase?.slice(1)} • {plan.powerLevel}
                        </span>
                      </div>
                    </div>
                    
                    {plan.economicAnalysis && (
                      <div className="space-y-3 mb-4">
                        <div>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Daily Consumption</p>
                          <p className="text-lg font-semibold text-gray-900 dark:text-white">
                            {plan.totalDailyConsumptionKWh?.toFixed(2)} kWh
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Total CAPEX</p>
                          <p className="text-lg font-semibold text-gray-900 dark:text-white">
                            ₹{(plan.economicAnalysis.total_capex / 100000).toFixed(2)} L
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Payback Period</p>
                          <p className="text-lg font-semibold text-green-600 dark:text-green-400">
                            {plan.economicAnalysis.payback_period_years?.toFixed(1)} years
                          </p>
                        </div>
                      </div>
                    )}

                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleLoadPlan(plan)}
                        className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 text-sm"
                      >
                        View Details
                      </button>
                      <button
                        onClick={() => handleDeletePlan(plan.id)}
                        className="px-4 py-2 bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-200 dark:hover:bg-red-900/30 text-sm font-semibold"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Planning Wizard</h1>
            <p className="text-gray-600 dark:text-gray-400">Design your optimal energy management system</p>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={() => {
                loadSavedPlans();
                setShowPreviousPlans(true);
              }}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg font-semibold hover:bg-gray-700 flex items-center space-x-2"
            >
              <History className="w-5 h-5" />
              <span>View Saved Plans</span>
            </button>
            <button
              onClick={() => navigate('/main-options')}
              className="px-4 py-2 bg-gray-500 text-white rounded-lg font-semibold hover:bg-gray-600"
            >
              Back to Main Options
            </button>
          </div>
        </div>

        {/* Progress Indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-center space-x-4">
            {[0, 1, 2, 3].map((s) => (
              <React.Fragment key={s}>
                <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold ${
                  step >= s ? 'bg-blue-600 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-500'
                }`}>
                  {step > s ? <Check className="w-6 h-6" /> : s + 1}
                </div>
                {s < 3 && (
                  <div className={`w-24 h-1 ${step > s ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-700'}`} />
                )}
              </React.Fragment>
            ))}
          </div>
          <div className="flex justify-between mt-2 text-sm text-gray-600 dark:text-gray-400 px-4">
            <span>Use Case</span>
            <span>Preferences</span>
            <span>Load Profile</span>
            <span>Results</span>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-800 dark:text-red-300">
            {error}
          </div>
        )}

        {/* Step 0: Use Case Selection */}
        {step === 0 && (
          <Card>
            <div className="p-8">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                    Select Use Case & Power Level
                  </h2>
                  <p className="text-gray-600 dark:text-gray-400">
                    Choose the type of energy system you want to design
                  </p>
                </div>
                <button
                  onClick={() => {
                    loadSavedPlans();
                    setShowPreviousPlans(true);
                  }}
                  className="px-4 py-2 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 rounded-lg font-semibold hover:bg-indigo-200 dark:hover:bg-indigo-900/40 flex items-center space-x-2"
                >
                  <History className="w-5 h-5" />
                  <span>Saved Plans ({(() => {
                    let count = 0;
                    for (let i = 0; i < localStorage.length; i++) {
                      const key = localStorage.key(i);
                      if (key?.startsWith('plan_')) count++;
                    }
                    return count;
                  })()})</span>
                </button>
              </div>

              <div className="space-y-6">
                {/* Plan Name */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Plan Name
                  </label>
                  <input
                    type="text"
                    value={planName}
                    onChange={(e) => setPlanName(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="My Energy Plan"
                  />
                </div>

                {/* Use Case Options */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">
                    Use Case & Power Level
                  </label>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {useCaseOptions.map((option) => (
                      <button
                        key={option.value}
                        onClick={() => setSelectedUseCase(option.value)}
                        className={`p-6 rounded-xl border-2 transition-all ${
                          selectedUseCase === option.value
                            ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20 shadow-lg scale-105'
                            : 'border-gray-200 dark:border-gray-700 hover:border-blue-300 hover:scale-102'
                        }`}
                      >
                        <div className="flex flex-col items-center space-y-3">
                          <div className={`p-4 rounded-xl bg-gradient-to-br ${option.color} text-white`}>
                            {option.icon}
                          </div>
                          <div className="text-center">
                            <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-1">
                              {option.label}
                            </h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                              {option.description}
                            </p>
                            <span className="inline-block px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 rounded-full text-xs font-semibold">
                              {option.powerLevel} System
                            </span>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Use Case Description */}
                {selectedUseCase && (
                  <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
                      {useCaseOptions.find(u => u.value === selectedUseCase)?.label} System Details
                    </h4>
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                      {(() => {
                        const template = getUseCaseTemplate(selectedUseCase);
                        return template ? template.typical_load : '';
                      })()}
                    </p>
                  </div>
                )}

                {/* Next Button */}
                <div className="flex justify-end">
                  <button
                    onClick={handleStep0Next}
                    disabled={!planName.trim()}
                    className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 flex items-center space-x-2"
                  >
                    <span>Next: Energy Sources</span>
                    <ArrowRight className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* Step 1: Energy Sources & Preferences */}
        {step === 1 && (
          <Card>
            <div className="p-8">
              <button
                onClick={() => setStep(0)}
                className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-6 flex items-center"
              >
                <ArrowLeft className="w-5 h-5 mr-2" />
                Back
              </button>

              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
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
                        className={`p-4 rounded-xl border-2 transition-all ${
                          preferredSources.includes(source.id)
                            ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20'
                            : 'border-gray-200 dark:border-gray-700 hover:border-blue-300'
                        }`}
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

                {/* Advanced Options */}
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="allowDiesel"
                      checked={allowDiesel}
                      onChange={(e) => setAllowDiesel(e.target.checked)}
                      className="w-4 h-4 text-blue-600 rounded"
                    />
                    <label htmlFor="allowDiesel" className="text-sm text-gray-700 dark:text-gray-300">
                      Include diesel generator as backup
                    </label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="includeHydrogen"
                      checked={includeHydrogen}
                      onChange={(e) => setIncludeHydrogen(e.target.checked)}
                      className="w-4 h-4 text-blue-600 rounded"
                    />
                    <label htmlFor="includeHydrogen" className="text-sm text-gray-700 dark:text-gray-300">
                      Include hydrogen fuel cell system (long-duration storage)
                    </label>
                  </div>
                </div>

                {/* Next Button */}
                <div className="flex justify-end">
                  <button
                    onClick={handleStep1Next}
                    disabled={preferredSources.length === 0 || !primaryGoal}
                    className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 flex items-center space-x-2"
                  >
                    <span>Next: Add Appliances</span>
                    <ArrowRight className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* Step 2: Appliances & Load Profile */}
        {step === 2 && (
          <div className="space-y-6">
            <Card>
              <div className="p-6">
                <button
                  onClick={() => setStep(1)}
                  className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-4 flex items-center"
                >
                  <ArrowLeft className="w-5 h-5 mr-2" />
                  Back
                </button>

                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                      Build Your Load Profile
                    </h2>
                    <p className="text-gray-600 dark:text-gray-400">
                      Add appliances to calculate your energy consumption
                    </p>
                  </div>
                  <span className="px-4 py-2 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 rounded-full text-sm font-semibold">
                    {useCase.charAt(0).toUpperCase() + useCase.slice(1)} • {useCaseOptions.find(u => u.value === useCase)?.powerLevel}
                  </span>
                </div>
              </div>
            </Card>

            {/* Appliance Selector Component */}
            <ApplianceSelector />

            {/* Next Button */}
            <div className="flex justify-end">
              <button
                onClick={handleStep2Next}
                disabled={appliances.length === 0}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 flex items-center space-x-2"
              >
                <span>Generate Recommendation</span>
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Technical Sizing & Economic Analysis */}
        {step === 3 && (
          <div className="space-y-6">
            <Card>
              <div className="p-6">
                <button
                  onClick={() => setStep(2)}
                  className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-4 flex items-center"
                >
                  <ArrowLeft className="w-5 h-5 mr-2" />
                  Back to Load Profile
                </button>

                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                  System Recommendation
                </h2>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  Based on your {totalDailyConsumptionKWh.toFixed(2)} kWh/day consumption
                </p>

                {!technicalSizing && (
                  <div className="text-center py-12">
                    <button
                      onClick={handleGenerateRecommendation}
                      disabled={isLoading}
                      className="px-8 py-4 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 flex items-center space-x-2 mx-auto"
                    >
                      {isLoading ? (
                        <>
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                          <span>Calculating...</span>
                        </>
                      ) : (
                        <>
                          <TrendingUp className="w-5 h-5" />
                          <span>Generate Recommendation</span>
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>
            </Card>

            {/* Technical Sizing Results */}
            {technicalSizing && (
              <>
                <Card title="Recommended Tech Rating">
                  <div className="p-6">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                      <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Solar Capacity</p>
                        <p className="text-2xl font-bold text-gray-900 dark:text-white">
                          {technicalSizing.solar_capacity_kw.toFixed(2)} kW
                        </p>
                      </div>
                      <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Battery Capacity</p>
                        <p className="text-2xl font-bold text-gray-900 dark:text-white">
                          {technicalSizing.battery_capacity_kwh.toFixed(2)} kWh
                        </p>
                      </div>
                      <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Inverter Capacity</p>
                        <p className="text-2xl font-bold text-gray-900 dark:text-white">
                          {technicalSizing.inverter_capacity_kw.toFixed(2)} kW
                        </p>
                      </div>
                      <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Peak Load</p>
                        <p className="text-2xl font-bold text-gray-900 dark:text-white">
                          {technicalSizing.peak_power_kw.toFixed(2)} kW
                        </p>
                      </div>
                    </div>
                    <div className="space-y-2">
                      {technicalSizing.recommendations.map((rec: string, i: number) => (
                        <div key={i} className="flex items-start space-x-2 text-sm text-gray-700 dark:text-gray-300">
                          <Check className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                          <span>{rec}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </Card>

                {/* Economic Analysis */}
                <Card title="Economic Analysis">
                  <div className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                      <div className="p-6 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl border border-green-200 dark:border-green-800">
                        <div className="flex items-center space-x-3 mb-3">
                          <DollarSign className="w-8 h-8 text-green-600" />
                          <div>
                            <p className="text-sm text-gray-600 dark:text-gray-400">Total CAPEX</p>
                            <p className="text-2xl font-bold text-gray-900 dark:text-white">
                              ₹{(economicAnalysis.total_capex / 100000).toFixed(2)} L
                            </p>
                          </div>
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Initial investment</p>
                      </div>

                      <div className="p-6 bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
                        <div className="flex items-center space-x-3 mb-3">
                          <TrendingUp className="w-8 h-8 text-blue-600" />
                          <div>
                            <p className="text-sm text-gray-600 dark:text-gray-400">Payback Period</p>
                            <p className="text-2xl font-bold text-gray-900 dark:text-white">
                              {economicAnalysis.payback_period_years.toFixed(1)} yrs
                            </p>
                          </div>
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Return on investment</p>
                      </div>

                      <div className="p-6 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-xl border border-purple-200 dark:border-purple-800">
                        <div className="flex items-center space-x-3 mb-3">
                          <DollarSign className="w-8 h-8 text-purple-600" />
                          <div>
                            <p className="text-sm text-gray-600 dark:text-gray-400">Monthly Savings</p>
                            <p className="text-2xl font-bold text-gray-900 dark:text-white">
                              ₹{economicAnalysis.monthly_savings.toLocaleString()}
                            </p>
                          </div>
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">vs grid-only system</p>
                      </div>
                    </div>

                    {/* Cost Breakdown Table */}
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-gray-100 dark:bg-gray-800">
                          <tr>
                            <th className="p-3 text-left">Component</th>
                            <th className="p-3 text-right">Cost (₹)</th>
                          </tr>
                        </thead>
                        <tbody>
                          {Object.entries(economicAnalysis.cost_breakdown).map(([key, value]: [string, any]) => (
                            <tr key={key} className="border-b border-gray-200 dark:border-gray-700">
                              <td className="p-3 text-gray-700 dark:text-gray-300">{key}</td>
                              <td className="p-3 text-right font-semibold text-gray-900 dark:text-white">
                                {Number(value).toLocaleString()}
                              </td>
                            </tr>
                          ))}
                          <tr className="bg-gray-100 dark:bg-gray-800 font-bold">
                            <td className="p-3">TOTAL CAPEX</td>
                            <td className="p-3 text-right text-lg text-blue-600 dark:text-blue-400">
                              ₹{economicAnalysis.total_capex.toLocaleString()}
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>

                    <div className="mt-6 grid grid-cols-2 gap-4">
                      <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Annual O&M Cost</p>
                        <p className="text-lg font-semibold text-gray-900 dark:text-white">
                          ₹{economicAnalysis.annual_om_cost_rs.toLocaleString()}
                        </p>
                      </div>
                      <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Annual Savings</p>
                        <p className="text-lg font-semibold text-green-600 dark:text-green-400">
                          ₹{economicAnalysis.annual_savings.toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>
                </Card>

                {/* Emissions Analysis */}
                <Card title="Environmental Impact">
                  <div className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="p-6 bg-gradient-to-br from-teal-50 to-green-50 dark:from-teal-900/20 dark:to-green-900/20 rounded-xl border border-teal-200 dark:border-teal-800">
                        <div className="flex items-center space-x-3 mb-3">
                          <Leaf className="w-8 h-8 text-teal-600" />
                          <div>
                            <p className="text-sm text-gray-600 dark:text-gray-400">Annual CO₂ Reduction</p>
                            <p className="text-2xl font-bold text-gray-900 dark:text-white">
                              {(emissionsAnalysis.annual_co2_reduction_kg / 1000).toFixed(2)} t
                            </p>
                          </div>
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">tonnes per year</p>
                      </div>

                      <div className="p-6 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl border border-green-200 dark:border-green-800">
                        <div className="flex items-center space-x-3 mb-3">
                          <TrendingUp className="w-8 h-8 text-green-600" />
                          <div>
                            <p className="text-sm text-gray-600 dark:text-gray-400">Carbon Offset</p>
                            <p className="text-2xl font-bold text-gray-900 dark:text-white">
                              {emissionsAnalysis.carbon_offset_percentage.toFixed(1)}%
                            </p>
                          </div>
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">vs grid-only</p>
                      </div>

                      <div className="p-6 bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 rounded-xl border border-emerald-200 dark:border-emerald-800">
                        <div className="flex items-center space-x-3 mb-3">
                          <Leaf className="w-8 h-8 text-emerald-600" />
                          <div>
                            <p className="text-sm text-gray-600 dark:text-gray-400">25-Year Reduction</p>
                            <p className="text-2xl font-bold text-gray-900 dark:text-white">
                              {emissionsAnalysis.lifetime_co2_reduction_tonnes.toFixed(1)} t
                            </p>
                          </div>
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">lifetime impact</p>
                      </div>
                    </div>
                  </div>
                </Card>

                {/* Action Buttons */}
                <div className="flex justify-end space-x-4">
                  <button
                    onClick={handleSavePlan}
                    className="px-6 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 flex items-center space-x-2"
                  >
                    <Save className="w-5 h-5" />
                    <span>Save Plan</span>
                  </button>
                  <button
                    onClick={handleProceedToOptimization}
                    className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 flex items-center space-x-2"
                  >
                    <span>Proceed to Optimization</span>
                    <ArrowRight className="w-5 h-5" />
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

// Wrapper with LoadProfileProvider
const PlanningWizardPageEnhanced: React.FC = () => {
  return (
    <LoadProfileProvider>
      <PlanningWizardContent />
    </LoadProfileProvider>
  );
};

export default PlanningWizardPageEnhanced;


import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, Home, GraduationCap, Factory, Zap, Settings, ArrowRight } from 'lucide-react';
import { SiteType, WorkflowPreference } from '../types';

interface PostLoginWizardPageProps {
  onComplete?: () => void;
}

const PostLoginWizardPage: React.FC<PostLoginWizardPageProps> = ({ onComplete }) => {
  const navigate = useNavigate();
  const [step, setStep] = useState<1 | 2>(1);
  const [siteType, setSiteType] = useState<SiteType | null>(null);
  const [workflowPreference, setWorkflowPreference] = useState<WorkflowPreference | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const siteTypes: { value: SiteType; label: string; icon: React.ReactNode; description: string }[] = [
    { value: 'home', label: 'Home', icon: <Home className="w-8 h-8" />, description: 'Residential energy management' },
    { value: 'college', label: 'College', icon: <GraduationCap className="w-8 h-8" />, description: 'Educational institution' },
    { value: 'small_industry', label: 'Small Industry', icon: <Factory className="w-8 h-8" />, description: 'Small to medium business' },
    { value: 'large_industry', label: 'Large Industry', icon: <Factory className="w-8 h-8" />, description: 'Large industrial facility' },
    { value: 'power_plant', label: 'Power Plant', icon: <Zap className="w-8 h-8" />, description: 'Power generation facility' },
    { value: 'other', label: 'Other', icon: <Settings className="w-8 h-8" />, description: 'Other facility type' },
  ];

  const handleSiteTypeSelect = (type: SiteType) => {
    setSiteType(type);
    setTimeout(() => setStep(2), 300);
  };

  const handleWorkflowSelect = async (workflow: WorkflowPreference) => {
    setWorkflowPreference(workflow);
    setIsLoading(true);

    try {
      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001/api/v1';
      const token = localStorage.getItem('jwt');
      
      const response = await fetch(`${API_BASE_URL}/wizard/site-type`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          site_type: siteType,
          workflow_preference: workflow
        })
      });

      if (response.ok) {
        // Mark wizard as completed
        localStorage.setItem('hasCompletedWizard', 'true');
        // Call onComplete callback if provided (this updates App state and navigates)
        if (onComplete) {
          onComplete();
        } else {
          // Fallback: use window.location for navigation
          window.location.hash = '#/main-options';
        }
      } else {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to save preferences');
      }
    } catch (error) {
      console.error('Error saving preferences:', error);
      // Still mark as completed and navigate even if save fails
      localStorage.setItem('hasCompletedWizard', 'true');
      if (onComplete) {
        onComplete();
      } else {
        window.location.hash = '#/main-options';
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        {/* Progress Indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-center space-x-4">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold ${
              step >= 1 ? 'bg-blue-600 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-500'
            }`}>
              1
            </div>
            <div className={`w-24 h-1 ${step >= 2 ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-700'}`} />
            <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold ${
              step >= 2 ? 'bg-blue-600 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-500'
            }`}>
              2
            </div>
          </div>
          <div className="flex justify-between mt-2 text-sm text-gray-600 dark:text-gray-400">
            <span>Select Site Type</span>
            <span>Select Workflow</span>
          </div>
        </div>

        {/* Step 1: Site Type Selection */}
        {step === 1 && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2 text-center">
              Welcome to VidyutAI
            </h2>
            <p className="text-gray-600 dark:text-gray-400 text-center mb-8">
              Let's get started by selecting your site type
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {siteTypes.map((type) => (
                <button
                  key={type.value}
                  onClick={() => handleSiteTypeSelect(type.value)}
                  className={`p-6 rounded-xl border-2 transition-all hover:shadow-lg ${
                    siteType === type.value
                      ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-gray-200 dark:border-gray-700 hover:border-blue-300'
                  }`}
                >
                  <div className="flex flex-col items-center text-center space-y-3">
                    <div className={`p-3 rounded-lg ${
                      siteType === type.value
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
                    }`}>
                      {type.icon}
                    </div>
                    <h3 className="font-semibold text-lg text-gray-900 dark:text-white">
                      {type.label}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {type.description}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 2: Workflow Selection */}
        {step === 2 && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8">
            <button
              onClick={() => setStep(1)}
              className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-6 flex items-center"
            >
              ← Back
            </button>

            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2 text-center">
              What would you like to do?
            </h2>
            <p className="text-gray-600 dark:text-gray-400 text-center mb-8">
              Choose your workflow
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <button
                onClick={(e) => {
                  e.preventDefault();
                  console.log('Plan new clicked');
                  handleWorkflowSelect('plan_new');
                }}
                disabled={isLoading}
                type="button"
                className="p-8 rounded-xl border-2 border-blue-200 dark:border-blue-800 hover:border-blue-600 dark:hover:border-blue-400 bg-blue-50 dark:bg-blue-900/20 hover:shadow-lg transition-all disabled:opacity-50 cursor-pointer"
              >
                <div className="flex flex-col items-center text-center space-y-4">
                  <div className="p-4 bg-blue-600 text-white rounded-lg">
                    <Building2 className="w-12 h-12" />
                  </div>
                  <h3 className="font-bold text-xl text-gray-900 dark:text-white">
                    Plan a New Energy System
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    Design and plan a new energy system from scratch with our guided wizard
                  </p>
                  <div className="flex items-center text-blue-600 dark:text-blue-400 font-semibold">
                    Get Started <ArrowRight className="w-5 h-5 ml-2" />
                  </div>
                </div>
              </button>

              <button
                onClick={(e) => {
                  e.preventDefault();
                  console.log('Optimize existing clicked');
                  handleWorkflowSelect('optimize_existing');
                }}
                disabled={isLoading}
                type="button"
                className="p-8 rounded-xl border-2 border-green-200 dark:border-green-800 hover:border-green-600 dark:hover:border-green-400 bg-green-50 dark:bg-green-900/20 hover:shadow-lg transition-all disabled:opacity-50 cursor-pointer"
              >
                <div className="flex flex-col items-center text-center space-y-4">
                  <div className="p-4 bg-green-600 text-white rounded-lg">
                    <Zap className="w-12 h-12" />
                  </div>
                  <h3 className="font-bold text-xl text-gray-900 dark:text-white">
                    Optimize Existing System
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    Optimize your current energy system for better efficiency and cost savings
                  </p>
                  <div className="flex items-center text-green-600 dark:text-green-400 font-semibold">
                    Get Started <ArrowRight className="w-5 h-5 ml-2" />
                  </div>
                </div>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PostLoginWizardPage;


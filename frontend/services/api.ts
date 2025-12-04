import { HealthStatus, Alert, MaintenanceAsset, Site, RLStrategy, DigitalTwinDataPoint, Anomaly, AIQuery, RLSuggestion, UserProfile, LoadProfile, PlanningRecommendation, OptimizationConfig, Appliance, PrimaryGoal } from '../types';
declare global {
  interface ImportMeta {
    env: {
      VITE_API_BASE_URL?: string;
      [key: string]: string | undefined;
    };
  }
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || (typeof window !== 'undefined' && window.location.hostname !== 'localhost' ? '/api/v1' : 'http://localhost:5001/api/v1');

// --- Helper for Auth Headers ---
const getAuthHeaders = (): HeadersInit => {
  const token = localStorage.getItem('jwt');
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
};

// --- Authentication ---
export interface User {
  id: string;
  email: string;
  name: string;
  role: string;
}

export const apiLogin = async (email: string, password: string): Promise<{ token: string; user: User }> => {
  console.log(`Logging in with ${email}`);

  const response = await fetch(`${API_BASE_URL}/auth/token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ username: email, password }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Invalid credentials' }));
    throw new Error(errorData.message || errorData.error || 'Invalid credentials');
  }
  const data = await response.json();
  
  // Store user data in localStorage
  const user = data.user;
  localStorage.setItem('user', JSON.stringify(user));
  
  return { token: data.access_token, user };
};

export const apiRegister = async (name: string, email: string, password: string): Promise<{ success: boolean; message: string }> => {
  console.log(`Registering user with email: ${email}`);
  
  const response = await fetch(`${API_BASE_URL}/auth/register`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ name, email, password }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Registration failed');
  }
  
  const data = await response.json();
  
  // Don't auto-login, just return success
  return { success: true, message: 'Account created successfully' };
};

// --- Site Management ---
export const fetchSites = async (): Promise<Site[]> => {
  const response = await fetch(`${API_BASE_URL}/sites`, { headers: getAuthHeaders() });
  if (!response.ok) throw new Error('Failed to fetch sites');
  const result = await response.json();
  return result.data || result; // Return the data array from the response
};

export const createSite = async (siteData: Omit<Site, 'id'>): Promise<Site> => {
  const response = await fetch(`${API_BASE_URL}/sites`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(siteData),
  });
  if (!response.ok) throw new Error('Failed to create site');
  const result = await response.json();
  return result.data || result;
};

export const updateSite = async (siteData: Site): Promise<Site> => {
  const response = await fetch(`${API_BASE_URL}/sites/${siteData.id}`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(siteData),
  });
  if (!response.ok) throw new Error('Failed to update site');
  const result = await response.json();
  return result.data || result;
};

export const deleteSite = async (siteId: string): Promise<{ success: boolean }> => {
  const response = await fetch(`${API_BASE_URL}/sites/${siteId}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });
  if (!response.ok) throw new Error('Failed to delete site');
  return response.json();
};

export const fetchTimeseries = async (siteId: string, range: string = 'last_6h'): Promise<any[]> => {
  // Alias for fetchTimeseriesData for consistency
  return fetchTimeseriesData(siteId, range);
};

// --- Core Data Fetching ---
export const fetchHealthStatus = async (siteId: string): Promise<HealthStatus> => {
  const response = await fetch(`${API_BASE_URL}/sites/${siteId}/health-status`, { headers: getAuthHeaders() });
  if (!response.ok) throw new Error('Failed to fetch health status');
  return response.json();
};

export const fetchAlerts = async (siteId: string): Promise<Alert[]> => {
  const response = await fetch(`${API_BASE_URL}/sites/${siteId}/alerts`, { headers: getAuthHeaders() });
  if (!response.ok) throw new Error('Failed to fetch alerts');
  return response.json();
};

export const acknowledgeAlert = async (siteId: string, alertId: string): Promise<{ success: boolean }> => {
  const response = await fetch(`${API_BASE_URL}/sites/${siteId}/alerts/${alertId}/acknowledge`, {
    method: 'POST',
    headers: getAuthHeaders(),
  });
  if (!response.ok) throw new Error('Failed to acknowledge alert');
  return response.json();
};

export const acceptRLSuggestion = async (siteId: string, suggestionId: string): Promise<{ success: boolean, schedule: string }> => {
  const response = await fetch(`${API_BASE_URL}/sites/${siteId}/suggestions/${suggestionId}/accept`, {
    method: 'POST',
    headers: getAuthHeaders()
  });
  if (!response.ok) throw new Error('Failed to accept suggestion');
  return response.json();
};

export const rejectRLSuggestion = async (siteId: string, suggestionId: string): Promise<{ success: boolean }> => {
  const response = await fetch(`${API_BASE_URL}/sites/${siteId}/suggestions/${suggestionId}/reject`, {
    method: 'POST',
    headers: getAuthHeaders()
  });
  if (!response.ok) throw new Error('Failed to reject suggestion');
  return response.json();
};

// --- Asset Management ---
export const fetchAssetsForSite = async (siteId: string): Promise<MaintenanceAsset[]> => {
  const response = await fetch(`${API_BASE_URL}/assets?siteId=${siteId}`, { headers: getAuthHeaders() });
  if (!response.ok) throw new Error('Failed to fetch assets');
  const result = await response.json();
  return result.data || result; // Handle both formats
};

export const createAsset = async (assetData: Omit<MaintenanceAsset, 'id' | 'failure_probability' | 'rank'>): Promise<MaintenanceAsset> => {
  const response = await fetch(`${API_BASE_URL}/assets`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(assetData)
  });
  if (!response.ok) throw new Error('Failed to create asset');
  const result = await response.json();
  return result.data || result; // Handle both formats
};

export const updateAsset = async (assetData: MaintenanceAsset): Promise<MaintenanceAsset> => {
  const response = await fetch(`${API_BASE_URL}/assets/${assetData.id}`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(assetData)
  });
  if (!response.ok) throw new Error('Failed to update asset');
  const result = await response.json();
  return result.data || result; // Handle both formats
};

export const deleteAsset = async (assetId: string): Promise<{ success: boolean }> => {
  const response = await fetch(`${API_BASE_URL}/assets/${assetId}`, {
    method: 'DELETE',
    headers: getAuthHeaders()
  });
  if (!response.ok) throw new Error('Failed to delete asset');
  return response.json();
};

export const scheduleMaintenance = async (siteId: string, assetId: string): Promise<{ success: boolean }> => {
  const response = await fetch(`${API_BASE_URL}/sites/${siteId}/maintenance/${assetId}/schedule`, {
    method: 'POST',
    headers: getAuthHeaders()
  });
  if (!response.ok) throw new Error('Failed to schedule maintenance');
  return response.json();
};

// --- Simulator & Timeseries ---
export const runSimulation = async (params: { pvCurtail: number, batteryTarget: number, gridPrice: number }): Promise<{ cost: number[], emissions: number[] }> => {
  const response = await fetch(`${API_BASE_URL}/simulate`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(params)
  });
  if (!response.ok) throw new Error('Simulation failed');
  return response.json();
};

export const fetchTimeseriesData = async (siteId: string, range: string) => {
  const response = await fetch(`${API_BASE_URL}/sites/${siteId}/timeseries?range=${range}`, { headers: getAuthHeaders() });
  if (!response.ok) throw new Error('Failed to fetch timeseries data');
  return response.json();
}

// --- Prediction Model Calls ---
export const runVibrationDiagnosis = async (): Promise<{ prediction: string; confidence: number }> => {
  const response = await fetch(`${API_BASE_URL}/predict/vibration`, { method: 'POST', headers: getAuthHeaders() });
  if (!response.ok) throw new Error('Vibration diagnosis failed');
  return response.json();
};

export const runSolarForecast = async (): Promise<{ prediction: number[] }> => {
  const response = await fetch(`${API_BASE_URL}/predict/solar`, { method: 'POST', headers: getAuthHeaders() });
  if (!response.ok) throw new Error('Solar forecast failed');
  return response.json();
};

export const runMotorFaultDiagnosis = async (): Promise<{ prediction: string; confidence: number }> => {
  const response = await fetch(`${API_BASE_URL}/predict/motor-fault`, { method: 'POST', headers: getAuthHeaders() });
  if (!response.ok) throw new Error('Motor fault diagnosis failed');
  return response.json();
};

// --- AI Predictions ---
export const getBatteryRULDashboard = async () => {
  const response = await fetch(`${getAIServiceURL()}/api/v1/predictions/battery-rul/dashboard`, {
    headers: getAuthHeaders()
  });
  if (!response.ok) throw new Error('Failed to fetch Battery RUL dashboard');
  return response.json();
};

export const getSolarDegradationDashboard = async () => {
  const response = await fetch(`${getAIServiceURL()}/api/v1/predictions/solar-degradation/dashboard`, {
    headers: getAuthHeaders()
  });
  if (!response.ok) throw new Error('Failed to fetch Solar Degradation dashboard');
  return response.json();
};

export const getEnergyLossDashboard = async () => {
  const response = await fetch(`${getAIServiceURL()}/api/v1/predictions/energy-loss/dashboard`, {
    headers: getAuthHeaders()
  });
  if (!response.ok) throw new Error('Failed to fetch Energy Loss dashboard');
  return response.json();
};

// --- Energy Forecasting ---
export interface ForecastInput {
  site_id?: string | null;
  forecast_type: 'production' | 'demand' | 'consumption';
  forecast_horizon_hours: number;
}

export interface ForecastResponse {
  success: boolean;
  forecast_type: string;
  horizon_hours: number;
  site_id?: string;
  data: Array<{
    timestamp: string;
    hour: number;
    value: number;
    confidence_lower: number;
    confidence_upper: number;
    pattern_factor?: number;
    model_used?: string;
  }>;
  summary?: {
    total_24h: number;
    average: number;
    peak: number;
    peak_hour: number;
    min: number;
    min_hour: number;
  };
  model_info?: {
    model: string;
    description?: string;
    mae?: number;
    rmse?: number;
    r2?: number;
  };
}

export const forecastEnergy = async (input: ForecastInput): Promise<ForecastResponse> => {
  const AI_SERVICE_URL = getAIServiceURL();
  const response = await fetch(`${AI_SERVICE_URL}/api/v1/forecast/energy`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(input)
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: 'Forecasting failed' }));
    throw new Error(errorData.message || 'Forecasting failed');
  }
  const data = await response.json();
  
  // Calculate summary if not provided
  if (data.success && data.data && !data.summary) {
    const values = data.data.map((d: any) => d.value);
    const total = values.reduce((sum: number, val: number) => sum + val, 0);
    const average = total / values.length;
    const peak = Math.max(...values);
    const peakIndex = values.indexOf(peak);
    const min = Math.min(...values);
    const minIndex = values.indexOf(min);
    
    data.summary = {
      total_24h: total,
      average: average,
      peak: peak,
      peak_hour: data.data[peakIndex]?.hour || 12,
      min: min,
      min_hour: data.data[minIndex]?.hour || 2
    };
  }
  
  return data;
};

export const getForecastSummary = async (
  siteId?: string,
  forecastType: 'production' | 'demand' | 'consumption' = 'consumption'
): Promise<ForecastResponse> => {
  const AI_SERVICE_URL = getAIServiceURL();
  const params = new URLSearchParams({ forecast_type: forecastType });
  if (siteId) params.append('site_id', siteId);
  
  const response = await fetch(`${AI_SERVICE_URL}/api/v1/forecast/summary?${params}`, {
    method: 'GET',
    headers: getAuthHeaders()
  });
  if (!response.ok) throw new Error('Failed to get forecast summary');
  return response.json();
};

export const explainForecast = async (forecastData: ForecastResponse): Promise<{ success: boolean; explanation: string; fallback?: boolean }> => {
  const AI_SERVICE_URL = getAIServiceURL();
  const response = await fetch(`${AI_SERVICE_URL}/api/v1/forecast/explain`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(forecastData)
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: 'Failed to get explanation' }));
    throw new Error(errorData.message || 'Failed to get explanation');
  }
  return response.json();
};

export const getAIServiceURL = (): string => {
  return (import.meta as any).env?.VITE_AI_BASE_URL || (typeof window !== 'undefined' && window.location.hostname !== 'localhost' ? '/ai' : 'http://localhost:8000');
};

// --- Hackathon Features ---
export const updateRLStrategy = async (siteId: string, strategy: RLStrategy): Promise<{ success: boolean }> => {
  const response = await fetch(`${API_BASE_URL}/sites/${siteId}/rl-strategy`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(strategy)
  });
  if (!response.ok) throw new Error('Failed to update RL strategy');
  return response.json();
};

export const fetchDigitalTwinData = async (assetId: string): Promise<{ dataPoints: DigitalTwinDataPoint[], anomalies: Anomaly[] }> => {
  const response = await fetch(`${API_BASE_URL}/assets/${assetId}/digital-twin`, { headers: getAuthHeaders() });
  if (!response.ok) throw new Error('Failed to fetch digital twin data');
  return response.json();
};

export const runRootCauseAnalysis = async (alert: Alert): Promise<string> => {
  const response = await fetch(`${API_BASE_URL}/alerts/analyze-root-cause`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(alert)
  });
  if (!response.ok) throw new Error('Root cause analysis failed');
  return response.json();
};


export const askAI = async (question: string): Promise<string> => {
  const body: AIQuery = { question };
  const response = await fetch(`${API_BASE_URL}/actions/ask-ai`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(body)
  });
  if (!response.ok) throw new Error('AI assistant is currently unavailable.');
  // The backend for this endpoint also returns a raw string
  return response.text();
};


export const fetchRLSuggestions = async (siteId: string): Promise<RLSuggestion[]> => {
    const response = await fetch(`${API_BASE_URL}/sites/${siteId}/suggestions`, { headers: getAuthHeaders() });
    if (!response.ok) throw new Error('Failed to fetch RL suggestions');
    return response.json();
};

// --- Wizard & Planning API ---
export const getUserProfile = async (): Promise<UserProfile | null> => {
  const response = await fetch(`${API_BASE_URL}/wizard/profile`, { headers: getAuthHeaders() });
  if (!response.ok) throw new Error('Failed to fetch user profile');
  const result = await response.json();
  return result.profile;
};

export const saveSiteTypeAndWorkflow = async (siteType: string, workflowPreference: string): Promise<{ success: boolean; profile: UserProfile }> => {
  const response = await fetch(`${API_BASE_URL}/wizard/site-type`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ site_type: siteType, workflow_preference: workflowPreference })
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Unknown error', message: 'Failed to save site type and workflow' }));
    throw new Error(errorData.message || errorData.error || 'Failed to save site type and workflow');
  }
  return response.json();
};

export const savePlanningStep1 = async (data: { preferred_sources: string[]; primary_goal: PrimaryGoal; allow_diesel: boolean }): Promise<{ success: boolean }> => {
  const response = await fetch(`${API_BASE_URL}/wizard/planning/step1`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(data)
  });
  if (!response.ok) throw new Error('Failed to save planning step 1');
  return response.json();
};

export const savePlanningStep2 = async (data: { name: string; appliances: Omit<Appliance, 'id'>[]; site_id?: string }): Promise<{ success: boolean; load_profile: LoadProfile }> => {
  const response = await fetch(`${API_BASE_URL}/wizard/planning/step2`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(data)
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Unknown error', message: 'Failed to save load profile' }));
    throw new Error(errorData.message || errorData.error || 'Failed to save load profile');
  }
  return response.json();
};

export const savePlanningStep3 = async (data: {
  load_profile_id: string;
  preferred_sources: string[];
  primary_goal: PrimaryGoal;
  allow_diesel: boolean;
  action: 'save' | 'proceed_to_optimization';
  site_id?: string;
}): Promise<{ success: boolean; recommendation: PlanningRecommendation; action: string }> => {
  const response = await fetch(`${API_BASE_URL}/wizard/planning/step3`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(data)
  });
  if (!response.ok) throw new Error('Failed to generate planning recommendation');
  return response.json();
};

export const getLoadProfiles = async (siteId?: string): Promise<LoadProfile[]> => {
  const url = siteId 
    ? `${API_BASE_URL}/wizard/load-profiles?site_id=${siteId}`
    : `${API_BASE_URL}/wizard/load-profiles`;
  const response = await fetch(url, { headers: getAuthHeaders() });
  if (!response.ok) {
    if (response.status === 401) {
      console.warn('Unauthorized: Token may be missing or expired');
      return []; // Return empty array instead of throwing
    }
    throw new Error(`Failed to fetch load profiles: ${response.status} ${response.statusText}`);
  }
  const result = await response.json();
  return result.load_profiles || [];
};

export const getPlanningRecommendations = async (siteId?: string, loadProfileId?: string): Promise<PlanningRecommendation[]> => {
  const params = new URLSearchParams();
  if (siteId) params.append('site_id', siteId);
  if (loadProfileId) params.append('load_profile_id', loadProfileId);
  const url = `${API_BASE_URL}/wizard/planning-recommendations${params.toString() ? '?' + params.toString() : ''}`;
  const response = await fetch(url, { headers: getAuthHeaders() });
  if (!response.ok) {
    if (response.status === 401) {
      console.warn('Unauthorized: Token may be missing or expired');
      return []; // Return empty array instead of throwing
    }
    throw new Error(`Failed to fetch planning recommendations: ${response.status} ${response.statusText}`);
  }
  const result = await response.json();
  return result.recommendations || [];
};

export const saveOptimizationConfig = async (config: Omit<OptimizationConfig, 'id' | 'created_at' | 'updated_at'>): Promise<{ success: boolean; config: OptimizationConfig }> => {
  const response = await fetch(`${API_BASE_URL}/wizard/optimization/setup`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(config)
  });
  if (!response.ok) throw new Error('Failed to save optimization config');
  return response.json();
};

export const getOptimizationConfigs = async (siteId?: string): Promise<OptimizationConfig[]> => {
  const url = siteId
    ? `${API_BASE_URL}/wizard/optimization/configs?site_id=${siteId}`
    : `${API_BASE_URL}/wizard/optimization/configs`;
  const response = await fetch(url, { headers: getAuthHeaders() });
  if (!response.ok) throw new Error('Failed to fetch optimization configs');
  const result = await response.json();
  return result.configs || [];
};
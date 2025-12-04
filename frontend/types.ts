import { Type } from "@google/genai";

export interface Telemetry {
  timestamp: string;
  site_id: string;
  device_id: string;
  subsystem: string;
  metrics: {
    voltage: number;
    current: number;
    frequency: number;
    thd?: number;
    power_factor?: number;
    voltage_unbalance?: number;
    temp_c: number;
    pv_generation?: number;
    pv_irradiance?: number;
    soc_batt?: number;
    net_load?: number;
    battery_discharge?: number;
  };
  waveform_refs?: {
    [key:string]: string;
  };
}

export interface Alert {
  id: string;
  timestamp?: string;
  device_id?: string;
  site_id?: string;
  severity: 'critical' | 'high' | 'medium' | 'low' | 'warning' | 'info';
  type?: string;
  title?: string;
  message: string;
  diagnosis?: string;
  recommended_action?: string;
  status: 'active' | 'acknowledged' | 'resolved';
}

export interface EnergyFlows {
    grid_to_load: number;
    pv_to_load: number;
    pv_to_battery: number;
    battery_to_load: number;
    battery_to_grid: number; // For V2G
    pv_to_grid: number; // Selling back
}

export interface RLSuggestion {
  id: string;
  timestamp: string;
  action_summary: string;
  explanation: string[];
  confidence: number;
  estimated_cost_savings: number;
  status: 'pending' | 'accepted' | 'rejected';
  current_flows: EnergyFlows;
  suggested_flows: EnergyFlows;
}

export interface MaintenanceAsset {
  id: string;
  siteId: string;
  name: string;
  type: string;
  modelNumber: string;
  installDate: string;
  status: 'operational' | 'degraded' | 'offline' | 'online' | 'maintenance' | 'warning' | 'error';
  failure_probability: number;
  rank: number;
}

export interface HealthStatus {
  site_health: number;
  grid_draw: number;
  battery_soc: number;
  pv_generation_today: number;
  battery_soh: number;
  inverter_health: number;
  motor_health: number;
  pv_health: number;
  ev_charger_health: number;
  power_quality_index?: number; // Overall power quality score (0-100)
  voltage_quality?: number; // Voltage quality score
  frequency_stability?: number; // Frequency stability score
  thd_percentage?: number; // Total Harmonic Distortion percentage
  power_factor?: number; // Power factor (0-1)
}

export interface APIKey {
  id: string;
  name: string;
  key: string;
  displayKey: string;
  createdAt: string;
  status: 'active' | 'inactive';
}

export interface Site {
  id: string;
  name: string;
  location: string;
  status: 'online' | 'offline' | 'maintenance';
}

// NEW: For Enhanced RL
export interface RLStrategy {
  cost_priority: number; // 0-100
  grid_stability_priority: number; // 0-100
  battery_life_priority: number; // 0-100 (renamed from battery_longevity_priority)
}

// NEW: For Digital Twin
export interface DigitalTwinDataPoint {
  id: string;
  label: string;
  unit: string;
  x: number;
  y: number;
  real_value: number;
  predicted_value: number;
}

export interface Anomaly {
  id: string;
  timestamp: string;
  data_point_id: string;
  data_point_label: string;
  severity: 'high' | 'medium' | 'low';
  message: string;
}


export interface AIQuery {
  question: string;
}

export interface RLSuggestion {
  id: string;
  timestamp: string; // Datetime objects are serialized as strings
  action_summary: string;
  explanation: string[];
  confidence: number;
  estimated_cost_savings: number;
  status: 'pending' | 'accepted' | 'rejected';
  current_flows: EnergyFlows;
  suggested_flows: EnergyFlows;
}
export interface Weather {
  location: string;
  temperature: number;
  condition: string;
  icon: string; // e.g., "01d" for clear sky, day
}

// Wizard Flow Types
export type SiteType = 'home' | 'college' | 'small_industry' | 'large_industry' | 'power_plant' | 'other';
export type WorkflowPreference = 'plan_new' | 'optimize_existing';
export type PrimaryGoal = 'savings' | 'self_sustainability' | 'reliability' | 'carbon_reduction';

export interface UserProfile {
  id: string;
  user_id: string;
  site_type: SiteType | null;
  workflow_preference: WorkflowPreference | null;
  created_at: string;
  updated_at: string;
}

export interface Appliance {
  id?: string;
  category: 'lighting' | 'fans' | 'it' | 'cooling_heating' | 'cleaning' | 'kitchen_misc';
  name: string;
  power_rating: number; // kW
  quantity: number;
  avg_hours: number; // hours per day
}

export interface CategoryTotals {
  lighting: { power: number; quantity: number; hours: number; total: number };
  fans: { power: number; quantity: number; hours: number; total: number };
  it: { power: number; quantity: number; hours: number; total: number };
  cooling_heating: { power: number; quantity: number; hours: number; total: number };
  cleaning: { power: number; quantity: number; hours: number; total: number };
  kitchen_misc: { power: number; quantity: number; hours: number; total: number };
}

export interface LoadProfile {
  id: string;
  user_id: string;
  site_id: string | null;
  name: string;
  category_totals: CategoryTotals;
  total_daily_energy_kwh: number;
  appliances: Appliance[];
  created_at: string;
  updated_at: string;
}

export interface TechnicalSizing {
  solar_capacity_kw: number;
  battery_capacity_kwh: number;
  inverter_capacity_kw: number;
  grid_connection_kw: number;
  diesel_capacity_kw: number | null;
  recommendations: string[];
}

export interface EconomicAnalysis {
  total_capex: number; // INR
  annual_opex: number; // INR
  payback_period_years: number;
  npv_10_years: number; // INR
  roi_percentage: number;
  monthly_savings: number; // INR
}

export interface EmissionsAnalysis {
  annual_co2_reduction_kg: number;
  carbon_offset_percentage: number;
  lifetime_co2_reduction_tonnes: number;
}

export interface PlanningRecommendation {
  id: string;
  user_id: string;
  site_id: string | null;
  load_profile_id: string;
  preferred_sources: string[];
  primary_goal: PrimaryGoal;
  allow_diesel: boolean;
  technical_sizing: TechnicalSizing;
  economic_analysis: EconomicAnalysis;
  emissions_analysis: EmissionsAnalysis;
  scenario_link: string | null;
  status: 'draft' | 'saved' | 'applied';
  created_at: string;
  updated_at: string;
}

export interface OptimizationConfig {
  id: string;
  user_id: string;
  site_id: string | null;
  load_profile_id: string | null;
  planning_recommendation_id: string | null;
  load_data: any; // JSON object
  tariff_data: any; // JSON object
  pv_parameters: any | null; // JSON object
  battery_parameters: any | null; // JSON object
  grid_parameters: any | null; // JSON object
  objective: 'cost' | 'co2' | 'combination';
  created_at: string;
  updated_at: string;
}
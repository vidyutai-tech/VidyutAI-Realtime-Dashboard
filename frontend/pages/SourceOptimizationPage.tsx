import { useContext, useState, useEffect, useMemo, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { AppContext } from "../contexts/AppContext";
import axios from "axios";
import { Snackbar, Alert } from "@mui/material";
import {
  BatteryCharging,
  DollarSign,
  Fuel,
  Gauge,
  Leaf,
  Sun,
  Zap,
  ArrowLeft,
} from "lucide-react";

const SourceOptimizationPage = () => {
  const { currentUser } = useContext(AppContext)!;
  const navigate = useNavigate();
  const location = useLocation();
  
  // Get common config from location state (from Optimization Setup)
  const commonConfig = (location.state as any)?.commonConfig;
  const uploadedFile = (location.state as any)?.uploadedFile;

  // Source-specific form data (load curtail cost and objective type)
  const [sourceSpecificData, setSourceSpecificData] = useState({
    load_curtail_cost: 50,
    objective_type: "cost" as "cost" | "co2",
  });

  // Merged form data (common + source-specific) for API call
  const [mergedFormData, setMergedFormData] = useState<any>(null);
  const [response, setResponse] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [plotUrl, setPlotUrl] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const AI_BASE_URL = (import.meta as any).env?.VITE_AI_BASE_URL || "http://localhost:8000";
  const OPTIMIZE_URL = `${AI_BASE_URL}/api/v1/optimize`;

  const controlWrapperClass = "form-control space-y-2";
  const labelClass = "label-text text-sm font-medium text-base-content/70 mb-1.5";
  const inputClass =
    "w-full px-4 py-3 rounded-lg border border-gray-200 bg-white text-base-content placeholder:text-gray-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all duration-200 shadow-sm hover:border-gray-300";
  const selectClass =
    "w-full px-4 py-3 rounded-lg border border-gray-200 bg-white text-base-content focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all duration-200 shadow-sm hover:border-gray-300";
  const fileInputClass =
    "file-input w-full rounded-lg border border-gray-200 bg-white text-base-content focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all duration-200 shadow-sm hover:border-gray-300 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20";
  const sectionPanelClass = "space-y-4 rounded-2xl border border-base-200/60 bg-base-100/70 p-5 shadow-sm";

  const formatNumber = (
    value: number | string | null | undefined,
    maximumFractionDigits = 2
  ): string => {
    if (value === null || value === undefined || value === "" || Number.isNaN(Number(value))) {
      return "-";
    }
    const numericValue = Number(value);
    return numericValue.toLocaleString("en-IN", {
      maximumFractionDigits,
    });
  };

  const formatCurrency = (value: number | string | null | undefined): string => {
    if (value === null || value === undefined || Number.isNaN(Number(value))) {
      return "-";
    }
    const numericValue = Number(value);
    return numericValue.toLocaleString("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 2,
    });
  };

  const formatPercent = (
    value: number | string | null | undefined,
    maximumFractionDigits = 1
  ): string => {
    if (value === null || value === undefined || Number.isNaN(Number(value))) {
      return "-";
    }
    return `${formatNumber(Number(value), maximumFractionDigits)}%`;
  };

  const formatKWh = (value: number | string | null | undefined, digits = 2): string => {
    const formatted = formatNumber(value, digits);
    return formatted === "-" ? "-" : `${formatted} kWh`;
  };

  // Merge common config with source-specific data
  useEffect(() => {
    if (commonConfig) {
      const merged = {
        ...commonConfig,
        ...sourceSpecificData,
        uploadedFile: uploadedFile || null,
      };
      setMergedFormData(merged);
    } else {
      // If no common config, use defaults (for backward compatibility)
      const defaultMerged = {
        weather: "Sunny",
        objective_type: "cost",
        num_days: 2,
        time_resolution_minutes: 30,
        grid_connection: 2000,
        solar_connection: 2000,
        battery_capacity: 4000000,
        battery_voltage: 100,
        diesel_capacity: 2200,
        fuel_price: 95,
        pv_energy_cost: 2.85,
        load_curtail_cost: 50,
        battery_om_cost: 6.085,
        profile_type: "Auto detect",
        electrolyzer_capacity: 1000.0,
        fuel_cell_capacity: 800.0,
        h2_tank_capacity: 100.0,
        fuel_cell_efficiency_percent: 0.60,
        fuel_cell_om_cost: 1.5,
        electrolyzer_om_cost: 0.5,
        ...sourceSpecificData,
      };
      setMergedFormData(defaultMerged);
    }
  }, [commonConfig, sourceSpecificData, uploadedFile]);

  useEffect(() => {
    const savedResponse = localStorage.getItem("sourceOptimizationResponse");
    if (!savedResponse) return;

    const parsed = JSON.parse(savedResponse);
    setResponse(parsed);
    if (parsed.plot_base64) {
      setPlotUrl(`data:image/png;base64,${parsed.plot_base64}`);
    }
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setSourceSpecificData(prev => ({
      ...prev,
      [name]: type === 'number' ? parseFloat(value) || 0 : value
    }));
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && mergedFormData) {
      setMergedFormData(prev => ({
        ...prev,
        uploadedFile: file
      }));
    }
  };

  const handleSubmit = async () => {
    if (!mergedFormData) {
      setError("Please configure optimization parameters first in Optimization Setup");
      setOpen(true);
      return;
    }

    // Basic client-side validation for common inputs
    const validResolutions = [15, 30, 60];
    if (!validResolutions.includes(Number(mergedFormData.time_resolution_minutes))) {
      setError("Time resolution must be 15, 30, or 60 minutes");
      setOpen(true);
      return;
    }
    if (mergedFormData.num_days < 1 || mergedFormData.num_days > 30) {
      setError("Number of days must be between 1 and 30");
      setOpen(true);
      return;
    }

    setLoading(true);
    setError(null);
    setOpen(false);

    try {
      // Get auth token
      const token = localStorage.getItem('jwt');
      if (!token) {
        throw new Error("Not authenticated");
      }

      // Cancel any in-flight request before starting a new one
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      const controller = new AbortController();
      abortControllerRef.current = controller;

      // Create FormData for file upload
      const formDataToSend = new FormData();
      
      // Add file if uploaded
      if (mergedFormData.uploadedFile) {
        formDataToSend.append('file', mergedFormData.uploadedFile);
      }
      
      // Add all form parameters (merged common + source-specific)
      Object.keys(mergedFormData).forEach((key) => {
        if (key !== "uploadedFile") {
          formDataToSend.append(key, String(mergedFormData[key]));
        }
      });

      

      // Call the Python API
      const res = await axios.post(
        OPTIMIZE_URL,
        formDataToSend,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
            'Authorization': `Bearer ${token}`,
          },
          signal: controller.signal,
        }
      );

      if (res.data.status === "success") {
        setResponse(res.data);
        if (res.data.plot_base64) {
          setPlotUrl(`data:image/png;base64,${res.data.plot_base64}`);
        } else {
          setPlotUrl(null);
        }
        localStorage.setItem(
          "sourceOptimizationResponse",
          JSON.stringify(res.data)
        );
        
        // Stay on page to show results
      } else {
        setError(res.data.message || "Optimization failed");
        setOpen(true);
      }

    } catch (err: any) {
      if (axios.isCancel && axios.isCancel(err)) {
        // Swallow cancellation errors
        return;
      }
      if (err.response?.data?.message) {
        setError(err.response.data.message);
      } else {
        setError(err.message || "An unexpected error occurred");
      }
      setOpen(true);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setOpen(false);
  };

  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  const summary = response?.summary;
  const displayWeather = summary?.Weather ?? mergedFormData?.weather ?? "Sunny";
  const displayProfile = summary?.Notes?.Profile_Type ?? mergedFormData?.profile_type ?? "Auto detect";
  const displayResolution = summary?.Resolution_min ?? mergedFormData?.time_resolution_minutes ?? 30;
  const displayDays = summary?.Optimization_Period_days ?? mergedFormData?.num_days ?? 2;

  const formattedBreakdown = useMemo(() => {
    if (!response?.summary?.Costs?.Breakdown) return [];
    const breakdown = response.summary.Costs.Breakdown;
    if (Array.isArray(breakdown)) {
      return breakdown.map((item: any) => ({
        label: item.label,
        value: item.value,
      }));
    }
    if (breakdown && typeof breakdown === "object") {
      return Object.entries(breakdown).map(([label, value]) => ({
        label,
        value,
      }));
    }
    return [];
  }, [response]);

  const keyMetrics = useMemo(() => {
    if (!summary) {
      return [
        {
          title: "Ready to Optimize",
          value: "Configure inputs",
          subtext: "Adjust parameters or upload CSV to generate results.",
          accent: "from-slate-500 to-slate-600",
          icon: Zap,
        },
        {
          title: "Weather Profile",
          value: displayWeather,
          subtext: "Impacts available solar resource and dispatch mix.",
          accent: "from-sky-500 to-cyan-500",
          icon: Sun,
        },
        {
          title: "Time Horizon",
          value: `${displayDays} day${displayDays > 1 ? "s" : ""}`,
          subtext: `${displayResolution}-minute resolution`,
          accent: "from-indigo-500 to-purple-500",
          icon: Gauge,
        },
        {
          title: "Profile Type",
          value: displayProfile,
          subtext: "Run optimization to calculate savings & dispatch.",
          accent: "from-amber-500 to-orange-500",
          icon: DollarSign,
        },
      ];
    }

    const costPerKwh = summary.Costs?.Cost_per_kWh_INR;
    const totalCO2t = summary.Emissions?.Total_CO2_t;
    const servedKWh = summary.Load?.Total_Served_kWh;
    const co2Intensity = servedKWh && totalCO2t ? (Number(totalCO2t) * 1000) / Number(servedKWh) : null;
    return [
      {
        title: "Total Optimized Cost",
        value: summary.Costs?.TOTAL_COST_INR != null ? `₹${formatNumber(summary.Costs.TOTAL_COST_INR, 0)}` : "-",
        subtext: costPerKwh ? `₹${formatNumber(costPerKwh, 2)} per kWh` : "Includes grid, diesel & storage costs",
        accent: "from-emerald-500 via-emerald-500 to-emerald-600",
        icon: DollarSign,
      },
      {
        title: "Solar Utilization",
        value: formatPercent(summary.Solar?.Used_Percent),
        subtext: `${formatKWh(summary.Solar?.Used_kWh)} used of ${formatKWh(summary.Solar?.Available_kWh)} available`,
        accent: "from-amber-500 to-orange-500",
        icon: Sun,
      },
      {
        title: "Grid Imports",
        value: formatKWh(summary.Grid?.Import_kWh, 0),
        subtext: summary.Grid?.Energy_Cost_INR != null ? `₹${formatNumber(summary.Grid.Energy_Cost_INR, 0)}` : "Includes peak tariff impact",
        accent: "from-sky-500 to-blue-500",
        icon: Gauge,
      },
      {
        title: "Battery Cycling",
        value: `${formatKWh(summary.Battery?.Charged_kWh, 0)} / ${formatKWh(summary.Battery?.Discharged_kWh, 0)}`,
        subtext: `${formatNumber(summary.Battery?.Capacity_kWh, 0)} kWh • ${formatNumber(summary.Battery?.Voltage_V, 0)} V`,
        accent: "from-violet-500 to-purple-500",
        icon: BatteryCharging,
      },
      {
        title: "CO2 Emissions",
        value: totalCO2t != null ? `${formatNumber(totalCO2t, 2)} tCO2` : "-",
        subtext: co2Intensity != null ? `${formatNumber(co2Intensity, 2)} kg CO2/kWh` : "Emission intensity",
        accent: "from-teal-500 to-emerald-500",
        icon: Leaf,
      },
    ];
  }, [summary, displayWeather, displayDays, displayResolution, displayProfile]);
  return (
    <div className="max-w-6xl mx-auto space-y-8 p-6 pb-12">
      <div className="rounded-3xl border border-base-200/60 bg-base-100/95 shadow-xl shadow-sky-100/30">
        <div className="space-y-8 p-7 md:p-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <button
                onClick={() => navigate('/optimization-setup')}
                className="flex items-center text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-4"
              >
                <ArrowLeft className="w-5 h-5 mr-2" />
                Back to Setup
              </button>
              <p className="text-[0.65rem] font-semibold uppercase tracking-[0.45em] text-primary/70">
                Source Optimization
              </p>
              <h2 className="mt-2 text-2xl font-semibold text-base-content md:text-3xl">
                Configure Source Optimization
              </h2>
              <p className="mt-3 max-w-2xl text-sm text-base-content/70 md:text-[0.95rem]">
                Configure objective and load curtail cost. Common parameters are already set from Optimization Setup.
              </p>
            </div>
            {mergedFormData && (
              <div className="grid gap-2 text-right md:text-left">
                <span className="text-xs font-semibold uppercase tracking-wide text-base-content/50">
                  Configuration from Setup
                </span>
                <span className="text-base font-semibold text-base-content capitalize">
                  {mergedFormData.num_days} day{mergedFormData.num_days > 1 ? "s" : ""} • {mergedFormData.time_resolution_minutes}-minute resolution
                </span>
                <span className="text-sm text-base-content/60">
                  Weather: <span className="capitalize">{mergedFormData.weather}</span> · Profile: <span className="capitalize">{mergedFormData.profile_type}</span>
                </span>
              </div>
            )}
          </div>

          {!commonConfig && (
            <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
              <p className="text-yellow-800 dark:text-yellow-300">
                ⚠️ No configuration found. Please start from <button onClick={() => navigate('/optimization-setup')} className="underline font-semibold">Optimization Setup</button> first.
              </p>
            </div>
          )}

          {/* Source-Specific: Objective and Load Curtail Cost */}
          <div className={sectionPanelClass}>
            <h3 className="text-lg font-semibold mb-4">Source Optimization Parameters</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className={controlWrapperClass}>
                <label className="label">
                  <span className={labelClass}>Optimization Objective</span>
                </label>
                <select
                  name="objective_type"
                  value={sourceSpecificData.objective_type}
                  onChange={handleInputChange}
                  className={selectClass}
                >
                  <option value="cost">Minimize Cost</option>
                  <option value="co2">Minimize CO2 Emissions</option>
                </select>
                <label className="label">
                  <span className="label-text-alt">Choose whether to optimize for cost or CO2 emissions</span>
                </label>
              </div>

              <div className={controlWrapperClass}>
                <label className="label">
                  <span className={labelClass}>Load Curtail Cost (Rs/kWh)</span>
                </label>
                <input
                  type="number"
                  name="load_curtail_cost"
                  value={sourceSpecificData.load_curtail_cost}
                  onChange={handleInputChange}
                  className={inputClass}
                  step="0.1"
                />
                <label className="label">
                  <span className="label-text-alt">Penalty cost for curtailing load when supply is insufficient</span>
                </label>
              </div>
            </div>
          </div>

          {/* Storage Type Selection */}
          <div className={sectionPanelClass}>
            <h3 className="text-lg font-semibold mb-4">Energy Storage Configuration</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className={controlWrapperClass}>
                <label className="label">
                  <span className={labelClass}>Storage Type</span>
                </label>
                <select
                  name="storage_type"
                  value={mergedFormData?.storage_type || 'battery'}
                  onChange={(e) => {
                    if (mergedFormData) {
                      setMergedFormData(prev => ({
                        ...prev,
                        storage_type: e.target.value
                      }));
                    }
                  }}
                  className={selectClass}
                >
                  <option value="battery">Battery Energy Storage (BESS)</option>
                  <option value="phes">Pumped Hydro Energy Storage (PHES)</option>
                  <option value="hybrid">Hybrid (BESS + PHES)</option>
                </select>
                <label className="label">
                  <span className="label-text-alt">Select primary storage technology for optimization</span>
                </label>
              </div>
              {(mergedFormData?.storage_type === 'phes' || mergedFormData?.storage_type === 'hybrid') && (
                <div className={controlWrapperClass}>
                  <label className="label">
                    <span className={labelClass}>PHES Capacity (kWh)</span>
                  </label>
                  <input
                    type="number"
                    name="phes_capacity"
                    value={mergedFormData?.phes_capacity || 10000}
                    onChange={(e) => {
                      if (mergedFormData) {
                        setMergedFormData(prev => ({
                          ...prev,
                          phes_capacity: parseFloat(e.target.value) || 0
                        }));
                      }
                    }}
                    className={inputClass}
                    step="100"
                  />
                  <label className="label">
                    <span className="label-text-alt">Large-scale, long-duration pumped hydro storage capacity</span>
                  </label>
                </div>
              )}
            </div>
            {(mergedFormData?.storage_type === 'phes' || mergedFormData?.storage_type === 'hybrid') && (
              <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  <strong>PHES Benefits:</strong> Lower operational cost (3.83 INR/kWh vs 4.31 INR/kWh for BESS), 
                  large-scale capacity, and robust backup for long-duration energy storage needs.
                </p>
              </div>
            )}
          </div>

          {/* Display Common Configuration (Read-only) */}
          {mergedFormData && (
            <div className={sectionPanelClass}>
              <h3 className="text-lg font-semibold mb-4">Common Configuration (from Optimization Setup)</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="text-base-content/60">Weather:</span>
                  <span className="ml-2 font-semibold capitalize">{mergedFormData.weather}</span>
                </div>
                <div>
                  <span className="text-base-content/60">Days:</span>
                  <span className="ml-2 font-semibold">{mergedFormData.num_days}</span>
                </div>
                <div>
                  <span className="text-base-content/60">Resolution:</span>
                  <span className="ml-2 font-semibold">{mergedFormData.time_resolution_minutes} min</span>
                </div>
                <div>
                  <span className="text-base-content/60">Profile:</span>
                  <span className="ml-2 font-semibold capitalize">{mergedFormData.profile_type}</span>
                </div>
                <div>
                  <span className="text-base-content/60">Grid:</span>
                  <span className="ml-2 font-semibold">{mergedFormData.grid_connection} kW</span>
                </div>
                <div>
                  <span className="text-base-content/60">Solar:</span>
                  <span className="ml-2 font-semibold">{mergedFormData.solar_connection} kW</span>
                </div>
                <div>
                  <span className="text-base-content/60">Battery:</span>
                  <span className="ml-2 font-semibold">{(mergedFormData.battery_capacity / 1000).toFixed(0)} kWh</span>
                </div>
                <div>
                  <span className="text-base-content/60">Diesel:</span>
                  <span className="ml-2 font-semibold">{mergedFormData.diesel_capacity} kW</span>
                </div>
              </div>
              <button
                onClick={() => navigate('/optimization-setup', { state: { commonConfig: mergedFormData } })}
                className="mt-4 text-sm text-blue-600 dark:text-blue-400 hover:underline"
              >
                Edit common parameters →
              </button>
            </div>
          )}

          <div className="flex justify-center pt-4">
            <button
              onClick={handleSubmit}
              className="btn h-12 min-h-12 rounded-2xl border-none bg-gradient-to-r from-sky-600 via-indigo-600 to-purple-600 px-10 text-base font-semibold text-white shadow-lg shadow-indigo-300/40 transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-70"
              disabled={loading || !mergedFormData}
            >
              {loading ? "Optimizing..." : "Run Source Optimization"}
            </button>
          </div>
        </div>
      </div>

      {response && (
        <div className="space-y-8">
          {/* Optimization Summary */}
          {plotUrl && (
            <div className="rounded-3xl border border-base-200/70 bg-base-100/95 shadow-xl shadow-purple-100/40">
              <div className="space-y-4 p-6 md:p-8">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[0.6rem] font-semibold uppercase tracking-[0.4em] text-purple-500/80">
                      Dispatch Charts
                    </p>
                    <h3 className="mt-2 text-xl font-semibold text-base-content md:text-2xl">
                      Optimization Results Visualization
                    </h3>
                  </div>
                  <span className="rounded-full border border-purple-400/30 bg-purple-50 px-4 py-1 text-xs font-semibold text-purple-600">
                    High-level summary plot
                  </span>
                </div>
                <div className="flex justify-center overflow-x-auto">
                  <img
                    src={plotUrl}
                    alt="Optimization Results"
                    className="max-w-full rounded-2xl shadow-lg"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Cost Breakdown */}
          {formattedBreakdown.length > 0 && (
            <div className="rounded-3xl border border-base-200/70 bg-base-100/95 shadow-xl shadow-emerald-100/40">
              <div className="space-y-4 p-6 md:p-8">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-[0.6rem] font-semibold uppercase tracking-[0.4em] text-emerald-500/80">
                      Cost Analytics
                    </p>
                    <h3 className="mt-2 text-xl font-semibold text-base-content md:text-2xl">
                      Cost Breakdown
                    </h3>
                  </div>
                  <div className="rounded-full border border-emerald-400/30 bg-emerald-50 px-4 py-1 text-xs font-semibold text-emerald-600">
                    {formatCurrency(summary?.Costs?.TOTAL_COST_INR)}
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
                  {formattedBreakdown.map((item) => (
                    <div
                      key={item.label}
                      className="rounded-2xl border border-base-200/70 bg-base-200/70 p-4 shadow-inner"
                    >
                      <p className="text-sm text-base-content/60">{item.label}</p>
                      <p className="mt-2 text-xl font-semibold text-base-content">
                        ₹{item.value}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          <div className="rounded-3xl bg-gradient-to-r from-sky-600 via-indigo-600 to-purple-600 text-white shadow-2xl ring-1 ring-white/15">
            <div className="space-y-6 p-6 md:p-8">
              <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div>
                  <p className="text-[0.6rem] font-semibold uppercase tracking-[0.45em] text-white/70">
                    Optimization overview
                  </p>
                  <h3 className="mt-2 text-2xl font-semibold md:text-3xl">Source Optimization</h3>
                  <p className="mt-2 max-w-2xl text-sm text-white/80 md:text-base">
                    Compare optimized energy dispatch against configured capacities, visualize cross-source
                    flows, and uncover actionable savings opportunities for your hybrid energy system.
                  </p>
                </div>
                <div className="rounded-2xl border border-white/20 bg-white/10 px-5 py-4 text-right shadow-inner backdrop-blur md:text-left">
                  <p className="text-xs font-semibold uppercase tracking-wide text-white/70">
                    Current scenario
                  </p>
                  <p className="mt-1 text-lg font-semibold capitalize">
                    {response.summary.Weather} · {response.summary.Notes?.Profile_Type}
                  </p>
                  <p className="text-xs text-white/70">
                    {response.summary.Optimization_Period_days} day{response.summary.Optimization_Period_days > 1 ? "s" : ""} ·{" "}
                    {response.summary.Resolution_min}-minute resolution
                  </p>
                </div>
              </div>
              <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                {keyMetrics.map((metric) => {
                  const IconComponent = metric.icon;
                  return (
                    <div
                      key={metric.title}
                      className={`rounded-2xl bg-gradient-to-br ${metric.accent} p-5 shadow-lg ring-1 ring-white/20 overflow-hidden`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold uppercase tracking-wide text-white/70">
                            {metric.title}
                          </p>
                          <p className="mt-3 text-2xl font-semibold text-white md:text-3xl leading-tight">
                            {metric.value}
                          </p>
                          <p className="mt-2 text-sm text-white/80 break-words">{metric.subtext}</p>
                        </div>
                        <IconComponent className="h-8 w-8 shrink-0 text-white/85 flex-shrink-0" />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Key Insights */}
          <div className="rounded-3xl border border-base-200/70 bg-base-100/95 shadow-xl shadow-primary/10">
            <div className="space-y-4 p-6 md:p-8">
              <div>
                <p className="text-[0.6rem] font-semibold uppercase tracking-[0.4em] text-primary/70">
                  Narrative Summary
                </p>
                <h3 className="mt-2 text-xl font-semibold text-base-content md:text-2xl">
                  Key Insights
                </h3>
              </div>
              <div className="space-y-4">
                <div className="alert alert-info">
                  <div>
                    <h4 className="font-bold">Energy Distribution</h4>
                    <p className="leading-relaxed">
                      Total load of{" "}
                      <span className="font-semibold">
                        {response.summary.Load?.Total_Demand_kWh} kWh
                      </span>{" "}
                      was served across{" "}
                      {response.summary.Optimization_Period_days} days with{" "}
                      {response.summary.Solar?.Used_kWh} kWh from solar (
                      {response.summary.Solar?.Used_Percent}% utilization) and{" "}
                      {response.summary.Grid?.Import_kWh} kWh imported from the
                      grid.
                    </p>
                    {response.summary.Battery && (
                      <p className="mt-2">
                        Battery cycled{" "}
                        <span className="font-semibold">
                          {response.summary.Battery?.Charged_kWh} kWh
                        </span>{" "}
                        charging /{" "}
                        <span className="font-semibold">
                          {response.summary.Battery?.Discharged_kWh} kWh
                        </span>{" "}
                        discharging.
                      </p>
                    )}
                  </div>
                </div>
                <div className="alert alert-success">
                  <div>
                    <h4 className="font-bold">Cost Analysis</h4>
                    <p>
                      Total optimized cost: ₹
                      {response.summary.Costs?.TOTAL_COST_INR} for{" "}
                      {response.summary.Optimization_Period_days} days with{" "}
                      {response.summary.Resolution_min}-minute resolution.
                    </p>
                    <p className="mt-2">
                      Cost of energy: ₹
                      {response.summary.Costs?.Cost_per_kWh_INR}
                    </p>
                  </div>
                </div>
                <div className="alert alert-warning">
                  <div>
                    <h4 className="font-bold">Weather Impact</h4>
                    <p>
                      Analysis performed under{" "}
                      <span className="font-semibold">
                        {response.summary.Weather}
                      </span>{" "}
                      conditions, influencing solar generation profiles and
                      storage strategy.
                    </p>
                  </div>
                </div>
                {response.summary.Hydrogen && (
                  <div className="alert alert-accent">
                    <div>
                      <h4 className="font-bold">Hydrogen System</h4>
                      <p>
                        Electrolyzer consumed{" "}
                        {
                          response.summary.Hydrogen
                            ?.Energy_to_Electrolyzer_kWh
                        }{" "}
                        kWh and Fuel Cell generated{" "}
                        {
                          response.summary.Hydrogen
                            ?.Energy_from_Fuel_Cell_kWh
                        }{" "}
                        kWh.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      <Snackbar open={open} autoHideDuration={6000} onClose={handleClose}>
        <Alert onClose={handleClose} severity="error" sx={{ width: "100%" }}>
          {error}
        </Alert>
      </Snackbar>
    </div>
  );
};

export default SourceOptimizationPage;


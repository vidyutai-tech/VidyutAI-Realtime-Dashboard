import { useContext, useState, useEffect, useMemo, useRef } from "react";
import { AppContext } from "../contexts/AppContext";
import axios from "axios";
import { Snackbar, Alert } from "@mui/material";
import {
  ResponsiveContainer,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  AreaChart,
  Area,
} from "recharts";
import {
  BatteryCharging,
  DollarSign,
  Fuel,
  Gauge,
  Leaf,
  Sun,
  Zap,
} from "lucide-react";

const SourceOptimizationPage = () => {
  const { currentUser } = useContext(AppContext)!;
  const [formData, setFormData] = useState({
    weather: "Sunny",
    objective_type: "cost",
    num_days: 2,
    time_resolution_minutes: 30,
    grid_connection: 2000,
    solar_connection: 2000,
    battery_capacity: 4000000,  // Wh (matching notebook)
    battery_voltage: 100,
    diesel_capacity: 2200,
    fuel_price: 95,
    pv_energy_cost: 2.85,  // Matching notebook
    load_curtail_cost: 50,
    battery_om_cost: 6.085,  // Matching notebook
    profile_type: "Auto detect",
    // Hydrogen system parameters
    electrolyzer_capacity: 1000.0,
    fuel_cell_capacity: 800.0,
    h2_tank_capacity: 100.0,
    fuel_cell_efficiency_percent: 0.60,
    fuel_cell_om_cost: 1.5,
    electrolyzer_om_cost: 0.5
  });
  const [response, setResponse] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [chartData, setChartData] = useState<any[]>([]);
  const [plotUrl, setPlotUrl] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const AI_BASE_URL = (import.meta as any).env?.VITE_AI_BASE_URL || "http://localhost:8000";
  const OPTIMIZE_URL = `${AI_BASE_URL}/api/v1/optimize`;

  const controlWrapperClass = "form-control space-y-2";
  const labelClass = "label-text text-xs font-semibold tracking-wide text-base-content/60";
  const inputClass =
    "input input-bordered w-full rounded-xl border-base-200 bg-base-200/70 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/40 transition-shadow";
  const selectClass =
    "select select-bordered w-full rounded-xl border-base-200 bg-base-200/70 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/40 transition-shadow";
  const fileInputClass =
    "file-input file-input-bordered w-full rounded-xl border-base-200 bg-base-200/70 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/40 transition-shadow";
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

  useEffect(() => {
    const savedResponse = localStorage.getItem("sourceOptimizationResponse");
    if (!savedResponse) return;

    const parsed = JSON.parse(savedResponse);
    setResponse(parsed);
    if (parsed.chart_data) {
      setChartData(parsed.chart_data);
    }
    if (parsed.plot_base64) {
      setPlotUrl(`data:image/png;base64,${parsed.plot_base64}`);
    }
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
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
        uploadedFile: file as any
      }));
    }
  };

  const handleSubmit = async () => {
    // Basic client-side validation for common inputs
    const validResolutions = [15, 30, 60];
    if (!validResolutions.includes(Number(formData.time_resolution_minutes))) {
      setError("Time resolution must be 15, 30, or 60 minutes");
      setOpen(true);
      return;
    }
    if (formData.num_days < 1 || formData.num_days > 30) {
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
      if ((formData as any).uploadedFile) {
        formDataToSend.append('file', (formData as any).uploadedFile);
      }
      
      // Add all form parameters
      Object.keys(formData).forEach((key) => {
        if (key !== "uploadedFile") {
          formDataToSend.append(key, String((formData as any)[key]));
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
        setChartData(res.data.chart_data || []);
        if (res.data.plot_base64) {
          setPlotUrl(`data:image/png;base64,${res.data.plot_base64}`);
        } else {
          setPlotUrl(null);
        }
        localStorage.setItem(
          "sourceOptimizationResponse",
          JSON.stringify(res.data)
        );
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
  const displayWeather = summary?.Weather ?? formData.weather;
  const displayProfile = summary?.Notes?.Profile_Type ?? formData.profile_type;
  const displayResolution = summary?.Resolution_min ?? formData.time_resolution_minutes;
  const displayDays = summary?.Optimization_Period_days ?? formData.num_days;

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
        value: formatCurrency(summary.Costs?.TOTAL_COST_INR),
        subtext: costPerKwh ? `${formatCurrency(costPerKwh)} per kWh` : "Includes grid, diesel & storage costs",
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
        value: formatKWh(summary.Grid?.Import_kWh),
        subtext: summary.Grid?.Energy_Cost_INR != null ? `${formatCurrency(summary.Grid?.Energy_Cost_INR)}` : "Includes peak tariff impact",
        accent: "from-sky-500 to-blue-500",
        icon: Gauge,
      },
      {
        title: "Battery Cycling",
        value: `${formatKWh(summary.Battery?.Charged_kWh)} / ${formatKWh(summary.Battery?.Discharged_kWh)}`,
        subtext: `${formatNumber(summary.Battery?.Capacity_kWh)} kWh • ${formatNumber(summary.Battery?.Voltage_V, 0)} V`,
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
              <p className="text-[0.65rem] font-semibold uppercase tracking-[0.45em] text-primary/70">
                Configure Scenario
              </p>
              <h2 className="mt-2 text-2xl font-semibold text-base-content md:text-3xl">
                Optimization Configuration
              </h2>
              <p className="mt-3 max-w-2xl text-sm text-base-content/70 md:text-[0.95rem]">
                Update capacities, tariffs, and operational constraints or upload a dispatch-ready CSV.
                These inputs steer the optimizer to rebuild the hybrid energy strategy for your facility.
              </p>
            </div>
            <div className="grid gap-2 text-right md:text-left">
              <span className="text-xs font-semibold uppercase tracking-wide text-base-content/50">
                Last Prepared Scenario
              </span>
              <span className="text-base font-semibold text-base-content capitalize">
                {displayDays} day{displayDays > 1 ? "s" : ""} • {displayResolution}-minute resolution
              </span>
              <span className="text-sm text-base-content/60">
                Weather: <span className="capitalize">{displayWeather}</span> · Profile: <span className="capitalize">{displayProfile}</span>
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {/* Basic Parameters */}
            <div className={sectionPanelClass}>
              <h3 className="text-lg font-semibold">Basic parameters</h3>
              
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

            {/* System Configuration */}
            <div className={sectionPanelClass}>
              <h3 className="text-lg font-semibold">System configuration</h3>
              <div className="flex flex-col gap-4">
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
                    <span className={labelClass}>Battery Capacity (Wh)</span>
                  </label>
                  <input
                    type="number"
                    name="battery_capacity"
                    value={formData.battery_capacity}
                    onChange={handleInputChange}
                    className={inputClass}
                    step="1000"
                  />
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
                  />
                </div>

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
          </div>

          {/* Cost parameters */}
          <div className={sectionPanelClass}>
            <h3 className="text-lg font-semibold mb-4">Cost parameters</h3>
            <div className="flex flex-col gap-4">
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
                  <span className={labelClass}>Load Curtail Cost (Rs/kWh)</span>
                </label>
                <input
                  type="number"
                  name="load_curtail_cost"
                  value={formData.load_curtail_cost}
                  onChange={handleInputChange}
                  className={inputClass}
                  step="0.1"
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

          {/* File Upload */}
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
                <span className="label-text-alt">CSV/XLSX should have 'Load', 'Price', and optional 'Solar/PV' columns</span>
              </label>
            </div>
          </div>

          {/* Objective Selection */}
          <div className={sectionPanelClass}>
            <h3 className="text-lg font-semibold mb-4">Objective</h3>
            <div className="flex flex-col gap-4">
              <div className={controlWrapperClass}>
                <label className="label">
                  <span className={labelClass}>Optimization Objective</span>
                </label>
                <select
                  name="objective_type"
                  value={(formData as any).objective_type}
                  onChange={handleInputChange}
                  className={selectClass}
                >
                  <option value="cost">Minimize Cost</option>
                  <option value="co2">Minimize CO2 Emissions</option>
                </select>
              </div>
              
            </div>
          </div>

          <div className="flex justify-center pt-4">
            <button
              onClick={handleSubmit}
              className="btn h-12 min-h-12 rounded-2xl border-none bg-gradient-to-r from-sky-600 via-indigo-600 to-purple-600 px-10 text-base font-semibold text-white shadow-lg shadow-indigo-300/40 transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-70"
              disabled={loading}
            >
              {loading ? "Optimizing..." : "Run Optimization"}
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

          {/* Energy Mix Visualization */}
          {chartData.length > 0 && (
            <div className="card overflow-hidden rounded-3xl border border-base-200/70 bg-base-100/95 shadow-xl shadow-sky-100/30">
              <div className="space-y-4 p-6 md:p-8">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[0.6rem] font-semibold uppercase tracking-[0.4em] text-sky-500/80">
                      Dispatch Detail
                    </p>
                    <h3 className="mt-2 text-xl font-semibold text-base-content md:text-2xl">
                      Energy Mix Over Time
                    </h3>
                  </div>
                  <span className="rounded-full border border-sky-400/30 bg-sky-50 px-4 py-1 text-xs font-semibold text-sky-600">
                    {chartData.length} intervals
                  </span>
                </div>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis
                        dataKey="timestamp"
                        tickFormatter={(value) =>
                          new Date(value).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                        }
                        minTickGap={30}
                      />
                      <YAxis />
                      <Tooltip
                        formatter={(value: any, name) => [
                          `${value} kWh`,
                          String(name).replace(/_/g, " "),
                        ]}
                        labelFormatter={(label) =>
                          new Date(label).toLocaleString([], {
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                        }
                      />
                      <Legend />
                      <Area
                        type="monotone"
                        dataKey="load_kwh"
                        name="Load"
                        stackId="1"
                        stroke="#2563eb"
                        fill="#2563eb22"
                      />
                      <Area
                        type="monotone"
                        dataKey="solar_kwh"
                        name="Solar"
                        stackId="1"
                        stroke="#f59e0b"
                        fill="#f59e0b33"
                      />
                      <Area
                        type="monotone"
                        dataKey="grid_kwh"
                        name="Grid"
                        stackId="1"
                        stroke="#10b981"
                        fill="#10b98133"
                      />
                      <Area
                        type="monotone"
                        dataKey="battery_discharge_kwh"
                        name="Battery Discharge"
                        stackId="1"
                        stroke="#8b5cf6"
                        fill="#8b5cf633"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
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
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
                {keyMetrics.map((metric) => (
                  <div
                    key={metric.title}
                    className={`rounded-2xl bg-gradient-to-br ${metric.accent} p-5 shadow-lg ring-1 ring-white/20`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-white/70">
                          {metric.title}
                        </p>
                        <p className="mt-3 text-2xl font-semibold text-white md:text-3xl">
                          {metric.value}
                        </p>
                        <p className="mt-2 text-sm text-white/80">{metric.subtext}</p>
                      </div>
                      <metric.icon className="h-8 w-8 shrink-0 text-white/85" />
                    </div>
                  </div>
                ))}
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
                      Cost per kWh served: ₹
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


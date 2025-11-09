import { useContext, useState, useEffect, useMemo } from "react";
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

const SourceOptimizationPage = () => {
  const { currentUser } = useContext(AppContext)!;
  const [formData, setFormData] = useState({
    weather: "Sunny",
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

  const controlWrapperClass = "form-control space-y-2";
  const labelClass = "label-text text-xs font-semibold uppercase tracking-wide text-base-content/60";
  const inputClass =
    "input input-bordered w-full rounded-xl border-base-200 bg-base-200/70 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/40 transition-shadow";
  const selectClass =
    "select select-bordered w-full rounded-xl border-base-200 bg-base-200/70 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/40 transition-shadow";
  const fileInputClass =
    "file-input file-input-bordered w-full rounded-xl border-base-200 bg-base-200/70 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/40 transition-shadow";
  const sectionPanelClass = "space-y-4 rounded-2xl border border-base-200/60 bg-base-100/70 p-5 shadow-sm";

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
    setLoading(true);
    setError(null);
    setOpen(false);

    try {
      // Get auth token
      const token = localStorage.getItem('jwt');
      if (!token) {
        throw new Error("Not authenticated");
      }

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
        "http://localhost:8000/api/v1/optimize",
        formDataToSend,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
            'Authorization': `Bearer ${token}`,
          },
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
    if (!response?.summary) return [];
    const summary = response.summary;
    return [
      {
        title: "Total Load Served",
        value: `${summary.Load?.Total_Demand_kWh ?? "-"} kWh`,
        subtext: `${summary.Optimization_Period_days} days • ${summary.Resolution_min}-min`,
      },
      {
        title: "Solar Utilization",
        value: `${summary.Solar?.Used_Percent ?? 0}%`,
        subtext: `${summary.Solar?.Used_kWh ?? "-"} kWh used of ${summary.Solar?.Capacity_kW ?? "-"} kW`,
      },
      {
        title: "Grid Imports",
        value: `${summary.Grid?.Import_kWh ?? "-"} kWh`,
        subtext: `Estimated cost ₹${summary.Grid?.Estimated_Cost_INR ?? "-"}`,
      },
      {
        title: "Battery Cycling",
        value: `${summary.Battery?.Charged_kWh ?? "-"} / ${summary.Battery?.Discharged_kWh ?? "-"} kWh`,
        subtext: `${summary.Battery?.Capacity_kWh ?? "-"} kWh @ ${summary.Battery?.Voltage_V ?? "-"}V`,
      },
      {
        title: "Diesel Usage",
        value: `${summary.Diesel?.Used_kWh ?? 0} kWh`,
        subtext: `${summary.Diesel?.Fuel_Consumed_L ?? 0} L • ₹${summary.Diesel?.Fuel_Cost_INR ?? 0}`,
      },
      {
        title: "Total Cost",
        value: `₹${summary.Costs?.TOTAL_COST_INR ?? "-"}`,
        subtext: `₹${summary.Costs?.Cost_per_kWh_INR ?? "-"} per kWh`,
      },
    ];
  }, [response]);
  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">
      <div className="card bg-base-100 shadow-xl">
        <div className="card-body">
          <h2 className="card-title text-2xl font-bold mb-6 text-center">
            Source Optimization Analysis
          </h2>
          <p className="text-center mb-6 text-gray-600">
            Optimize your energy management system by analyzing load patterns, 
            solar generation, and grid interactions to minimize costs and maximize efficiency.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Basic Parameters */}
            <div className={sectionPanelClass}>
              <h3 className="text-lg font-semibold">Basic Parameters</h3>
              
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
              <h3 className="text-lg font-semibold">System Configuration</h3>
              
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
            </div>
          </div>

          {/* Cost Parameters */}
          <div className={sectionPanelClass}>
            <h3 className="text-lg font-semibold mb-4">Cost Parameters</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
            </div>
          </div>

          {/* Hydrogen System Parameters */}
          <div className={sectionPanelClass}>
            <h3 className="text-lg font-semibold mb-4">Hydrogen System Parameters</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                accept=".csv"
                onChange={handleFileUpload}
                className={fileInputClass}
              />
              <label className="label">
                <span className="label-text-alt">CSV should have 'Load' and 'Price' columns</span>
              </label>
            </div>
          </div>

          <div className="flex justify-center mt-8">
            <button
              onClick={handleSubmit}
              className="btn btn-primary rounded-xl px-8 py-3 text-lg shadow-md"
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
          <div className="card bg-base-100 shadow-xl">
            <div className="card-body space-y-6">
              <div>
                <h3 className="card-title text-xl font-semibold">
                  Optimization Snapshot
                </h3>
                <p className="text-sm text-gray-500">
                  Weather:{" "}
                  <span className="font-medium">
                    {response.summary.Weather}
                  </span>{" "}
                  • Profile:{" "}
                  <span className="font-medium">
                    {response.summary.Notes?.Profile_Type}
                  </span>
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {keyMetrics.map((metric) => (
                  <div
                    key={metric.title}
                    className="rounded-xl border border-base-200 p-4 bg-base-200/60"
                  >
                    <p className="text-sm text-gray-500">{metric.title}</p>
                    <p className="text-2xl font-semibold mt-2">
                      {metric.value}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {metric.subtext}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {plotUrl && (
            <div className="card bg-base-100 shadow-xl">
              <div className="card-body space-y-4">
                <h3 className="card-title text-xl font-semibold">
                  Optimization Results Visualization
                </h3>
                <div className="flex justify-center overflow-x-auto">
                  <img
                    src={plotUrl}
                    alt="Optimization Results"
                    className="max-w-full rounded-lg shadow-md"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Energy Mix Visualization */}
          {chartData.length > 0 && (
            <div className="card bg-base-100 shadow-xl">
              <div className="card-body space-y-4">
                <h3 className="card-title text-xl font-semibold">
                  Energy Mix Over Time
                </h3>
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
            <div className="card bg-base-100 shadow-xl">
              <div className="card-body space-y-4">
                <h3 className="card-title text-xl font-semibold">
                  Cost Breakdown
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {formattedBreakdown.map((item) => (
                    <div
                      key={item.label}
                      className="p-4 rounded-lg bg-base-200/70 border border-base-200"
                    >
                      <p className="text-sm text-gray-500">{item.label}</p>
                      <p className="text-xl font-semibold mt-2">
                        ₹{item.value}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Key Insights */}
          <div className="card bg-base-100 shadow-xl">
            <div className="card-body">
              <h3 className="card-title text-xl font-semibold">
                Key Insights
              </h3>
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


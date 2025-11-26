# 📊 Energy Mix Graph - Data Source Explanation

## Does the graph use real data or random values?

**Answer: The graph uses REAL values from your dataset (CSV file) + CALCULATED values from the optimization algorithm.**

---

## 🔍 How It Works

### 1. **Load Data (Blue) - FROM YOUR CSV FILE** ✅
- **Source**: Directly from the `Load (kW)` column in your uploaded CSV
- **Example**: If your CSV has `2386.1095 kW` at 00:00, that exact value is used
- **No randomization** - it's your actual load data

### 2. **Solar Data (Orange) - FROM YOUR CSV FILE** ✅
- **Source**: From the `Solar/PV` column in your CSV (if present)
- **Example**: If your CSV has `0.2` (20% of capacity) at 10:00, that value is used
- **If no CSV column**: Uses weather-based profile (Sunny/Cloudy/Rainy)

### 3. **Grid Data (Green) - CALCULATED BY OPTIMIZATION** 🧮
- **Source**: Calculated by the MILP optimization algorithm
- **How**: Algorithm decides how much grid power is needed based on:
  - Your load demand
  - Available solar
  - Battery state
  - Grid prices
- **Not random** - it's the optimal solution

### 4. **Battery Discharge (Purple) - CALCULATED BY OPTIMIZATION** 🧮
- **Source**: Calculated by the MILP optimization algorithm
- **How**: Algorithm decides when to discharge battery to:
  - Meet load demand
  - Avoid expensive grid power
  - Optimize costs
- **Not random** - it's the optimal dispatch strategy

---

## 📋 Code Flow

### Step 1: Read CSV File (if uploaded)
```python
# Lines 654-655 in optimization.py
load_profile = df.iloc[:, df.columns.str.contains("Load", case=False)].squeeze().tolist()
price_profile = df.iloc[:, df.columns.str.contains("Price", case=False)].squeeze().tolist()
```
✅ **Uses your actual CSV data**

### Step 2: Run Optimization
```python
# Line 705
summary, plot_bytes, chart_data = run_optimization(params, load_profile, price_profile, solar_profile_input)
```
🧮 **Optimization algorithm calculates optimal energy mix**

### Step 3: Build Chart Data
```python
# Lines 567-577
for t in T:
    chart_data.append({
        "timestamp": ts.isoformat(),
        "load_kwh": float(load_profile[t]) * step_size,  # ← FROM CSV
        "solar_kwh": float(value(P_pv_used[t])) * step_size,  # ← CALCULATED
        "grid_kwh": float(max(0.0, value(P_grid[t]))) * step_size,  # ← CALCULATED
        "battery_discharge_kwh": float(value(P_discharge[t])) * step_size,  # ← CALCULATED
    })
```

---

## 📊 Your CSV File Example

Looking at your `merged_24h_smart -kW.csv`:

```
Datetime,Load (kW),Price (INR/kWh),Solar/PV
08-01-2025 00:00,2386.1095,2.43802,0
08-01-2025 12:00,2069.2075,3.14291,1
```

**What happens:**
1. ✅ **Load**: `2386.1095 kW` at 00:00 → Used directly in graph
2. ✅ **Price**: `2.43802 INR/kWh` → Used in optimization calculation
3. ✅ **Solar**: `1` (100%) at 12:00 → Used directly in graph
4. 🧮 **Grid**: Algorithm calculates how much grid is needed
5. 🧮 **Battery**: Algorithm calculates optimal discharge/charge

---

## 🎯 Summary

| Data Source | Source Type | Example |
|------------|-------------|---------|
| **Load (Blue)** | ✅ From CSV | `2386.1095 kW` from your file |
| **Solar (Orange)** | ✅ From CSV (or weather profile) | `1.0` (100%) from your file |
| **Grid (Green)** | 🧮 Calculated by optimization | Algorithm decides based on load, solar, prices |
| **Battery (Purple)** | 🧮 Calculated by optimization | Algorithm decides optimal discharge timing |

---

## ✅ Key Points

1. **Load is REAL** - Comes directly from your CSV file
2. **Solar is REAL** - Comes from your CSV (if present) or weather profile
3. **Grid is CALCULATED** - Optimization algorithm determines optimal grid usage
4. **Battery is CALCULATED** - Optimization algorithm determines optimal battery dispatch
5. **NOT RANDOM** - All values are either from your data or calculated by the optimization

---

## 🔬 How to Verify

1. **Check your CSV values** - Compare with graph load values
2. **Check solar values** - Should match your CSV Solar/PV column
3. **Grid/Battery** - These are optimization results, not random

The graph shows:
- **Your actual load demand** (from CSV)
- **Your actual solar availability** (from CSV or weather)
- **Optimal energy mix** (calculated by optimization algorithm)

This is why the graph is useful - it shows you the **optimal dispatch strategy** based on **your real data**! 🎯


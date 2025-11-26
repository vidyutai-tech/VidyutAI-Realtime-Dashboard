# 📊 Energy Mix Over Time Graph - Explanation

## What is "Energy Mix Over Time"?

The **"Energy Mix Over Time"** graph in the Source Optimization page shows **how different energy sources are used to meet your load demand over time** during the optimization period.

---

## 🎯 What It Shows

This is a **stacked area chart** that visualizes the **dispatch strategy** - meaning how the optimization algorithm decides to use each energy source at each time interval.

### The 4 Energy Sources Displayed:

1. **🔵 Load (Blue)** - Your energy demand/consumption
   - This is the **base layer** - it shows how much energy you need
   - All other sources stack on top to meet this demand

2. **🟠 Solar (Orange)** - Solar PV generation
   - Shows how much solar energy is being used
   - When solar is high, you're using more renewable energy
   - When solar is low (night/cloudy), you rely more on other sources

3. **🟢 Grid (Green)** - Grid electricity imports
   - Shows when you're buying electricity from the grid
   - Typically used when solar + battery can't meet demand
   - Or when grid prices are low (smart charging)

4. **🟣 Battery Discharge (Purple)** - Battery energy discharge
   - Shows when the battery is discharging to power your load
   - Used during peak hours or when solar is unavailable
   - Helps reduce grid dependency

---

## ⏱️ What Does "24 Intervals" Mean?

**"24 intervals"** refers to the **number of time periods** in your optimization:

- **Interval = One time period** based on your resolution setting
- If you set **30-minute resolution**:
  - 24 intervals = 12 hours of data
  - 48 intervals = 24 hours (1 day)
  - 96 intervals = 48 hours (2 days)

### Example:
- **Time Resolution**: 30 minutes
- **Optimization Period**: 2 days
- **Total Intervals**: 2 days × 48 intervals/day = **96 intervals**

The graph shows all intervals, so you can see the **complete dispatch strategy** over your optimization period.

---

## 📈 How to Read the Graph

### Stacked Areas:
- The **total height** at any point = Total energy needed (Load)
- Each **colored layer** = Energy from that source
- **Stacked together** = They add up to meet the load

### Example Reading:
At **10:00 AM**:
- **Load**: 100 kWh (total height)
- **Solar**: 60 kWh (orange layer)
- **Battery**: 30 kWh (purple layer)
- **Grid**: 10 kWh (green layer)
- **Total**: 60 + 30 + 10 = 100 kWh ✅

This means:
- Solar is providing 60% of your energy
- Battery is discharging 30 kWh
- Grid is only needed for 10 kWh
- **Smart optimization!** 🎯

---

## 💡 What This Graph Tells You

### 1. **Renewable Utilization**
- **More orange (Solar)** = Better renewable energy usage
- **Less green (Grid)** = Lower grid dependency

### 2. **Battery Strategy**
- **Purple during peak hours** = Battery is being used to avoid expensive grid power
- **No purple during low-price hours** = Battery is being charged instead

### 3. **Cost Optimization**
- **Less green during peak tariff** = Saving money by avoiding expensive grid power
- **More green during low tariff** = Buying cheap grid power to charge battery

### 4. **Energy Independence**
- **High orange + purple, low green** = More self-sufficient
- **High green** = More dependent on grid

---

## 🔍 Key Insights to Look For

### ✅ Good Patterns:
- **Daytime**: High orange (solar) + low green (grid) = Good solar utilization
- **Peak Hours**: Purple (battery) instead of green (grid) = Smart peak shaving
- **Night**: Purple (battery) + minimal green (grid) = Good battery management

### ⚠️ Areas to Improve:
- **High green during peak hours** = Missing cost savings opportunity
- **Low orange during sunny hours** = Solar not being fully utilized
- **No purple when needed** = Battery not being used optimally

---

## 📊 Example Scenarios

### Scenario 1: Sunny Day (Good Optimization)
```
Morning (6 AM):  Low load, Solar starting, Battery charging
Noon (12 PM):   High solar, Low grid, Battery charging
Evening (6 PM):  Solar low, Battery discharging, Minimal grid
Night (10 PM):   Battery discharging, Some grid backup
```
**Result**: High renewable usage, low grid dependency ✅

### Scenario 2: Cloudy Day
```
All Day:         Low solar, More grid, Battery used strategically
Peak Hours:       Battery discharge to reduce grid costs
```
**Result**: Optimization still minimizes costs despite low solar ✅

---

## 🎯 Summary

**"Energy Mix Over Time"** = **"How your energy sources work together over time"**

- **24 intervals** = 24 time periods in your optimization
- **Stacked areas** = Each source's contribution to meeting load
- **Smart dispatch** = Optimization algorithm choosing the best mix at each moment

This graph helps you **understand and verify** that the optimization is working correctly and making smart decisions about when to use each energy source! 🚀


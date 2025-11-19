# Optimization Code Comparison: Notebook vs optimization.py

## Key Differences Found

### 1. CO2 Emission Factors ⚠️ **CRITICAL DIFFERENCE**

**Notebook (line 48):**
```python
co2_diesel = 0.9  # kg CO2 / kWh
```

**optimization.py (line 259):**
```python
"diesel": 0.787,  # kg/kwh
```

**Impact:** This will cause different CO2 optimization results. The notebook uses 0.9, but optimization.py uses 0.787.

**Other CO2 factors match:**
- Grid: 0.716 ✓
- Battery: 0.029 ✓
- Solar: 0.046 ✓
- Fuel Cell: 0.001 ✓
- Electrolyzer: 0.0 ✓
- Load curtailment penalty: 5.0 ✓

### 2. Cost Objective Function ✓ **CORRECT IN optimization.py**

**Notebook (line 272):**
```python
step_size * price_profile[t] * P_grid[t]  # Uses P_grid (includes exports)
```

**optimization.py (line 288):**
```python
step_size * price_profile[t] * P_grid_import[t]  # Uses P_grid_import (only imports)
```

**Status:** ✅ optimization.py is CORRECT. The notebook incorrectly treats grid exports as negative cost (revenue), but optimization.py correctly only counts imports as cost.

### 3. Battery Capacity Calculation ✓ **EQUIVALENT**

**Notebook (line 107):**
```python
battery_storage_energy = (battery_capacity * battery_voltage) / 1000
# battery_capacity is in Ah
```

**optimization.py (line 139):**
```python
battery_storage_energy = battery_capacity_wh / 1000.0
# battery_capacity_wh = battery_capacity_ah * battery_voltage (line 78)
```

**Status:** ✅ These are equivalent. The notebook receives Ah, optimization.py receives Wh and converts to Ah internally.

### 4. Electrolyzer Efficiency Calculation ⚠️ **MINOR DIFFERENCE**

**Notebook (line 151):**
```python
H2_at_break1 = (P_break1 * 1 * eff_at_break1) / H2_LHV  # Has redundant * 1
```

**optimization.py (line 162):**
```python
H2_at_break1 = (P_break1 * eff_at_break1) / H2_LHV  # No redundant multiplication
```

**Status:** ⚠️ The notebook has a redundant `* 1` which doesn't affect results but is unnecessary. optimization.py is cleaner.

### 5. Fuel Cost in Objective ✓ **MATCHES**

Both use: `step_size * fuel_price * F_diesel[t]` ✓

### 6. Grid Cost Calculation ⚠️ **DIFFERENCE IN POST-PROCESSING**

**Notebook (line 529):**
```python
grid_cost = sum(results_df['Grid_Power'].iloc[t] * results_df['Price'].iloc[t] * step_size 
                for t in range(time_horizon))
# Uses Grid_Power (can be negative for exports)
```

**optimization.py (line 381):**
```python
grid_cost = sum(max(0.0, results['Grid_Power'][t]) * price_profile[t] * step_size 
                for t in range(time_horizon))
# Uses max(0.0, ...) to only count positive (imports)
```

**Status:** ⚠️ The notebook's post-processing calculation would incorrectly count exports as negative cost. optimization.py correctly only counts imports.

### 7. Constraint Formulations ✓ **MATCH**

All constraints match between notebook and optimization.py:
- Power balance ✓
- Load curtailment limit ✓
- PV balance ✓
- Diesel min/max power ✓
- Battery dynamics ✓
- Hydrogen dynamics ✓
- Grid import definition ✓

### 8. Battery Discharge Efficiency Calculation ✓ **MATCH**

Both use: `P_discharge[t] * (1.0 / bess_discharge_efficiency)` ✓

## Summary of Issues to Fix

1. **CRITICAL:** Update diesel CO2 emission factor from 0.787 to 0.9 to match notebook
2. **MINOR:** Grid cost post-processing in optimization.py is actually correct (uses max(0, ...)), but notebook's calculation would be wrong if used
3. **MINOR:** Notebook has redundant `* 1` in electrolyzer calculation (doesn't affect results)

## Recommendations

1. Update `co2_kg_per_kwh["diesel"]` to 0.9 in optimization.py
2. Keep the cost objective function as-is (using P_grid_import) - it's correct
3. Keep grid cost post-processing as-is (using max(0, ...)) - it's correct


const express = require('express');
const router = express.Router();

/**
 * Technical Sizing Calculation
 * Based on total daily consumption, calculates system sizing
 * Similar to CaseStudy1 solar-battery-calculation
 */
router.post('/technical-sizing', (req, res) => {
  try {
    const { total_energy_consumption_kwh, use_case = 'commercial', include_hydrogen = false } = req.body;

    if (!total_energy_consumption_kwh || total_energy_consumption_kwh <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Invalid total_energy_consumption_kwh. Must be > 0'
      });
    }

    // Peak to Average ratio based on use case
    const peakToAvgRatio = {
      residential: 2.5,  // High peak during evening
      commercial: 1.8,   // Moderate peak during business hours
      industrial: 1.3,   // More consistent load
    }[use_case] || 1.8;

    // Calculate system sizing
    const dailyConsumption = parseFloat(total_energy_consumption_kwh);
    const averagePower = dailyConsumption / 24; // kW
    const peakPower = averagePower * peakToAvgRatio; // kW

    // Solar sizing: 1.5x peak power for adequate generation
    const solarCapacity = peakPower * 1.5;

    // Battery sizing: 5 hours of average load (for night/backup)
    const batteryCapacity = averagePower * 5;

    // Inverter sizing: 1.25x peak power (safety margin)
    const inverterCapacity = peakPower * 1.25;

    // Grid connection: Same as peak power
    const gridConnection = peakPower;

    // Diesel backup: 1.1x peak power
    const dieselCapacity = peakPower * 1.1;

    // Hydrogen system (if requested)
    let hydrogenSystem = null;
    if (include_hydrogen) {
      hydrogenSystem = {
        electrolyzer_capacity_kw: solarCapacity * 0.2, // 20% of solar for hydrogen production
        fuel_cell_capacity_kw: peakPower * 0.5, // 50% of peak for long-duration backup
        h2_tank_capacity_kg: batteryCapacity / 33.3, // 1 kg H2 ≈ 33.3 kWh
      };
    }

    // Economic analysis
    const solarCostPerKW = 40000; // Rs/kW
    const batteryCostPerKWh = 8000; // Rs/kWh
    const inverterCostPerKW = 8000; // Rs/kW
    const dcConverterCostPerKW = 1500; // Rs/kW
    const installationPercent = 0.10; // 10% of equipment cost

    const solarCost = solarCapacity * solarCostPerKW;
    const batteryCost = batteryCapacity * batteryCostPerKWh;
    const inverterCost = inverterCapacity * inverterCostPerKW;
    const dcConverterCost = solarCapacity * dcConverterCostPerKW;

    const equipmentCost = solarCost + batteryCost + inverterCost + dcConverterCost;
    const installationCost = equipmentCost * installationPercent;
    const totalCapex = equipmentCost + installationCost;

    // Add hydrogen costs if applicable
    let hydrogenCapex = 0;
    if (include_hydrogen && hydrogenSystem) {
      const electrolyzerCostPerKW = 50000; // Rs/kW
      const fuelCellCostPerKW = 60000; // Rs/kW
      const h2TankCostPerKg = 5000; // Rs/kg

      hydrogenCapex = 
        (hydrogenSystem.electrolyzer_capacity_kw * electrolyzerCostPerKW) +
        (hydrogenSystem.fuel_cell_capacity_kw * fuelCellCostPerKW) +
        (hydrogenSystem.h2_tank_capacity_kg * h2TankCostPerKg);
      
      totalCapex += hydrogenCapex;
    }

    // OPEX: O&M costs
    const annualOMPercent = 0.03; // 3% of equipment cost per year
    const annualOM = (solarCost + batteryCost) * annualOMPercent;
    const monthlyOM = annualOM / 12;

    // Savings calculation (vs grid-only)
    const gridTariff = 8.5; // Rs/kWh average
    const solarLCOE = 2.85; // Rs/kWh for solar
    const monthlyCost = dailyConsumption * 30 * solarLCOE;
    const monthlyGridCost = dailyConsumption * 30 * gridTariff;
    const monthlySavings = monthlyGridCost - monthlyCost - monthlyOM;
    const annualSavings = monthlySavings * 12;

    // Payback period
    const paybackPeriodYears = totalCapex / annualSavings;

    // Carbon emissions
    const gridEmissionFactor = 0.82; // kg CO2 per kWh
    const solarEmissionFactor = 0.05; // kg CO2 per kWh (lifecycle)
    const annualConsumption = dailyConsumption * 365;
    const annualGridEmissions = annualConsumption * gridEmissionFactor;
    const annualSolarEmissions = annualConsumption * solarEmissionFactor;
    const annualCO2Reduction = annualGridEmissions - annualSolarEmissions;
    const carbonOffsetPercent = (annualCO2Reduction / annualGridEmissions) * 100;
    const lifetimeCO2Reduction = (annualCO2Reduction * 25) / 1000; // tonnes over 25 years

    const technicalAnalysis = {
      solar_capacity_kw: solarCapacity,
      battery_capacity_kwh: batteryCapacity,
      inverter_capacity_kw: inverterCapacity,
      grid_connection_kw: gridConnection,
      diesel_capacity_kw: dieselCapacity,
      dc_converter_capacity_kw: solarCapacity,
      battery_voltage_v: use_case === 'residential' ? 48 : use_case === 'commercial' ? 96 : 480,
      daily_consumption_kwh: dailyConsumption,
      peak_power_kw: peakPower,
      average_power_kw: averagePower,
      hydrogen_system: hydrogenSystem,
      recommendations: [
        `Solar capacity ${solarCapacity.toFixed(2)} kW can generate ${(solarCapacity * 5).toFixed(2)} kWh/day (5 sun-hours)`,
        `Battery ${batteryCapacity.toFixed(2)} kWh provides ${(batteryCapacity / averagePower).toFixed(1)} hours of backup`,
        `Inverter ${inverterCapacity.toFixed(2)} kW handles peak load with 25% safety margin`,
        hydrogenSystem ? `Hydrogen system provides long-duration backup with ${hydrogenSystem.h2_tank_capacity_kg.toFixed(2)} kg H2 storage` : null,
      ].filter(Boolean),
    };

    const economicAnalysis = {
      solar_cost_rs: solarCost,
      battery_cost_rs: batteryCost,
      inverter_cost_rs: inverterCost,
      dc_converter_cost_rs: dcConverterCost,
      installation_cost_rs: installationCost,
      hydrogen_capex_rs: hydrogenCapex,
      total_capex: totalCapex,
      annual_om_cost_rs: annualOM,
      monthly_om_cost_rs: monthlyOM,
      monthly_savings: monthlySavings,
      annual_savings: annualSavings,
      payback_period_years: paybackPeriodYears,
      cost_breakdown: {
        'Solar Panels': solarCost,
        'Battery Storage': batteryCost,
        'Inverter': inverterCost,
        'DC-DC Converter': dcConverterCost,
        'Installation (10%)': installationCost,
        ...(include_hydrogen && hydrogenCapex > 0 ? { 'Hydrogen System': hydrogenCapex } : {}),
      },
    };

    const emissionsAnalysis = {
      annual_co2_reduction_kg: annualCO2Reduction,
      carbon_offset_percentage: carbonOffsetPercent,
      lifetime_co2_reduction_tonnes: lifetimeCO2Reduction,
      grid_emission_factor_kg_per_kwh: gridEmissionFactor,
      solar_emission_factor_kg_per_kwh: solarEmissionFactor,
    };

    res.json({
      success: true,
      data: {
        technical_analysis: technicalAnalysis,
        economic_analysis: economicAnalysis,
        emissions_analysis: emissionsAnalysis,
        input: {
          daily_consumption_kwh: dailyConsumption,
          use_case,
          include_hydrogen,
        },
      },
    });
  } catch (error) {
    console.error('Technical sizing error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to calculate technical sizing',
      message: error.message,
    });
  }
});

module.exports = router;


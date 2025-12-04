// Use Case Templates for 2kW, 20kW, 200kW systems

export interface UseCaseTemplate {
  use_case: 'residential' | 'commercial' | 'industrial';
  power_level: number; // kW
  description: string;
  typical_load: string;
  system_config: {
    grid_connection: number; // kW
    solar_connection: number; // kW
    battery_capacity: number; // Wh
    battery_voltage: number; // V
    diesel_capacity: number; // kW
    electrolyzer_capacity: number; // kW
    fuel_cell_capacity: number; // kW
    h2_tank_capacity: number; // kg
    fuel_cell_efficiency_percent: number;
  };
  cost_parameters: {
    fuel_price: number; // Rs/L
    pv_energy_cost: number; // Rs/kWh
    battery_om_cost: number; // Rs/kWh
    fuel_cell_om_cost: number; // Rs/kWh
    electrolyzer_om_cost: number; // Rs/kWh
  };
  load_characteristics: {
    peak_demand: number; // kW
    average_demand: number; // kW
    load_factor: number;
    peak_hours: string;
    typical_pattern: string;
  };
  recommended_resolution: number; // minutes
  recommended_horizon: number; // days
}

export const USE_CASE_TEMPLATES: Record<string, UseCaseTemplate> = {
  residential: {
    use_case: 'residential',
    power_level: 2,
    description: 'Home energy system for residential buildings and apartments',
    typical_load: 'Lighting, fans, refrigerator, TV, AC, water pump, kitchen appliances',
    system_config: {
      grid_connection: 5,
      solar_connection: 3,
      battery_capacity: 10000, // 10 kWh
      battery_voltage: 48,
      diesel_capacity: 5,
      electrolyzer_capacity: 2,
      fuel_cell_capacity: 2,
      h2_tank_capacity: 1,
      fuel_cell_efficiency_percent: 0.60,
    },
    cost_parameters: {
      fuel_price: 95,
      pv_energy_cost: 2.85,
      battery_om_cost: 6.085,
      fuel_cell_om_cost: 1.5,
      electrolyzer_om_cost: 0.5,
    },
    load_characteristics: {
      peak_demand: 2,
      average_demand: 1.2,
      load_factor: 0.6,
      peak_hours: '18:00-22:00',
      typical_pattern: 'Morning spike (7-9 AM), Evening peak (6-10 PM), Low during work hours',
    },
    recommended_resolution: 60,
    recommended_horizon: 1,
  },
  commercial: {
    use_case: 'commercial',
    power_level: 20,
    description: 'Commercial building energy system for offices, retail, small businesses',
    typical_load: 'Office lighting, HVAC, computers, servers, printers, kitchen, elevators',
    system_config: {
      grid_connection: 50,
      solar_connection: 30,
      battery_capacity: 100000, // 100 kWh
      battery_voltage: 96,
      diesel_capacity: 50,
      electrolyzer_capacity: 20,
      fuel_cell_capacity: 20,
      h2_tank_capacity: 10,
      fuel_cell_efficiency_percent: 0.60,
    },
    cost_parameters: {
      fuel_price: 90,
      pv_energy_cost: 2.70,
      battery_om_cost: 5.50,
      fuel_cell_om_cost: 1.5,
      electrolyzer_om_cost: 0.5,
    },
    load_characteristics: {
      peak_demand: 20,
      average_demand: 12,
      load_factor: 0.6,
      peak_hours: '10:00-17:00',
      typical_pattern: 'Business hours (9-6 PM), Low nights & weekends, Consistent weekday pattern',
    },
    recommended_resolution: 30,
    recommended_horizon: 2,
  },
  industrial: {
    use_case: 'industrial',
    power_level: 200,
    description: 'Industrial facility energy system for manufacturing, heavy machinery',
    typical_load: 'Production machinery, motors, CNC, compressors, HVAC, cranes, pumps',
    system_config: {
      grid_connection: 500,
      solar_connection: 300,
      battery_capacity: 1000000, // 1000 kWh (1 MWh)
      battery_voltage: 480,
      diesel_capacity: 500,
      electrolyzer_capacity: 200,
      fuel_cell_capacity: 200,
      h2_tank_capacity: 100,
      fuel_cell_efficiency_percent: 0.60,
    },
    cost_parameters: {
      fuel_price: 85,
      pv_energy_cost: 2.50,
      battery_om_cost: 5.00,
      fuel_cell_om_cost: 1.5,
      electrolyzer_om_cost: 0.5,
    },
    load_characteristics: {
      peak_demand: 200,
      average_demand: 150,
      load_factor: 0.75,
      peak_hours: '08:00-20:00',
      typical_pattern: 'Multi-shift operation (8 AM - 8 PM), Continuous base load, High power factor',
    },
    recommended_resolution: 15,
    recommended_horizon: 7,
  },
};

export const getUseCaseTemplate = (useCase: string): UseCaseTemplate | null => {
  return USE_CASE_TEMPLATES[useCase] || null;
};

// Scaling factors relative to commercial (20kW) as base
export const SCALE_FACTORS = {
  residential: 0.1,   // 2kW / 20kW
  commercial: 1.0,    // 20kW / 20kW (reference)
  industrial: 10.0,   // 200kW / 20kW
};

export const scaleParameter = (baseValue: number, useCase: string): number => {
  const factor = SCALE_FACTORS[useCase as keyof typeof SCALE_FACTORS] || 1.0;
  return baseValue * factor;
};


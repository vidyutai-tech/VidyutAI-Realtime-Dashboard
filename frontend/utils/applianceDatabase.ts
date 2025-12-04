// Appliance Database for Different Use Cases
// Power ratings in Watts, typical usage hours per day

export interface Appliance {
  name: string;
  category: string;
  typicalRating: number; // Watts
  minRating: number;
  maxRating: number;
  typicalHours: number; // hours per day
  priority: 'critical' | 'high' | 'medium' | 'low';
}

export interface ApplianceUsage {
  appliance: string;
  rating: number; // Watts
  quantity: number;
  hoursPerDay: number;
  priority: 'critical' | 'high' | 'medium' | 'low';
  dailyConsumption: number; // Wh
}

// RESIDENTIAL (2kW system)
export const RESIDENTIAL_APPLIANCES: Appliance[] = [
  // Lighting
  { name: 'LED Bulbs (9W)', category: 'Lighting', typicalRating: 9, minRating: 5, maxRating: 15, typicalHours: 6, priority: 'high' },
  { name: 'LED Tubes (18W)', category: 'Lighting', typicalRating: 18, minRating: 10, maxRating: 25, typicalHours: 8, priority: 'high' },
  { name: 'Ceiling Fans', category: 'Cooling', typicalRating: 75, minRating: 50, maxRating: 100, typicalHours: 10, priority: 'high' },
  { name: 'Table Fans', category: 'Cooling', typicalRating: 50, minRating: 30, maxRating: 70, typicalHours: 6, priority: 'medium' },
  
  // Electronics
  { name: 'Laptop/Computer', category: 'Electronics', typicalRating: 65, minRating: 30, maxRating: 150, typicalHours: 8, priority: 'high' },
  { name: 'LED TV (32")', category: 'Entertainment', typicalRating: 60, minRating: 40, maxRating: 150, typicalHours: 5, priority: 'medium' },
  { name: 'Wi-Fi Router', category: 'Electronics', typicalRating: 10, minRating: 5, maxRating: 20, typicalHours: 24, priority: 'critical' },
  { name: 'Mobile Chargers', category: 'Electronics', typicalRating: 15, minRating: 5, maxRating: 30, typicalHours: 3, priority: 'high' },
  
  // Kitchen
  { name: 'Refrigerator (Small)', category: 'Kitchen', typicalRating: 150, minRating: 80, maxRating: 250, typicalHours: 24, priority: 'critical' },
  { name: 'Microwave Oven', category: 'Kitchen', typicalRating: 1000, minRating: 700, maxRating: 1500, typicalHours: 0.5, priority: 'medium' },
  { name: 'Induction Cooktop (1 burner)', category: 'Kitchen', typicalRating: 1200, minRating: 1000, maxRating: 2000, typicalHours: 2, priority: 'high' },
  { name: 'Electric Kettle', category: 'Kitchen', typicalRating: 1500, minRating: 1000, maxRating: 2000, typicalHours: 0.3, priority: 'low' },
  { name: 'Mixer/Blender', category: 'Kitchen', typicalRating: 500, minRating: 300, maxRating: 750, typicalHours: 0.5, priority: 'low' },
  
  // Water & Heating
  { name: 'Water Pump (0.5 HP)', category: 'Water', typicalRating: 370, minRating: 250, maxRating: 750, typicalHours: 1, priority: 'critical' },
  { name: 'Water Heater/Geyser', category: 'Heating', typicalRating: 2000, minRating: 1500, maxRating: 3000, typicalHours: 1, priority: 'medium' },
  
  // Cooling (Heavy)
  { name: 'Room AC (1 Ton)', category: 'Cooling', typicalRating: 1200, minRating: 900, maxRating: 1500, typicalHours: 8, priority: 'medium' },
  { name: 'Air Cooler', category: 'Cooling', typicalRating: 200, minRating: 150, maxRating: 300, typicalHours: 6, priority: 'low' },
  
  // Cleaning & Others
  { name: 'Washing Machine', category: 'Cleaning', typicalRating: 500, minRating: 300, maxRating: 1000, typicalHours: 1, priority: 'low' },
  { name: 'Iron', category: 'Cleaning', typicalRating: 1000, minRating: 750, maxRating: 1500, typicalHours: 0.5, priority: 'low' },
  { name: 'Vacuum Cleaner', category: 'Cleaning', typicalRating: 1000, minRating: 600, maxRating: 1500, typicalHours: 0.5, priority: 'low' },
];

// COMMERCIAL (20kW system)
export const COMMERCIAL_APPLIANCES: Appliance[] = [
  // Lighting
  { name: 'LED Panel Lights (40W)', category: 'Lighting', typicalRating: 40, minRating: 30, maxRating: 60, typicalHours: 10, priority: 'high' },
  { name: 'LED Tube Lights (18W)', category: 'Lighting', typicalRating: 18, minRating: 15, maxRating: 25, typicalHours: 10, priority: 'high' },
  { name: 'Emergency Lighting', category: 'Lighting', typicalRating: 15, minRating: 10, maxRating: 30, typicalHours: 24, priority: 'critical' },
  
  // HVAC
  { name: 'Commercial AC (3 Ton)', category: 'HVAC', typicalRating: 3600, minRating: 2700, maxRating: 4500, typicalHours: 10, priority: 'high' },
  { name: 'Exhaust Fans', category: 'HVAC', typicalRating: 100, minRating: 50, maxRating: 200, typicalHours: 12, priority: 'medium' },
  { name: 'Air Purifiers', category: 'HVAC', typicalRating: 60, minRating: 40, maxRating: 100, typicalHours: 10, priority: 'medium' },
  
  // Office Equipment
  { name: 'Desktop Computers', category: 'Office', typicalRating: 200, minRating: 150, maxRating: 400, typicalHours: 9, priority: 'high' },
  { name: 'Laptops', category: 'Office', typicalRating: 65, minRating: 45, maxRating: 100, typicalHours: 8, priority: 'high' },
  { name: 'Printers/Scanners', category: 'Office', typicalRating: 300, minRating: 200, maxRating: 500, typicalHours: 3, priority: 'medium' },
  { name: 'Network Equipment', category: 'IT', typicalRating: 500, minRating: 200, maxRating: 1000, typicalHours: 24, priority: 'critical' },
  { name: 'Server Rack', category: 'IT', typicalRating: 2000, minRating: 1000, maxRating: 5000, typicalHours: 24, priority: 'critical' },
  { name: 'Projectors', category: 'Office', typicalRating: 250, minRating: 150, maxRating: 400, typicalHours: 4, priority: 'low' },
  
  // Kitchen/Pantry
  { name: 'Commercial Refrigerator', category: 'Kitchen', typicalRating: 400, minRating: 300, maxRating: 800, typicalHours: 24, priority: 'critical' },
  { name: 'Coffee Machine', category: 'Kitchen', typicalRating: 1200, minRating: 800, maxRating: 2000, typicalHours: 8, priority: 'medium' },
  { name: 'Microwave Oven', category: 'Kitchen', typicalRating: 1200, minRating: 900, maxRating: 1800, typicalHours: 2, priority: 'low' },
  { name: 'Water Dispenser', category: 'Kitchen', typicalRating: 500, minRating: 300, maxRating: 800, typicalHours: 10, priority: 'medium' },
  
  // Security & Access
  { name: 'CCTV System', category: 'Security', typicalRating: 200, minRating: 100, maxRating: 500, typicalHours: 24, priority: 'critical' },
  { name: 'Biometric Systems', category: 'Security', typicalRating: 50, minRating: 20, maxRating: 100, typicalHours: 10, priority: 'high' },
  { name: 'Elevator (Small)', category: 'Access', typicalRating: 5000, minRating: 3000, maxRating: 8000, typicalHours: 8, priority: 'high' },
  
  // Water & Utilities
  { name: 'Water Pump (1 HP)', category: 'Water', typicalRating: 750, minRating: 500, maxRating: 1500, typicalHours: 4, priority: 'critical' },
  { name: 'Water Heater', category: 'Water', typicalRating: 3000, minRating: 2000, maxRating: 6000, typicalHours: 3, priority: 'medium' },
];

// INDUSTRIAL (200kW system)
export const INDUSTRIAL_APPLIANCES: Appliance[] = [
  // Production Machinery
  { name: 'Industrial Motors (10 HP)', category: 'Production', typicalRating: 7500, minRating: 3700, maxRating: 15000, typicalHours: 16, priority: 'critical' },
  { name: 'CNC Machines', category: 'Production', typicalRating: 15000, minRating: 10000, maxRating: 30000, typicalHours: 12, priority: 'critical' },
  { name: 'Hydraulic Press', category: 'Production', typicalRating: 20000, minRating: 15000, maxRating: 40000, typicalHours: 8, priority: 'high' },
  { name: 'Welding Equipment', category: 'Production', typicalRating: 5000, minRating: 3000, maxRating: 10000, typicalHours: 6, priority: 'high' },
  { name: 'Conveyor Belt System', category: 'Material Handling', typicalRating: 3000, minRating: 2000, maxRating: 7500, typicalHours: 16, priority: 'critical' },
  
  // HVAC & Ventilation
  { name: 'Industrial HVAC (10 Ton)', category: 'HVAC', typicalRating: 12000, minRating: 9000, maxRating: 18000, typicalHours: 16, priority: 'high' },
  { name: 'Industrial Exhaust Fans', category: 'Ventilation', typicalRating: 1500, minRating: 750, maxRating: 3000, typicalHours: 16, priority: 'high' },
  { name: 'Dust Collection System', category: 'Ventilation', typicalRating: 5000, minRating: 3000, maxRating: 10000, typicalHours: 12, priority: 'medium' },
  
  // Compressors & Pumps
  { name: 'Air Compressor (20 HP)', category: 'Compressed Air', typicalRating: 15000, minRating: 7500, maxRating: 30000, typicalHours: 16, priority: 'critical' },
  { name: 'Industrial Water Pump (5 HP)', category: 'Water', typicalRating: 3730, minRating: 2000, maxRating: 7500, typicalHours: 12, priority: 'critical' },
  { name: 'Hydraulic Pumps', category: 'Hydraulics', typicalRating: 7500, minRating: 5000, maxRating: 15000, typicalHours: 10, priority: 'high' },
  
  // Lighting
  { name: 'High Bay LED Lights (100W)', category: 'Lighting', typicalRating: 100, minRating: 60, maxRating: 150, typicalHours: 16, priority: 'high' },
  { name: 'Outdoor Lighting', category: 'Lighting', typicalRating: 50, minRating: 30, maxRating: 100, typicalHours: 12, priority: 'medium' },
  
  // Material Handling
  { name: 'Overhead Crane (5 Ton)', category: 'Material Handling', typicalRating: 15000, minRating: 10000, maxRating: 30000, typicalHours: 6, priority: 'high' },
  { name: 'Forklift Charging Station', category: 'Material Handling', typicalRating: 10000, minRating: 5000, maxRating: 20000, typicalHours: 8, priority: 'medium' },
  
  // Office & Support
  { name: 'Office Area (Computers, AC, Lights)', category: 'Office', typicalRating: 5000, minRating: 3000, maxRating: 10000, typicalHours: 9, priority: 'high' },
  { name: 'Canteen Equipment', category: 'Kitchen', typicalRating: 8000, minRating: 5000, maxRating: 15000, typicalHours: 6, priority: 'medium' },
  
  // Security & Monitoring
  { name: 'Security & CCTV', category: 'Security', typicalRating: 500, minRating: 200, maxRating: 1000, typicalHours: 24, priority: 'critical' },
  { name: 'Emergency Lighting', category: 'Safety', typicalRating: 200, minRating: 100, maxRating: 500, typicalHours: 24, priority: 'critical' },
];

export const getAppliancesForUseCase = (useCase: 'residential' | 'commercial' | 'industrial'): Appliance[] => {
  switch (useCase) {
    case 'residential':
      return RESIDENTIAL_APPLIANCES;
    case 'commercial':
      return COMMERCIAL_APPLIANCES;
    case 'industrial':
      return INDUSTRIAL_APPLIANCES;
    default:
      return RESIDENTIAL_APPLIANCES;
  }
};

export const calculateDailyConsumption = (appliances: ApplianceUsage[]): number => {
  return appliances.reduce((total, app) => {
    return total + (app.rating * app.quantity * app.hoursPerDay);
  }, 0);
};

export const calculatePeakLoad = (appliances: ApplianceUsage[]): number => {
  // Assume 70% diversity factor (not all appliances run simultaneously)
  const totalConnectedLoad = appliances.reduce((total, app) => {
    return total + (app.rating * app.quantity);
  }, 0);
  return totalConnectedLoad * 0.7 / 1000; // Convert to kW
};

export const groupByPriority = (appliances: ApplianceUsage[]) => {
  return {
    critical: appliances.filter(a => a.priority === 'critical'),
    high: appliances.filter(a => a.priority === 'high'),
    medium: appliances.filter(a => a.priority === 'medium'),
    low: appliances.filter(a => a.priority === 'low'),
  };
};


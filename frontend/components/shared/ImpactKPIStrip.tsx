import React from 'react';
import { DollarSign, Battery, Sun, Leaf, TrendingUp, TrendingDown } from 'lucide-react';

interface ImpactKPIStripProps {
  netDailySavings: number; // INR
  batteryLifeImpact: number; // percentage per day
  renewableUtilization: number; // percentage
  carbonAvoided: number; // kg CO2
}

const ImpactKPIStrip: React.FC<ImpactKPIStripProps> = ({
  netDailySavings,
  batteryLifeImpact,
  renewableUtilization,
  carbonAvoided,
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {/* Net Daily Savings */}
      <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl p-5 text-white shadow-lg">
        <div className="flex items-center justify-between mb-3">
          <DollarSign className="w-8 h-8 text-green-100" />
          <TrendingUp className="w-5 h-5 text-green-100" />
        </div>
        <div>
          <p className="text-green-100 text-sm font-medium mb-1">Net Daily Savings</p>
          <p className="text-3xl font-bold">₹{netDailySavings.toLocaleString()}</p>
          <p className="text-green-100 text-xs mt-2">vs Conventional EMS</p>
        </div>
      </div>

      {/* Battery Life Impact */}
      <div className="bg-gradient-to-br from-blue-500 to-cyan-600 rounded-xl p-5 text-white shadow-lg">
        <div className="flex items-center justify-between mb-3">
          <Battery className="w-8 h-8 text-blue-100" />
          {batteryLifeImpact < 5 ? (
            <TrendingDown className="w-5 h-5 text-blue-100" />
          ) : (
            <TrendingUp className="w-5 h-5 text-blue-100" />
          )}
        </div>
        <div>
          <p className="text-blue-100 text-sm font-medium mb-1">Battery Life Impact</p>
          <p className="text-3xl font-bold">{batteryLifeImpact.toFixed(2)}%</p>
          <p className="text-blue-100 text-xs mt-2">Cycle cost per day</p>
        </div>
      </div>

      {/* Renewable Utilization */}
      <div className="bg-gradient-to-br from-orange-500 to-amber-600 rounded-xl p-5 text-white shadow-lg">
        <div className="flex items-center justify-between mb-3">
          <Sun className="w-8 h-8 text-orange-100" />
          <TrendingUp className="w-5 h-5 text-orange-100" />
        </div>
        <div>
          <p className="text-orange-100 text-sm font-medium mb-1">Renewable Utilization</p>
          <p className="text-3xl font-bold">{renewableUtilization.toFixed(2)}%</p>
          <p className="text-orange-100 text-xs mt-2">Of available solar</p>
        </div>
      </div>

      {/* Carbon Avoided */}
      <div className="bg-gradient-to-br from-teal-500 to-green-600 rounded-xl p-5 text-white shadow-lg">
        <div className="flex items-center justify-between mb-3">
          <Leaf className="w-8 h-8 text-teal-100" />
          <TrendingDown className="w-5 h-5 text-teal-100" />
        </div>
        <div>
          <p className="text-teal-100 text-sm font-medium mb-1">Carbon Avoided</p>
          <p className="text-3xl font-bold">{carbonAvoided.toFixed(2)}</p>
          <p className="text-teal-100 text-xs mt-2">kg CO₂ per day</p>
        </div>
      </div>
    </div>
  );
};

export default ImpactKPIStrip;


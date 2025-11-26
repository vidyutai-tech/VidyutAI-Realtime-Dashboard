import React, { useState, useContext, useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import Card from '../components/ui/Card';
import { PlayCircle } from 'lucide-react';
import { AppContext } from '../contexts/AppContext';
import { convertValue, CURRENCY_SYMBOLS, USD_TO_EUR, USD_TO_INR } from '../utils/currency';

const SimulatorPage: React.FC = () => {
  const [pvCurtail, setPvCurtail] = useState(20);
  const [batteryTarget, setBatteryTarget] = useState(80);
  const [gridPrice, setGridPrice] = useState(150);
  const [simulationResult, setSimulationResult] = useState<{ cost: number[], emissions: number[] } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { theme, currency } = useContext(AppContext)!;
  const [emissionsUnit, setEmissionsUnit] = useState<'kg' | 't'>('kg');

  const gridColor = theme === 'dark' ? '#4A5568' : '#e2e8f0';
  const textColor = theme === 'dark' ? '#A0AEC0' : '#4A5568';
  
  const KG_TO_TONNES = 0.001;

  const handleRunSimulation = async () => {
    setIsLoading(true);
    setSimulationResult(null);
    try {
      const result = await import('../services/api').then(api => 
        api.runSimulation({ pvCurtail, batteryTarget, gridPrice })
      );
      setSimulationResult(result);
    } catch (error) {
      console.error("Simulation failed:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const chartData = useMemo(() => {
    if (!simulationResult) return [];

    return Array.from({ length: 24 }, (_, i) => {
        const cost = convertValue(simulationResult.cost[i], currency);
        const emissions = emissionsUnit === 't' ? simulationResult.emissions[i] * KG_TO_TONNES : simulationResult.emissions[i];
        return {
            hour: `${i}:00`,
            cost: cost,
            emissions: emissions,
        };
    });
  }, [simulationResult, currency, emissionsUnit]);


  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-1">
        <Card title="Simulation Controls">
          <div className="space-y-6">
            <div>
              <label htmlFor="pv-curtail" className="block text-sm font-medium text-gray-600 dark:text-gray-300">PV Curtailment (%)</label>
              <div className="flex items-center space-x-4">
                <input id="pv-curtail" type="range" min="0" max="100" value={pvCurtail} onChange={(e) => setPvCurtail(Number(e.target.value))} className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer" />
                <span className="font-bold w-12 text-center">{pvCurtail}%</span>
              </div>
            </div>
            <div>
              <label htmlFor="battery-target" className="block text-sm font-medium text-gray-600 dark:text-gray-300">Battery Target SoC (%)</label>
              <div className="flex items-center space-x-4">
                <input id="battery-target" type="range" min="0" max="100" value={batteryTarget} onChange={(e) => setBatteryTarget(Number(e.target.value))} className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer" />
                <span className="font-bold w-12 text-center">{batteryTarget}%</span>
              </div>
            </div>
            <div>
              <label htmlFor="grid-price" className="block text-sm font-medium text-gray-600 dark:text-gray-300">Grid Price (USD/MWh)</label>
              <div className="flex items-center space-x-4">
                <input id="grid-price" type="range" min="50" max="500" value={gridPrice} onChange={(e) => setGridPrice(Number(e.target.value))} className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer" />
                <span className="font-bold w-12 text-center">${gridPrice}</span>
              </div>
            </div>
            
            <div>
                <label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">Emissions Unit</label>
                 <div className="flex items-center p-1 rounded-full bg-gray-200 dark:bg-gray-700">
                    <button onClick={() => setEmissionsUnit('kg')} className={`w-full px-2 py-1 text-xs font-medium rounded-full transition-colors ${emissionsUnit === 'kg' ? 'bg-white dark:bg-gray-900 text-blue-600 shadow-sm' : 'text-gray-500 dark:text-gray-400'}`}>kg CO₂</button>
                    <button onClick={() => setEmissionsUnit('t')} className={`w-full px-2 py-1 text-xs font-medium rounded-full transition-colors ${emissionsUnit === 't' ? 'bg-white dark:bg-gray-900 text-blue-600 shadow-sm' : 'text-gray-500 dark:text-gray-400'}`}>Tonnes</button>
                </div>
            </div>

            <button
              onClick={handleRunSimulation}
              disabled={isLoading}
              className="w-full flex items-center justify-center px-4 py-3 bg-green-600 hover:bg-green-700 text-white rounded-md font-semibold disabled:bg-green-800"
            >
              <PlayCircle className="w-5 h-5 mr-2" />
              {isLoading ? 'Running...' : 'Run Simulation'}
            </button>
          </div>
        </Card>
      </div>
      <div className="lg:col-span-2">
        <Card title="Predicted Outcome (24h)">
          <p className="text-xs text-gray-400 dark:text-gray-500 -mt-2 mb-4">
            Note: Using conversion rates 1 USD = {USD_TO_EUR} EUR, 1 USD = {USD_TO_INR} INR, and 1 tonne = 1000 kg.
          </p>
          <div className="h-[26rem]">
            {isLoading && <div className="flex items-center justify-center h-full"><p>Running simulation...</p></div>}
            {!isLoading && !simulationResult && <div className="flex items-center justify-center h-full"><p>Adjust controls and run simulation to see results.</p></div>}
            {simulationResult && (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                  <XAxis 
                    dataKey="hour" 
                    label={{ value: 'Hour', position: 'insideBottom', offset: -5 }}
                    stroke={textColor} 
                  />
                  <YAxis 
                    yAxisId="left" 
                    stroke="#8884d8" 
                    label={{ value: `Cost (${CURRENCY_SYMBOLS[currency]})`, angle: -90, position: 'insideLeft', fill: '#8884d8' }}
                    tickFormatter={(value) => Number(value).toFixed(2)}
                  />
                  <YAxis 
                    yAxisId="right" 
                    orientation="right" 
                    stroke="#82ca9d" 
                    label={{ value: `Emissions (${emissionsUnit === 'kg' ? 'kg CO₂' : 'tonnes CO₂'})`, angle: -90, position: 'insideRight', fill: '#82ca9d' }}
                    tickFormatter={(value) => Number(value).toFixed(2)}
                  />
                  <Tooltip contentStyle={{ backgroundColor: theme === 'dark' ? '#1A202C' : '#FFFFFF', border: `1px solid ${gridColor}` }} formatter={(value: number) => value.toFixed(2)} />
                  <Legend />
                  <Line yAxisId="left" type="monotone" dataKey="cost" stroke="#8884d8" name={`Predicted Cost (${currency})`}/>
                  <Line yAxisId="right" type="monotone" dataKey="emissions" stroke="#82ca9d" name={`Predicted Emissions (${emissionsUnit.toUpperCase()})`}/>
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default SimulatorPage;
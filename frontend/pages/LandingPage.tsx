import React, { useState, useEffect } from 'react';
import { ArrowRight, Zap, Battery, Sun, Building2, Network, Fuel, CheckCircle } from 'lucide-react';

interface LandingPageProps {
  onGetStarted: () => void;
}

interface PowerFlow {
  from: string;
  to: string;
  active: boolean;
  value?: number;
}

const ComponentNode: React.FC<{ 
  icon: React.ReactNode; 
  label: string; 
  color: string;
  id: string;
}> = ({ icon, label, color, id }) => (
  <div 
    id={id}
    className={`flex flex-col items-center p-4 bg-white dark:bg-gray-800 rounded-lg shadow-lg border-2 ${color} relative z-10`}
  >
    <div className="mb-2">{icon}</div>
    <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">{label}</span>
  </div>
);

const PowerFlowLine: React.FC<{
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
  active: boolean;
  label?: string;
}> = ({ fromX, fromY, toX, toY, active, label }) => {
  const strokeColor = active ? '#ef4444' : '#9ca3af';
  const markerId = active ? 'arrowhead-red' : 'arrowhead-gray';
  
  return (
    <g>
      <line
        x1={fromX}
        y1={fromY}
        x2={toX}
        y2={toY}
        stroke={strokeColor}
        strokeWidth={active ? 3 : 2}
        strokeDasharray={active ? '0' : '5,5'}
        className={active ? 'animate-pulse' : ''}
        markerEnd={`url(#${markerId})`}
      />
      {label && (
        <text
          x={(fromX + toX) / 2}
          y={(fromY + toY) / 2 - 10}
          fill={strokeColor}
          fontSize="11"
          fontWeight="600"
          textAnchor="middle"
        >
          {label}
        </text>
      )}
    </g>
  );
};

const LandingPage: React.FC<LandingPageProps> = ({ onGetStarted }) => {
  const [mode, setMode] = useState<'grid' | 'island'>('grid');
  const [flows, setFlows] = useState<PowerFlow[]>([]);

  // Simulate power flows based on mode
  useEffect(() => {
    if (mode === 'grid') {
      // Grid Connected Mode: Multiple active flows
      setFlows([
        { from: 'renewable', to: 'ems', active: true, value: 450 },
        { from: 'battery', to: 'ems', active: true, value: 200 },
        { from: 'diesel', to: 'ems', active: false }, // Usually inactive in grid mode
        { from: 'grid', to: 'ems', active: true, value: 100 }, // Some grid import
        { from: 'ems', to: 'load', active: true, value: 600 },
        { from: 'ems', to: 'battery', active: true, value: 150 }, // Charging
        { from: 'ems', to: 'grid', active: true, value: 100 }, // Export to grid
        { from: 'renewable', to: 'grid', active: true, value: 50 }, // Direct export
      ]);
    } else {
      // Island Mode: No grid connection
      setFlows([
        { from: 'renewable', to: 'ems', active: true, value: 450 },
        { from: 'battery', to: 'ems', active: true, value: 200 },
        { from: 'diesel', to: 'ems', active: true, value: 150 }, // Active in island mode
        { from: 'ems', to: 'load', active: true, value: 600 },
        { from: 'ems', to: 'battery', active: true, value: 200 }, // Charging
        { from: 'grid', to: 'ems', active: false }, // Grid unavailable
        { from: 'ems', to: 'grid', active: false }, // No export in island
        { from: 'renewable', to: 'grid', active: false }, // No grid in island mode
      ]);
    }

    // Animate power flows - toggle some flows periodically
    const interval = setInterval(() => {
      setFlows(prev => prev.map(flow => {
        // Randomly toggle battery charge/discharge
        if (flow.from === 'ems' && flow.to === 'battery') {
          return { ...flow, active: Math.random() > 0.3 };
        }
        if (flow.from === 'battery' && flow.to === 'ems') {
          return { ...flow, active: Math.random() > 0.3 };
        }
        return flow;
      }));
    }, 3000);

    return () => clearInterval(interval);
  }, [mode]);

  // Component positions (relative to SVG viewport)
  const componentPositions = {
    renewable: { x: 150, y: 100 },
    ems: { x: 400, y: 200 },
    battery: { x: 650, y: 100 },
    grid: { x: 150, y: 350 },
    load: { x: 400, y: 350 },
    diesel: { x: 650, y: 350 },
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <header className="bg-white dark:bg-gray-900 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            {/* Logos */}
            <div className="flex items-center space-x-4">
              <img src="/Spel.png" alt="SPEL" className="h-12 w-auto" />
              <span className="text-2xl text-gray-400 dark:text-gray-600">|</span>
              <img src="/VidyutAI Logo.png" alt="VidyutAI" className="h-11 w-auto" />
            </div>
            
            {/* Get Started Button */}
            <button
              onClick={onGetStarted}
              className="flex items-center space-x-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-md transition-all hover:shadow-lg"
            >
              <span>Get Started</span>
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-extrabold text-gray-900 dark:text-white mb-4">
            Energy Management System
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
            Intelligent power flow optimization for renewable energy systems. 
            Real-time monitoring and AI-powered decision making for maximum efficiency.
          </p>
        </div>

        {/* Mode Selector */}
        <div className="flex justify-center mb-8">
          <div className="inline-flex rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 p-1">
            <button
              onClick={() => setMode('grid')}
              className={`px-6 py-2 rounded-md font-medium transition-all ${
                mode === 'grid'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              Grid Connected Mode
            </button>
            <button
              onClick={() => setMode('island')}
              className={`px-6 py-2 rounded-md font-medium transition-all ${
                mode === 'island'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              Island Mode
            </button>
          </div>
        </div>

        {/* Power Flow Visualization */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 mb-12">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 text-center">
            {mode === 'grid' ? 'Grid Connected Mode EMS' : 'Island Mode EMS'}
          </h2>
          
          <div className="flex justify-center items-start min-h-[500px]">
            <div className="relative w-full max-w-4xl">
              {/* Power Flow Legend - Positioned above the visualization */}
              <div className="flex justify-end mb-4">
                <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg shadow-md">
                  <div className="flex flex-col space-y-2 text-sm">
                    <div className="flex items-center space-x-2">
                      <div className="w-8 h-1 bg-red-500"></div>
                      <span className="text-gray-700 dark:text-gray-300">Power Flowing</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-8 h-1 bg-gray-400 border-dashed border-t-2"></div>
                      <span className="text-gray-700 dark:text-gray-300">No Power Flow</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* SVG Canvas for Power Flow Visualization */}
              <div className="relative bg-gray-50 dark:bg-gray-900 rounded-lg p-8">
                <svg 
                  viewBox="0 0 800 500" 
                  className="w-full h-auto"
                  style={{ minHeight: '500px' }}
                >
                  {/* Arrow marker definitions */}
                  <defs>
                    <marker
                      id="arrowhead-red"
                      markerWidth="10"
                      markerHeight="10"
                      refX="9"
                      refY="3"
                      orient="auto"
                    >
                      <polygon
                        points="0 0, 10 3, 0 6"
                        fill="#ef4444"
                      />
                    </marker>
                    <marker
                      id="arrowhead-gray"
                      markerWidth="10"
                      markerHeight="10"
                      refX="9"
                      refY="3"
                      orient="auto"
                    >
                      <polygon
                        points="0 0, 10 3, 0 6"
                        fill="#9ca3af"
                      />
                    </marker>
                  </defs>

                  {/* Power Flow Lines */}
                  {flows.map((flow, index) => {
                    const fromPos = componentPositions[flow.from as keyof typeof componentPositions];
                    const toPos = componentPositions[flow.to as keyof typeof componentPositions];
                    if (!fromPos || !toPos) return null;

                    return (
                      <PowerFlowLine
                        key={`${flow.from}-${flow.to}-${index}`}
                        fromX={fromPos.x}
                        fromY={fromPos.y}
                        toX={toPos.x}
                        toY={toPos.y}
                        active={flow.active}
                        label={flow.active && flow.value ? `${flow.value}kW` : undefined}
                      />
                    );
                  })}

                  {/* Component Nodes - Positioned absolutely */}
                </svg>

                {/* Component Nodes Overlay - Positioned using absolute positioning based on SVG coordinates */}
                <div className="absolute inset-0 pointer-events-none">
                  {/* Renewable */}
                  <div 
                    className="absolute transform -translate-x-1/2 -translate-y-1/2 pointer-events-auto"
                    style={{ left: `${(componentPositions.renewable.x / 800) * 100}%`, top: `${(componentPositions.renewable.y / 500) * 100}%` }}
                  >
                    <ComponentNode 
                      icon={<Sun className="w-10 h-10 text-orange-500" />} 
                      label="Renewable" 
                      color="border-orange-400"
                      id="renewable"
                    />
                  </div>

                  {/* EMS */}
                  <div 
                    className="absolute transform -translate-x-1/2 -translate-y-1/2 pointer-events-auto"
                    style={{ left: `${(componentPositions.ems.x / 800) * 100}%`, top: `${(componentPositions.ems.y / 500) * 100}%` }}
                  >
                    <ComponentNode 
                      icon={<Zap className="w-10 h-10 text-blue-500" />} 
                      label="EMS" 
                      color="border-blue-600"
                      id="ems"
                    />
                  </div>

                  {/* Battery */}
                  <div 
                    className="absolute transform -translate-x-1/2 -translate-y-1/2 pointer-events-auto"
                    style={{ left: `${(componentPositions.battery.x / 800) * 100}%`, top: `${(componentPositions.battery.y / 500) * 100}%` }}
                  >
                    <ComponentNode 
                      icon={<Battery className="w-10 h-10 text-green-500" />} 
                      label="Battery" 
                      color="border-green-400"
                      id="battery"
                    />
                  </div>

                  {/* Grid (only in grid mode) */}
                  {mode === 'grid' && (
                    <div 
                      className="absolute transform -translate-x-1/2 -translate-y-1/2 pointer-events-auto"
                      style={{ left: `${(componentPositions.grid.x / 800) * 100}%`, top: `${(componentPositions.grid.y / 500) * 100}%` }}
                    >
                      <ComponentNode 
                        icon={<Network className="w-10 h-10 text-purple-500" />} 
                        label="Grid" 
                        color="border-purple-400"
                        id="grid"
                      />
                    </div>
                  )}

                  {/* Load */}
                  <div 
                    className="absolute transform -translate-x-1/2 -translate-y-1/2 pointer-events-auto"
                    style={{ left: `${(componentPositions.load.x / 800) * 100}%`, top: `${(componentPositions.load.y / 500) * 100}%` }}
                  >
                    <ComponentNode 
                      icon={<Building2 className="w-10 h-10 text-gray-500" />} 
                      label="Load" 
                      color="border-gray-400"
                      id="load"
                    />
                  </div>

                  {/* Diesel */}
                  <div 
                    className="absolute transform -translate-x-1/2 -translate-y-1/2 pointer-events-auto"
                    style={{ left: `${(componentPositions.diesel.x / 800) * 100}%`, top: `${(componentPositions.diesel.y / 500) * 100}%` }}
                  >
                    <ComponentNode 
                      icon={<Fuel className="w-10 h-10 text-amber-600" />} 
                      label="Diesel" 
                      color="border-amber-400"
                      id="diesel"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Description */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 mb-12">
          <p className="text-lg text-gray-700 dark:text-gray-300 leading-relaxed">
            This visualization demonstrates the flow of power in an Energy Management System (EMS). 
            All the components in the EMS are connected to the EMS device, which decides the power flow 
            from each component depending on availability and the cost associated with it. If the cost 
            associated with the power is high, then the power flow will be from other available sources 
            with low cost. The charge and discharge of the battery is also shown in the animation. 
            The battery is charged when the cost of the power is low and discharged when the cost of 
            the power is high. We can also see power flows from Renewable and Diesel to the grid, 
            which indicates that the power is being sold to the grid and making a profit.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
          {/* Key Features */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8">
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Key Features</h3>
            <ul className="space-y-4">
              <li className="flex items-start">
                <CheckCircle className="w-6 h-6 text-green-500 mr-3 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white">Smart Power Routing</h4>
                  <p className="text-gray-600 dark:text-gray-400">Optimizes power flow based on availability and cost</p>
                </div>
              </li>
              <li className="flex items-start">
                <CheckCircle className="w-6 h-6 text-green-500 mr-3 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white">Dynamic Storage Management</h4>
                  <p className="text-gray-600 dark:text-gray-400">Charges during low-cost periods, discharges when costs are high</p>
                </div>
              </li>
              <li className="flex items-start">
                <CheckCircle className="w-6 h-6 text-green-500 mr-3 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white">Renewable Integration</h4>
                  <p className="text-gray-600 dark:text-gray-400">Prioritizes clean energy sources for sustainability</p>
                </div>
              </li>
              <li className="flex items-start">
                <CheckCircle className="w-6 h-6 text-green-500 mr-3 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white">Cost Optimization</h4>
                  <p className="text-gray-600 dark:text-gray-400">Minimizes energy costs through intelligent decision-making</p>
                </div>
              </li>
            </ul>
          </div>

          {/* Power Flow Dynamics */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8">
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Power Flow Dynamics</h3>
            <ul className="space-y-3">
              <li className="flex items-center text-gray-700 dark:text-gray-300">
                <ArrowRight className="w-5 h-5 text-blue-500 mr-3" />
                <span><strong>EMS to Grid:</strong> Excess power sold for profit</span>
              </li>
              <li className="flex items-center text-gray-700 dark:text-gray-300">
                <ArrowRight className="w-5 h-5 text-blue-500 mr-3" />
                <span><strong>Renewables to EMS:</strong> Clean energy prioritized</span>
              </li>
              <li className="flex items-center text-gray-700 dark:text-gray-300">
                <ArrowRight className="w-5 h-5 text-blue-500 mr-3" />
                <span><strong>Battery to EMS:</strong> Discharge during peak demand</span>
              </li>
              <li className="flex items-center text-gray-700 dark:text-gray-300">
                <ArrowRight className="w-5 h-5 text-blue-500 mr-3" />
                <span><strong>Diesel to EMS:</strong> Backup power during emergencies</span>
              </li>
              <li className="flex items-center text-gray-700 dark:text-gray-300">
                <ArrowRight className="w-5 h-5 text-blue-500 mr-3" />
                <span><strong>EMS to Load:</strong> Efficient power distribution to devices</span>
              </li>
              <li className="flex items-center text-gray-700 dark:text-gray-300">
                <ArrowRight className="w-5 h-5 text-blue-500 mr-3" />
                <span><strong>EMS to Storage:</strong> Energy stored for future use</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Call to Action */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl shadow-2xl p-12 text-center text-white">
          <h2 className="text-3xl font-bold mb-4">Ready to Optimize Your Energy?</h2>
          <p className="text-lg mb-8 opacity-90">
            Access real-time monitoring, AI-powered insights, and advanced energy management features.
          </p>
          <button
            onClick={onGetStarted}
            className="inline-flex items-center space-x-2 px-8 py-4 bg-white text-blue-600 font-bold rounded-lg shadow-lg hover:shadow-xl transition-all transform hover:scale-105"
          >
            <span>Access Dashboard</span>
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col md:flex-row items-center justify-between space-y-3 md:space-y-0">
            <div className="text-sm text-gray-600 dark:text-gray-400">
              © {new Date().getFullYear()} VidyutAI. All rights reserved.
            </div>
            <div className="flex items-center space-x-3">
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Developed at
              </span>
              <img 
                src="/IITGN_logo.webp" 
                alt="IIT Gandhinagar" 
                className="h-8 w-auto opacity-80 hover:opacity-100 transition-opacity"
              />
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;


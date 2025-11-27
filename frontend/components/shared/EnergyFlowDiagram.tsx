import React from 'react';
import { Sun, Network, Battery, Building2 } from 'lucide-react';
import { EnergyFlows } from '../../types';

interface EnergyFlowDiagramProps {
  currentFlows: EnergyFlows;
  suggestedFlows?: EnergyFlows | null;
  className?: string;
  mode?: 'grid' | 'island';
}

const FlowArrow: React.FC<{ d: string; value: number; suggestedValue?: number; isHidden?: boolean }> = ({ d, value, suggestedValue, isHidden }) => {
  if (isHidden || (value <= 0 && (!suggestedValue || suggestedValue <= 0))) return null;
  
  const hasSuggestion = suggestedValue !== undefined && suggestedValue !== value;
  const strokeWidth = 2 + Math.log1p(value) * 1.5;
  const suggestedStrokeWidth = hasSuggestion ? (2 + Math.log1p(suggestedValue) * 1.5) : 0;

  return (
    <g>
      {hasSuggestion && suggestedValue > 0 && (
        <path d={d} fill="none" stroke="rgba(236, 72, 153, 0.7)" strokeWidth={suggestedStrokeWidth} strokeDasharray="5,5" />
      )}
      {value > 0 && (
        <path d={d} fill="none" stroke="rgba(59, 130, 246, 0.7)" strokeWidth={strokeWidth}>
          <animate attributeName="stroke-dasharray" from="0, 100" to="100, 0" dur="2s" repeatCount="indefinite" />
        </path>
      )}
    </g>
  );
};

const FlowLabel: React.FC<{ x: number, y: number, value: number, suggestedValue?: number, unit: string }> = ({ x, y, value, suggestedValue, unit}) => {
    const hasSuggestion = suggestedValue !== undefined && suggestedValue !== value;

    return (
        <text x={x} y={y} textAnchor="middle" className="text-xs font-bold fill-current">
            <tspan className="text-blue-600 dark:text-blue-300">{value.toFixed(2)}</tspan>
            {hasSuggestion && (
                <>
                    <tspan className="text-gray-600 dark:text-gray-400"> → </tspan>
                    <tspan className="text-pink-600 dark:text-pink-400">{suggestedValue.toFixed(2)}</tspan>
                </>
            )}
             <tspan dy="10" x={x} className="text-gray-500 dark:text-gray-400">{unit}</tspan>
        </text>
    )
}

const EnergyFlowNode: React.FC<{ x: number; y: number; icon: React.ReactNode; label: string }> = ({ x, y, icon, label }) => (
  <g transform={`translate(${x}, ${y})`}>
    <foreignObject x="-24" y="-24" width="48" height="48">
        <div className="flex flex-col items-center justify-center text-center p-1 rounded-lg bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 w-full h-full">
            {icon}
            <span className="text-[10px] font-semibold mt-1 leading-tight">{label}</span>
        </div>
    </foreignObject>
  </g>
);

const EnergyFlowDiagram: React.FC<EnergyFlowDiagramProps> = ({ currentFlows, suggestedFlows, className, mode = 'grid' }) => {
  const isIslandMode = mode === 'island';
  
  return (
    <div className={`w-full h-80 ${className}`}>
      <svg width="100%" height="100%" viewBox="0 0 300 200">
        <defs>
          <marker id="arrow" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="4" markerHeight="4" orient="auto-start-reverse">
            <path d="M 0 0 L 10 5 L 0 10 z" fill="#3B82F6" />
          </marker>
        </defs>

        {/* Nodes */}
        <EnergyFlowNode x={50} y={50} icon={<Sun className="w-5 h-5 text-orange-400" />} label="PV" />
        <EnergyFlowNode 
          x={250} 
          y={50} 
          icon={<Network className={`w-5 h-5 ${isIslandMode ? 'text-gray-400' : 'text-yellow-500'}`} />} 
          label="Grid" 
        />
        <EnergyFlowNode x={50} y={150} icon={<Battery className="w-5 h-5 text-green-500" />} label="Battery" />
        <EnergyFlowNode x={250} y={150} icon={<Building2 className="w-5 h-5 text-gray-500" />} label="Load" />

        {/* Arrows - Grid connections are hidden in island mode */}
        {!isIslandMode && (
          <>
            <FlowArrow d="M 75 50 H 225" value={currentFlows.pv_to_grid} suggestedValue={suggestedFlows?.pv_to_grid} isHidden />
            <FlowArrow d="M 75 150 H 225" value={currentFlows.battery_to_grid} suggestedValue={suggestedFlows?.battery_to_grid} isHidden />
            <FlowArrow d="M 250 75 V 125" value={currentFlows.grid_to_load} suggestedValue={suggestedFlows?.grid_to_load} />
          </>
        )}
        <FlowArrow d="M 50 75 V 125" value={currentFlows.pv_to_battery} suggestedValue={suggestedFlows?.pv_to_battery} />
        <FlowArrow d="M 75 50 L 225 150" value={currentFlows.pv_to_load} suggestedValue={suggestedFlows?.pv_to_load} />
        <FlowArrow d="M 75 150 L 225 150" value={currentFlows.battery_to_load} suggestedValue={suggestedFlows?.battery_to_load} />
        
        {/* Labels */}
        {!isIslandMode && (
          <FlowLabel x={265} y={95} value={currentFlows.grid_to_load} suggestedValue={suggestedFlows?.grid_to_load} unit="kW"/>
        )}
        <FlowLabel x={35} y={95} value={currentFlows.pv_to_battery} suggestedValue={suggestedFlows?.pv_to_battery} unit="kW"/>
        <FlowLabel x={150} y={90} value={currentFlows.pv_to_load} suggestedValue={suggestedFlows?.pv_to_load} unit="kW"/>
        <FlowLabel x={150} y={165} value={currentFlows.battery_to_load} suggestedValue={suggestedFlows?.battery_to_load} unit="kW"/>

      </svg>
    </div>
  );
};

export default EnergyFlowDiagram;
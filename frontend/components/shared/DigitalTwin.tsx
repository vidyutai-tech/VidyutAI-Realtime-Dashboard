import React from 'react';
import { DigitalTwinDataPoint } from '../../types';
import { Thermometer, Zap, BarChart, Rss } from 'lucide-react';

interface DigitalTwinProps {
    dataPoints: DigitalTwinDataPoint[];
}

const DataPoint: React.FC<{ point: DigitalTwinDataPoint }> = ({ point }) => {
    const deviation = point.predicted_value !== 0 ? ((point.real_value - point.predicted_value) / point.predicted_value) * 100 : 0;

    let colorClass = 'text-green-500';
    let bgClass = 'bg-green-500/10';
    if (Math.abs(deviation) > 10) {
      colorClass = 'text-yellow-500';
      bgClass = 'bg-yellow-500/10';
    }
    if (Math.abs(deviation) > 25) {
      colorClass = 'text-red-500';
      bgClass = 'bg-red-500/10';
    }

    const getIcon = (label: string) => {
        const labelLower = (label || '').toLowerCase();
        if (labelLower.includes('temp')) return <Thermometer className="w-4 h-4 text-gray-500 dark:text-gray-400" />;
        if (labelLower.includes('speed')) return <Rss className="w-4 h-4 text-gray-500 dark:text-gray-400" />;
        if (labelLower.includes('vib')) return <BarChart className="w-4 h-4 text-gray-500 dark:text-gray-400" />;
        return <Zap className="w-4 h-4 text-gray-500 dark:text-gray-400" />;
    };

    return (
        <g transform={`translate(${point.x}, ${point.y})`} className="transition-transform duration-500">
            <foreignObject x="-75" y="-35" width="150" height="70">
                <div className={`w-full h-full p-2 rounded-lg shadow-lg flex flex-col justify-center items-center 
                                 border-2 transition-colors duration-300 ${colorClass.replace('text-', 'border-')} ${bgClass}`}>
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-700 dark:text-gray-300">
                        {getIcon(point.label || '')}
                        <span>{point.label || 'Unknown'}</span>
                    </div>
                    <div className="flex items-baseline font-mono">
                        <span className="text-xl font-bold text-gray-900 dark:text-white">{point.real_value.toFixed(2)}</span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">/{point.predicted_value.toFixed(2)} {point.unit || ''}</span>
                    </div>
                    <div className={`text-xs font-bold ${colorClass}`}>
                        {deviation > 0 ? '▲' : '▼'} {Math.abs(deviation).toFixed(2)}%
                    </div>
                </div>
            </foreignObject>
        </g>
    );
};

const DigitalTwin: React.FC<DigitalTwinProps> = ({ dataPoints }) => {
    // UPDATED: Central asset is smaller and centered in the new, larger canvas
    const asset = { x: 175, y: 150, width: 100, height: 50 };

    const getAnchorPoint = (point: DigitalTwinDataPoint) => {
        const cx = asset.x + asset.width / 2;
        const cy = asset.y + asset.height / 2;
        const dx = point.x - cx;
        const dy = point.y - cy;
        
        let anchorX = cx + (asset.width / 2) * (Math.abs(dx) > asset.width / 2 ? Math.sign(dx) : dx / (asset.width / 2));
        let anchorY = cy + (asset.height / 2) * (Math.abs(dy) > asset.height / 2 ? Math.sign(dy) : dy / (asset.height / 2));

        anchorX = Math.max(asset.x, Math.min(asset.x + asset.width, anchorX));
        anchorY = Math.max(asset.y, Math.min(asset.y + asset.height, anchorY));
        
        return { x: anchorX, y: anchorY };
    };

    // UPDATED: ViewBox is now larger (450x350) to give more space
    return (
        <svg width="100%" height="100%" viewBox="0 0 450 350">
            <defs>
                <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="0" refY="3.5" orient="auto">
                    <polygon points="0 0, 10 3.5, 0 7" className="fill-current text-gray-400 dark:text-gray-500" />
                </marker>
            </defs>

            <g>
                <rect x={asset.x} y={asset.y} width={asset.width} height={asset.height} rx="5" className="fill-current text-gray-200 dark:text-gray-700" />
                <rect x={asset.x + 5} y={asset.y + 5} width={asset.width - 10} height={asset.height - 10} rx="3" className="fill-current text-gray-300 dark:text-gray-600" />
            </g>

            <g>
                {dataPoints.map((point, index) => {
                    const anchor = getAnchorPoint(point);
                    const pathData = `M ${anchor.x} ${anchor.y} Q ${anchor.x} ${point.y}, ${point.x - 10 * Math.sign(point.x - (asset.x + asset.width/2))} ${point.y}`;
                    return (
                        <path
                            key={`line-${point.id || point.label || index}`}
                            d={pathData}
                            className="stroke-current text-gray-400 dark:text-gray-500"
                            strokeWidth="1.5"
                            fill="none"
                            markerEnd="url(#arrowhead)"
                        />
                    );
                })}
            </g>
            
            <g>
                {dataPoints.map((point, index) => (
                    <DataPoint key={point.id || point.label || `point-${index}`} point={point} />
                ))}
            </g>
        </svg>
    );
};

export default DigitalTwin;
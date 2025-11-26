import React, { useState, useEffect, useRef } from 'react';
import { Download, AlertTriangle } from 'lucide-react';
import Card from '../ui/Card';

interface AnomalyRegion {
  x: number;
  y: number;
  width: number;
  height: number;
  severity: 'low' | 'medium' | 'high';
  description: string;
}

interface EnhancedFFTSpectrogramProps {
  data?: number[][];
  anomalies?: AnomalyRegion[];
  theme: 'light' | 'dark';
  onDownload?: () => void;
}

const EnhancedFFTSpectrogram: React.FC<EnhancedFFTSpectrogramProps> = ({
  data,
  anomalies = [],
  theme,
  onDownload,
}) => {
  const [hoveredCell, setHoveredCell] = useState<{ x: number; y: number; value: number } | null>(null);
  const [mousePosition, setMousePosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Generate mock data if not provided
  const spectrogramData = data || (() => {
    const rows = 32;
    const cols = 100;
    return Array.from({ length: rows }, () =>
      Array.from({ length: cols }, () => Math.random())
    );
  })();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const cellWidth = 4;
    const cellHeight = 4;
    const width = spectrogramData[0]?.length * cellWidth || 400;
    const height = spectrogramData.length * cellHeight || 128;

    canvas.width = width;
    canvas.height = height;

    // Draw spectrogram
    spectrogramData.forEach((row, i) => {
      row.forEach((val, j) => {
        const x = j * cellWidth;
        const y = i * cellHeight;

        // Color based on value
        const intensity = Math.floor(val * 255);
        if (theme === 'dark') {
          ctx.fillStyle = `rgb(${intensity}, ${intensity}, ${intensity})`;
        } else {
          const invIntensity = Math.floor((1 - val) * 200);
          ctx.fillStyle = `rgb(${invIntensity}, ${invIntensity}, ${invIntensity})`;
        }

        ctx.fillRect(x, y, cellWidth, cellHeight);
      });
    });

    // Draw anomaly highlights
    anomalies.forEach((anomaly) => {
      ctx.strokeStyle =
        anomaly.severity === 'high'
          ? '#ef4444'
          : anomaly.severity === 'medium'
          ? '#f59e0b'
          : '#3b82f6';
      ctx.lineWidth = 2;
      ctx.strokeRect(anomaly.x, anomaly.y, anomaly.width, anomaly.height);

      // Add semi-transparent overlay
      ctx.fillStyle =
        anomaly.severity === 'high'
          ? 'rgba(239, 68, 68, 0.2)'
          : anomaly.severity === 'medium'
          ? 'rgba(245, 158, 11, 0.2)'
          : 'rgba(59, 130, 246, 0.2)';
      ctx.fillRect(anomaly.x, anomaly.y, anomaly.width, anomaly.height);
    });
  }, [spectrogramData, anomalies, theme]);

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const cellWidth = 4;
    const cellHeight = 4;
    const col = Math.floor(x / cellWidth);
    const row = Math.floor(y / cellHeight);

    if (
      row >= 0 &&
      row < spectrogramData.length &&
      col >= 0 &&
      col < spectrogramData[0]?.length
    ) {
      const value = spectrogramData[row][col];
      setHoveredCell({ x: col, y: row, value });
      setMousePosition({ x: e.clientX, y: e.clientY });
    } else {
      setHoveredCell(null);
    }
  };

  const handleMouseLeave = () => {
    setHoveredCell(null);
  };

  const handleDownload = () => {
    if (onDownload) {
      onDownload();
      return;
    }

    // Default download implementation
    const canvas = canvasRef.current;
    if (!canvas) return;

    const link = document.createElement('a');
    link.download = `fft-spectrogram-${new Date().toISOString()}.png`;
    link.href = canvas.toDataURL();
    link.click();
  };

  // Calculate frequency from row index (assuming 0-100 Hz range)
  const getFrequency = (row: number) => {
    const maxFreq = 100;
    return ((spectrogramData.length - row) / spectrogramData.length) * maxFreq;
  };

  // Calculate time from column index
  const getTime = (col: number) => {
    const maxTime = 10; // seconds
    return (col / (spectrogramData[0]?.length || 1)) * maxTime;
  };

  return (
    <Card title="Motor Vibration FFT Spectrogram" className="relative">
      <div className="mb-4 flex items-center justify-between">
        <div className="text-sm text-gray-600 dark:text-gray-400">
          Hover over the spectrogram to see frequency and amplitude values
        </div>
        <button
          onClick={handleDownload}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
        >
          <Download className="w-4 h-4" />
          Download Raw FFT
        </button>
      </div>

      <div ref={containerRef} className="relative bg-gray-200 dark:bg-gray-900 p-2 rounded-md overflow-x-auto">
        <canvas
          ref={canvasRef}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          className="cursor-crosshair"
        />

        {/* Hover Tooltip */}
        {hoveredCell && (
          <div
            className="absolute bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg p-3 z-10 pointer-events-none"
            style={{
              left: `${mousePosition.x + 10}px`,
              top: `${mousePosition.y + 10}px`,
              transform: 'translate(0, 0)',
            }}
          >
            <div className="text-sm space-y-1">
              <div className="font-semibold text-gray-900 dark:text-white">FFT Data</div>
              <div className="text-gray-600 dark:text-gray-400">
                Frequency: <span className="font-medium">{getFrequency(hoveredCell.y).toFixed(2)} Hz</span>
              </div>
              <div className="text-gray-600 dark:text-gray-400">
                Time: <span className="font-medium">{getTime(hoveredCell.x).toFixed(2)} s</span>
              </div>
              <div className="text-gray-600 dark:text-gray-400">
                Amplitude: <span className="font-medium">{(hoveredCell.value * 100).toFixed(2)}%</span>
              </div>
            </div>
          </div>
        )}

        {/* Anomaly Legend */}
        {anomalies.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-4 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-red-500 bg-red-500/20" />
              <span className="text-gray-600 dark:text-gray-400">High Severity</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-yellow-500 bg-yellow-500/20" />
              <span className="text-gray-600 dark:text-gray-400">Medium Severity</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-blue-500 bg-blue-500/20" />
              <span className="text-gray-600 dark:text-gray-400">Low Severity</span>
            </div>
          </div>
        )}

        {/* Anomaly Details */}
        {anomalies.length > 0 && (
          <div className="mt-4 border-t border-gray-200 dark:border-gray-700 pt-4">
            <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-orange-500" />
              Detected Anomalies
            </h4>
            <div className="space-y-2 max-h-32 overflow-y-auto">
              {anomalies.map((anomaly, index) => (
                <div
                  key={index}
                  className={`p-2 rounded-lg text-xs ${
                    anomaly.severity === 'high'
                      ? 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'
                      : anomaly.severity === 'medium'
                      ? 'bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800'
                      : 'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800'
                  }`}
                >
                  <div className="font-medium text-gray-900 dark:text-white">
                    {anomaly.severity.toUpperCase()} Severity
                  </div>
                  <div className="text-gray-600 dark:text-gray-400 mt-1">{anomaly.description}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Axis Labels */}
        <div className="flex justify-between text-xs text-gray-600 dark:text-gray-500 mt-2">
          <span>0s</span>
          <span>Time →</span>
          <span>10s</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-500 mt-2">
          <span>Frequency ↑</span>
          <span className="ml-auto">0 Hz</span>
          <span className="mr-auto">100 Hz</span>
        </div>
      </div>
    </Card>
  );
};

export default EnhancedFFTSpectrogram;


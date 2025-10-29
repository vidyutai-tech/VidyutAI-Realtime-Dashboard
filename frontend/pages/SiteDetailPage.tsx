
import React, { useState, useEffect, useContext } from 'react';
import { AreaChart, Area, LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { HeartPulse, BatteryMedium, CircuitBoard, Cog } from 'lucide-react';
import Card from '../components/ui/Card';
import Skeleton from '../components/ui/Skeleton';
// FIX: Removed unused fetchHealthStatus import.
import { fetchTimeseriesData } from '../services/api';
import { HealthStatus, Telemetry } from '../types';
import { AppContext } from '../contexts/AppContext';

const MetricCard: React.FC<{ title: string; value: number; unit: string; icon: React.ReactNode; isLoading: boolean }> = ({ title, value, unit, icon, isLoading }) => (
    <Card className="flex items-center space-x-4">
        {isLoading ? <Skeleton className="w-12 h-12 rounded-full" /> : <div className="p-3 bg-gray-100 dark:bg-gray-700 rounded-full">{icon}</div>}
        <div>
            {isLoading ? <Skeleton className="h-5 w-24 mb-1" /> : <p className="text-sm text-gray-500 dark:text-gray-400">{title}</p>}
            {isLoading ? <Skeleton className="h-7 w-20" /> : <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}<span className="text-base ml-1">{unit}</span></p>}
        </div>
    </Card>
);

const SpectrogramViewer: React.FC = () => {
    const [data, setData] = useState<number[][]>([]);
    const { theme } = useContext(AppContext)!;

    useEffect(() => {
        const rows = 32;
        const cols = 100;
        const mockData = Array.from({ length: rows }, () => 
            Array.from({ length: cols }, () => Math.random())
        );
        setData(mockData);
    }, []);

    const getColor = (value: number) => {
        if (theme === 'dark') {
            const intensity = Math.floor(value * 255);
            return `rgb(${intensity}, ${intensity}, ${intensity})`;
        } else {
            const intensity = Math.floor((1 - value) * 200);
            return `rgb(${intensity}, ${intensity}, ${intensity})`;
        }
    };

    return (
        <div className="bg-gray-200 dark:bg-gray-900 p-2 rounded-md overflow-x-auto">
            <div className="flex flex-col-reverse" style={{ width: `${data[0]?.length * 4}px`}}>
                {data.map((row, i) => (
                    <div key={i} className="flex">
                        {row.map((val, j) => (
                            <div key={j} className="w-1 h-1" style={{ backgroundColor: getColor(val) }} />
                        ))}
                    </div>
                ))}
            </div>
            <div className="flex justify-between text-xs text-gray-600 dark:text-gray-500 mt-1">
                <span>0s</span>
                <span>Time</span>
                <span>10s</span>
            </div>
        </div>
    );
};

const SiteDetailPage: React.FC = () => {
  // FIX: Get healthStatus from context, manage telemetry loading state locally.
  const { theme, healthStatus, selectedSite } = useContext(AppContext)!;
  const [telemetryData, setTelemetryData] = useState<Telemetry[]>([]);
  const [isLoadingTelemetry, setIsLoadingTelemetry] = useState(true);

  const gridColor = theme === 'dark' ? '#4A5568' : '#e2e8f0';
  const textColor = theme === 'dark' ? '#A0AEC0' : '#4A5568';
  
  useEffect(() => {
    const fetchData = async () => {
      if (!selectedSite) return;
      try {
        // FIX: Only fetch telemetry data now.
        setIsLoadingTelemetry(true);
        const telemetry = await fetchTimeseriesData(selectedSite.id, 'last_6h');
        setTelemetryData(telemetry);
      } catch (error) {
        console.error("Failed to fetch site detail data:", error);
      } finally {
        setIsLoadingTelemetry(false);
      }
    };
    fetchData();
  }, [selectedSite]);

  // FIX: Combine global and local loading states for a consistent UI.
  const isLoading = healthStatus === null || isLoadingTelemetry;

  const formattedTelemetry = telemetryData.map(d => ({
      ...d.metrics,
      time: new Date(d.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }));

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard title="Health Index" value={healthStatus?.site_health ?? 0} unit="%" icon={<HeartPulse className="w-6 h-6 text-red-500" />} isLoading={isLoading} />
        <MetricCard title="Battery SoH" value={healthStatus?.battery_soh ?? 0} unit="%" icon={<BatteryMedium className="w-6 h-6 text-green-500" />} isLoading={isLoading} />
        <MetricCard title="Inverter Health" value={healthStatus?.inverter_health ?? 0} unit="%" icon={<CircuitBoard className="w-6 h-6 text-blue-500" />} isLoading={isLoading} />
        <MetricCard title="Motor Health" value={healthStatus?.motor_health ?? 0} unit="%" icon={<Cog className="w-6 h-6 text-yellow-500" />} isLoading={isLoading} />
      </div>

      <Card title="Real-time Telemetry">
        <div className="h-96">
            <ResponsiveContainer>
                <LineChart data={formattedTelemetry}>
                    <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                    <XAxis dataKey="time" stroke={textColor} />
                    <YAxis yAxisId="left" stroke="#8884d8" label={{ value: 'Voltage (V)', angle: -90, position: 'insideLeft', fill: '#8884d8' }}/>
                    <YAxis yAxisId="right" orientation="right" stroke="#82ca9d" label={{ value: 'Current (A)', angle: -90, position: 'insideRight', fill: '#82ca9d' }}/>
                    <Tooltip contentStyle={{ backgroundColor: theme === 'dark' ? '#1A202C' : '#FFFFFF', border: `1px solid ${gridColor}` }} />
                    <Legend />
                    <Line yAxisId="left" type="monotone" dataKey="voltage" stroke="#8884d8" dot={false} />
                    <Line yAxisId="right" type="monotone" dataKey="current" stroke="#82ca9d" dot={false} />
                    <Line yAxisId="right" type="monotone" dataKey="frequency" stroke="#ffc658" dot={false} hide={true}/>
                </LineChart>
            </ResponsiveContainer>
        </div>
      </Card>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card title="Power Distribution (PV vs Grid vs Load)">
            <div className="h-80">
                <ResponsiveContainer>
                    <AreaChart data={formattedTelemetry}>
                        <CartesianGrid strokeDasharray="3 3" stroke={gridColor}/>
                        <XAxis dataKey="time" stroke={textColor}/>
                        <YAxis stroke={textColor}/>
                        <Tooltip contentStyle={{ backgroundColor: theme === 'dark' ? '#1A202C' : '#FFFFFF', border: `1px solid ${gridColor}` }}/>
                        <Legend />
                        <Area type="monotone" dataKey="pv_irradiance" stackId="1" stroke="#ffc658" fill="#ffc658" name="PV Gen"/>
                        <Area type="monotone" dataKey="net_load" stackId="1" stroke="#8884d8" fill="#8884d8" name="Net Load"/>
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </Card>
        <Card title="Motor Vibration FFT Spectrogram">
           <SpectrogramViewer />
        </Card>
      </div>
    </div>
  );
};

export default SiteDetailPage;

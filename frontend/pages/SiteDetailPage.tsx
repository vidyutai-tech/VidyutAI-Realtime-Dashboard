import React, { useState, useEffect, useContext } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { HeartPulse, BatteryMedium, CircuitBoard, Cog } from 'lucide-react';
import Card from '../components/ui/Card';
import Skeleton from '../components/ui/Skeleton';
import { fetchTimeseriesData } from '../services/api';
import { HealthStatus, Telemetry } from '../types';
import { AppContext } from '../contexts/AppContext';
import RichDiagnosticCard from '../components/shared/RichDiagnosticCard';
import EnhancedTelemetryChart from '../components/shared/EnhancedTelemetryChart';
import EnhancedFFTSpectrogram from '../components/shared/EnhancedFFTSpectrogram';

const SiteDetailPage: React.FC = () => {
  const { theme, healthStatus, selectedSite } = useContext(AppContext)!;
  const [telemetryData, setTelemetryData] = useState<Telemetry[]>([]);
  const [isLoadingTelemetry, setIsLoadingTelemetry] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!selectedSite) return;
      try {
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

  const isLoading = healthStatus === null || isLoadingTelemetry;

  // Format telemetry data with forecast (mock for now)
  const formattedTelemetry = telemetryData.map((d, index) => ({
      timestamp: d.timestamp,
      time: new Date(d.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      ...d.metrics,
      forecast: index < telemetryData.length - 10 ? undefined : {
        voltage: (d.metrics.voltage || 0) * (1 + Math.random() * 0.05 - 0.025),
        current: (d.metrics.current || 0) * (1 + Math.random() * 0.05 - 0.025),
        frequency: (d.metrics.frequency || 0) * (1 + Math.random() * 0.01 - 0.005),
      },
  }));

  // Mock anomalies for demonstration
  const anomalies = telemetryData
    .map((d, index) => {
      if (index % 15 === 0 && Math.random() > 0.7) {
        return {
          timestamp: d.timestamp,
          type: 'Voltage Fluctuation',
          severity: (['low', 'medium', 'high'] as const)[Math.floor(Math.random() * 3)],
          description: `Voltage deviation detected at ${new Date(d.timestamp).toLocaleTimeString()}`,
        };
      }
      return null;
    })
    .filter(Boolean) as Array<{
      timestamp: string;
      type: string;
      severity: 'low' | 'medium' | 'high';
      description: string;
    }>;

  // Mock FFT anomalies
  const fftAnomalies = [
    {
      x: 200,
      y: 100,
      width: 40,
      height: 20,
      severity: 'high' as const,
      description: 'High amplitude at 45-50 Hz - Possible bearing fault',
    },
    {
      x: 150,
      y: 80,
      width: 30,
      height: 15,
      severity: 'medium' as const,
      description: 'Moderate vibration at 30-35 Hz - Monitor closely',
    },
  ];

  // Helper function to get condition from value
  const getCondition = (value: number): 'healthy' | 'slight' | 'observe' | 'critical' => {
    if (value >= 90) return 'healthy';
    if (value >= 80) return 'slight';
    if (value >= 70) return 'observe';
    return 'critical';
  };

  // Helper function to calculate trend (mock 7-day trend)
  const getTrend = (value: number) => {
    const change = (Math.random() * 4 - 2); // -2% to +2%
    return {
      value,
      change,
      direction: change > 0.5 ? 'up' as const : change < -0.5 ? 'down' as const : 'stable' as const,
    };
  };

  // Standard threshold bands
  const standardThresholds = {
    healthy: { min: 90, max: 100 },
    slight: { min: 80, max: 90 },
    observe: { min: 70, max: 80 },
    critical: { min: 0, max: 70 },
  };

  return (
    <div className="space-y-6">
      {/* Rich Diagnostic Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <RichDiagnosticCard
          title="Health Index"
          value={healthStatus?.site_health ?? 0}
          unit="%"
          icon={<HeartPulse className="w-6 h-6 text-red-500" />}
          trend={getTrend(healthStatus?.site_health ?? 0)}
          thresholdBand={standardThresholds}
          condition={getCondition(healthStatus?.site_health ?? 0)}
          rootCauses={healthStatus && healthStatus.site_health < 90 ? [
            'Overall system degradation due to multiple subsystem issues',
            'Thermal drift affecting multiple components',
            'Aging components requiring maintenance',
          ] : []}
          isLoading={isLoading}
        />
        <RichDiagnosticCard
          title="Battery SoH"
          value={healthStatus?.battery_soh ?? 0}
          unit="%"
          icon={<BatteryMedium className="w-6 h-6 text-green-500" />}
          trend={getTrend(healthStatus?.battery_soh ?? 0)}
          thresholdBand={standardThresholds}
          condition={getCondition(healthStatus?.battery_soh ?? 0)}
          rootCauses={healthStatus && healthStatus.battery_soh < 90 ? [
            'Battery aging and capacity degradation',
            'Thermal stress from frequent cycling',
            'Depth of discharge patterns affecting longevity',
          ] : []}
          isLoading={isLoading}
        />
        <RichDiagnosticCard
          title="Inverter Health"
          value={healthStatus?.inverter_health ?? 0}
          unit="%"
          icon={<CircuitBoard className="w-6 h-6 text-blue-500" />}
          trend={getTrend(healthStatus?.inverter_health ?? 0)}
          thresholdBand={standardThresholds}
          condition={getCondition(healthStatus?.inverter_health ?? 0)}
          rootCauses={healthStatus && healthStatus.inverter_health < 90 ? [
            'Harmonic distortion affecting efficiency',
            'Thermal drift in power electronics',
            'Capacitor aging in DC link',
          ] : []}
          isLoading={isLoading}
        />
        <RichDiagnosticCard
          title="Motor Health"
          value={healthStatus?.motor_health ?? 0}
          unit="%"
          icon={<Cog className="w-6 h-6 text-yellow-500" />}
          trend={getTrend(healthStatus?.motor_health ?? 0)}
          thresholdBand={standardThresholds}
          condition={getCondition(healthStatus?.motor_health ?? 0)}
          rootCauses={healthStatus && healthStatus.motor_health < 90 ? [
            'Bearing wear detected in vibration analysis',
            'Harmonic distortion from inverter',
            'Thermal stress from continuous operation',
          ] : []}
          isLoading={isLoading}
        />
      </div>

      {/* Enhanced Telemetry Chart */}
      <EnhancedTelemetryChart
        data={formattedTelemetry}
        anomalies={anomalies}
        theme={theme}
        isLoading={isLoadingTelemetry}
      />
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Power Distribution Chart */}
        <Card title="Power Distribution (PV vs Grid vs Load)">
          <div className="h-80">
            <ResponsiveContainer>
              <AreaChart data={formattedTelemetry}>
                <CartesianGrid strokeDasharray="3 3" stroke={theme === 'dark' ? '#4A5568' : '#e2e8f0'}/>
                <XAxis 
                  dataKey="time" 
                  label={{ value: 'Time', position: 'insideBottom', offset: -5 }}
                  stroke={theme === 'dark' ? '#A0AEC0' : '#4A5568'}
                />
                <YAxis 
                  label={{ value: 'Power (kW)', angle: -90, position: 'insideLeft' }}
                  stroke={theme === 'dark' ? '#A0AEC0' : '#4A5568'}
                  tickFormatter={(value) => Number(value).toFixed(2)}
                />
                <Tooltip 
                  contentStyle={{ backgroundColor: theme === 'dark' ? '#1A202C' : '#FFFFFF', border: `1px solid ${theme === 'dark' ? '#4A5568' : '#e2e8f0'}` }}
                  formatter={(value: any) => Number(value).toFixed(2)}
                />
                <Legend />
                <Area type="monotone" dataKey="pv_generation" stackId="1" stroke="#ffc658" fill="#ffc658" name="PV Gen"/>
                <Area type="monotone" dataKey="net_load" stackId="1" stroke="#8884d8" fill="#8884d8" name="Net Load"/>
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Enhanced FFT Spectrogram */}
        <EnhancedFFTSpectrogram
          anomalies={fftAnomalies}
          theme={theme}
        />
      </div>
    </div>
  );
};

export default SiteDetailPage;

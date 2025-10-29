import React, { useState, useEffect, useContext } from 'react';
import { AlertTriangle, CheckCircle, Info, ShieldAlert, Bot, Loader } from 'lucide-react';
import Card from '../components/ui/Card';
import Skeleton from '../components/ui/Skeleton';
import { acknowledgeAlert, runRootCauseAnalysis } from '../services/api';
import { AppContext } from '../contexts/AppContext';

const AlertItem = ({ alert: initialAlert, onAcknowledge }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [alert, setAlert] = useState(initialAlert);
  const [isRcaLoading, setIsRcaLoading] = useState(false);
  const [rcaResult, setRcaResult] = useState<string | null>(null);

  const getSeverityStyles = () => {
    switch (alert.severity) {
      case 'critical': return { icon: <ShieldAlert className="w-6 h-6 text-red-500" />, color: 'border-red-500' };
      case 'warning': return { icon: <AlertTriangle className="w-6 h-6 text-yellow-500" />, color: 'border-yellow-500' };
      case 'info': return { icon: <Info className="w-6 h-6 text-blue-500" />, color: 'border-blue-500' };
      default: return { icon: <Info />, color: 'border-gray-500' };
    }
  };

  const { icon, color } = getSeverityStyles();

  const handleAcknowledge = async (e) => {
    e.stopPropagation();
    await onAcknowledge(alert.id);
    setAlert({ ...alert, status: 'acknowledged' });
  };

  const handleRunRCA = async (e) => {
    e.stopPropagation();
    setIsRcaLoading(true);
    setRcaResult(null);
    try {
        const result = await runRootCauseAnalysis(alert);
        setRcaResult(result);
    } catch (error) {
        console.error("RCA failed:", error);
        setRcaResult("Analysis failed to run. Please try again.");
    } finally {
        setIsRcaLoading(false);
    }
  };

  const formatRcaText = (text: string) => {
    return text
      .replace(/\*\*(.*?)\*\*/g, '<strong class="text-gray-800 dark:text-gray-100">$1</strong>')
      .replace(/\* (.*?)/g, '<li class="ml-4">$1</li>')
      .replace(/(\r\n|\n|\r)/g, '<br />');
  };

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg border-l-4 p-4 cursor-pointer transition-all duration-300 ${color}`} onClick={() => setIsExpanded(!isExpanded)}>
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          {icon}
          <div className="ml-4">
            <p className="font-semibold text-gray-900 dark:text-white">{alert.message}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">{alert.device_id} - {new Date(alert.timestamp).toLocaleString()}</p>
          </div>
        </div>
        <div className="flex items-center space-x-4">
            <span className={`px-2 py-1 text-xs font-semibold rounded-full ${alert.status === 'active' ? 'bg-red-500 text-white' : 'bg-green-500 text-white'}`}>
                {alert.status}
            </span>
        </div>
      </div>
      {isExpanded && (
        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 text-sm">
          <p className="font-bold text-gray-700 dark:text-gray-300">Diagnosis:</p>
          <p className="mb-2 text-gray-500 dark:text-gray-400">{alert.diagnosis}</p>
          <p className="font-bold text-gray-700 dark:text-gray-300">Recommended Action:</p>
          <p className="mb-4 text-gray-500 dark:text-gray-400">{alert.recommended_action}</p>

          <div className="flex items-start gap-4">
              {alert.status === 'active' && (
                <button onClick={handleAcknowledge} className="flex items-center px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm">
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Acknowledge
                </button>
              )}
              {alert.severity === 'critical' && (
                <div className="flex-1">
                    <button onClick={handleRunRCA} disabled={isRcaLoading} className="flex items-center px-3 py-1 bg-purple-600 hover:bg-purple-700 text-white rounded-md text-sm disabled:opacity-60">
                        {isRcaLoading ? <Loader className="w-4 h-4 mr-2 animate-spin" /> : <Bot className="w-4 h-4 mr-2" />}
                        {isRcaLoading ? 'Analyzing...' : 'Run AI Root Cause Analysis'}
                    </button>
                    {rcaResult && (
                        <div className="mt-3 p-3 bg-gray-100 dark:bg-gray-900/50 rounded-md border border-gray-200 dark:border-gray-600">
                           <p className="text-gray-600 dark:text-gray-300" dangerouslySetInnerHTML={{ __html: formatRcaText(rcaResult) }} />
                        </div>
                    )}
                </div>
              )}
          </div>
        </div>
      )}
    </div>
  );
};

const AlertsPage: React.FC = () => {
  const { alerts, setAlerts, selectedSite } = useContext(AppContext)!;
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!selectedSite) return;
    
    if (alerts.length === 0) {
        setIsLoading(true);
        import('../services/api').then(api => {
            api.fetchAlerts(selectedSite.id).then(initialAlerts => {
                setAlerts(initialAlerts);
            }).finally(() => setIsLoading(false));
        });
    } else {
        setIsLoading(false);
    }
  }, [selectedSite, alerts.length, setAlerts]);

  const handleAcknowledge = async (alertId: string) => {
    if (!selectedSite) return;
    try {
      await acknowledgeAlert(selectedSite.id, alertId);
      setAlerts(prevAlerts =>
        prevAlerts.map(a => (a.id === alertId ? { ...a, status: 'acknowledged' } : a))
      );
    } catch (error) {
      console.error("Failed to acknowledge alert:", error);
    }
  };

  return (
    <Card title="Alerts Feed">
      {isLoading ? (
        <div className="space-y-4">
            {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-20 w-full" />)}
        </div>
      ) : (
        <div className="space-y-4">
          {alerts.map(alert => (
            <AlertItem key={alert.id} alert={alert} onAcknowledge={handleAcknowledge} />
          ))}
        </div>
      )}
    </Card>
  );
};

export default AlertsPage;

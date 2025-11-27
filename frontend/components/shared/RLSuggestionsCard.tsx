import React, { useContext, useEffect, useState } from 'react';
import { AppContext } from '../../contexts/AppContext';
import { fetchRLSuggestions, acceptRLSuggestion, rejectRLSuggestion } from '../../services/api';
import Card from '../ui/Card';
import Skeleton from '../ui/Skeleton';
import EnergyFlowDiagram from '../shared/EnergyFlowDiagram';
import { formatCurrency } from '../../utils/currency';
import { RLSuggestion } from '../../types';
import { Bot, Check, X, DollarSign } from 'lucide-react';

const RLSuggestionsCard: React.FC = () => {
    const { 
        selectedSite, 
        suggestions, 
        setSuggestions, 
        currency, 
        healthStatus, 
        latestTelemetry 
    } = useContext(AppContext)!;

    const [isLoading, setIsLoading] = useState(true);
    const [isActionLoading, setIsActionLoading] = useState(false);
    const [mode, setMode] = useState<'grid' | 'island'>('grid');
    
    const MIN_FETCH_INTERVAL = 20 * 60 * 1000; // 20 minutes minimum between fetches

    useEffect(() => {
        if (!selectedSite) return;

        const STORAGE_KEY = `lastSuggestionsFetch_${selectedSite.id}`;
        let intervalId: NodeJS.Timeout | null = null;
        let isMounted = true;

        const loadSuggestions = async (force = false) => {
            // Prevent multiple simultaneous calls
            if (!force && isLoading) {
                console.log('⏱️ Skipping suggestions fetch - already loading');
                return;
            }

            const now = Date.now();
            const lastFetchStr = localStorage.getItem(STORAGE_KEY);
            const lastFetchTime = lastFetchStr ? parseInt(lastFetchStr, 10) : 0;
            const timeSinceLastFetch = now - lastFetchTime;
            
            // Throttle: Only fetch if enough time has passed or if forced (initial load)
            if (!force && timeSinceLastFetch < MIN_FETCH_INTERVAL) {
                console.log(`⏱️ Skipping suggestions fetch - only ${Math.round(timeSinceLastFetch / 1000 / 60)} minutes since last fetch (need 15 minutes)`);
                return;
            }
            
            // Store the fetch time immediately to prevent concurrent calls
            localStorage.setItem(STORAGE_KEY, now.toString());
            
            if (!isMounted) return;
            setIsLoading(true);
            
            try {
                console.log(`📡 Fetching RL suggestions for site ${selectedSite.id} at ${new Date().toLocaleTimeString()}`);
                const initialSuggestions = await fetchRLSuggestions(selectedSite.id);
                
                if (!isMounted) return;
                setSuggestions(initialSuggestions);
                console.log(`✅ Loaded ${initialSuggestions.length} suggestions`);
            } catch (error) {
                console.error("Failed to load RL suggestions", error);
                // Reset the timestamp on error so it can retry
                if (!force) {
                    localStorage.setItem(STORAGE_KEY, (now - MIN_FETCH_INTERVAL + 60000).toString()); // Allow retry after 1 minute
                }
            } finally {
                if (isMounted) {
                    setIsLoading(false);
                }
            }
        };

        // Check if we should do initial load (only if enough time has passed or no previous fetch)
        const lastFetchStr = localStorage.getItem(STORAGE_KEY);
        const lastFetchTime = lastFetchStr ? parseInt(lastFetchStr, 10) : 0;
        const timeSinceLastFetch = Date.now() - lastFetchTime;
        const shouldLoadInitial = timeSinceLastFetch >= MIN_FETCH_INTERVAL || lastFetchTime === 0;

        if (shouldLoadInitial) {
            // Initial load
            loadSuggestions(true);
        } else {
            // Skip initial load, just set loading to false
            setIsLoading(false);
            const minutesRemaining = Math.ceil((MIN_FETCH_INTERVAL - timeSinceLastFetch) / 60000);
            console.log(`⏱️ Skipping initial suggestions fetch - ${minutesRemaining} minutes until next fetch`);
        }
        
        // Refresh suggestions every 15 minutes (longer interval to reduce API calls)
        intervalId = setInterval(() => {
            loadSuggestions(false);
        }, 15 * 60 * 1000); // 15 minutes
        
        return () => {
            isMounted = false;
            if (intervalId) {
                clearInterval(intervalId);
            }
        };
    }, [selectedSite?.id]); // Only depend on selectedSite.id to avoid unnecessary re-runs

    const handleAction = async (suggestion: RLSuggestion, action: 'accept' | 'reject') => {
        if (!selectedSite) return;
        setIsActionLoading(true);

        setSuggestions(prev => prev.filter(s => s.id !== suggestion.id));

        try {
            if (action === 'accept') {
                await acceptRLSuggestion(selectedSite.id, suggestion.id);
            } else {
                await rejectRLSuggestion(selectedSite.id, suggestion.id);
            }
        } catch (err) {
            console.error(`Failed to ${action} suggestion.`);
            setSuggestions(prev => [suggestion, ...prev]);
        } finally {
            setIsActionLoading(false);
        }
    };
    
    // Calculate live flows with fallback to realistic defaults if data is missing
    const pvGen = latestTelemetry?.metrics?.pv_generation ?? healthStatus?.pv_generation_today ?? 450;
    const netLoad = latestTelemetry?.metrics?.net_load ?? 400;
    const gridDraw = healthStatus?.grid_draw ?? 100;
    const batteryDischarge = latestTelemetry?.metrics?.battery_discharge ?? 50;
    
    const liveFlows = {
      grid_to_load: gridDraw,
      pv_to_load: Math.max(0, Math.min(pvGen, netLoad)),
      pv_to_battery: Math.max(0, pvGen - netLoad),
      battery_to_load: batteryDischarge,
      battery_to_grid: 0,
      pv_to_grid: Math.max(0, pvGen - netLoad - batteryDischarge),
    };

    const latestSuggestion = suggestions.find(s => s.status === 'pending');

    // Adjust flows based on mode
    const adjustedFlows = {
      ...(latestSuggestion ? latestSuggestion.current_flows : liveFlows),
      // In island mode, disable grid connections
      grid_to_load: mode === 'grid' ? (latestSuggestion ? latestSuggestion.current_flows.grid_to_load : liveFlows.grid_to_load) : 0,
      pv_to_grid: mode === 'grid' ? (latestSuggestion ? latestSuggestion.current_flows.pv_to_grid : liveFlows.pv_to_grid) : 0,
      battery_to_grid: mode === 'grid' ? (latestSuggestion ? latestSuggestion.current_flows.battery_to_grid : liveFlows.battery_to_grid) : 0,
    };

    const adjustedSuggestedFlows = latestSuggestion && latestSuggestion.suggested_flows ? {
      ...latestSuggestion.suggested_flows,
      grid_to_load: mode === 'grid' ? latestSuggestion.suggested_flows.grid_to_load : 0,
      pv_to_grid: mode === 'grid' ? latestSuggestion.suggested_flows.pv_to_grid : 0,
      battery_to_grid: mode === 'grid' ? latestSuggestion.suggested_flows.battery_to_grid : 0,
    } : null;

    return (
        <Card title={latestSuggestion ? "Energy Dispatch Suggestion" : "Live Energy Dispatch"}>
            {/* Mode Toggle */}
            <div className="mb-4 flex justify-center">
                <div className="inline-flex rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 p-1">
                    <button
                        onClick={() => setMode('grid')}
                        className={`px-4 py-2 rounded-md font-medium text-sm transition-all ${
                            mode === 'grid'
                                ? 'bg-blue-600 text-white shadow-sm'
                                : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                        }`}
                    >
                        Grid Mode
                    </button>
                    <button
                        onClick={() => setMode('island')}
                        className={`px-4 py-2 rounded-md font-medium text-sm transition-all ${
                            mode === 'island'
                                ? 'bg-blue-600 text-white shadow-sm'
                                : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                        }`}
                    >
                        Island Mode
                    </button>
                </div>
            </div>
            <EnergyFlowDiagram 
                currentFlows={adjustedFlows}
                suggestedFlows={adjustedSuggestedFlows}
                mode={mode}
            />
            
            {isLoading && !latestSuggestion && (
              <div className="mt-4 p-4 text-center text-gray-500 dark:text-gray-400 text-sm">
                Loading suggestions...
              </div>
            )}
            
            {!isLoading && !latestSuggestion && (
              <div className="mt-4 p-4 border-t border-gray-200 dark:border-gray-700 text-center text-gray-500 dark:text-gray-400 text-sm">
                No active suggestions. System is operating normally.
              </div>
            )}

            {!isLoading && latestSuggestion && (
                <div className="p-4 border-t border-gray-200 dark:border-gray-700">
                    <div className="flex items-center mb-3">
                        <Bot className="w-6 h-6 text-blue-500 mr-3"/>
                        <div>
                            <p className="font-semibold">{latestSuggestion.action_summary}</p>
                            <p className="text-sm text-green-500 font-medium">
                                Est. Savings: {formatCurrency(latestSuggestion.estimated_cost_savings, currency)}
                            </p>
                        </div>
                    </div>
                     <div className="flex space-x-3">
                        <button onClick={() => handleAction(latestSuggestion, 'accept')} disabled={isActionLoading} className="flex-1 inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 disabled:opacity-50">
                            <Check className="w-5 h-5 mr-2" /> Accept
                        </button>
                        <button onClick={() => handleAction(latestSuggestion, 'reject')} disabled={isActionLoading} className="flex-1 inline-flex items-center justify-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-800 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50">
                            <X className="w-5 h-5 mr-2" /> Reject
                        </button>
                    </div>
                </div>
            )}
        </Card>
    );
};

export default RLSuggestionsCard;
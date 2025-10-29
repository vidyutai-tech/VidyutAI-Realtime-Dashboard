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

    useEffect(() => {
        if (!selectedSite) return;

        const loadSuggestions = async () => {
            setIsLoading(true);
            try {
                const initialSuggestions = await fetchRLSuggestions(selectedSite.id);
                setSuggestions(initialSuggestions);
            } catch (error) {
                console.error("Failed to load RL suggestions", error);
            } finally {
                setIsLoading(false);
            }
        };

        loadSuggestions();
    }, [selectedSite, setSuggestions]);

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
    
    const liveFlows = {
      grid_to_load: healthStatus?.grid_draw ?? 0,
      pv_to_load: Math.max(0, Math.min(latestTelemetry?.metrics.pv_generation ?? 0, latestTelemetry?.metrics.net_load ?? 0)),
      pv_to_battery: Math.max(0, (latestTelemetry?.metrics.pv_generation ?? 0) - (latestTelemetry?.metrics.net_load ?? 0)),
      battery_to_load: latestTelemetry?.metrics.battery_discharge ?? 0,
      battery_to_grid: 0,
      pv_to_grid: 0,
    };

    const latestSuggestion = suggestions.find(s => s.status === 'pending');

    return (
        <Card title={latestSuggestion ? "Energy Dispatch Suggestion" : "Live Energy Dispatch"}>
            <EnergyFlowDiagram 
                currentFlows={latestSuggestion ? latestSuggestion.current_flows : liveFlows}
                suggestedFlows={latestSuggestion ? latestSuggestion.suggested_flows : null}
            />
            
            {isLoading && <Skeleton className="h-24 w-full mt-4" />}

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
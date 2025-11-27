import React, { useContext, useEffect, useState, useCallback } from 'react';
import Card from '../ui/Card';
import { AppContext } from '../../contexts/AppContext';
// FIX: Replaced non-existent BatteryHeart icon with BatteryCharging.
import { Bot, DollarSign, Zap, BatteryCharging, Save } from 'lucide-react';
import { updateRLStrategy } from '../../services/api';
import debounce from 'lodash.debounce';

const RLTuningCard: React.FC = () => {
    const { rlStrategy, setRlStrategy, selectedSite } = useContext(AppContext)!;
    const [isSaving, setIsSaving] = useState(false);
    const [isSaved, setIsSaved] = useState(false);

    const debouncedUpdate = useCallback(debounce(async (strategy) => {
        if (!selectedSite) return;
        setIsSaving(true);
        try {
            await updateRLStrategy(selectedSite.id, strategy);
            setIsSaved(true);
            setTimeout(() => setIsSaved(false), 2000);
        } catch (error) {
            console.error("Failed to update RL strategy:", error);
        } finally {
            setIsSaving(false);
        }
    }, 1000), [selectedSite]);

    const handleChange = (key: keyof typeof rlStrategy, value: number) => {
        const newStrategy = { ...rlStrategy, [key]: value };
        setRlStrategy(newStrategy);
        debouncedUpdate(newStrategy);
    };
    
    return (
        <Card>
            <div className="flex justify-between items-center mb-4">
                 <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 flex items-center">
                    <Bot className="w-5 h-5 mr-2" /> RL Strategy
                </h3>
                {isSaving && <span className="text-xs text-yellow-500">Saving...</span>}
                {isSaved && <div className="text-xs text-green-500 flex items-center"><Save className="w-3 h-3 mr-1"/> Saved</div>}
            </div>
           
            <div className="space-y-4">
                <div>
                    <label className="flex items-center text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">
                       <DollarSign className="w-4 h-4 mr-2 text-green-500"/> Cost Savings
                    </label>
                    <div className="flex items-center space-x-2">
                        <input type="range" min="0" max="100" value={rlStrategy.cost_priority} onChange={(e) => handleChange('cost_priority', Number(e.target.value))} className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer" />
                        <span className="text-sm font-bold w-10 text-right">{rlStrategy.cost_priority}%</span>
                    </div>
                </div>
                 <div>
                    <label className="flex items-center text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">
                       <Zap className="w-4 h-4 mr-2 text-yellow-500"/> Grid Stability
                    </label>
                    <div className="flex items-center space-x-2">
                        <input type="range" min="0" max="100" value={rlStrategy.grid_stability_priority} onChange={(e) => handleChange('grid_stability_priority', Number(e.target.value))} className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer" />
                        <span className="text-sm font-bold w-10 text-right">{rlStrategy.grid_stability_priority}%</span>
                    </div>
                </div>
                 <div>
                    <label className="flex items-center text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">
                       {/* FIX: Replaced non-existent BatteryHeart icon with BatteryCharging. */}
                       <BatteryCharging className="w-4 h-4 mr-2 text-blue-500"/> Battery Longevity
                    </label>
                    <div className="flex items-center space-x-2">
                        <input type="range" min="0" max="100" value={rlStrategy.battery_life_priority} onChange={(e) => handleChange('battery_life_priority', Number(e.target.value))} className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer" />
                        <span className="text-sm font-bold w-10 text-right">{rlStrategy.battery_life_priority}%</span>
                    </div>
                </div>
            </div>
        </Card>
    );
};

export default RLTuningCard;
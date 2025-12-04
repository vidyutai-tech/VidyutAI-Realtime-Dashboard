import React, { useState, useContext } from 'react';
import { Plus, Trash2, Zap, AlertCircle } from 'lucide-react';
import Card from '../ui/Card';
import { LoadProfileContext } from '../../contexts/LoadProfileContext';
import { getAppliancesForUseCase, Appliance, ApplianceUsage } from '../../utils/applianceDatabase';

const ApplianceSelector: React.FC = () => {
  const context = useContext(LoadProfileContext);
  if (!context) throw new Error('ApplianceSelector must be used within LoadProfileProvider');
  
  const { appliances, addAppliance, updateAppliance, removeAppliance, useCase, totalDailyConsumptionKWh, peakLoad } = context;
  
  const [selectionMode, setSelectionMode] = useState<'dropdown' | 'manual'>('dropdown');
  const [selectedApplianceName, setSelectedApplianceName] = useState('');
  const [customAppliance, setCustomAppliance] = useState({
    name: '',
    rating: 0,
    quantity: 1,
    hoursPerDay: 1,
    priority: 'medium' as 'critical' | 'high' | 'medium' | 'low',
  });

  const availableAppliances = getAppliancesForUseCase(useCase);

  const handleAddFromDropdown = () => {
    const selected = availableAppliances.find(a => a.name === selectedApplianceName);
    if (!selected) return;

    const newAppliance: ApplianceUsage = {
      appliance: selected.name,
      rating: selected.typicalRating,
      quantity: 1,
      hoursPerDay: selected.typicalHours,
      priority: selected.priority,
      dailyConsumption: selected.typicalRating * 1 * selected.typicalHours,
    };

    addAppliance(newAppliance);
    setSelectedApplianceName('');
  };

  const handleAddCustom = () => {
    if (!customAppliance.name || customAppliance.rating <= 0) return;

    const newAppliance: ApplianceUsage = {
      appliance: customAppliance.name,
      rating: customAppliance.rating,
      quantity: customAppliance.quantity,
      hoursPerDay: customAppliance.hoursPerDay,
      priority: customAppliance.priority,
      dailyConsumption: customAppliance.rating * customAppliance.quantity * customAppliance.hoursPerDay,
    };

    addAppliance(newAppliance);
    setCustomAppliance({
      name: '',
      rating: 0,
      quantity: 1,
      hoursPerDay: 1,
      priority: 'medium',
    });
  };

  const handleUpdateQuantity = (index: number, quantity: number) => {
    const app = appliances[index];
    updateAppliance(index, {
      ...app,
      quantity,
      dailyConsumption: app.rating * quantity * app.hoursPerDay,
    });
  };

  const handleUpdateHours = (index: number, hours: number) => {
    const app = appliances[index];
    updateAppliance(index, {
      ...app,
      hoursPerDay: hours,
      dailyConsumption: app.rating * app.quantity * hours,
    });
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'text-red-600 bg-red-50 dark:bg-red-900/20';
      case 'high': return 'text-orange-600 bg-orange-50 dark:bg-orange-900/20';
      case 'medium': return 'text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20';
      case 'low': return 'text-blue-600 bg-blue-50 dark:bg-blue-900/20';
      default: return 'text-gray-600 bg-gray-50 dark:bg-gray-900/20';
    }
  };

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <div className="p-4">
            <div className="flex items-center space-x-2 mb-2">
              <Zap className="w-5 h-5 text-blue-600" />
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Daily Consumption</p>
            </div>
            <p className="text-3xl font-bold text-gray-900 dark:text-white">
              {totalDailyConsumptionKWh.toFixed(2)}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">kWh per day</p>
          </div>
        </Card>
        <Card>
          <div className="p-4">
            <div className="flex items-center space-x-2 mb-2">
              <AlertCircle className="w-5 h-5 text-orange-600" />
              <p className="text-sm text-gray-600 dark:text-gray-400">Peak Load</p>
            </div>
            <p className="text-3xl font-bold text-gray-900 dark:text-white">
              {peakLoad.toFixed(2)}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">kW (70% diversity)</p>
          </div>
        </Card>
        <Card>
          <div className="p-4">
            <div className="flex items-center space-x-2 mb-2">
              <Plus className="w-5 h-5 text-green-600" />
              <p className="text-sm text-gray-600 dark:text-gray-400">Appliances Added</p>
            </div>
            <p className="text-3xl font-bold text-gray-900 dark:text-white">
              {appliances.length}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {appliances.reduce((sum, a) => sum + a.quantity, 0)} total units
            </p>
          </div>
        </Card>
      </div>

      {/* Add Appliance Section */}
      <Card title="Add Appliances to Load Profile">
        <div className="p-6 space-y-6">
          {/* Selection Mode Toggle */}
          <div className="flex items-center justify-center space-x-4">
            <button
              onClick={() => setSelectionMode('dropdown')}
              className={`px-6 py-3 rounded-lg font-semibold transition-all ${
                selectionMode === 'dropdown'
                  ? 'bg-blue-600 text-white shadow-lg'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
              }`}
            >
              📋 Select from List
            </button>
            <button
              onClick={() => setSelectionMode('manual')}
              className={`px-6 py-3 rounded-lg font-semibold transition-all ${
                selectionMode === 'manual'
                  ? 'bg-blue-600 text-white shadow-lg'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
              }`}
            >
              ✏️ Manual Entry
            </button>
          </div>

          {/* Dropdown Mode */}
          {selectionMode === 'dropdown' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Select Appliance
                </label>
                <select
                  value={selectedApplianceName}
                  onChange={(e) => setSelectedApplianceName(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="">-- Choose an appliance --</option>
                  {availableAppliances.map((app, idx) => (
                    <option key={idx} value={app.name}>
                      {app.name} ({app.typicalRating}W, {app.typicalHours}h/day - {app.priority})
                    </option>
                  ))}
                </select>
              </div>
              <button
                onClick={handleAddFromDropdown}
                disabled={!selectedApplianceName}
                className="w-full px-6 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
              >
                <Plus className="w-5 h-5" />
                <span>Add Selected Appliance</span>
              </button>
            </div>
          )}

          {/* Manual Mode */}
          {selectionMode === 'manual' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Appliance Name
                  </label>
                  <input
                    type="text"
                    value={customAppliance.name}
                    onChange={(e) => setCustomAppliance({ ...customAppliance, name: e.target.value })}
                    placeholder="e.g., Custom Motor"
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Power Rating (W)
                  </label>
                  <input
                    type="number"
                    value={customAppliance.rating}
                    onChange={(e) => setCustomAppliance({ ...customAppliance, rating: parseFloat(e.target.value) || 0 })}
                    placeholder="1000"
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Quantity
                  </label>
                  <input
                    type="number"
                    value={customAppliance.quantity}
                    onChange={(e) => setCustomAppliance({ ...customAppliance, quantity: parseInt(e.target.value) || 1 })}
                    min="1"
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Hours per Day
                  </label>
                  <input
                    type="number"
                    value={customAppliance.hoursPerDay}
                    onChange={(e) => setCustomAppliance({ ...customAppliance, hoursPerDay: parseFloat(e.target.value) || 1 })}
                    min="0.1"
                    max="24"
                    step="0.5"
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Priority Level
                  </label>
                  <select
                    value={customAppliance.priority}
                    onChange={(e) => setCustomAppliance({ ...customAppliance, priority: e.target.value as any })}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                  >
                    <option value="critical">Critical (Always on - Life safety, security)</option>
                    <option value="high">High (Important - Comfort, productivity)</option>
                    <option value="medium">Medium (Flexible - Can be scheduled)</option>
                    <option value="low">Low (Deferrable - Can be delayed)</option>
                  </select>
                </div>
              </div>
              <button
                onClick={handleAddCustom}
                disabled={!customAppliance.name || customAppliance.rating <= 0}
                className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
              >
                <Plus className="w-5 h-5" />
                <span>Add Custom Appliance</span>
              </button>
            </div>
          )}
        </div>
      </Card>

      {/* Appliances List */}
      {appliances.length > 0 && (
        <Card title="Your Load Profile">
          <div className="p-6">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-100 dark:bg-gray-800">
                  <tr>
                    <th className="p-3 text-left">Appliance</th>
                    <th className="p-3 text-center">Rating (W)</th>
                    <th className="p-3 text-center">Quantity</th>
                    <th className="p-3 text-center">Hours/Day</th>
                    <th className="p-3 text-center">Priority</th>
                    <th className="p-3 text-right">Daily (Wh)</th>
                    <th className="p-3 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {appliances.map((app, index) => (
                    <tr key={index} className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800">
                      <td className="p-3 font-medium text-gray-900 dark:text-white">{app.appliance}</td>
                      <td className="p-3 text-center text-gray-600 dark:text-gray-400">{app.rating}</td>
                      <td className="p-3 text-center">
                        <input
                          type="number"
                          value={app.quantity}
                          onChange={(e) => handleUpdateQuantity(index, parseInt(e.target.value) || 1)}
                          min="1"
                          className="w-20 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-center bg-white dark:bg-gray-700"
                        />
                      </td>
                      <td className="p-3 text-center">
                        <input
                          type="number"
                          value={app.hoursPerDay}
                          onChange={(e) => handleUpdateHours(index, parseFloat(e.target.value) || 1)}
                          min="0.1"
                          max="24"
                          step="0.5"
                          className="w-20 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-center bg-white dark:bg-gray-700"
                        />
                      </td>
                      <td className="p-3 text-center">
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getPriorityColor(app.priority)}`}>
                          {app.priority}
                        </span>
                      </td>
                      <td className="p-3 text-right font-semibold text-gray-900 dark:text-white">
                        {app.dailyConsumption.toFixed(0)}
                      </td>
                      <td className="p-3 text-center">
                        <button
                          onClick={() => removeAppliance(index)}
                          className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-gray-100 dark:bg-gray-800 font-bold">
                  <tr>
                    <td colSpan={5} className="p-3 text-right">TOTAL DAILY CONSUMPTION:</td>
                    <td className="p-3 text-right text-lg text-blue-600 dark:text-blue-400">
                      {totalDailyConsumptionKWh.toFixed(2)} kWh
                    </td>
                    <td></td>
                  </tr>
                  <tr>
                    <td colSpan={5} className="p-3 text-right">PEAK LOAD (70% diversity):</td>
                    <td className="p-3 text-right text-lg text-orange-600 dark:text-orange-400">
                      {peakLoad.toFixed(2)} kW
                    </td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </Card>
      )}

      {/* Empty State */}
      {appliances.length === 0 && (
        <Card>
          <div className="p-12 text-center">
            <Zap className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              No Appliances Added Yet
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Start by selecting appliances from the dropdown or adding custom appliances manually
            </p>
          </div>
        </Card>
      )}
    </div>
  );
};

export default ApplianceSelector;


import React, { createContext, useState, useCallback, useMemo } from 'react';
import { ApplianceUsage, calculateDailyConsumption, calculatePeakLoad, groupByPriority } from '../utils/applianceDatabase';

interface LoadProfileContextType {
  appliances: ApplianceUsage[];
  addAppliance: (appliance: ApplianceUsage) => void;
  updateAppliance: (index: number, appliance: ApplianceUsage) => void;
  removeAppliance: (index: number) => void;
  clearAppliances: () => void;
  totalDailyConsumption: number; // Wh
  totalDailyConsumptionKWh: number; // kWh
  peakLoad: number; // kW
  priorityGroups: ReturnType<typeof groupByPriority>;
  useCase: 'residential' | 'commercial' | 'industrial';
  setUseCase: (useCase: 'residential' | 'commercial' | 'industrial') => void;
}

export const LoadProfileContext = createContext<LoadProfileContextType | null>(null);

export const LoadProfileProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [appliances, setAppliances] = useState<ApplianceUsage[]>([]);
  const [useCase, setUseCase] = useState<'residential' | 'commercial' | 'industrial'>('residential');

  const addAppliance = useCallback((appliance: ApplianceUsage) => {
    setAppliances(prev => [...prev, appliance]);
  }, []);

  const updateAppliance = useCallback((index: number, appliance: ApplianceUsage) => {
    setAppliances(prev => {
      const newAppliances = [...prev];
      newAppliances[index] = appliance;
      return newAppliances;
    });
  }, []);

  const removeAppliance = useCallback((index: number) => {
    setAppliances(prev => prev.filter((_, i) => i !== index));
  }, []);

  const clearAppliances = useCallback(() => {
    setAppliances([]);
  }, []);

  const totalDailyConsumption = useMemo(() => {
    return calculateDailyConsumption(appliances);
  }, [appliances]);

  const totalDailyConsumptionKWh = useMemo(() => {
    return totalDailyConsumption / 1000;
  }, [totalDailyConsumption]);

  const peakLoad = useMemo(() => {
    return calculatePeakLoad(appliances);
  }, [appliances]);

  const priorityGroups = useMemo(() => {
    return groupByPriority(appliances);
  }, [appliances]);

  return (
    <LoadProfileContext.Provider
      value={{
        appliances,
        addAppliance,
        updateAppliance,
        removeAppliance,
        clearAppliances,
        totalDailyConsumption,
        totalDailyConsumptionKWh,
        peakLoad,
        priorityGroups,
        useCase,
        setUseCase,
      }}
    >
      {children}
    </LoadProfileContext.Provider>
  );
};


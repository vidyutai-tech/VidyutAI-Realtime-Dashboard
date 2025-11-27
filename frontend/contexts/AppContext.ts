import { createContext, React } from 'react';
import { Telemetry, Alert, RLSuggestion, HealthStatus, Site, RLStrategy } from '../types';
import { GoogleGenAI } from '@google/genai';
import { User } from '../services/api';

interface AppContextType {
  isAuthenticated: boolean;
  currentUser: User | null;
  logout: () => void;
  connectionStatus: string;
  latestTelemetry: Telemetry | null;
  alerts: Alert[];
  suggestions: RLSuggestion[];
  setSuggestions: React.Dispatch<React.SetStateAction<RLSuggestion[]>>;
  theme: 'light' | 'dark';
  setTheme: (theme: 'light' | 'dark') => void;
  currency: 'USD' | 'EUR' | 'INR';
  setCurrency: (currency: 'USD' | 'EUR' | 'INR') => void;
  healthStatus: HealthStatus | null;
  // Site management
  sites: Site[];
  selectedSite: Site | null;
  selectSite: (site: Site | null) => void;
  // NEW: Enhanced RL
  rlStrategy: RLStrategy;
  setRlStrategy: React.Dispatch<React.SetStateAction<RLStrategy>>;
}

export const AppContext = createContext<AppContextType | null>(null);

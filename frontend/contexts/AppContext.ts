import { createContext, React } from 'react';
import { Telemetry, Alert, RLSuggestion, HealthStatus, Site, RLStrategy } from '../types';
import { GoogleGenAI } from '@google/genai';
import { User } from '../services/api';

interface AppContextType {
  isAuthenticated: boolean;
  currentUser: User | null;
  login: (token: string, user?: User) => void;
  logout: () => void;
  connectionStatus: string;
  latestTelemetry: Telemetry | null;
  alerts: Alert[];
  rlSuggestion: RLSuggestion | null;
  setAlerts: React.Dispatch<React.SetStateAction<Alert[]>>;
  setRlSuggestion: React.Dispatch<React.SetStateAction<RLSuggestion | null>>;
  theme: 'light' | 'dark';
  setTheme: (theme: 'light' | 'dark') => void;
  currency: 'USD' | 'EUR' | 'INR';
  setCurrency: (currency: 'USD' | 'EUR' | 'INR') => void;
  ai: GoogleGenAI | null;
  healthStatus: HealthStatus | null;
  // Site management
  sites: Site[];
  setSites: React.Dispatch<React.SetStateAction<Site[]>>;
  selectedSite: Site | null;
  selectSite: (site: Site | null) => void;
  // NEW: Enhanced RL
  rlStrategy: RLStrategy;
  setRlStrategy: React.Dispatch<React.SetStateAction<RLStrategy>>;
}

export const AppContext = createContext<AppContextType | null>(null);

import React, { useState, useEffect, useCallback } from 'react';
import { HashRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Sidebar from './components/layout/Sidebar';
import Header from './components/layout/Header';
import Footer from './components/layout/Footer';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import DashboardPage from './pages/DashboardPage';
import SiteDetailPage from './pages/SiteDetailPage';
import ImpactPage from './pages/ImpactPage';
import AlertsPage from './pages/AlertsPage';
import MaintenancePage from './pages/MaintenancePage';
import SimulatorPage from './pages/SimulatorPage';
import SettingsPage from './pages/SettingsPage';
import ProfilePage from './pages/ProfilePage';
import SiteSelectPage from './pages/SiteSelectPage';
import PredictionsPage from './pages/PredictionsPage';
import ManageSitesPage from './pages/ManageSitesPage';
import ManageAssetsPage from './pages/ManageAssetsPage';
import DigitalTwinPage from './pages/DigitalTwinPage';
import DemandOptimizationPage from './pages/DemandOptimizationPage';
import SourceOptimizationPage from './pages/SourceOptimizationPage';
import PostLoginWizardPage from './pages/PostLoginWizardPage';
import PlanningWizardPage from './pages/PlanningWizardPage';
import OptimizationSetupPage from './pages/OptimizationSetupPage';
import OptimizationResultsPage from './pages/OptimizationResultsPage';
import PlanningAndOptimizationPage from './pages/PlanningAndOptimizationPage';
import MainOptionsPage from './pages/MainOptionsPage';
import OptimizationFlowPage from './pages/OptimizationFlowPage';
import AIMLInsightsPage from './pages/AIMLInsightsPage';
import UnifiedDashboardPage from './pages/UnifiedDashboardPage';
import AIRecommendationsPage from './pages/AIRecommendationsPage';
import RenewableOptimizationPage from './pages/RenewableOptimizationPage';
import AIExplanationsPage from './pages/AIExplanationsPage';
import { AppContext } from './contexts/AppContext';
import { Telemetry, Alert, RLSuggestion, HealthStatus, Site, RLStrategy } from './types';
import { useWebSocket } from './hooks/useWebSocket';
import { GoogleGenAI } from '@google/genai';
import { fetchHealthStatus, fetchSites, User, getUserProfile } from './services/api';
import { io, Socket } from 'socket.io-client';

const App: React.FC = () => {
  const [showLanding, setShowLanding] = useState<boolean>(!localStorage.getItem('jwt') && !localStorage.getItem('hasSeenLanding'));
  const [showSignup, setShowSignup] = useState<boolean>(false);
  const [showSignupSuccess, setShowSignupSuccess] = useState<boolean>(false);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(!!localStorage.getItem('jwt'));
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const storedUser = localStorage.getItem('user');
    return storedUser ? JSON.parse(storedUser) : null;
  });
  const [isSidebarOpen, setSidebarOpen] = useState<boolean>(false);

  const [sites, setSites] = useState<Site[]>([]);
  const [selectedSite, setSelectedSite] = useState<Site | null>(null);
  const [hasCompletedWizard, setHasCompletedWizard] = useState<boolean | null>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [flowCompleted, setFlowCompleted] = useState<boolean>(false);

  const [theme, setTheme] = useState<'light' | 'dark'>(
    'light'
  );

  const [currency, setCurrency] = useState<'USD' | 'EUR' | 'INR'>(
    'INR'
  );

  const [rlStrategy, setRlStrategy] = useState<RLStrategy>({
    cost_priority: 70,
    grid_stability_priority: 20,
    battery_life_priority: 10,
  });

  const [healthStatus, setHealthStatus] = useState<HealthStatus | null>(null);
  const [latestTelemetry, setLatestTelemetry] = useState<Telemetry | null>(null);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [suggestions, setSuggestions] = useState<RLSuggestion[]>([]);
  const [socket, setSocket] = useState<Socket | null>(null);

  // Check wizard completion status
  useEffect(() => {
    const completed = localStorage.getItem('hasCompletedWizard');
    setHasCompletedWizard(completed === 'true');
  }, []);

  // Load user profile
  useEffect(() => {
    if (isAuthenticated) {
      getUserProfile()
        .then(profile => {
          if (profile) {
            setUserProfile(profile);
          }
        })
        .catch(err => console.error('Failed to load user profile:', err));
    }
  }, [isAuthenticated]);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setSidebarOpen(true);
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (isAuthenticated && selectedSite) {
      const token = localStorage.getItem('jwt');
      const socketUrl = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5001';
      const newSocket = io(socketUrl, {
        auth: { token },
        query: { siteId: selectedSite.id },
      });

      newSocket.on('connect', () => {
        console.log('✅ Socket.IO connected');
      });

      newSocket.on('disconnect', () => {
        console.log('❌ Socket.IO disconnected');
      });

      newSocket.on('telemetry_update', (data: Telemetry) => {
        setLatestTelemetry(data);
      });

      newSocket.on('alert', (data: Alert) => {
        setAlerts(prev => [data, ...prev]);
      });

      newSocket.on('rl_suggestion', (data: RLSuggestion) => {
        setSuggestions(prev => [data, ...prev]);
      });

      setSocket(newSocket);

      return () => {
        newSocket.close();
      };
    }
  }, [isAuthenticated, selectedSite]);

  useEffect(() => {
    if (isAuthenticated && selectedSite) {
      const loadHealthStatus = async () => {
        try {
          const status = await fetchHealthStatus(selectedSite.id);
          setHealthStatus(status);
        } catch (error) {
          console.error('Failed to load health status:', error);
        }
      };
      loadHealthStatus();
      const interval = setInterval(loadHealthStatus, 600000); // 10 minutes
      return () => clearInterval(interval);
    }
  }, [isAuthenticated, selectedSite]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchSites()
        .then(setSites)
        .catch(err => console.error('Failed to fetch sites:', err));
    }
  }, [isAuthenticated]);

  const login = (user: User, token: string) => {
    setIsAuthenticated(true);
    setCurrentUser(user);
    localStorage.setItem('jwt', token);
    localStorage.setItem('user', JSON.stringify(user));
    setShowLanding(false);
    setShowSignup(false);
  };

  const logout = () => {
    setIsAuthenticated(false);
    setCurrentUser(null);
    setSelectedSite(null);
    setHasCompletedWizard(null);
    localStorage.removeItem('jwt');
    localStorage.removeItem('user');
    localStorage.removeItem('selectedSite');
    localStorage.removeItem('hasCompletedWizard');
    if (socket) {
      socket.close();
      setSocket(null);
    }
    setShowLanding(true);
  };

  const selectSite = (site: Site | null) => {
    setSelectedSite(site);
    if (site) {
      localStorage.setItem('selectedSite', JSON.stringify(site));
    } else {
      localStorage.removeItem('selectedSite');
    }
  };

  const handleGetStarted = () => {
    setShowLanding(false);
    setShowSignup(false);
    if (!isAuthenticated) {
      // Show login page
    }
  };

  const handleBackToLanding = () => {
    setShowLanding(true);
    setShowSignup(false);
    setShowSignupSuccess(false);
  };

  const handleShowSignup = () => {
    setShowSignup(true);
  };

  const handleSignupSuccess = () => {
    setShowSignupSuccess(true);
    setShowSignup(false);
  };

  const handleBackToLogin = () => {
    setShowSignup(false);
    setShowSignupSuccess(false);
  };

  const appContextValue = {
    currentUser,
    isAuthenticated,
    sites,
    selectedSite,
    selectSite,
    healthStatus,
    latestTelemetry,
    alerts,
    suggestions,
    setSuggestions,
    currency,
    setCurrency,
    theme,
    setTheme,
    rlStrategy,
    setRlStrategy,
    connectionStatus: socket?.connected ? 'connected' : (isAuthenticated && selectedSite ? 'connecting' : 'disconnected'),
    logout,
  };

  // Layout wrapper component that conditionally shows sidebar
  const LayoutWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const location = useLocation();
    const isMainOptions = location.pathname === '/main-options' || location.pathname === '/';
    
    if (isMainOptions) {
      // Main Options - NO SIDEBAR, NO HEADER, NO FOOTER
      return <>{children}</>;
    }
    
    // All other pages - WITH SIDEBAR, HEADER, FOOTER
    return (
      <div className="flex h-screen flex-col">
        <div className="flex flex-1 overflow-hidden">
          <Sidebar isOpen={isSidebarOpen} setSidebarOpen={setSidebarOpen} />
          <div className="flex-1 flex flex-col overflow-hidden">
            <Header onToggleSidebar={() => setSidebarOpen(!isSidebarOpen)} />
            <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100 dark:bg-gray-800 p-4 md:p-6 lg:p-8">
              {children}
            </main>
            <Footer />
          </div>
        </div>
      </div>
    );
  };

  const renderContent = () => {
    if (showLanding) {
      return <LandingPage onGetStarted={handleGetStarted} />;
    }
    if (showSignup) {
      return (
        <SignupPage
          onSignupSuccess={handleSignupSuccess}
          onBackToLogin={handleBackToLogin}
          onBack={handleBackToLanding}
        />
      );
    }
    if (!isAuthenticated) {
      return (
        <LoginPage
          onLogin={login}
          onBack={handleBackToLanding}
          onSignupClick={handleShowSignup}
          showSignupSuccess={showSignupSuccess}
        />
      );
    }
    
    // Post-Login Wizard (if not completed)
    if (hasCompletedWizard === false) {
      return (
        <HashRouter>
          <Routes>
            <Route path="*" element={
              <PostLoginWizardPage 
                onComplete={() => {
                  setHasCompletedWizard(true);
                  // Update localStorage
                  localStorage.setItem('hasCompletedWizard', 'true');
                  // Navigate using window.location since we're in a separate router
                  setTimeout(() => {
                    window.location.hash = '#/main-options';
                  }, 100);
                }} 
              />
            } />
          </Routes>
        </HashRouter>
      );
    }
    
    // Main application with routing
    return (
      <HashRouter>
        <LayoutWrapper>
          <Routes>
            <Route path="/" element={<Navigate to="/main-options" />} />
            <Route path="/main-options" element={<MainOptionsPage />} />
            <Route path="/planning-wizard" element={<PlanningWizardPage />} />
            <Route path="/optimization-flow" element={<OptimizationFlowPage />} />
            <Route path="/optimization-setup" element={<OptimizationSetupPage />} />
            <Route path="/optimization-results" element={<OptimizationResultsPage />} />
            <Route path="/demand-optimization" element={<DemandOptimizationPage />} />
            <Route path="/source-optimization" element={<SourceOptimizationPage />} />
            <Route path="/ai-ml-insights" element={<AIMLInsightsPage />} />
            <Route path="/ai-recommendations" element={<AIRecommendationsPage />} />
            <Route path="/renewable-optimization" element={<RenewableOptimizationPage />} />
            <Route path="/ai-explanations" element={<AIExplanationsPage />} />
            <Route path="/unified-dashboard" element={<UnifiedDashboardPage />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/site-detail" element={<SiteDetailPage />} />
            <Route path="/impact" element={<ImpactPage />} />
            <Route path="/digital-twin" element={<DigitalTwinPage />} />
            <Route path="/planning-optimization" element={<PlanningAndOptimizationPage />} />
            <Route path="/alerts" element={<AlertsPage />} />
            <Route path="/maintenance" element={<MaintenancePage />} />
            <Route path="/simulator" element={<SimulatorPage />} />
            <Route path="/predictions" element={<PredictionsPage />} />
            <Route path="/manage-sites" element={<ManageSitesPage />} />
            <Route path="/manage-assets" element={<ManageAssetsPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Routes>
        </LayoutWrapper>
      </HashRouter>
    );
  };

  return (
    <AppContext.Provider value={appContextValue}>
      <div className="bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-100 min-h-screen">
        {renderContent()}
      </div>
    </AppContext.Provider>
  );
};

export default App;

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
import PlanningWizardPageEnhanced from './pages/PlanningWizardPageEnhanced';
import OptimizationSetupPage from './pages/OptimizationSetupPage';
import OptimizationResultsPage from './pages/OptimizationResultsPage';
import PlanningAndOptimizationPage from './pages/PlanningAndOptimizationPage';
import MainOptionsPage from './pages/MainOptionsPage';
import OptimizationFlowPage from './pages/OptimizationFlowPage';
import AIMLInsightsPage from './pages/AIMLInsightsPage';
import UnifiedDashboardPage from './pages/UnifiedDashboardPage';
import AIRecommendationsPage from './pages/AIRecommendationsPage';
import AIExplanationsPage from './pages/AIExplanationsPage';
import EnergyForecastingPage from './pages/EnergyForecastingPage';
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
  const [socketConnected, setSocketConnected] = useState<boolean>(false);

  // Check wizard completion status
  useEffect(() => {
    const completed = localStorage.getItem('hasCompletedWizard');
    setHasCompletedWizard(completed === 'true');
  }, []);

  // Sync user state from localStorage on mount and when authentication changes
  useEffect(() => {
    const token = localStorage.getItem('jwt');
    const storedUser = localStorage.getItem('user');
    
    if (token && storedUser) {
      try {
        const user = JSON.parse(storedUser);
        setIsAuthenticated(true);
        setCurrentUser(user);
      } catch (e) {
        console.error('Failed to parse user from localStorage:', e);
        // Clear invalid data
        localStorage.removeItem('jwt');
        localStorage.removeItem('user');
        setIsAuthenticated(false);
        setCurrentUser(null);
      }
    } else if (!token) {
      setIsAuthenticated(false);
      setCurrentUser(null);
    }
  }, []);

  // Load user profile
  useEffect(() => {
    if (isAuthenticated && currentUser) {
      getUserProfile()
        .then(profile => {
          if (profile) {
            setUserProfile(profile);
          }
        })
        .catch(err => console.error('Failed to load user profile:', err));
    }
  }, [isAuthenticated, currentUser]);

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
        console.log('✅ Socket.IO connected with ID:', newSocket.id);
        setSocketConnected(true);
        // Subscribe to the selected site's updates
        if (selectedSite) {
      newSocket.emit('subscribe_site', selectedSite.id);
          console.log(`📡 Subscribed to site: ${selectedSite.id}`);
        }
    });

      newSocket.on('disconnect', (reason) => {
        console.log('❌ Socket.IO disconnected. Reason:', reason);
        setSocketConnected(false);
    });

    newSocket.on('connect_error', (error) => {
        console.error('❌ Socket.IO connection error:', error.message);
        console.error('Socket URL:', socketUrl);
    });

      // Listen for site data updates (initial connection only, not frequent updates)
      let lastSiteDataUpdate = 0;
      newSocket.on('site_data', (data: any) => {
        const now = Date.now();
        // Only process initial site_data or if 10 minutes have passed
        if (lastSiteDataUpdate > 0 && now - lastSiteDataUpdate < 570000) {
          console.log('⏱️ Skipping site_data update - too soon since last update');
          return;
        }
        
        lastSiteDataUpdate = now;
        console.log('📊 Received initial site data:', data);
        // Convert to Telemetry format if needed
      if (data.metrics) {
          const telemetry: Telemetry = {
            timestamp: data.timestamp || new Date().toISOString(),
            site_id: data.siteId || selectedSite?.id || '',
            device_id: 'system',
            subsystem: 'System',
          metrics: {
              voltage: data.metrics.voltage?.value || 0,
              current: data.metrics.current?.value || 0,
              frequency: data.metrics.frequency?.value || 0,
              thd: data.metrics.thd?.value || 0,
              power_factor: data.metrics.power_factor?.value || 0.95,
              voltage_unbalance: data.metrics.voltage_unbalance?.value || 0,
              temp_c: data.metrics.temp_c?.value || 0,
            pv_generation: data.metrics.pv_generation?.value || 0,
            net_load: data.metrics.net_load?.value || 0,
            battery_discharge: data.metrics.battery_discharge?.value || 0,
              soc_batt: data.metrics.soc?.value || 0,
            }
          };
          setLatestTelemetry(telemetry);
        }
      });

      // Listen for metrics updates (broadcast from backend) - throttled to 10-minute intervals
      let lastMetricsUpdate = 0;
      newSocket.on('metrics_update', (data: any) => {
        const now = Date.now();
        // Only process updates if at least 9.5 minutes have passed since last update
        if (now - lastMetricsUpdate < 570000) { // 9.5 minutes = 570000ms
          console.log('⏱️ Skipping metrics update - too soon since last update');
          return;
        }
        
        lastMetricsUpdate = now;
        console.log('📊 Received metrics update (10-minute interval):', data);
        if (data.metrics) {
          const telemetry: Telemetry = {
            timestamp: data.timestamp || new Date().toISOString(),
            site_id: data.siteId || selectedSite?.id || '',
            device_id: 'system',
            subsystem: 'System',
            metrics: {
            voltage: data.metrics.voltage?.value || 0,
            current: data.metrics.current?.value || 0,
            frequency: data.metrics.frequency?.value || 0,
              thd: data.metrics.thd?.value || 0,
              power_factor: data.metrics.power_factor?.value || 0.95,
              voltage_unbalance: data.metrics.voltage_unbalance?.value || 0,
              temp_c: data.metrics.temp_c?.value || 0,
              pv_generation: data.metrics.pv_generation?.value || 0,
              net_load: data.metrics.net_load?.value || 0,
              battery_discharge: data.metrics.battery_discharge?.value || 0,
              soc_batt: data.metrics.soc?.value || 0,
            }
          };
          setLatestTelemetry(telemetry);
        }
      });

      newSocket.on('telemetry_update', (data: Telemetry) => {
        setLatestTelemetry(data);
      });

            newSocket.on('alert', (data: Alert) => {
              // Check if this is a power quality alert and avoid duplicates
              const isDuplicate = alerts.some(a => 
                a.id === data.id || 
                (a.message === data.message && a.status === 'active')
              );
              
              if (!isDuplicate) {
                setAlerts(prev => [data, ...prev]);
                // Show browser notification for critical/high power quality alerts
                if (data.severity === 'critical' || data.severity === 'high') {
                  if ('Notification' in window && Notification.permission === 'granted') {
                    new Notification(`Power Quality Alert: ${data.message}`, {
                      body: data.message,
                      icon: '/logo.jpeg',
                      tag: data.id
                    });
                  }
                }
              }
            });

      newSocket.on('rl_suggestion', (data: RLSuggestion) => {
        setSuggestions(prev => [data, ...prev]);
    });

    setSocket(newSocket);

    return () => {
        setSocketConnected(false);
        newSocket.close();
    };
    }
  }, [isAuthenticated, selectedSite]);

  const MIN_HEALTH_FETCH_INTERVAL = 20 * 60 * 1000; // 20 minutes minimum between fetches

  useEffect(() => {
      if (isAuthenticated && selectedSite) {
      const STORAGE_KEY = `lastHealthStatusFetch_${selectedSite.id}`;
      let intervalId: NodeJS.Timeout | null = null;
      let isMounted = true;

      const loadHealthStatus = async (force = false) => {
        const now = Date.now();
        const lastFetchStr = localStorage.getItem(STORAGE_KEY);
        const lastFetchTime = lastFetchStr ? parseInt(lastFetchStr, 10) : 0;
        const timeSinceLastFetch = now - lastFetchTime;
        
        // Throttle: Only fetch if enough time has passed or if forced (initial load)
        if (!force && timeSinceLastFetch < MIN_HEALTH_FETCH_INTERVAL) {
          console.log(`⏱️ Skipping health status fetch - only ${Math.round(timeSinceLastFetch / 1000 / 60)} minutes since last fetch (need 20 minutes)`);
          return;
        }
        
        // Store the fetch time immediately to prevent concurrent calls
        localStorage.setItem(STORAGE_KEY, now.toString());
        
        try {
          console.log(`📡 Fetching health status for site ${selectedSite.id} at ${new Date().toLocaleTimeString()}`);
          const status = await fetchHealthStatus(selectedSite.id);
          
          if (isMounted) {
          setHealthStatus(status);
          }
        } catch (error) {
          console.error('Failed to load health status:', error);
          // Reset the timestamp on error so it can retry
          if (!force) {
            localStorage.setItem(STORAGE_KEY, (now - MIN_HEALTH_FETCH_INTERVAL + 60000).toString()); // Allow retry after 1 minute
          }
        }
      };
      
      // Check if we should do initial load
      const lastFetchStr = localStorage.getItem(STORAGE_KEY);
      const lastFetchTime = lastFetchStr ? parseInt(lastFetchStr, 10) : 0;
      const timeSinceLastFetch = Date.now() - lastFetchTime;
      const shouldLoadInitial = timeSinceLastFetch >= MIN_HEALTH_FETCH_INTERVAL || lastFetchTime === 0;

      if (shouldLoadInitial) {
        // Initial load
        loadHealthStatus(true);
      } else {
        const minutesRemaining = Math.ceil((MIN_HEALTH_FETCH_INTERVAL - timeSinceLastFetch) / 60000);
        console.log(`⏱️ Skipping initial health status fetch - ${minutesRemaining} minutes until next fetch`);
      }
      
      // Refresh every 20 minutes (longer interval to reduce API calls)
      intervalId = setInterval(() => {
        loadHealthStatus(false);
      }, 20 * 60 * 1000); // 20 minutes
      
      return () => {
        isMounted = false;
        if (intervalId) {
          clearInterval(intervalId);
        }
      };
    }
  }, [isAuthenticated, selectedSite?.id]); // Only depend on selectedSite.id to avoid unnecessary re-runs

  useEffect(() => {
    if (isAuthenticated) {
      fetchSites()
        .then(setSites)
        .catch(err => console.error('Failed to fetch sites:', err));
    }
  }, [isAuthenticated]);

  // Load selected site from localStorage after sites are fetched
  useEffect(() => {
    if (sites.length > 0) {
      const savedSiteId = localStorage.getItem('selectedSiteId');
      if (savedSiteId && !selectedSite) {
        // Find the site in the current sites list by ID
        const matchingSite = sites.find(s => s.id === savedSiteId);
        if (matchingSite) {
          setSelectedSite(matchingSite);
          console.log('✅ Restored selected site from localStorage:', matchingSite.name);
        } else {
          // Site no longer exists, clear from localStorage
          localStorage.removeItem('selectedSiteId');
          localStorage.removeItem('selectedSite');
          console.log('⚠️ Previously selected site not found, cleared from storage');
        }
      } else if (!savedSiteId && sites.length > 0 && !selectedSite) {
        // Auto-select the first site if none is selected
        setSelectedSite(sites[0]);
        localStorage.setItem('selectedSiteId', sites[0].id);
        console.log('✅ Auto-selected first site:', sites[0].name);
      }
    }
  }, [sites]);

  const login = (user: User, token: string) => {
    console.log('Login called with user:', user, 'token:', token ? 'present' : 'missing');
    if (!user || !token) {
      console.error('Login called with invalid parameters:', { user, token });
      return;
    }
    setIsAuthenticated(true);
    setCurrentUser(user);
    localStorage.setItem('jwt', token);
    localStorage.setItem('user', JSON.stringify(user));
    setShowLanding(false);
    setShowSignup(false);
    console.log('User logged in successfully:', user.email);
  };

  const logout = () => {
    setIsAuthenticated(false);
    setCurrentUser(null);
    setSelectedSite(null);
    setHasCompletedWizard(null);
    setSocketConnected(false);
    localStorage.removeItem('jwt');
    localStorage.removeItem('user');
    localStorage.removeItem('selectedSiteId');
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
      localStorage.setItem('selectedSiteId', site.id);
      localStorage.setItem('selectedSite', JSON.stringify(site));
      console.log('✅ Site selected and saved:', site.name);
    } else {
      localStorage.removeItem('selectedSiteId');
      localStorage.removeItem('selectedSite');
      console.log('✅ Site selection cleared');
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
    connectionStatus: socketConnected ? 'connected' : (isAuthenticated && selectedSite ? 'connecting' : 'disconnected'),
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
            <Route path="/planning-wizard" element={<PlanningWizardPageEnhanced />} />
            <Route path="/planning-wizard-old" element={<PlanningWizardPage />} />
            <Route path="/optimization-flow" element={<OptimizationFlowPage />} />
            <Route path="/optimization-setup" element={<OptimizationSetupPage />} />
            <Route path="/optimization-results" element={<OptimizationResultsPage />} />
            <Route path="/demand-optimization" element={<DemandOptimizationPage />} />
            <Route path="/source-optimization" element={<SourceOptimizationPage />} />
            <Route path="/ai-ml-insights" element={<AIMLInsightsPage />} />
            <Route path="/energy-forecasting" element={<EnergyForecastingPage />} />
            <Route path="/ai-recommendations" element={<AIRecommendationsPage />} />
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

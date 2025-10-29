# VidyutAI Frontend

React + TypeScript frontend for the VidyutAI Realtime Dashboard.

## Overview

Modern, responsive web application for real-time energy monitoring and management. Built with React 19, TypeScript, and Vite for optimal performance.

## Features

- **Real-time Dashboard**: Live energy consumption monitoring
- **Multi-site Management**: Manage multiple energy facilities
- **Interactive Charts**: Powered by Recharts
- **WebSocket Integration**: Real-time data updates
- **Responsive Design**: Works on desktop, tablet, and mobile
- **AI-Powered Insights**: Anomaly detection and predictions
- **Digital Twin**: Virtual representation of energy systems

## Technology Stack

- **React 19**: Latest React with concurrent features
- **TypeScript**: Type-safe development
- **Vite**: Lightning-fast build tool
- **React Router**: Client-side routing
- **Recharts**: Data visualization
- **Lucide React**: Modern icon library
- **Google Gemini AI**: AI-powered chat assistance

## Project Structure

```
frontend/
├── components/
│   ├── layout/                # Layout components
│   │   ├── Header.tsx
│   │   └── Sidebar.tsx
│   │
│   ├── shared/                # Reusable components
│   │   ├── AlertCard.tsx
│   │   ├── MetricCard.tsx
│   │   ├── SiteCard.tsx
│   │   └── ...
│   │
│   └── ui/                    # Base UI components
│       ├── Button.tsx
│       ├── Card.tsx
│       └── Modal.tsx
│
├── pages/                     # Page components
│   ├── DashboardPage.tsx
│   ├── SiteSelectPage.tsx
│   ├── SiteDetailPage.tsx
│   ├── AlertsPage.tsx
│   ├── PredictionsPage.tsx
│   ├── ManageSitesPage.tsx
│   ├── ManageAssetsPage.tsx
│   ├── MaintenancePage.tsx
│   ├── DigitalTwinPage.tsx
│   ├── SimulatorPage.tsx
│   ├── SettingsPage.tsx
│   ├── ProfilePage.tsx
│   └── LoginPage.tsx
│
├── services/                  # API services
│   ├── api.ts                 # API client
│   └── mockData.ts            # Mock data for development
│
├── contexts/                  # React contexts
│   └── AppContext.ts          # Global app state
│
├── hooks/                     # Custom hooks
│   └── useWebSocket.ts        # WebSocket hook
│
├── utils/                     # Utility functions
│   └── currency.ts            # Currency formatting
│
├── types.ts                   # TypeScript type definitions
├── App.tsx                    # Main app component
├── index.tsx                  # Entry point
├── index.html                 # HTML template
├── vite.config.ts             # Vite configuration
├── tsconfig.json              # TypeScript configuration
└── package.json               # Dependencies
```

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Configuration

Create a `.env` file (optional, defaults are provided):

```bash
VITE_API_URL=http://localhost:8000
VITE_API_BASE_URL=http://localhost:8000/api/v1
VITE_WS_URL=ws://localhost:8000
```

### 3. Run Development Server

```bash
npm run dev
```

Or use the convenience script from the root:
```bash
# From project root
./start-frontend.sh
```

The app will be available at http://localhost:5173

## Available Scripts

### Development

```bash
npm run dev          # Start development server
```

### Production

```bash
npm run build        # Build for production
npm run preview      # Preview production build
```

## Features Guide

### Dashboard

The main dashboard provides:
- Real-time metrics (power, energy, efficiency)
- Recent alerts
- Quick statistics
- Site overview

### Site Management

- View all sites
- Add new sites
- Edit site details
- Monitor site-specific metrics

### Alerts System

- Real-time alert notifications
- Alert severity levels (critical, high, medium, low)
- Alert acknowledgment
- Alert history

### Predictions

- AI-powered anomaly detection
- Predictive maintenance recommendations
- Energy optimization suggestions
- Historical pattern analysis

### Digital Twin

- Virtual representation of energy systems
- Real-time simulation
- Scenario testing
- Performance prediction

## API Integration

The frontend communicates with the backend via:

### REST API

```typescript
import { api } from './services/api';

// Fetch sites
const sites = await api.get('/sites');

// Create alert
await api.post('/alerts', alertData);
```

### WebSocket

```typescript
import { useWebSocket } from './hooks/useWebSocket';

function Component() {
  const { data, isConnected } = useWebSocket('ws://localhost:8000/ws/site/1');
  
  return <div>{data?.power} kW</div>;
}
```

## Component Development

### Creating New Components

```tsx
// components/shared/MyComponent.tsx
import React from 'react';

interface MyComponentProps {
  title: string;
  value: number;
}

export const MyComponent: React.FC<MyComponentProps> = ({ title, value }) => {
  return (
    <div className="my-component">
      <h3>{title}</h3>
      <span>{value}</span>
    </div>
  );
};
```

### Using TypeScript

All components should use TypeScript for type safety:

```tsx
import { Site, Metric } from '../types';

interface DashboardProps {
  site: Site;
  metrics: Metric[];
}

export const Dashboard: React.FC<DashboardProps> = ({ site, metrics }) => {
  // Component logic
};
```

## Styling

The project uses inline styles and CSS modules. Main colors:

```css
--primary: #6366f1      /* Indigo */
--secondary: #10b981    /* Green */
--danger: #ef4444       /* Red */
--warning: #f59e0b      /* Amber */
--info: #3b82f6         /* Blue */
```

## State Management

### Context API

```tsx
import { AppContext } from './contexts/AppContext';

function Component() {
  const { currentSite, setCurrentSite } = useContext(AppContext);
  
  return <div>{currentSite?.name}</div>;
}
```

### Local State

```tsx
const [metrics, setMetrics] = useState<Metric[]>([]);

useEffect(() => {
  fetchMetrics().then(setMetrics);
}, []);
```

## Routing

```tsx
import { BrowserRouter, Routes, Route } from 'react-router-dom';

<BrowserRouter>
  <Routes>
    <Route path="/" element={<SiteSelectPage />} />
    <Route path="/dashboard/:siteId" element={<DashboardPage />} />
    <Route path="/alerts" element={<AlertsPage />} />
  </Routes>
</BrowserRouter>
```

## Building for Production

```bash
# Build optimized bundle
npm run build

# Output will be in 'dist/' directory
# Deploy contents of 'dist/' to your web server
```

### Production Checklist

- [ ] Update API URLs in environment variables
- [ ] Enable production mode
- [ ] Optimize images and assets
- [ ] Test on different devices/browsers
- [ ] Enable HTTPS
- [ ] Configure CDN (optional)

## Performance Optimization

The app uses several optimization techniques:

- **Code Splitting**: Automatic via Vite
- **Lazy Loading**: For heavy components
- **Memoization**: Using React.memo() for expensive components
- **Virtual Scrolling**: For large lists (if needed)

## Troubleshooting

### Dependencies Issues

```bash
rm -rf node_modules package-lock.json
npm install
```

### TypeScript Errors

```bash
# Check types
npx tsc --noEmit
```

### Build Failures

```bash
# Clear Vite cache
rm -rf node_modules/.vite
npm run dev
```

### WebSocket Connection Issues

Check that:
1. Backend is running on correct port
2. WebSocket URL is correct in config
3. CORS is properly configured on backend

## Browser Support

- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)
- Mobile browsers (iOS Safari, Chrome Android)

## Contributing

1. Create a feature branch
2. Follow TypeScript best practices
3. Add proper type definitions
4. Test on multiple browsers
5. Submit a pull request

## License

See main project LICENSE file.

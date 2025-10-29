const express = require('express');
const router = express.Router();

// Mock data (replace with database calls later)
const mockSites = [
  {
    id: '1',
    name: 'Solar Plant A',
    location: 'Gujarat, India',
    type: 'Solar',
    capacity: 2500,
    status: 'online',
    installedDate: '2023-01-15',
    coordinates: { lat: 23.0225, lng: 72.5714 }
  },
  {
    id: '2',
    name: 'Wind Farm B',
    location: 'Tamil Nadu, India',
    type: 'Wind',
    capacity: 3000,
    status: 'online',
    installedDate: '2022-06-20',
    coordinates: { lat: 11.1271, lng: 78.6569 }
  }
];

// GET all sites
router.get('/', (req, res) => {
  res.json({
    success: true,
    count: mockSites.length,
    data: mockSites
  });
});

// GET single site by ID
router.get('/:id', (req, res) => {
  const site = mockSites.find(s => s.id === req.params.id);
  
  if (!site) {
    return res.status(404).json({
      success: false,
      error: 'Site not found'
    });
  }
  
  res.json({
    success: true,
    data: site
  });
});

// POST create new site
router.post('/', (req, res) => {
  const newSite = {
    id: String(mockSites.length + 1),
    ...req.body,
    status: 'online',
    installedDate: new Date().toISOString().split('T')[0]
  };
  
  mockSites.push(newSite);
  
  res.status(201).json({
    success: true,
    data: newSite
  });
});

// PUT update site
router.put('/:id', (req, res) => {
  const index = mockSites.findIndex(s => s.id === req.params.id);
  
  if (index === -1) {
    return res.status(404).json({
      success: false,
      error: 'Site not found'
    });
  }
  
  mockSites[index] = { ...mockSites[index], ...req.body };
  
  res.json({
    success: true,
    data: mockSites[index]
  });
});

// DELETE site
router.delete('/:id', (req, res) => {
  const index = mockSites.findIndex(s => s.id === req.params.id);
  
  if (index === -1) {
    return res.status(404).json({
      success: false,
      error: 'Site not found'
    });
  }
  
  mockSites.splice(index, 1);
  
  res.json({
    success: true,
    message: 'Site deleted successfully'
  });
});

// GET health status for a site
router.get('/:id/health-status', (req, res) => {
  const site = mockSites.find(s => s.id === req.params.id);
  
  if (!site) {
    return res.status(404).json({
      success: false,
      error: 'Site not found'
    });
  }
  
  // Return mock health status
  const healthStatus = {
    siteId: req.params.id,
    timestamp: new Date().toISOString(),
    site_health: 92 + Math.random() * 8,
    pv_health: 92 + Math.random() * 8,
    battery_soh: 88 + Math.random() * 10,
    battery_soc: 75 + Math.random() * 15,
    inverter_health: 95 + Math.random() * 5,
    ev_charger_health: 90 + Math.random() * 8,
    motor_health: 85 + Math.random() * 12,
    grid_draw: 150 + Math.random() * 100,
    pv_generation_today: 850 + Math.random() * 200,
    overall_health: 90 + Math.random() * 8
  };
  
  res.json(healthStatus);
});

// GET alerts for a site
router.get('/:id/alerts', (req, res) => {
  const site = mockSites.find(s => s.id === req.params.id);
  
  if (!site) {
    return res.status(404).json({
      success: false,
      error: 'Site not found'
    });
  }
  
  // Return mock alerts
  const alerts = [
    {
      id: '1',
      siteId: req.params.id,
      type: 'warning',
      severity: 'medium',
      title: 'Battery SOC Low',
      message: 'Battery state of charge is below 20%',
      timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
      status: 'active'
    }
  ];
  
  res.json(alerts);
});

// GET assets for a site
router.get('/:id/assets', (req, res) => {
  const site = mockSites.find(s => s.id === req.params.id);
  
  if (!site) {
    return res.status(404).json({
      success: false,
      error: 'Site not found'
    });
  }
  
  // Return mock assets
  const assets = [
    {
      id: '1',
      siteId: req.params.id,
      name: 'Solar Panel Array 1',
      type: 'Solar Panel',
      model: 'SP-500W',
      status: 'operational',
      health: 95,
      failure_probability: 0.05,
      rank: 1
    },
    {
      id: '2',
      siteId: req.params.id,
      name: 'Inverter Unit A',
      type: 'Inverter',
      model: 'INV-100kW',
      status: 'operational',
      health: 88,
      failure_probability: 0.12,
      rank: 2
    }
  ];
  
  res.json(assets);
});

// GET timeseries data for a site
router.get('/:id/timeseries', (req, res) => {
  const site = mockSites.find(s => s.id === req.params.id);
  
  if (!site) {
    return res.status(404).json({
      success: false,
      error: 'Site not found'
    });
  }
  
  const { range = 'last_6h' } = req.query;
  const points = range === 'last_6h' ? 72 : range === 'last_24h' ? 288 : 72;
  const timeseries = [];
  
  for (let i = points; i >= 0; i--) {
    const timestamp = new Date(Date.now() - i * 5 * 60 * 1000); // 5-minute intervals
    timeseries.push({
      timestamp: timestamp.toISOString(),
      metrics: {
        voltage: 410 + Math.random() * 20 + Math.sin(i / 10) * 5,
        current: 120 + Math.random() * 30 + Math.sin(i / 8) * 10,
        frequency: 49.8 + Math.random() * 0.4,
        pv_generation: 500 + Math.random() * 300 + Math.sin(i / 12) * 200,
        net_load: 400 + Math.random() * 200,
        battery_discharge: Math.random() * 100,
        grid_draw: 100 + Math.random() * 150,
        soc: 60 + Math.random() * 20
      }
    });
  }
  
  res.json(timeseries);
});

// GET RL suggestions for a site
router.get('/:id/suggestions', (req, res) => {
  const site = mockSites.find(s => s.id === req.params.id);
  
  if (!site) {
    return res.status(404).json({
      success: false,
      error: 'Site not found'
    });
  }
  
  // Return mock RL suggestions
  const suggestions = [
    {
      id: '1',
      type: 'cost_optimization',
      title: 'Reduce Grid Draw During Peak Hours',
      description: 'Increase battery discharge between 6 PM - 9 PM to save ₹2,500/day',
      status: 'pending',
      priority: 'high',
      estimatedSavings: 2500,
      estimated_cost_savings: 2500,
      action_summary: 'Reduce grid draw by 50 kW and increase battery discharge during peak hours',
      timestamp: new Date().toISOString(),
      current_flows: {
        grid_to_load: 150,
        pv_to_load: 300,
        pv_to_battery: 200,
        battery_to_load: 50,
        battery_to_grid: 0,
        pv_to_grid: 0
      },
      suggested_flows: {
        grid_to_load: 100,
        pv_to_load: 300,
        pv_to_battery: 150,
        battery_to_load: 100,
        battery_to_grid: 0,
        pv_to_grid: 0
      }
    }
  ];
  
  res.json(suggestions);
});

// POST accept RL suggestion
router.post('/:id/suggestions/:suggestionId/accept', (req, res) => {
  res.json({
    success: true,
    schedule: 'Implementation scheduled for tomorrow at 6:00 AM'
  });
});

// POST reject RL suggestion
router.post('/:id/suggestions/:suggestionId/reject', (req, res) => {
  res.json({
    success: true
  });
});

// POST update RL strategy
router.post('/:id/rl-strategy', (req, res) => {
  res.json({
    success: true,
    message: 'RL strategy updated successfully'
  });
});

module.exports = router;


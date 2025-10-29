const express = require('express');
const router = express.Router();

// Mock alerts data
const mockAlerts = [
  {
    id: '1',
    siteId: '1',
    siteName: 'Solar Plant A',
    type: 'anomaly',
    severity: 'high',
    title: 'Unusual Power Drop',
    message: 'Power output dropped by 30% in the last hour',
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    status: 'active',
    acknowledged: false
  },
  {
    id: '2',
    siteId: '2',
    siteName: 'Wind Farm B',
    type: 'maintenance',
    severity: 'medium',
    title: 'Scheduled Maintenance Due',
    message: 'Turbine #5 requires maintenance within 7 days',
    timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
    status: 'active',
    acknowledged: false
  }
];

// GET all alerts
router.get('/', (req, res) => {
  const { severity, status, siteId } = req.query;
  
  let filteredAlerts = [...mockAlerts];
  
  if (severity) {
    filteredAlerts = filteredAlerts.filter(a => a.severity === severity);
  }
  
  if (status) {
    filteredAlerts = filteredAlerts.filter(a => a.status === status);
  }
  
  if (siteId) {
    filteredAlerts = filteredAlerts.filter(a => a.siteId === siteId);
  }
  
  res.json({
    success: true,
    count: filteredAlerts.length,
    data: filteredAlerts
  });
});

// GET single alert
router.get('/:id', (req, res) => {
  const alert = mockAlerts.find(a => a.id === req.params.id);
  
  if (!alert) {
    return res.status(404).json({
      success: false,
      error: 'Alert not found'
    });
  }
  
  res.json({
    success: true,
    data: alert
  });
});

// POST acknowledge alert
router.post('/:id/acknowledge', (req, res) => {
  const alert = mockAlerts.find(a => a.id === req.params.id);
  
  if (!alert) {
    return res.status(404).json({
      success: false,
      error: 'Alert not found'
    });
  }
  
  alert.acknowledged = true;
  alert.acknowledgedAt = new Date().toISOString();
  alert.acknowledgedBy = req.body.userId || 'user';
  
  res.json({
    success: true,
    data: alert
  });
});

// PUT resolve alert
router.put('/:id/resolve', (req, res) => {
  const alert = mockAlerts.find(a => a.id === req.params.id);
  
  if (!alert) {
    return res.status(404).json({
      success: false,
      error: 'Alert not found'
    });
  }
  
  alert.status = 'resolved';
  alert.resolvedAt = new Date().toISOString();
  alert.resolution = req.body.resolution || 'Resolved';
  
  res.json({
    success: true,
    data: alert
  });
});

// POST analyze root cause of alert
router.post('/analyze-root-cause', (req, res) => {
  const alert = req.body;
  
  // Mock root cause analysis based on alert type
  let analysis = '';
  
  if (alert.title?.toLowerCase().includes('battery')) {
    analysis = `Root Cause Analysis for "${alert.title}":\n\n` +
      `1. Battery Discharge Pattern: The battery has been discharging at a higher rate than usual during peak hours.\n\n` +
      `2. Contributing Factors:\n` +
      `   • Grid electricity prices are at peak levels (₹8/kWh)\n` +
      `   • Solar PV generation is lower than forecast\n` +
      `   • Load demand increased by 15% compared to historical average\n\n` +
      `3. Recommendations:\n` +
      `   • Consider reducing non-critical loads during peak hours\n` +
      `   • Optimize battery discharge schedule to maintain 20%+ SoC\n` +
      `   • Schedule battery health check within next week`;
  } else if (alert.title?.toLowerCase().includes('power')) {
    analysis = `Root Cause Analysis for "${alert.title}":\n\n` +
      `1. Power Output Variation: Detected 30% drop in power output.\n\n` +
      `2. Potential Causes:\n` +
      `   • Cloud cover or weather changes affecting solar irradiance\n` +
      `   • Possible inverter efficiency reduction\n` +
      `   • Shading on solar panels\n\n` +
      `3. Recommendations:\n` +
      `   • Inspect solar panel array for shading or debris\n` +
      `   • Check inverter performance metrics\n` +
      `   • Review weather forecast for next 24 hours`;
  } else {
    analysis = `Root Cause Analysis for "${alert.title || 'Unknown Alert'}":\n\n` +
      `1. Initial Assessment: Automated analysis detected an anomaly in system behavior.\n\n` +
      `2. Current Status:\n` +
      `   • System health: 99.7%\n` +
      `   • All subsystems operational\n` +
      `   • No immediate action required\n\n` +
      `3. Recommendations:\n` +
      `   • Continue monitoring\n` +
      `   • Schedule routine inspection\n` +
      `   • Review historical data for patterns`;
  }
  
  res.set('Content-Type', 'text/plain');
  res.send(analysis);
});

module.exports = router;


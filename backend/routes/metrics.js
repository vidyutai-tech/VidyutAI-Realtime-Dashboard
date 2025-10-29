const express = require('express');
const router = express.Router();

// GET metrics for a site
router.get('/site/:siteId', (req, res) => {
  const { siteId } = req.params;
  const { period = '24h' } = req.query;
  
  // Generate mock metrics data
  const metrics = {
    siteId,
    period,
    timestamp: new Date().toISOString(),
    current: {
      power: (1000 + Math.random() * 500).toFixed(2),
      energy: (15000 + Math.random() * 2000).toFixed(2),
      efficiency: (85 + Math.random() * 10).toFixed(2),
      cost: (45 + Math.random() * 10).toFixed(2),
      carbonOffset: (12 + Math.random() * 3).toFixed(2)
    },
    daily: {
      peakPower: 1850,
      totalEnergy: 22500,
      avgEfficiency: 91.2,
      totalCost: 67.50
    },
    history: generateHistoryData(period)
  };
  
  res.json({
    success: true,
    data: metrics
  });
});

// GET real-time metrics
router.get('/realtime/:siteId', (req, res) => {
  const { siteId } = req.params;
  
  const realtimeData = {
    siteId,
    timestamp: new Date().toISOString(),
    power: (1000 + Math.random() * 500).toFixed(2),
    voltage: (415 + Math.random() * 10).toFixed(2),
    current: (120 + Math.random() * 20).toFixed(2),
    frequency: (49.8 + Math.random() * 0.4).toFixed(2),
    powerFactor: (0.85 + Math.random() * 0.1).toFixed(2),
    temperature: (25 + Math.random() * 10).toFixed(1)
  };
  
  res.json({
    success: true,
    data: realtimeData
  });
});

// Helper function to generate history data
function generateHistoryData(period) {
  const points = period === '24h' ? 24 : period === '7d' ? 168 : 720;
  const history = [];
  const now = new Date();
  
  for (let i = points; i >= 0; i--) {
    const timestamp = new Date(now - i * 60 * 60 * 1000);
    history.push({
      timestamp: timestamp.toISOString(),
      power: (1000 + Math.random() * 500).toFixed(2),
      energy: (500 + Math.random() * 200).toFixed(2),
      efficiency: (85 + Math.random() * 10).toFixed(2)
    });
  }
  
  return history;
}

module.exports = router;


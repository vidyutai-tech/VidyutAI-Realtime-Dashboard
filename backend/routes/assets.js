const express = require('express');
const router = express.Router();

// Mock assets data
const mockAssets = [
  {
    id: '1',
    siteId: '1',
    name: 'Solar Panel Array 1',
    type: 'Solar Panel',
    model: 'SP-500W',
    manufacturer: 'SolarTech',
    capacity: 500,
    status: 'operational',
    health: 95,
    installedDate: '2023-01-15',
    lastMaintenance: '2024-09-15'
  },
  {
    id: '2',
    siteId: '1',
    name: 'Inverter Unit A',
    type: 'Inverter',
    model: 'INV-100kW',
    manufacturer: 'PowerInv',
    capacity: 100,
    status: 'operational',
    health: 88,
    installedDate: '2023-01-15',
    lastMaintenance: '2024-08-20'
  }
];

// GET all assets
router.get('/', (req, res) => {
  const { siteId, type, status } = req.query;
  
  let filteredAssets = [...mockAssets];
  
  if (siteId) {
    filteredAssets = filteredAssets.filter(a => a.siteId === siteId);
  }
  
  if (type) {
    filteredAssets = filteredAssets.filter(a => a.type === type);
  }
  
  if (status) {
    filteredAssets = filteredAssets.filter(a => a.status === status);
  }
  
  res.json({
    success: true,
    count: filteredAssets.length,
    data: filteredAssets
  });
});

// GET single asset
router.get('/:id', (req, res) => {
  const asset = mockAssets.find(a => a.id === req.params.id);
  
  if (!asset) {
    return res.status(404).json({
      success: false,
      error: 'Asset not found'
    });
  }
  
  res.json({
    success: true,
    data: asset
  });
});

// POST create asset
router.post('/', (req, res) => {
  const newAsset = {
    id: String(mockAssets.length + 1),
    ...req.body,
    status: 'operational',
    health: 100,
    installedDate: new Date().toISOString().split('T')[0]
  };
  
  mockAssets.push(newAsset);
  
  res.status(201).json({
    success: true,
    data: newAsset
  });
});

// PUT update asset
router.put('/:id', (req, res) => {
  const index = mockAssets.findIndex(a => a.id === req.params.id);
  
  if (index === -1) {
    return res.status(404).json({
      success: false,
      error: 'Asset not found'
    });
  }
  
  mockAssets[index] = { ...mockAssets[index], ...req.body };
  
  res.json({
    success: true,
    data: mockAssets[index]
  });
});

// DELETE asset
router.delete('/:id', (req, res) => {
  const index = mockAssets.findIndex(a => a.id === req.params.id);
  
  if (index === -1) {
    return res.status(404).json({
      success: false,
      error: 'Asset not found'
    });
  }
  
  mockAssets.splice(index, 1);
  
  res.json({
    success: true,
    message: 'Asset deleted successfully'
  });
});

// GET digital twin data for an asset
router.get('/:id/digital-twin', (req, res) => {
  const asset = mockAssets.find(a => a.id === req.params.id);
  
  if (!asset) {
    return res.status(404).json({
      success: false,
      error: 'Asset not found'
    });
  }
  
  // Generate mock digital twin data points
  const now = Date.now();
  
  // Current real-time sensor values with predictions
  const dataPoints = [
    {
      label: 'Temperature',
      real_value: 78.5 + Math.random() * 5,
      predicted_value: 80,
      unit: '°C',
      x: 100,
      y: 50
    },
    {
      label: 'Vibration',
      real_value: 0.6 + Math.random() * 0.2,
      predicted_value: 0.5,
      unit: 'mm/s',
      x: 300,
      y: 50
    },
    {
      label: 'Efficiency',
      real_value: 92 + Math.random() * 5,
      predicted_value: 94,
      unit: '%',
      x: 100,
      y: 150
    },
    {
      label: 'Power Output',
      real_value: 480 + Math.random() * 40,
      predicted_value: 500,
      unit: 'kW',
      x: 300,
      y: 150
    }
  ];
  
  // Generate mock anomalies
  const anomalies = [];
  
  // Add 1-2 random anomalies
  if (Math.random() > 0.3) {
    anomalies.push({
      id: '1',
      assetId: req.params.id,
      type: 'temperature_spike',
      severity: 'medium',
      timestamp: new Date(now - 15 * 60 * 1000).toISOString(),
      description: 'Temperature exceeded normal range by 8°C',
      value: 93.5,
      threshold: 85,
      confidence: 0.89
    });
  }
  
  if (Math.random() > 0.5) {
    anomalies.push({
      id: '2',
      assetId: req.params.id,
      type: 'efficiency_drop',
      severity: 'low',
      timestamp: new Date(now - 45 * 60 * 1000).toISOString(),
      description: 'Efficiency dropped below expected value',
      value: 82.3,
      threshold: 90,
      confidence: 0.76
    });
  }
  
  res.json({
    dataPoints,
    anomalies
  });
});

module.exports = router;


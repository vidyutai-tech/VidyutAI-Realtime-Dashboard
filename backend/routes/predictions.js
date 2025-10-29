const express = require('express');
const router = express.Router();
const axios = require('axios');

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';

// GET anomaly predictions
router.get('/anomalies', async (req, res) => {
  const { siteId } = req.query;
  
  try {
    // Try to call AI service, fall back to mock data if not available
    try {
      const response = await axios.get(`${AI_SERVICE_URL}/api/v1/anomalies`, {
        params: { siteId },
        timeout: 3000
      });
      return res.json(response.data);
    } catch (aiError) {
      // AI service not available, return mock data
      const mockAnomalies = {
        success: true,
        siteId: siteId || 'all',
        timestamp: new Date().toISOString(),
        data: [
          {
            id: '1',
            siteId: '1',
            type: 'power_drop',
            severity: 'high',
            timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
            value: 850,
            expectedValue: 1200,
            deviation: -29.2,
            confidence: 0.94
          }
        ]
      };
      
      res.json(mockAnomalies);
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch anomalies',
      message: error.message
    });
  }
});

// GET predictive maintenance
router.get('/maintenance', async (req, res) => {
  const { siteId, assetId } = req.query;
  
  try {
    // Try to call AI service
    try {
      const response = await axios.get(`${AI_SERVICE_URL}/api/v1/maintenance`, {
        params: { siteId, assetId },
        timeout: 3000
      });
      return res.json(response.data);
    } catch (aiError) {
      // Return mock data
      const mockMaintenance = {
        success: true,
        siteId: siteId || 'all',
        timestamp: new Date().toISOString(),
        data: [
          {
            id: '1',
            assetId: '2',
            assetName: 'Inverter Unit A',
            type: 'preventive',
            priority: 'medium',
            predictedFailureDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
            daysUntilMaintenance: 7,
            confidence: 0.87,
            recommendation: 'Schedule inspection of inverter cooling system',
            estimatedCost: 5000
          }
        ]
      };
      
      res.json(mockMaintenance);
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch maintenance predictions',
      message: error.message
    });
  }
});

// GET energy forecast
router.get('/forecast', async (req, res) => {
  const { siteId, horizon = '24h' } = req.query;
  
  try {
    // Try to call AI service
    try {
      const response = await axios.get(`${AI_SERVICE_URL}/api/v1/forecast`, {
        params: { siteId, horizon },
        timeout: 3000
      });
      return res.json(response.data);
    } catch (aiError) {
      // Return mock data
      const hours = horizon === '24h' ? 24 : horizon === '7d' ? 168 : 24;
      const forecast = [];
      
      for (let i = 0; i < hours; i++) {
        const timestamp = new Date(Date.now() + i * 60 * 60 * 1000);
        forecast.push({
          timestamp: timestamp.toISOString(),
          predictedPower: (1000 + Math.random() * 500 + Math.sin(i / 4) * 200).toFixed(2),
          confidence: (0.85 + Math.random() * 0.1).toFixed(2),
          lower95: (800 + Math.random() * 400).toFixed(2),
          upper95: (1200 + Math.random() * 600).toFixed(2)
        });
      }
      
      res.json({
        success: true,
        siteId,
        horizon,
        timestamp: new Date().toISOString(),
        data: forecast
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch forecast',
      message: error.message
    });
  }
});

// GET energy optimization recommendations
router.get('/optimization', async (req, res) => {
  const { siteId } = req.query;
  
  try {
    // Try to call AI service
    try {
      const response = await axios.get(`${AI_SERVICE_URL}/api/v1/optimization`, {
        params: { siteId },
        timeout: 3000
      });
      return res.json(response.data);
    } catch (aiError) {
      // Return mock data
      const mockOptimization = {
        success: true,
        siteId,
        timestamp: new Date().toISOString(),
        recommendations: [
          {
            id: '1',
            type: 'load_shift',
            title: 'Shift Non-Critical Loads to Off-Peak Hours',
            description: 'Move water pumping operations to off-peak hours (10 PM - 6 AM) to reduce costs',
            potentialSavings: 15000,
            savingsPercentage: 12.5,
            implementationCost: 2000,
            paybackPeriod: '2 months',
            priority: 'high',
            confidence: 0.92
          },
          {
            id: '2',
            type: 'efficiency',
            title: 'Optimize Inverter Settings',
            description: 'Adjust inverter parameters for better efficiency during low-light conditions',
            potentialSavings: 8000,
            savingsPercentage: 6.7,
            implementationCost: 500,
            paybackPeriod: '3 weeks',
            priority: 'medium',
            confidence: 0.88
          }
        ]
      };
      
      res.json(mockOptimization);
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch optimization recommendations',
      message: error.message
    });
  }
});

module.exports = router;


const express = require('express');
const router = express.Router();
const SiteModel = require('../database/models/sites');
const AssetModel = require('../database/models/assets');
const AlertModel = require('../database/models/alerts');

// GET all sites
router.get('/', (req, res) => {
  try {
    const sites = SiteModel.getAll();
    res.json({
      success: true,
      count: sites.length,
      data: sites.map(site => ({
        ...site,
        type: 'Solar', // Default type
        installedDate: site.created_at,
        coordinates: { lat: site.latitude || 0, lng: site.longitude || 0 }
      }))
    });
  } catch (error) {
    console.error('Error fetching sites:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch sites'
    });
  }
});

// GET single site by ID
router.get('/:id', (req, res) => {
  try {
    const site = SiteModel.findById(req.params.id);
    
    if (!site) {
      return res.status(404).json({
        success: false,
        error: 'Site not found'
      });
    }
    
    res.json({
      success: true,
      data: {
        ...site,
        type: 'Solar',
        installedDate: site.created_at,
        coordinates: { lat: site.latitude || 0, lng: site.longitude || 0 }
      }
    });
  } catch (error) {
    console.error('Error fetching site:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch site'
    });
  }
});

// POST create new site
router.post('/', (req, res) => {
  try {
    const newSite = {
      id: `site-${Date.now()}`,
      name: req.body.name,
      location: req.body.location,
      latitude: req.body.coordinates?.lat,
      longitude: req.body.coordinates?.lng,
      capacity: req.body.capacity,
      status: req.body.status || 'online',
      energy_saved: 0,
      cost_reduced: 0
    };
    
    SiteModel.create(newSite);
    
    res.status(201).json({
      success: true,
      data: {
        ...newSite,
        type: 'Solar',
        installedDate: new Date().toISOString(),
        coordinates: { lat: newSite.latitude || 0, lng: newSite.longitude || 0 }
      }
    });
  } catch (error) {
    console.error('Error creating site:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create site'
    });
  }
});

// PUT update site
router.put('/:id', (req, res) => {
  try {
    const site = SiteModel.findById(req.params.id);
    
    if (!site) {
      return res.status(404).json({
        success: false,
        error: 'Site not found'
      });
    }
    
    const updates = {};
    if (req.body.name) updates.name = req.body.name;
    if (req.body.location) updates.location = req.body.location;
    if (req.body.capacity) updates.capacity = req.body.capacity;
    if (req.body.status) updates.status = req.body.status;
    if (req.body.coordinates?.lat) updates.latitude = req.body.coordinates.lat;
    if (req.body.coordinates?.lng) updates.longitude = req.body.coordinates.lng;
    
    SiteModel.update(req.params.id, updates);
    
    const updatedSite = SiteModel.findById(req.params.id);
    
    res.json({
      success: true,
      data: {
        ...updatedSite,
        type: 'Solar',
        installedDate: updatedSite.created_at,
        coordinates: { lat: updatedSite.latitude || 0, lng: updatedSite.longitude || 0 }
      }
    });
  } catch (error) {
    console.error('Error updating site:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update site'
    });
  }
});

// DELETE site
router.delete('/:id', (req, res) => {
  try {
    const site = SiteModel.findById(req.params.id);
    
    if (!site) {
      return res.status(404).json({
        success: false,
        error: 'Site not found'
      });
    }
    
    SiteModel.delete(req.params.id);
    
    res.json({
      success: true,
      message: 'Site deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting site:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete site'
    });
  }
});

// GET site health status
router.get('/:id/health-status', (req, res) => {
  try {
    const site = SiteModel.findById(req.params.id);
    
    if (!site) {
      return res.status(404).json({
        success: false,
        error: 'Site not found'
      });
    }
    
    const healthStatus = SiteModel.getHealthStatus(req.params.id);
    res.json(healthStatus);
  } catch (error) {
    console.error('Error fetching health status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch health status'
    });
  }
});

// GET site alerts
router.get('/:id/alerts', (req, res) => {
  try {
    const site = SiteModel.findById(req.params.id);
    
    if (!site) {
      return res.status(404).json({
        success: false,
        error: 'Site not found'
      });
    }
    
    const alerts = AlertModel.findBySiteId(req.params.id);
    
    res.json({
      success: true,
      count: alerts.length,
      data: alerts
    });
  } catch (error) {
    console.error('Error fetching alerts:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch alerts'
    });
  }
});

// GET site assets
router.get('/:id/assets', (req, res) => {
  try {
    const site = SiteModel.findById(req.params.id);
    
    if (!site) {
      return res.status(404).json({
        success: false,
        error: 'Site not found'
      });
    }
    
    const assets = AssetModel.findBySiteId(req.params.id);
    
    res.json({
      success: true,
      count: assets.length,
      data: assets
    });
  } catch (error) {
    console.error('Error fetching assets:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch assets'
    });
  }
});

// GET site timeseries data
router.get('/:id/timeseries', (req, res) => {
  try {
    const site = SiteModel.findById(req.params.id);
    
    if (!site) {
      return res.status(404).json({
        success: false,
        error: 'Site not found'
      });
    }
    
    const { range = 'last_6h' } = req.query;
    const timeseries = SiteModel.getTimeseries(req.params.id, range);
    
    res.json(timeseries);
  } catch (error) {
    console.error('Error fetching timeseries:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch timeseries data'
    });
  }
});

// GET RL suggestions
router.get('/:id/suggestions', (req, res) => {
  try {
    const site = SiteModel.findById(req.params.id);
    
    if (!site) {
      return res.status(404).json({
        success: false,
        error: 'Site not found'
      });
    }
    
    // Mock RL suggestions (in production, fetch from RL service)
    const suggestions = [
      {
        id: 'rl-1',
        siteId: req.params.id,
        type: 'battery_schedule',
        title: 'Optimize Battery Discharge Schedule',
        description: 'Shift discharge window to 18:00-22:00 for ₹1,250 daily savings',
        impact: 'High',
        confidence: 0.89,
        expected_savings: 1250.50,
        current_flows: {
          peak_discharge: '19:00-21:00',
          charge_window: '02:00-05:00'
        },
        suggested_flows: {
          peak_discharge: '18:00-22:00',
          charge_window: '02:00-06:00'
        },
        status: 'pending',
        created_at: new Date().toISOString()
      },
      {
        id: 'rl-2',
        siteId: req.params.id,
        type: 'load_shifting',
        title: 'Reduce Non-Critical Load During Peak Hours',
        description: 'Shift HVAC load by 15% to save ₹850/day',
        impact: 'Medium',
        confidence: 0.76,
        expected_savings: 850.25,
        current_flows: {
          hvac_load: '100%',
          lighting: '100%'
        },
        suggested_flows: {
          hvac_load: '85%',
          lighting: '90%'
        },
        status: 'pending',
        created_at: new Date().toISOString()
      }
    ];
    
    res.json({
      success: true,
      suggestions
    });
  } catch (error) {
    console.error('Error fetching suggestions:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch suggestions'
    });
  }
});

// POST accept RL suggestion
router.post('/:id/suggestions/:suggestionId/accept', (req, res) => {
  try {
    res.json({
      success: true,
      message: 'Suggestion accepted and applied',
      applied_at: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error accepting suggestion:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to accept suggestion'
    });
  }
});

// POST reject RL suggestion
router.post('/:id/suggestions/:suggestionId/reject', (req, res) => {
  try {
    res.json({
      success: true,
      message: 'Suggestion rejected'
    });
  } catch (error) {
    console.error('Error rejecting suggestion:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to reject suggestion'
    });
  }
});

// GET RL strategy
router.get('/:id/rl-strategy', (req, res) => {
  try {
    const site = SiteModel.findById(req.params.id);
    
    if (!site) {
      return res.status(404).json({
        success: false,
        error: 'Site not found'
      });
    }
    
    // Mock RL strategy data
    const strategy = {
      siteId: req.params.id,
      algorithm: 'Deep Q-Network (DQN)',
      training_iterations: 50000,
      current_reward: 0.87,
      total_savings_today: 3250.75,
      actions_taken_today: 12,
      confidence: 0.89,
      last_updated: new Date().toISOString()
    };
    
    res.json(strategy);
  } catch (error) {
    console.error('Error fetching RL strategy:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch RL strategy'
    });
  }
});

module.exports = router;


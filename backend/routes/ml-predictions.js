const express = require('express');
const router = express.Router();

// POST vibration diagnosis
router.post('/vibration', (req, res) => {
  // Mock vibration diagnosis result
  const predictions = [
    { prediction: 'Normal', confidence: 0.94 },
    { prediction: 'Bearing Fault', confidence: 0.87 },
    { prediction: 'Imbalance', confidence: 0.91 },
    { prediction: 'Misalignment', confidence: 0.85 }
  ];
  
  const result = predictions[Math.floor(Math.random() * predictions.length)];
  
  res.json({
    success: true,
    prediction: result.prediction,
    confidence: result.confidence,
    timestamp: new Date().toISOString(),
    features_used: 24,
    model: 'RandomForest Classifier'
  });
});

// POST motor fault diagnosis
router.post('/motor-fault', (req, res) => {
  // Mock motor fault diagnosis
  const faultTypes = [
    { prediction: 'No Fault Detected', confidence: 0.96 },
    { prediction: 'Bearing Degradation', confidence: 0.88 },
    { prediction: 'Rotor Imbalance', confidence: 0.82 },
    { prediction: 'Electrical Fault', confidence: 0.79 }
  ];
  
  const result = faultTypes[Math.floor(Math.random() * faultTypes.length)];
  
  res.json({
    success: true,
    prediction: result.prediction,
    confidence: result.confidence,
    timestamp: new Date().toISOString(),
    features_used: 40,
    model: 'XGBoost Classifier',
    sensors: ['accelerometer', 'microphone', 'temperature']
  });
});

// POST solar power forecast
router.post('/solar', (req, res) => {
  // Generate 24-hour forecast (hourly predictions)
  const forecast = [];
  const baseValue = 450;
  
  for (let i = 0; i < 24; i++) {
    // Simulate solar curve (peak at noon)
    const hourFactor = Math.sin((i - 6) / 24 * Math.PI * 2);
    const value = Math.max(0, baseValue + hourFactor * 400 + (Math.random() - 0.5) * 50);
    forecast.push(parseFloat(value.toFixed(2)));
  }
  
  res.json({
    success: true,
    prediction: forecast,
    timestamp: new Date().toISOString(),
    horizon: '24 hours',
    model: 'LSTM Neural Network',
    confidence: 0.92
  });
});

module.exports = router;


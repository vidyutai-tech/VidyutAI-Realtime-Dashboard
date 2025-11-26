const express = require('express');
const router = express.Router();

/**
 * ML-Driven Alert Endpoints
 * These endpoints simulate ML model outputs for:
 * - Anomaly Detection (Isolation Forest / Autoencoders)
 * - RUL Estimation (LSTM/Transformer)
 * - Fault Classification (XGBoost)
 * - LLM Explanations
 */

// Simulate Isolation Forest / Autoencoder anomaly detection
const detectAnomaly = (dataType, metrics) => {
  // Simulate anomaly scores (0-1, where >0.7 is anomalous)
  const baseScore = Math.random() * 0.3; // Normal: 0-0.3
  const anomalyScore = Math.random() > 0.7 ? 0.7 + Math.random() * 0.3 : baseScore;
  
  let severity = 'low';
  if (anomalyScore > 0.85) severity = 'critical';
  else if (anomalyScore > 0.75) severity = 'high';
  else if (anomalyScore > 0.65) severity = 'medium';
  
  return {
    anomalyScore: parseFloat(anomalyScore.toFixed(3)),
    severity,
    detectedAt: new Date().toISOString(),
    dataType,
    metrics,
  };
};

// Simulate LSTM/Transformer RUL estimation
const estimateRUL = (equipmentType, historicalData) => {
  // Simulate RUL in days
  const baseRUL = 180 + Math.random() * 120; // 180-300 days
  const confidence = 0.75 + Math.random() * 0.2; // 75-95%
  
  // Feature drift indicator (0-1, where >0.7 indicates drift)
  const featureDrift = Math.random() * 0.5; // Normal: 0-0.5
  
  return {
    rulDays: Math.round(baseRUL),
    rulConfidence: parseFloat(confidence.toFixed(2)),
    featureDrift: parseFloat(featureDrift.toFixed(3)),
    estimatedFailureDate: new Date(Date.now() + baseRUL * 24 * 60 * 60 * 1000).toISOString(),
    equipmentType,
  };
};

// Simulate XGBoost fault classification
const classifyFault = (anomalyData) => {
  const faultTypes = [
    { name: 'bearing_wear', probability: 0 },
    { name: 'loose_connections', probability: 0 },
    { name: 'panel_degradation', probability: 0 },
    { name: 'inverter_overtemperature', probability: 0 },
    { name: 'harmonic_distortion', probability: 0 },
  ];
  
  // Simulate probability distribution (must sum to ~1.0)
  const totalProb = 0.95 + Math.random() * 0.05;
  const probabilities = [];
  let remaining = totalProb;
  
  for (let i = 0; i < faultTypes.length - 1; i++) {
    const prob = Math.random() * remaining * 0.6;
    probabilities.push(prob);
    remaining -= prob;
  }
  probabilities.push(remaining);
  
  // Shuffle and assign
  probabilities.sort(() => Math.random() - 0.5);
  faultTypes.forEach((fault, i) => {
    fault.probability = parseFloat(probabilities[i].toFixed(3));
  });
  
  // Sort by probability
  faultTypes.sort((a, b) => b.probability - a.probability);
  
  return {
    faultClassification: faultTypes,
    topFault: faultTypes[0],
    confidence: parseFloat((faultTypes[0].probability * 100).toFixed(1)),
  };
};

// Simulate LLM explanation
const generateLLMExplanation = (anomalyScore, severity, faultClassification, rul) => {
  const topFault = faultClassification.topFault;
  
  let explanation = `**Alert Summary:**\n\n`;
  
  if (severity === 'critical') {
    explanation += `🚨 **CRITICAL ALERT** - Immediate attention required.\n\n`;
  } else if (severity === 'high') {
    explanation += `⚠️ **HIGH PRIORITY** - Action recommended within 24 hours.\n\n`;
  } else {
    explanation += `ℹ️ **INFORMATIONAL** - Monitor and investigate during next maintenance window.\n\n`;
  }
  
  explanation += `**Anomaly Detection:**\n`;
  explanation += `Our ML model detected an anomaly with a score of ${(anomalyScore * 100).toFixed(1)}% `;
  explanation += `(threshold: 70%). This indicates ${severity === 'critical' ? 'severe' : severity === 'high' ? 'significant' : 'moderate'} deviation from normal operating patterns.\n\n`;
  
  explanation += `**Fault Classification:**\n`;
  explanation += `XGBoost classifier identified **${topFault.name.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}** `;
  explanation += `as the most likely root cause (${(topFault.probability * 100).toFixed(1)}% confidence).\n\n`;
  
  if (rul) {
    explanation += `**Remaining Useful Life:**\n`;
    explanation += `LSTM-based RUL model estimates ${rul.rulDays} days until potential failure `;
    explanation += `(${(rul.rulConfidence * 100).toFixed(0)}% confidence). `;
    if (rul.featureDrift > 0.5) {
      explanation += `⚠️ Feature drift detected (${(rul.featureDrift * 100).toFixed(1)}%) - model confidence may be reduced.\n\n`;
    } else {
      explanation += `Model confidence is stable.\n\n`;
    }
  }
  
  explanation += `**Recommended Actions:**\n`;
  
  if (topFault.name === 'bearing_wear') {
    explanation += `• Inspect motor bearings for wear, lubrication, and alignment\n`;
    explanation += `• Check vibration signatures and compare with baseline\n`;
    explanation += `• Schedule bearing replacement if wear exceeds 50%\n`;
  } else if (topFault.name === 'loose_connections') {
    explanation += `• Perform visual inspection of all electrical connections\n`;
    explanation += `• Check for signs of arcing, discoloration, or heat damage\n`;
    explanation += `• Tighten connections to manufacturer specifications\n`;
  } else if (topFault.name === 'panel_degradation') {
    explanation += `• Measure panel output vs. nameplate rating\n`;
    explanation += `• Check for physical damage, soiling, or shading\n`;
    explanation += `• Schedule panel cleaning and efficiency testing\n`;
  } else if (topFault.name === 'inverter_overtemperature') {
    explanation += `• Verify cooling system operation (fans, heat sinks)\n`;
    explanation += `• Check ambient temperature and ventilation\n`;
    explanation += `• Reduce load if temperature exceeds 75°C\n`;
  } else if (topFault.name === 'harmonic_distortion') {
    explanation += `• Analyze harmonic spectrum (FFT)\n`;
    explanation += `• Check for non-linear loads or inverter issues\n`;
    explanation += `• Consider harmonic filters if THD > 5%\n`;
  } else {
    explanation += `• Review system logs and historical data\n`;
    explanation += `• Perform diagnostic tests as per maintenance manual\n`;
    explanation += `• Contact technical support if issue persists\n`;
  }
  
  return explanation;
};

// POST /api/v1/ml-alerts/detect-anomaly
router.post('/detect-anomaly', (req, res) => {
  const { dataType, metrics } = req.body;
  
  if (!dataType) {
    return res.status(400).json({
      success: false,
      error: 'dataType is required',
    });
  }
  
  const result = detectAnomaly(dataType, metrics || {});
  
  res.json({
    success: true,
    data: result,
  });
});

// POST /api/v1/ml-alerts/estimate-rul
router.post('/estimate-rul', (req, res) => {
  const { equipmentType, historicalData } = req.body;
  
  if (!equipmentType) {
    return res.status(400).json({
      success: false,
      error: 'equipmentType is required',
    });
  }
  
  const result = estimateRUL(equipmentType, historicalData || []);
  
  res.json({
    success: true,
    data: result,
  });
});

// POST /api/v1/ml-alerts/classify-fault
router.post('/classify-fault', (req, res) => {
  const { anomalyData } = req.body;
  
  if (!anomalyData) {
    return res.status(400).json({
      success: false,
      error: 'anomalyData is required',
    });
  }
  
  const result = classifyFault(anomalyData);
  
  res.json({
    success: true,
    data: result,
  });
});

// POST /api/v1/ml-alerts/generate-explanation
router.post('/generate-explanation', (req, res) => {
  const { anomalyScore, severity, faultClassification, rul } = req.body;
  
  const explanation = generateLLMExplanation(
    anomalyScore || 0.75,
    severity || 'medium',
    faultClassification || { topFault: { name: 'unknown', probability: 0.5 } },
    rul || null
  );
  
  res.json({
    success: true,
    data: {
      explanation,
      generatedAt: new Date().toISOString(),
    },
  });
});

// POST /api/v1/ml-alerts/full-analysis
// Complete ML pipeline: anomaly detection → RUL → fault classification → explanation
router.post('/full-analysis', (req, res) => {
  const { dataType, equipmentType, metrics, historicalData } = req.body;
  
  // Step 1: Anomaly Detection
  const anomaly = detectAnomaly(dataType || 'inverter_harmonics', metrics || {});
  
  // Step 2: RUL Estimation (if equipment type provided)
  const rul = equipmentType ? estimateRUL(equipmentType, historicalData || []) : null;
  
  // Step 3: Fault Classification
  const faultClassification = classifyFault(anomaly);
  
  // Step 4: LLM Explanation
  const explanation = generateLLMExplanation(
    anomaly.anomalyScore,
    anomaly.severity,
    faultClassification,
    rul
  );
  
  res.json({
    success: true,
    data: {
      anomaly,
      rul,
      faultClassification,
      explanation: {
        text: explanation,
        generatedAt: new Date().toISOString(),
      },
    },
  });
});

module.exports = router;


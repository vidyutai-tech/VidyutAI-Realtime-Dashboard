const express = require('express');
const router = express.Router();

// POST ask AI assistant
router.post('/ask-ai', async (req, res) => {
  const { question } = req.body;
  
  if (!question || question.trim() === '') {
    return res.status(400).json({
      success: false,
      error: 'Question is required'
    });
  }
  
  // Mock AI responses based on keywords
  let answer = '';
  const lowerQuestion = question.toLowerCase();
  
  if (lowerQuestion.includes('hello') || lowerQuestion.includes('hi')) {
    answer = 'Hello! I\'m here to help you with the VidyutAI energy management system. How can I assist you today?';
  } else if (lowerQuestion.includes('status') || lowerQuestion.includes('health')) {
    answer = 'The solar plant is currently operating at 99.7% health. All subsystems (PV, Battery, Inverter, EV Charger) are functioning within normal parameters. Grid draw is at 185 kW.';
  } else if (lowerQuestion.includes('battery') || lowerQuestion.includes('soc')) {
    answer = 'The battery state of charge (SoC) is currently at 77%. Battery health (SoH) is at 88%, which is good. The battery is charging from excess solar power during the day.';
  } else if (lowerQuestion.includes('solar') || lowerQuestion.includes('pv') || lowerQuestion.includes('generation')) {
    answer = 'Today\'s solar PV generation is approximately 850 kWh so far. The PV system health is at 92%, which is excellent. Current power output is around 500 kW.';
  } else if (lowerQuestion.includes('alert') || lowerQuestion.includes('warning') || lowerQuestion.includes('issue')) {
    answer = 'There is 1 active alert: Battery SOC is below 20%. This is a medium-severity warning. I recommend monitoring the battery discharge rate during peak hours.';
  } else if (lowerQuestion.includes('save') || lowerQuestion.includes('cost') || lowerQuestion.includes('optimization')) {
    answer = 'Based on current RL optimization analysis, you could save approximately ₹2,500 per day by reducing grid draw during peak hours (6 PM - 9 PM) and increasing battery discharge. This would reduce your electricity costs by 12-15%.';
  } else if (lowerQuestion.includes('maintenance') || lowerQuestion.includes('repair')) {
    answer = 'Predictive maintenance analysis shows that Inverter Unit A may require inspection within 7 days. The confidence level is 87%. I recommend scheduling preventive maintenance to avoid potential failures.';
  } else if (lowerQuestion.includes('efficiency')) {
    answer = 'System efficiency is currently at 92%, which is above the expected 90%. To optimize further, consider: 1) Reducing grid draw during peak hours, 2) Optimizing battery charge/discharge cycles, and 3) Regular cleaning of solar panels.';
  } else if (lowerQuestion.includes('help') || lowerQuestion.includes('what can you do')) {
    answer = 'I can help you with:\n• System status and health monitoring\n• Energy generation and consumption analysis\n• Battery and storage insights\n• Cost optimization recommendations\n• Alert explanations and troubleshooting\n• Predictive maintenance suggestions\n\nJust ask me anything about your solar plant!';
  } else {
    // Default response for unknown questions
    answer = `I understand you're asking about "${question}". Based on current system data, the solar plant is operating normally with 99.7% health. Grid draw is 185 kW, battery SoC is 77%, and today's PV generation is 850 kWh. Would you like more specific information about any subsystem?`;
  }
  
  // Return as plain text (the API expects text response)
  res.set('Content-Type', 'text/plain');
  res.send(answer);
});

// POST simulate energy scenario
router.post('/simulate', async (req, res) => {
  const { pvCurtail = 0, batteryTarget = 80, gridPrice = 5 } = req.body;
  
  // Generate mock simulation results
  const hours = 24;
  const cost = [];
  const emissions = [];
  
  for (let i = 0; i < hours; i++) {
    // Simulate cost based on parameters
    const baseCost = gridPrice * (100 + Math.random() * 50);
    const pvSavings = pvCurtail * 2;
    const batterySavings = (batteryTarget - 50) * 0.5;
    
    cost.push(parseFloat((baseCost - pvSavings - batterySavings).toFixed(2)));
    
    // Simulate emissions (kg CO2)
    const baseEmissions = 50 + Math.random() * 20;
    emissions.push(parseFloat((baseEmissions * (1 - pvCurtail / 100)).toFixed(2)));
  }
  
  res.json({
    success: true,
    cost,
    emissions,
    parameters: {
      pvCurtail,
      batteryTarget,
      gridPrice
    },
    summary: {
      totalCost: cost.reduce((a, b) => a + b, 0).toFixed(2),
      totalEmissions: emissions.reduce((a, b) => a + b, 0).toFixed(2),
      avgCostPerHour: (cost.reduce((a, b) => a + b, 0) / hours).toFixed(2)
    }
  });
});

module.exports = router;


const { getDatabase } = require('../database/db');
const AlertModel = require('../database/models/alerts');

// Store last alert timestamps to prevent spam
const lastAlertTimes = {};

/**
 * Check power quality metrics and return alerts if issues detected
 */
function checkPowerQualityForAlerts(siteId, metrics) {
  const alerts = [];
  
  const voltage = metrics.voltage?.value || 415;
  const frequency = metrics.frequency?.value || 50.0;
  const thd = metrics.thd?.value || 3.0;
  const powerFactor = metrics.power_factor?.value || 0.95;
  const voltageUnbalance = metrics.voltage_unbalance?.value || 1.5;
  
  const now = Date.now();
  const alertKey = `${siteId}_`;
  
  // Voltage quality check
  const voltageDeviation = Math.abs(voltage - 415) / 415 * 100;
  if (voltageDeviation > 7) {
    const key = `${alertKey}voltage_critical`;
    if (!lastAlertTimes[key] || now - lastAlertTimes[key] > 600000) { // 10 minutes
      alerts.push({
        id: `pq_${siteId}_voltage_${now}`,
        site_id: siteId,
        severity: 'critical',
        type: 'power_quality',
        title: 'Voltage Out of Range',
        message: `Voltage deviation: ${voltage.toFixed(1)}V (${voltageDeviation.toFixed(1)}% deviation from nominal 415V). Equipment damage risk.`,
        status: 'active',
        timestamp: new Date().toISOString(),
      });
      lastAlertTimes[key] = now;
    }
  } else if (voltageDeviation > 5) {
    const key = `${alertKey}voltage_high`;
    if (!lastAlertTimes[key] || now - lastAlertTimes[key] > 900000) { // 15 minutes
      alerts.push({
        id: `pq_${siteId}_voltage_${now}`,
        site_id: siteId,
        severity: 'high',
        type: 'power_quality',
        title: 'Voltage Deviation Warning',
        message: `Voltage deviation: ${voltage.toFixed(1)}V (${voltageDeviation.toFixed(1)}% deviation). Monitor closely.`,
        status: 'active',
        timestamp: new Date().toISOString(),
      });
      lastAlertTimes[key] = now;
    }
  }
  
  // Frequency stability check
  const frequencyDeviation = Math.abs(frequency - 50.0);
  if (frequencyDeviation > 0.5) {
    const key = `${alertKey}frequency_critical`;
    if (!lastAlertTimes[key] || now - lastAlertTimes[key] > 600000) {
      alerts.push({
        id: `pq_${siteId}_frequency_${now}`,
        site_id: siteId,
        severity: 'critical',
        type: 'power_quality',
        title: 'Frequency Instability',
        message: `Frequency deviation: ${frequency.toFixed(2)}Hz (${frequencyDeviation.toFixed(2)}Hz from nominal 50Hz). Grid stability issue.`,
        status: 'active',
        timestamp: new Date().toISOString(),
      });
      lastAlertTimes[key] = now;
    }
  } else if (frequencyDeviation > 0.3) {
    const key = `${alertKey}frequency_high`;
    if (!lastAlertTimes[key] || now - lastAlertTimes[key] > 900000) {
      alerts.push({
        id: `pq_${siteId}_frequency_${now}`,
        site_id: siteId,
        severity: 'high',
        type: 'power_quality',
        title: 'Frequency Deviation Warning',
        message: `Frequency deviation: ${frequency.toFixed(2)}Hz. Monitor grid stability.`,
        status: 'active',
        timestamp: new Date().toISOString(),
      });
      lastAlertTimes[key] = now;
    }
  }
  
  // THD check
  if (thd > 10) {
    const key = `${alertKey}thd_critical`;
    if (!lastAlertTimes[key] || now - lastAlertTimes[key] > 600000) {
      alerts.push({
        id: `pq_${siteId}_thd_${now}`,
        site_id: siteId,
        severity: 'critical',
        type: 'power_quality',
        title: 'High Harmonic Distortion',
        message: `THD: ${thd.toFixed(2)}% (exceeds 10%). Equipment damage risk. Immediate action recommended.`,
        status: 'active',
        timestamp: new Date().toISOString(),
      });
      lastAlertTimes[key] = now;
    }
  } else if (thd > 8) {
    const key = `${alertKey}thd_high`;
    if (!lastAlertTimes[key] || now - lastAlertTimes[key] > 900000) {
      alerts.push({
        id: `pq_${siteId}_thd_${now}`,
        site_id: siteId,
        severity: 'high',
        type: 'power_quality',
        title: 'Elevated Harmonic Distortion',
        message: `THD: ${thd.toFixed(2)}% (above 8%). Monitor and investigate source.`,
        status: 'active',
        timestamp: new Date().toISOString(),
      });
      lastAlertTimes[key] = now;
    }
  }
  
  // Power Factor check
  if (powerFactor < 0.80) {
    const key = `${alertKey}pf_high`;
    if (!lastAlertTimes[key] || now - lastAlertTimes[key] > 900000) {
      alerts.push({
        id: `pq_${siteId}_pf_${now}`,
        site_id: siteId,
        severity: 'high',
        type: 'power_quality',
        title: 'Low Power Factor',
        message: `Power factor: ${powerFactor.toFixed(3)} (below 0.80). Energy efficiency reduced. Consider power factor correction.`,
        status: 'active',
        timestamp: new Date().toISOString(),
      });
      lastAlertTimes[key] = now;
    }
  } else if (powerFactor < 0.85) {
    const key = `${alertKey}pf_medium`;
    if (!lastAlertTimes[key] || now - lastAlertTimes[key] > 1200000) { // 20 minutes
      alerts.push({
        id: `pq_${siteId}_pf_${now}`,
        site_id: siteId,
        severity: 'medium',
        type: 'power_quality',
        title: 'Power Factor Warning',
        message: `Power factor: ${powerFactor.toFixed(3)}. Below optimal range (>0.95).`,
        status: 'active',
        timestamp: new Date().toISOString(),
      });
      lastAlertTimes[key] = now;
    }
  }
  
  // Voltage Unbalance check
  if (voltageUnbalance > 4) {
    const key = `${alertKey}unbalance_critical`;
    if (!lastAlertTimes[key] || now - lastAlertTimes[key] > 600000) {
      alerts.push({
        id: `pq_${siteId}_unbalance_${now}`,
        site_id: siteId,
        severity: 'critical',
        type: 'power_quality',
        title: 'High Voltage Unbalance',
        message: `Voltage unbalance: ${voltageUnbalance.toFixed(2)}% (exceeds 4%). Phase imbalance detected. Motor damage risk.`,
        status: 'active',
        timestamp: new Date().toISOString(),
      });
      lastAlertTimes[key] = now;
    }
  } else if (voltageUnbalance > 3) {
    const key = `${alertKey}unbalance_high`;
    if (!lastAlertTimes[key] || now - lastAlertTimes[key] > 900000) {
      alerts.push({
        id: `pq_${siteId}_unbalance_${now}`,
        site_id: siteId,
        severity: 'high',
        type: 'power_quality',
        title: 'Voltage Unbalance Warning',
        message: `Voltage unbalance: ${voltageUnbalance.toFixed(2)}% (above 3%). Monitor three-phase balance.`,
        status: 'active',
        timestamp: new Date().toISOString(),
      });
      lastAlertTimes[key] = now;
    }
  }
  
  return alerts;
}

module.exports = {
  checkPowerQualityForAlerts
};


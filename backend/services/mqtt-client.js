const mqtt = require('mqtt');
const EventEmitter = require('events');

class MQTTClient extends EventEmitter {
  constructor() {
    super();
    this.client = null;
    this.connected = false;
    this.enabled = process.env.USE_MQTT === 'true';
    this.messageHandlers = [];
    
    if (this.enabled) {
      this.connect();
    }
  }

  connect() {
    const mqttUrl = process.env.MQTT_URL || 'mqtt://localhost:1883';
    
    try {
      this.client = mqtt.connect(mqttUrl, {
        clientId: `vidyutai_server_${Math.random().toString(16).slice(2, 8)}`,
        clean: true,
        reconnectPeriod: 5000,
        connectTimeout: 30000
      });

      this.client.on('connect', () => {
        console.log('✅ MQTT connected');
        this.connected = true;
        
        // Subscribe to all vidyutai topics
        this.client.subscribe('vidyutai/#', { qos: 1 });
      });

      this.client.on('error', (err) => {
        console.error('❌ MQTT Error:', err.message);
      });

      this.client.on('close', () => {
        this.connected = false;
      });

      this.client.on('message', (topic, message) => {
        // Emit event for message handlers
        this.emit('message', topic, message);
        
        // Call registered handlers
        this.messageHandlers.forEach(handler => {
          try {
            handler(topic, message);
          } catch (err) {
            console.error('MQTT message handler error:', err);
          }
        });
      });

    } catch (err) {
      console.error('❌ MQTT connection failed:', err.message);
      this.enabled = false;
    }
  }

  publish(topic, message, options = {}) {
    if (!this.enabled || !this.connected) return;
    
    this.client.publish(topic, JSON.stringify(message), { qos: 1, ...options });
  }

  onMessage(handler) {
    this.messageHandlers.push(handler);
  }

  disconnect() {
    if (this.client) {
      this.client.end();
    }
  }
}

module.exports = new MQTTClient();


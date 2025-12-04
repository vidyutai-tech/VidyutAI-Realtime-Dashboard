const redis = require('redis');

class RedisClient {
  constructor() {
    this.client = null;
    this.enabled = process.env.USE_REDIS === 'true';
    
    if (this.enabled) {
      this.connect();
    }
  }

  async connect() {
    try {
      this.client = redis.createClient({
        url: process.env.REDIS_URL || 'redis://localhost:6379'
      });

      this.client.on('error', (err) => {
        console.error('❌ Redis Error:', err);
      });

      this.client.on('connect', () => {
        console.log('✅ Redis connected');
      });

      await this.client.connect();
    } catch (err) {
      console.error('❌ Redis connection failed:', err.message);
      this.enabled = false;
    }
  }

  async set(key, value, ttlSeconds = 300) {
    if (!this.enabled || !this.client) return;
    
    try {
      await this.client.set(key, JSON.stringify(value), {
        EX: ttlSeconds
      });
    } catch (err) {
      console.error('Redis set error:', err);
    }
  }

  async get(key) {
    if (!this.enabled || !this.client) return null;
    
    try {
      const cached = await this.client.get(key);
      return cached ? JSON.parse(cached) : null;
    } catch (err) {
      console.error('Redis get error:', err);
      return null;
    }
  }

  async del(key) {
    if (!this.enabled || !this.client) return;
    
    try {
      await this.client.del(key);
    } catch (err) {
      console.error('Redis del error:', err);
    }
  }

  async close() {
    if (this.client) {
      await this.client.quit();
    }
  }
}

module.exports = new RedisClient();


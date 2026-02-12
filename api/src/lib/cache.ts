import Redis from 'ioredis';
import { redisConfig } from '../config/index.js';

class RedisCache {
  private client: Redis | null = null;
  private isEnabled: boolean = false;

  constructor() {
    if (redisConfig.host) {
      this.client = new Redis({
        host: redisConfig.host,
        port: typeof redisConfig.port === 'string' ? parseInt(redisConfig.port) : redisConfig.port,
        password: redisConfig.password,
        db: typeof redisConfig.db === 'string' ? parseInt(redisConfig.db) : redisConfig.db,
        lazyConnect: true, // Don't connect immediately
        retryStrategy: (times) => {
          const delay = Math.min(times * 50, 2000);
          return delay;
        },
      });

      this.client.on('error', (err) => {
        console.error('Redis Client Error:', err);
        this.isEnabled = false;
      });

      this.client.on('connect', () => {
        console.log('Redis Client Connected');
        this.isEnabled = true;
      });

      // Attempt connection
      this.client.connect().catch(() => {
        // Error handler above handles this
      });
    }
  }

  async get<T>(key: string): Promise<T | null> {
    if (!this.isEnabled || !this.client) return null;
    try {
      const data = await this.client.get(key);
      if (!data) return null;
      return JSON.parse(data) as T;
    } catch (error) {
      console.error(`Redis get error for key ${key}:`, error);
      return null;
    }
  }

  async set(key: string, value: any, ttlSeconds: number = 3600): Promise<void> {
    if (!this.isEnabled || !this.client) return;
    try {
      const data = JSON.stringify(value);
      await this.client.set(key, data, 'EX', ttlSeconds);
    } catch (error) {
      console.error(`Redis set error for key ${key}:`, error);
    }
  }

  async del(key: string): Promise<void> {
    if (!this.isEnabled || !this.client) return;
    try {
      await this.client.del(key);
    } catch (error) {
      console.error(`Redis del error for key ${key}:`, error);
    }
  }

  async flush(): Promise<void> {
    if (!this.isEnabled || !this.client) return;
    try {
      await this.client.flushdb();
    } catch (error) {
      console.error('Redis flush error:', error);
    }
  }
}

export const cache = new RedisCache();

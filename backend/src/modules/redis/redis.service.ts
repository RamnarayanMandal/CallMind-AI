import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private client: Redis;
  private isConnected = false;

  // In-memory fallback when Redis is unavailable
  private memoryCache = new Map<string, { value: string; expiresAt?: number }>();

  constructor(private readonly configService: ConfigService) {}

  onModuleInit() {
    this.client = new Redis({
      host: this.configService.get<string>('redis.host', 'localhost'),
      port: this.configService.get<number>('redis.port', 6379),
      password: this.configService.get<string>('redis.password'),
      retryStrategy: (times: number) => {
        if (times > 10) {
          this.logger.error('Redis: Max reconnection attempts reached');
          return null;
        }
        const delay = Math.min(times * 200, 3000);
        this.logger.warn(`Redis: Reconnecting in ${delay}ms (attempt ${times})`);
        return delay;
      },
      maxRetriesPerRequest: 3,
      enableReadyCheck: true,
      lazyConnect: false,
    });

    this.client.on('connect', () => {
      this.isConnected = true;
      this.logger.log('Connected to Redis successfully');
    });

    this.client.on('ready', () => {
      this.isConnected = true;
      this.logger.log('Redis client ready');
    });

    this.client.on('error', (err) => {
      this.isConnected = false;
      this.logger.error('Redis connection error', err);
    });

    this.client.on('close', () => {
      this.isConnected = false;
      this.logger.warn('Redis connection closed');
    });
  }

  onModuleDestroy() {
    if (this.client) {
      this.client.disconnect();
    }
  }

  getClient(): Redis {
    return this.client;
  }

  isRedisConnected(): boolean {
    return this.isConnected;
  }

  async set(key: string, value: any, ttlSeconds?: number): Promise<void> {
    const stringValue = JSON.stringify(value);

    // Always try Redis first
    if (this.isConnected) {
      try {
        if (ttlSeconds) {
          await this.client.set(key, stringValue, 'EX', ttlSeconds);
        } else {
          await this.client.set(key, stringValue);
        }
        return;
      } catch (err) {
        this.logger.warn(`Redis SET failed for key ${key}: ${err.message} — falling back to memory`);
      }
    }

    // Fallback to in-memory cache
    this.memoryCache.set(key, {
      value: stringValue,
      expiresAt: ttlSeconds ? Date.now() + ttlSeconds * 1000 : undefined,
    });
  }

  async get<T>(key: string): Promise<T | null> {
    // Try Redis first
    if (this.isConnected) {
      try {
        const data = await this.client.get(key);
        if (data) {
          return JSON.parse(data) as T;
        }
        return null;
      } catch (err) {
        this.logger.warn(`Redis GET failed for key ${key}: ${err.message} — falling back to memory`);
      }
    }

    // Fallback to in-memory cache
    const cached = this.memoryCache.get(key);
    if (cached) {
      if (cached.expiresAt && Date.now() > cached.expiresAt) {
        this.memoryCache.delete(key);
        return null;
      }
      try {
        return JSON.parse(cached.value) as T;
      } catch {
        return null;
      }
    }

    return null;
  }

  async del(key: string): Promise<void> {
    this.memoryCache.delete(key);
    if (this.isConnected) {
      try {
        await this.client.del(key);
      } catch (err) {
        this.logger.warn(`Redis DEL failed for key ${key}: ${err.message}`);
      }
    }
  }

  async delMany(keys: string[]): Promise<void> {
    if (keys.length === 0) return;
    keys.forEach(k => this.memoryCache.delete(k));
    if (this.isConnected) {
      try {
        await this.client.del(...keys);
      } catch (err) {
        this.logger.warn(`Redis DEL MANY failed: ${err.message}`);
      }
    }
  }

  async scanKeys(pattern: string): Promise<string[]> {
    // For SCAN, only use Redis — memory cache doesn't support pattern matching
    if (!this.isConnected) {
      return [];
    }

    try {
      const keys: string[] = [];
      let cursor = '0';
      do {
        const [nextCursor, batch] = await this.client.scan(cursor, 'MATCH', pattern, 'COUNT', 100);
        cursor = nextCursor;
        keys.push(...batch);
      } while (cursor !== '0');
      return keys;
    } catch (err) {
      this.logger.warn(`Redis SCAN failed for pattern ${pattern}: ${err.message}`);
      return [];
    }
  }
}

import Redis from 'ioredis';
import { config } from '../config';

export const redis = new Redis(config.redisUrl, { lazyConnect: true, maxRetriesPerRequest: 2 });

export async function connectRedis(): Promise<void> {
  await redis.connect();
  console.log('Redis connected');
}

export async function resetAuthorizationCache(): Promise<number> {
  const keys = await redis.keys('authz:*');
  if (keys.length === 0) return 0;
  return redis.del(...keys);
}

export function authorizationCacheKey(userId: string, permission: string, siteId?: string, businessUnit?: string): string {
  return `authz:${userId}:${permission}:${siteId ?? 'GLOBAL'}:${businessUnit ?? 'ANY'}`;
}

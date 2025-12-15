// Redis key-value store for Proofit
import { createClient } from "npm:redis@4.7.0";

// Redis connection URL from environment or default
const REDIS_URL = Deno.env.get("REDIS_URL") || 
  "redis://default:ZOYKORHHc0j92mA2mr0NegXq8gJ0ePd1@redis-15585.crce214.us-east-1-3.ec2.cloud.redislabs.com:15585";

// Create Redis client connection
let redisClient: ReturnType<typeof createClient> | null = null;

const getClient = async () => {
  if (!redisClient) {
    redisClient = createClient({
      url: REDIS_URL,
    });
    await redisClient.connect();
  }
  return redisClient;
};

// Set stores a key-value pair in Redis.
export const set = async (key: string, value: any): Promise<void> => {
  const client = await getClient();
  const serialized = JSON.stringify(value);
  await client.set(key, serialized);
};

// Get retrieves a key-value pair from Redis.
export const get = async (key: string): Promise<any> => {
  const client = await getClient();
  const value = await client.get(key);
  if (value === null) {
    return undefined;
  }
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
};

// Delete deletes a key-value pair from Redis.
export const del = async (key: string): Promise<void> => {
  const client = await getClient();
  await client.del(key);
};

// Sets multiple key-value pairs in Redis.
export const mset = async (keys: string[], values: any[]): Promise<void> => {
  const client = await getClient();
  const pipeline = client.multi();
  keys.forEach((k, i) => {
    pipeline.set(k, JSON.stringify(values[i]));
  });
  await pipeline.exec();
};

// Gets multiple key-value pairs from Redis.
export const mget = async (keys: string[]): Promise<any[]> => {
  const client = await getClient();
  const values = await client.mGet(keys);
  return values.map((v) => {
    if (v === null) return undefined;
    try {
      return JSON.parse(v);
    } catch {
      return v;
    }
  });
};

// Deletes multiple key-value pairs from Redis.
export const mdel = async (keys: string[]): Promise<void> => {
  const client = await getClient();
  await client.del(keys);
};

// Search for key-value pairs by prefix.
export const getByPrefix = async (prefix: string): Promise<any[]> => {
  const client = await getClient();
  const keys = await client.keys(`${prefix}*`);
  if (keys.length === 0) {
    return [];
  }
  const values = await client.mGet(keys);
  return values.map((v) => {
    if (v === null) return undefined;
    try {
      return JSON.parse(v);
    } catch {
      return v;
    }
  });
};

// Set with expiration (TTL in seconds)
export const setex = async (key: string, value: any, ttl: number): Promise<void> => {
  const client = await getClient();
  const serialized = JSON.stringify(value);
  await client.setEx(key, ttl, serialized);
};


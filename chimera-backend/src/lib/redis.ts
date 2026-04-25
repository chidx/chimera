import Redis from 'ioredis';

const redisUrl = process.env.REDIS_URL!;
const parsed = new URL(redisUrl);

export const connection = {
  host: parsed.hostname,
  port: parseInt(parsed.port || '6379', 10),
};

const redis = new Redis(redisUrl);

export default redis;

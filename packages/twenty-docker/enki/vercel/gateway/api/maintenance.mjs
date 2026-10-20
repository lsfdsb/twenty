import Redis from 'ioredis';

import { authorizeCron } from '../lib/authorize-cron.mjs';
import { shouldRunMaintenance } from '../lib/maintenance.mjs';
import { invokeMaintenance } from '../lib/worker.mjs';

export default async function maintenance(request, response) {
  if (!authorizeCron(request)) {
    response.statusCode = 401;
    response.end();
    return;
  }

  const redisUrl = process.env.REDIS_QUEUE_URL || process.env.REDIS_URL;
  if (!redisUrl?.startsWith('rediss://')) {
    throw new Error('Maintenance requires a TLS Redis connection');
  }
  const redis = new Redis(redisUrl, { maxRetriesPerRequest: 1, commandTimeout: 10_000 });
  try {
    if (await shouldRunMaintenance({ redis, prefix: process.env.REDIS_QUEUE_PREFIX || 'bull' })) {
      await invokeMaintenance();
    }
    response.statusCode = 204;
    response.end();
  } finally {
    await redis.quit();
  }
}

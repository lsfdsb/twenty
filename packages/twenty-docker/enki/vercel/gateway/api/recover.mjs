import { QueueClient } from '@vercel/queue';
import Redis from 'ioredis';

import { recoverQueues } from '../lib/recover.mjs';
import { authorizeCron } from '../lib/authorize-cron.mjs';
import queueNames from '../queue-names.json' with { type: 'json' };

export default async function recover(request, response) {
  if (!authorizeCron(request)) {
    response.statusCode = 401;
    response.end();
    return;
  }

  const redisUrl = process.env.REDIS_QUEUE_URL || process.env.REDIS_URL;

  if (!redisUrl || !redisUrl.startsWith('rediss://')) {
    throw new Error('Queue recovery requires a TLS Redis connection');
  }

  const redis = new Redis(redisUrl, { maxRetriesPerRequest: 1, commandTimeout: 10_000 });
  const queue = new QueueClient({
    region: 'gru1',
    deploymentId: process.env.ENKI_QUEUE_PIN_CURRENT === 'true' ? undefined : null,
  });

  try {
    const recovered = await recoverQueues({
      redis,
      queueNames,
      prefix: process.env.REDIS_QUEUE_PREFIX || 'bull',
      publish: (queueName) => queue.send('enki-twenty-queue-wake', { queueName }),
    });

    response.setHeader('content-type', 'application/json');
    response.end(JSON.stringify({ recovered }));
  } finally {
    await redis.quit();
  }
}

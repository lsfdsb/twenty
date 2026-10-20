import { test } from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { createRequire } from 'node:module';

import { recoverQueues } from '../vercel/gateway/lib/recover.mjs';

const require = createRequire(new URL('../../../twenty-server/package.json', import.meta.url));
const Redis = require('ioredis');
const { Queue } = require('bullmq');

test('an empty installation inspects all queues with one command', {
  skip: !process.env.ENKI_TEST_REDIS_URL,
}, async () => {
  const redis = new Redis(process.env.ENKI_TEST_REDIS_URL);
  const prefix = `enki-recovery-empty-${randomUUID()}`;
  const calls = [];
  const originalSendCommand = redis.sendCommand.bind(redis);
  await redis.ping();
  redis.sendCommand = (command, ...arguments_) => {
    calls.push(command.name);
    return originalSendCommand(command, ...arguments_);
  };
  try {
    assert.equal(await recoverQueues({
      redis, prefix, queueNames: Array.from({ length: 26 }, (_, index) => `queue-${index}`),
      publish: async () => { throw new Error('Empty queues must not be dispatched'); },
    }), 0);
    assert.deepEqual(calls, ['exists', 'set']);
  } finally {
    await redis.del(`${prefix}:enki:recovery:last-success`);
    await redis.quit();
  }
});

test('recovery finds missed ready work, due delayed jobs and interrupted active work', {
  skip: !process.env.ENKI_TEST_REDIS_URL,
}, async () => {
  const redis = new Redis(process.env.ENKI_TEST_REDIS_URL, { maxRetriesPerRequest: null });
  const prefix = `enki-recovery-test-${randomUUID()}`;
  const queueNames = ['empty', 'ready', 'delayed', 'future', 'interrupted'];
  const queues = queueNames.map((name) => new Queue(name, { connection: redis, prefix }));

  try {
    await queues[1].add('ready', {});
    const due = await queues[2].add('delayed', {}, { delay: 30_000 });
    await queues[3].add('future', {}, { delay: 3600_000 });
    await redis.lpush(`${prefix}:interrupted:active`, 'abandoned-job');

    const notified = [];
    const now = Date.now() + 31_000;
    const count = await recoverQueues({
      redis, prefix, queueNames, now,
      publish: async (name) => notified.push(name),
    });

    assert.equal(count, 3);
    assert.deepEqual(notified, ['ready', 'delayed', 'interrupted']);
    assert.equal(await due.getState(), 'delayed');
    assert.equal(await redis.get(`${prefix}:enki:recovery:last-success`), String(now));

    await redis.del(`${prefix}:enki:recovery:last-success`);
    await assert.rejects(recoverQueues({
      redis, prefix, queueNames, now,
      publish: async () => { throw new Error('delivery unavailable'); },
    }));
    assert.equal(await redis.get(`${prefix}:enki:recovery:last-success`), null);
  } finally {
    for (const queue of queues) {
      await queue.obliterate({ force: true });
      await queue.close();
    }
    await redis.del(`${prefix}:enki:recovery:last-success`);
    await redis.quit();
  }
});

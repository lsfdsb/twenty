const { createRequire } = require('node:module');
const { resolve } = require('node:path');
const { randomUUID } = require('node:crypto');
const { setTimeout: delay } = require('node:timers/promises');

const serverPath = resolve(__dirname, '../../../twenty-server');
const serverRequire = createRequire(`${serverPath}/package.json`);
serverRequire('reflect-metadata');
const Redis = serverRequire('ioredis');
const { EventEmitter2 } = serverRequire('@nestjs/event-emitter');
const base = `${serverPath}/dist/engine/core-modules/message-queue`;
const { BullMQDriver } = require(`${base}/drivers/bullmq.driver.js`);
const { OnDemandQueueCoordinator } = require(`${base}/drivers/on-demand-queue-coordinator.js`);
const { MessageQueue } = require(`${base}/message-queue.constants.js`);
const { MESSAGE_QUEUE_WORKER_CONFIG } = require(`${base}/message-queue-worker-config.constant.js`);

(async () => {
  if (!process.env.ENKI_TEST_REDIS_URL) throw new Error('An isolated test Redis is required');
  const connection = new Redis(process.env.ENKI_TEST_REDIS_URL, { maxRetriesPerRequest: null });
  const prefix = `enki-idle-${randomUUID()}`;
  const driver = new BullMQDriver(
    { connection, prefix }, {}, { get: () => 1000 }, new EventEmitter2(),
    new OnDemandQueueCoordinator(async () => {}),
  );
  const queues = Object.values(MessageQueue);

  try {
    for (const name of queues) {
      driver.register(name);
      driver.work(name, async () => {}, MESSAGE_QUEUE_WORKER_CONFIG[name].workerOptions);
    }
    await delay(500);
    const before = Number((await connection.info('stats')).match(/total_commands_processed:(\d+)/)[1]);
    const started = Date.now();
    await delay(35_000);
    const after = Number((await connection.info('stats')).match(/total_commands_processed:(\d+)/)[1]);
    const idleCommands = after - before - 1;
    console.log(JSON.stringify({
      registeredQueues: queues.length, elapsedMilliseconds: Date.now() - started,
      idleServerCommandsExcludingMeasurement: idleCommands,
      scope: 'queue drivers only; recovery cron and productive work excluded',
    }, null, 2));
    if (idleCommands !== 0) process.exitCode = 1;
  } finally {
    await driver.onModuleDestroy();
    const keys = await connection.keys(`${prefix}:*`);
    if (keys.length) await connection.del(...keys);
    await connection.quit();
  }
})().catch(() => { console.error('Idle probe failed'); process.exitCode = 1; });

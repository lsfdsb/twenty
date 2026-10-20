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

(async () => {
  if (!process.env.ENKI_TEST_REDIS_URL) throw new Error('An isolated test Redis is required');
  const connection = new Redis(process.env.ENKI_TEST_REDIS_URL, { maxRetriesPerRequest: null });
  const prefix = `enki-cost-${randomUUID()}`;
  const driver = new BullMQDriver(
    { connection, prefix },
    { incrementCounterForEvent() {}, recordHistogram() {} },
    { get: () => 1000 }, new EventEmitter2(),
    new OnDemandQueueCoordinator(async () => {}),
  );
  const commands = async () => Number((await connection.info('stats'))
    .match(/total_commands_processed:(\d+)/)[1]);
  const scenarios = [];

  try {
    driver.register(MessageQueue.cronQueue);
    driver.work(MessageQueue.cronQueue, async () => {});
    await delay(250);
    for (const count of [1, 10]) {
      const before = await commands();
      await driver.bulkAdd(MessageQueue.cronQueue, 'no-op-maintenance',
        Array.from({ length: count }, () => ({ data: {} })));
      await driver.drainOnDemand(MessageQueue.cronQueue);
      const measured = (await commands()) - before - 1;
      scenarios.push({ jobs: count, serverCommands: measured });
    }
    await driver.addCron({ queueName: MessageQueue.cronQueue, jobName: 'repeat-maintenance',
      data: {}, options: { repeat: { every: 300 } } });
    await driver.drainOnDemand(MessageQueue.cronQueue);
    for (let repetition = 1; repetition <= 3; repetition++) {
      await delay(325);
      const before = await commands();
      await driver.drainOnDemand(MessageQueue.cronQueue);
      const measured = (await commands()) - before - 1;
      scenarios.push({ jobs: 1, repeat: true, repetition, serverCommands: measured });
    }
    console.log(JSON.stringify({
      scenarios,
      scope: 'No-op processors; includes Redis Lua commands, excludes application work and Vercel Queue operations. Run alone against an isolated Redis.',
      billingMeasurement: false,
    }, null, 2));
  } finally {
    await driver.onModuleDestroy();
    const keys = await connection.keys(`${prefix}:*`);
    if (keys.length) await connection.del(...keys);
    await connection.quit();
  }
})().catch(() => { console.error('Queue cost probe failed'); process.exitCode = 1; });

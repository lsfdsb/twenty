// A bounded compatibility check. Only its random, isolated prefix is removed.
const { createRequire } = require('node:module');
const { randomUUID } = require('node:crypto');
const { setTimeout: sleep } = require('node:timers/promises');
const runtimeRequire = createRequire('/app/packages/twenty-server/package.json');
const Redis = runtimeRequire('ioredis');
const { Queue, Worker } = runtimeRequire('bullmq');
const prefix = `enki-probe-${randomUUID()}`;
const connection = new Redis(process.env.REDIS_URL, {
  maxRetriesPerRequest: null, connectTimeout: 10000, retryStrategy: () => null,
});
const queues = [];
const workers = [];
const failures = [];
const completed = new Set();
let commands = 0;
const original = Redis.prototype.sendCommand;
Redis.prototype.sendCommand = function (...args) {
  commands += 1;
  return original.apply(this, args);
};
connection.on('error', (error) => failures.push(error.name));
const timeout = setTimeout(() => { console.error('Probe timed out'); process.exit(1); }, 85000);

(async () => {
  try {
    await connection.ping();
    for (let index = 0; index < 27; index += 1) {
      const name = `queue-${index}`;
      const queue = new Queue(name, { connection, prefix });
      const worker = new Worker(name, async (job) => {
        if (job.name === 'retry' && job.attemptsMade === 0) throw new Error('Expected retry');
        completed.add(job.name);
      }, { connection, prefix });
      worker.on('error', (error) => failures.push(error.name));
      queues.push(queue);
      workers.push(worker);
    }
    await Promise.all(workers.map((worker) => worker.waitUntilReady()));
    await queues[0].add('immediate', {});
    await queues[0].add('delayed', {}, { delay: 1000 });
    await queues[0].add('retry', {}, { attempts: 2, backoff: { type: 'fixed', delay: 1000 } });
    await sleep(5000);
    const before = commands;
    const started = Date.now();
    await sleep(35000);
    const elapsedSeconds = (Date.now() - started) / 1000;
    const idleCommands = commands - before;
    const result = {
      workerCount: workers.length,
      completed: [...completed].sort(),
      errors: failures,
      elapsedSeconds, idleCommands,
      projectedIdleCommandsPer30Days: Math.round(idleCommands / elapsedSeconds * 2592000),
      caveat: 'Client commands, not a billing measurement; excludes application traffic and native cron jobs.',
    };
    console.log(JSON.stringify(result));
    if (completed.size !== 3 || failures.length) process.exitCode = 1;
  } catch (error) {
    console.error(JSON.stringify({ error: error.name, code: error.code ?? null }));
    process.exitCode = 1;
  } finally {
    await Promise.all(workers.map((worker) => worker.close(true)));
    await Promise.all(queues.map(async (queue) => {
      await queue.obliterate({ force: true });
      await queue.close();
    }));
    await connection.quit();
    clearTimeout(timeout);
  }
})();

import { randomUUID } from 'node:crypto';
import { setTimeout as delay } from 'node:timers/promises';

import { EventEmitter2 } from '@nestjs/event-emitter';
import { Queue, Worker } from 'bullmq';
import Redis from 'ioredis';

import { BullMQDriver } from 'src/engine/core-modules/message-queue/drivers/bullmq.driver';
import { OnDemandQueueCoordinator } from 'src/engine/core-modules/message-queue/drivers/on-demand-queue-coordinator';
import { MessageQueue } from 'src/engine/core-modules/message-queue/message-queue.constants';
import { type MetricsService } from 'src/engine/core-modules/metrics/metrics.service';
import { type TwentyConfigService } from 'src/engine/core-modules/twenty-config/twenty-config.service';

const integration = process.env.ENKI_TEST_REDIS_URL ? describe : describe.skip;

integration('on-demand BullMQ with real isolated Redis', () => {
  const queueName = MessageQueue.emailQueue;
  let connection: Redis;
  let queue: Queue;
  let driver: BullMQDriver;
  let coordinator: OnDemandQueueCoordinator;
  let publish: jest.Mock;

  beforeEach(() => {
    jest.useRealTimers();
    connection = new Redis(process.env.ENKI_TEST_REDIS_URL!, {
      maxRetriesPerRequest: null,
    });
    const options = { connection, prefix: `enki-test-${randomUUID()}` };

    publish = jest.fn().mockResolvedValue(undefined);
    coordinator = new OnDemandQueueCoordinator(publish, 500);
    driver = new BullMQDriver(
      options,
      {
        recordHistogram: jest.fn(),
        incrementCounterForEvent: jest.fn(),
      } as unknown as MetricsService,
      {
        get: jest.fn().mockReturnValue(1000),
      } as unknown as TwentyConfigService,
      new EventEmitter2(),
      coordinator,
    );
    driver.register(queueName);
    queue = new Queue(queueName, options);
  });

  afterEach(async () => {
    await driver.onModuleDestroy();
    await queue.obliterate({ force: true });
    await queue.close();
    await connection.quit();
  });

  it('does not start a worker until requested, then persists progress and completion', async () => {
    const handler = jest.fn(async (job) => {
      await job.updateProgress({ sent: 1 });
    });

    driver.work(queueName, handler);
    const id = (await driver.add(queueName, 'email', { workspaceId: 'a' }))!;

    expect(Number.isFinite(publish.mock.calls[0][1])).toBe(true);
    await delay(75);
    expect(handler).not.toHaveBeenCalled();
    expect(await queue.getWorkers()).toHaveLength(0);
    await driver.drainOnDemand(queueName);
    expect(handler).toHaveBeenCalledTimes(1);
    expect(await driver.getJobs(queueName, [id])).toMatchObject({
      [id]: { state: 'completed', progress: { sent: 1 } },
    });
    expect(await queue.getWorkers()).toHaveLength(0);
  });

  it('retains priority ordering, batch IDs and tenant payloads', async () => {
    const handled: string[] = [];

    driver.work(queueName, async (job) => {
      handled.push((job.data as { workspaceId: string }).workspaceId);
    });
    await driver.bulkAdd(
      queueName,
      'email',
      [{ jobId: 'low', data: { workspaceId: 'a' } }],
      { priority: 8 },
    );
    await driver.add(queueName, 'email', { workspaceId: 'b' }, { priority: 1 });
    expect(
      publish.mock.calls.every(([, availableAt]) =>
        Number.isFinite(availableAt),
      ),
    ).toBe(true);
    await driver.drainOnDemand(queueName);
    expect(handled).toEqual(['b', 'a']);
    expect(await driver.getJobs(queueName, ['low'])).toMatchObject({
      low: { data: { workspaceId: 'a' }, state: 'completed' },
    });
  });

  it('does not execute delayed jobs early and schedules the next wake-up', async () => {
    const handler = jest.fn();

    driver.work(queueName, handler);
    await driver.add(queueName, 'later', {}, { delay: 250 });
    await driver.drainOnDemand(queueName);
    expect(handler).not.toHaveBeenCalled();
    expect(publish).toHaveBeenLastCalledWith(queueName, expect.any(Number));
    await delay(275);
    await driver.drainOnDemand(queueName);
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it('preserves retry limits, backoff and the final failure state', async () => {
    const handler = jest.fn().mockRejectedValue(new Error('delivery failed'));

    driver.work(queueName, handler);
    const id = (await driver.add(
      queueName,
      'retry',
      {},
      {
        retryLimit: 1,
        backoff: { strategy: 'fixed', initialDelayMilliseconds: 200 },
      },
    ))!;

    await driver.drainOnDemand(queueName);
    expect(handler).toHaveBeenCalledTimes(1);
    await delay(225);
    await driver.drainOnDemand(queueName);
    expect(handler).toHaveBeenCalledTimes(2);
    expect(await driver.getJobs(queueName, [id])).toMatchObject({
      [id]: {
        state: 'failed',
        attemptsMade: 2,
        failedReason: 'delivery failed',
      },
    });
  });

  it('keeps accepted jobs recoverable when publishing fails', async () => {
    const handler = jest.fn();

    publish.mockRejectedValue(new Error('publisher unavailable'));
    driver.work(queueName, handler);
    const id = (await driver.add(queueName, 'email', {}))!;

    expect((await driver.getJobs(queueName, [id]))[id]?.state).toBe(
      'prioritized',
    );
    publish.mockResolvedValue(undefined);
    await driver.drainOnDemand(queueName);
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it('serializes duplicate notifications without duplicating a completed job', async () => {
    const handler = jest.fn(async () => delay(30));

    driver.work(queueName, handler);
    await driver.add(queueName, 'once', {});
    await Promise.all([
      driver.drainOnDemand(queueName),
      driver.drainOnDemand(queueName),
    ]);
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it('processes a notification that arrives while an earlier drain is closing', async () => {
    let markStarted: () => void = () => undefined;
    let release: () => void = () => undefined;
    const started = new Promise<void>((resolve) => {
      markStarted = resolve;
    });
    const untilReleased = new Promise<void>((resolve) => {
      release = resolve;
    });
    const handled: string[] = [];

    driver.work<{ name: string }>(queueName, async (job) => {
      handled.push(job.data.name);
      if (job.data.name === 'first') {
        markStarted();
        await untilReleased;
      }
    });
    await driver.add(queueName, 'email', { name: 'first' });
    const firstDrain = driver.drainOnDemand(queueName);

    await started;
    await delay(550);
    await driver.add(queueName, 'email', { name: 'second' });
    const nextDrain = driver.drainOnDemand(queueName);

    release();
    await Promise.all([firstDrain, nextDrain]);
    expect(handled).toEqual(['first', 'second']);
  });

  it('preserves paused jobs until the queue is resumed', async () => {
    const handler = jest.fn();

    driver.work(queueName, handler);
    await queue.pause();
    await driver.add(queueName, 'email', {});
    await driver.drainOnDemand(queueName);
    expect(handler).not.toHaveBeenCalled();
    await queue.resume();
    await driver.drainOnDemand(queueName);
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it('recovers an active job after its worker stops and the lock expires', async () => {
    const handler = jest.fn();
    const options = {
      connection,
      prefix: queue.opts.prefix,
      autorun: false,
      lockDuration: 80,
      stalledInterval: 50,
    };
    const stoppedWorker = new Worker(queueName, undefined, options);
    const id = (await driver.add(queueName, 'interrupted', {}))!;

    try {
      const claimed = await stoppedWorker.getNextJob('interrupted-worker', {
        block: false,
      });

      expect(claimed?.id).toBe(id);
    } finally {
      await stoppedWorker.close(true);
    }
    coordinator.register(
      queueName,
      async () => new Worker(queueName, handler, options),
    );
    await delay(100);
    await driver.drainOnDemand(queueName);
    await delay(75);
    await driver.drainOnDemand(queueName);
    expect(handler).toHaveBeenCalledTimes(1);
    expect(await queue.getJobState(id)).toBe('completed');
    expect(await queue.getWorkers()).toHaveLength(0);
  });

  it('enforces global concurrency across independent worker instances', async () => {
    let active = 0;
    let peak = 0;
    const handler = jest.fn(async () => {
      active++;
      peak = Math.max(peak, active);
      await delay(15);
      active--;
    });
    const otherDriver = new BullMQDriver(
      { connection, prefix: queue.opts.prefix },
      {
        recordHistogram: jest.fn(),
        incrementCounterForEvent: jest.fn(),
      } as unknown as MetricsService,
      {
        get: jest.fn().mockReturnValue(1000),
      } as unknown as TwentyConfigService,
      new EventEmitter2(),
      new OnDemandQueueCoordinator(publish, 500),
    );

    otherDriver.register(queueName);
    driver.work(queueName, handler, { concurrency: 3, globalConcurrency: 1 });
    otherDriver.work(queueName, handler, {
      concurrency: 3,
      globalConcurrency: 1,
    });
    try {
      await driver.bulkAdd(
        queueName,
        'email',
        Array.from({ length: 5 }, () => ({ data: {} })),
      );
      for (let delivery = 0; delivery < 5; delivery++) {
        publish.mockClear();
        await Promise.all([
          driver.drainOnDemand(queueName),
          otherDriver.drainOnDemand(queueName),
        ]);
        if ((await queue.getCompletedCount()) === 5) break;
        expect(publish).toHaveBeenCalledWith(queueName, expect.any(Number));
      }
      expect(handler).toHaveBeenCalledTimes(5);
      expect(peak).toBe(1);
    } finally {
      await otherDriver.onModuleDestroy();
    }
  });

  it('registers native maintenance without Redis polling and honors cancellation', async () => {
    const handler = jest.fn();

    driver.work(queueName, handler);
    await driver.addCron({
      queueName,
      jobName: 'scheduled',
      data: undefined,
      options: { repeat: { pattern: '* * * * *' } },
    });
    expect(await queue.getJobSchedulers()).toHaveLength(0);
    expect(publish).not.toHaveBeenCalled();
    const [schedule] = driver.onDemandSchedules.list();
    await driver.onDemandSchedules.execute(
      schedule.key,
      'maintenance-execution',
    );
    expect(handler).toHaveBeenCalledTimes(1);
    await driver.removeCron({ queueName, jobName: 'scheduled' });
    await expect(
      driver.onDemandSchedules.execute(schedule.key, 'after-cancel'),
    ).rejects.toThrow();
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it('rejects an unknown queue instead of acknowledging unprocessed work', async () => {
    await expect(
      driver.drainOnDemand(MessageQueue.billingQueue),
    ).rejects.toThrow();
  });
});

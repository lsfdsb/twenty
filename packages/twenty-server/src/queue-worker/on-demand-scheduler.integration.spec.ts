import { randomUUID } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { DataSource } from 'typeorm';

import { OnDemandScheduleRegistry } from 'src/engine/core-modules/message-queue/drivers/on-demand-schedule-registry';
import { MessageQueue } from 'src/engine/core-modules/message-queue/message-queue.constants';
import { OnDemandScheduler } from 'src/queue-worker/on-demand-scheduler';

const databaseUrl = process.env.ENKI_TEST_POSTGRES_URL;
const describeWithDatabase = databaseUrl ? describe : describe.skip;

describeWithDatabase('on-demand maintenance with PostgreSQL', () => {
  let database: DataSource;
  const initial = new Date('2026-10-20T12:00:10Z');
  const due = new Date('2026-10-20T12:01:10Z');
  const keys: string[] = [];

  const setup = (handler = jest.fn().mockResolvedValue(undefined)) => {
    const registry = new OnDemandScheduleRegistry();
    registry.registerHandler(MessageQueue.cronQueue, handler);
    registry.register({
      queueName: MessageQueue.cronQueue,
      jobName: `isolated-${randomUUID()}`,
      data: undefined,
      options: { repeat: { pattern: '* * * * *' } },
    });
    const key = registry.list()[0].key;
    keys.push(key);
    return {
      registry,
      key,
      handler,
      scheduler: new OnDemandScheduler(database, registry),
    };
  };

  beforeAll(async () => {
    jest.useRealTimers();
    const url = new URL(databaseUrl!);
    if (
      url.hostname !== '127.0.0.1' ||
      url.pathname !== '/enki_scheduler_test'
    ) {
      throw new Error(
        'Scheduler integration tests require the isolated local database',
      );
    }
    database = new DataSource({ type: 'postgres', url: databaseUrl });
    await database.initialize();
    await database.query(
      readFileSync(
        resolve(
          __dirname,
          '../../../twenty-docker/enki/schema/001-on-demand-maintenance.sql',
        ),
        'utf8',
      ),
    );
  });

  afterAll(async () => {
    if (database?.isInitialized) {
      await database.query(
        'DELETE FROM enki_runtime.maintenance_schedule WHERE key = ANY($1::text[])',
        [keys],
      );
      await database.destroy();
    }
  });

  it('uses native frequency and survives a process restart without duplicate execution', async () => {
    const { scheduler, registry, handler } = setup();
    expect((await scheduler.tick(initial)).executed).toBe(0);
    expect((await scheduler.tick(due)).executed).toBe(1);
    expect(
      (await new OnDemandScheduler(database, registry).tick(due)).executed,
    ).toBe(0);
    expect(handler).toHaveBeenCalledTimes(1);
    await scheduler.tick(new Date('2026-10-20T12:02:10Z'));
    expect(handler).toHaveBeenCalledTimes(2);
  });

  it('does not overlap a running handler across independent worker instances', async () => {
    let entered!: () => void;
    let release!: () => void;
    const started = new Promise<void>((resolveStarted) => {
      entered = resolveStarted;
    });
    const pending = new Promise<void>((resolvePending) => {
      release = resolvePending;
    });
    const handler = jest.fn(async () => {
      entered();
      await pending;
    });
    const { scheduler, registry } = setup(handler);
    await scheduler.tick(initial);
    const first = scheduler.tick(due);
    await started;
    try {
      const competing = new OnDemandScheduler(database, registry);
      expect((await competing.tick(due)).executed).toBe(0);
      expect(handler).toHaveBeenCalledTimes(1);
    } finally {
      release();
      await first;
    }
  });

  it('records a failure and retries instead of advancing the schedule cursor', async () => {
    const handler = jest
      .fn()
      .mockRejectedValueOnce(new Error('native failure'))
      .mockResolvedValue(undefined);
    const { scheduler, key } = setup(handler);
    await scheduler.tick(initial);
    await expect(scheduler.tick(due)).rejects.toThrow('Maintenance failed');
    const [failed] = await database.query(
      'SELECT * FROM enki_runtime.maintenance_schedule WHERE key = $1',
      [key],
    );
    expect(failed.consecutiveFailures).toBe(1);
    expect(failed.leaseToken).toBeNull();
    expect(new Date(failed.lastSuccessAt)).toEqual(initial);
    expect((await scheduler.tick(due)).executed).toBe(1);
    const [retried] = await database.query(
      'SELECT * FROM enki_runtime.maintenance_schedule WHERE key = $1',
      [key],
    );
    expect(retried.consecutiveFailures).toBe(0);
    expect(handler).toHaveBeenCalledTimes(2);
  });

  it('recovers an expired process lease but respects a live lease', async () => {
    const { scheduler, key, handler } = setup();
    await scheduler.tick(initial);
    await database.query(
      'UPDATE enki_runtime.maintenance_schedule SET "leaseToken" = $2, "leaseUntil" = $3 WHERE key = $1',
      [key, randomUUID(), new Date('2026-10-20T12:15:00Z')],
    );
    expect((await scheduler.tick(due)).executed).toBe(0);
    expect(
      (await scheduler.tick(new Date('2026-10-20T12:15:01Z'))).executed,
    ).toBe(1);
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it('does not execute removed or disabled schedules left by an older release', async () => {
    const { scheduler, registry, handler } = setup();
    await scheduler.tick(initial);
    const registered = registry.list()[0];
    registry.remove(registered.queueName, registered.jobName);
    await expect(scheduler.tick(due)).rejects.toThrow(
      'No native maintenance schedules',
    );
    expect(handler).not.toHaveBeenCalled();
  });
});

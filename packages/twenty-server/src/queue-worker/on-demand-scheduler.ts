import { randomUUID } from 'node:crypto';

import { CronExpressionParser } from 'cron-parser';
import { type DataSource } from 'typeorm';

import { type OnDemandScheduleRegistry } from 'src/engine/core-modules/message-queue/drivers/on-demand-schedule-registry';

type ScheduleState = {
  key: string;
  lastSuccessAt: Date;
};

const SCHEDULE_LEASE_MS = 15 * 60_000;
const TICK_BUDGET_MS = 10 * 60_000;

export class OnDemandScheduler {
  private initialized = false;

  constructor(
    private readonly database: Pick<DataSource, 'query'>,
    private readonly registry: OnDemandScheduleRegistry,
  ) {}

  async tick(now = new Date()) {
    const schedules = this.registry.list();

    if (schedules.length === 0) {
      throw new Error('No native maintenance schedules registered');
    }

    if (!this.initialized) {
      await this.database.query(
        `INSERT INTO enki_runtime.maintenance_schedule (key, pattern, "lastSuccessAt")
         SELECT definition.key, definition.pattern, $2::timestamptz
         FROM jsonb_to_recordset($1::jsonb) AS definition(key text, pattern text)
         ON CONFLICT (key) DO UPDATE SET pattern = EXCLUDED.pattern
         WHERE maintenance_schedule.pattern IS DISTINCT FROM EXCLUDED.pattern`,
        [JSON.stringify(schedules), now],
      );
      this.initialized = true;
    }

    const states: ScheduleState[] = await this.database.query(
      `SELECT key, "lastSuccessAt" FROM enki_runtime.maintenance_schedule
       WHERE key = ANY($1::text[])`,
      [schedules.map(({ key }) => key)],
    );
    const stateByKey = new Map(states.map((state) => [state.key, state]));
    const startedAt = Date.now();
    const failures: string[] = [];
    let executed = 0;

    for (const schedule of schedules) {
      if (Date.now() - startedAt >= TICK_BUDGET_MS) {
        throw new Error('Maintenance tick exceeded its execution budget');
      }

      const due = CronExpressionParser.parse(schedule.pattern, {
        currentDate: new Date(now.getTime() + 1),
        tz: 'UTC',
      })
        .prev()
        .toDate();
      const state = stateByKey.get(schedule.key);

      if (!state || new Date(state.lastSuccessAt) >= due) {
        continue;
      }

      const token = randomUUID();
      const claimed: { key: string }[] = await this.database.query(
        `WITH claimed AS (UPDATE enki_runtime.maintenance_schedule
         SET "leaseToken" = $2, "leaseUntil" = $3, "lastStartedAt" = $4
         WHERE key = $1 AND "lastSuccessAt" < $5
         AND ("leaseUntil" IS NULL OR "leaseUntil" <= $4)
         RETURNING key) SELECT key FROM claimed`,
        [
          schedule.key,
          token,
          new Date(now.getTime() + SCHEDULE_LEASE_MS),
          now,
          due,
        ],
      );

      if (claimed.length === 0) {
        continue;
      }

      try {
        await this.registry.execute(schedule.key, token);
        const completed: { key: string }[] = await this.database.query(
          `WITH completed AS (UPDATE enki_runtime.maintenance_schedule
           SET "lastSuccessAt" = $3, "leaseToken" = NULL, "leaseUntil" = NULL,
               "consecutiveFailures" = 0, "lastError" = NULL
           WHERE key = $1 AND "leaseToken" = $2 RETURNING key)
           SELECT key FROM completed`,
          [schedule.key, token, now],
        );

        if (completed.length === 0) {
          throw new Error('Maintenance execution lost its lease');
        }

        executed++;
      } catch {
        await this.database.query(
          `UPDATE enki_runtime.maintenance_schedule
           SET "leaseToken" = NULL, "leaseUntil" = NULL,
               "consecutiveFailures" = "consecutiveFailures" + 1,
               "lastError" = 'Native handler failed; inspect application logs'
           WHERE key = $1 AND "leaseToken" = $2`,
          [schedule.key, token],
        );
        failures.push(schedule.jobName);
      }
    }

    if (failures.length > 0) {
      throw new Error(`Maintenance failed: ${failures.join(', ')}`);
    }

    await this.database.query(
      `INSERT INTO enki_runtime.maintenance_health (id, "lastSuccessAt")
       VALUES (true, $1)
       ON CONFLICT (id) DO UPDATE SET "lastSuccessAt" = EXCLUDED."lastSuccessAt"`,
      [now],
    );

    return { executed, registered: schedules.length };
  }
}

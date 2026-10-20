import { CronExpressionParser } from 'cron-parser';

import { type QueueCronJobOptions } from 'src/engine/core-modules/message-queue/drivers/interfaces/job-options.interface';
import { type MessageQueueJob } from 'src/engine/core-modules/message-queue/interfaces/message-queue-job.interface';
import { type MessageQueue } from 'src/engine/core-modules/message-queue/message-queue.constants';

export type OnDemandSchedule = {
  key: string;
  queueName: MessageQueue;
  jobName: string;
  pattern: string;
};

export class OnDemandScheduleRegistry {
  private readonly schedules = new Map<string, OnDemandSchedule>();
  private readonly handlers = new Map<
    MessageQueue,
    (job: MessageQueueJob<unknown>) => Promise<void>
  >();

  registerHandler<T>(
    queueName: MessageQueue,
    handler: (job: MessageQueueJob<T>) => Promise<void>,
  ) {
    this.handlers.set(queueName, (job) => handler(job as MessageQueueJob<T>));
  }

  register({
    queueName,
    jobName,
    jobId,
    data,
    options,
  }: {
    queueName: MessageQueue;
    jobName: string;
    jobId?: string;
    data: unknown;
    options: QueueCronJobOptions;
  }) {
    const { pattern, every, limit } = options.repeat;

    // Only native static maintenance schedules use this path. Business jobs
    // retain BullMQ persistence, retries, progress and delayed delivery.
    if (!pattern || every || limit || data !== undefined || jobId) {
      throw new Error('Unsupported on-demand maintenance schedule');
    }

    CronExpressionParser.parse(pattern, { tz: 'UTC' });
    const key = `${queueName}:${jobName}`;

    this.schedules.set(key, { key, queueName, jobName, pattern });
  }

  list(): OnDemandSchedule[] {
    return [...this.schedules.values()];
  }

  remove(queueName: MessageQueue, jobName: string) {
    this.schedules.delete(`${queueName}:${jobName}`);
  }

  async execute(key: string, executionId: string) {
    const schedule = this.schedules.get(key);
    const handler = schedule && this.handlers.get(schedule.queueName);

    if (!schedule || !handler) {
      throw new Error('Unknown on-demand maintenance schedule');
    }

    await handler({
      id: executionId,
      name: schedule.jobName,
      data: undefined,
      retryLimit: 0,
      updateData: async () => {
        throw new Error('Maintenance schedule data cannot be changed');
      },
      updateProgress: async () => undefined,
    });
  }
}

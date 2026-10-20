import { Logger } from '@nestjs/common';

import { type Queue, type Worker } from 'bullmq';

import { type MessageQueue } from 'src/engine/core-modules/message-queue/message-queue.constants';

export type QueueWakePublisher = (
  queueName: MessageQueue,
  availableAt: number,
) => Promise<void>;

// Redis remains the durable job store. Notifications contain only a queue name;
// the recovery sweep also finds jobs accepted just before a publisher crash.
export class OnDemandQueueCoordinator {
  private readonly logger = new Logger(OnDemandQueueCoordinator.name);
  private readonly factories = new Map<MessageQueue, () => Promise<Worker>>();
  private readonly running = new Map<MessageQueue, Promise<void>>();
  private shuttingDown = false;

  constructor(
    private readonly publish: QueueWakePublisher,
    private readonly fetchWindowMilliseconds = 30_000,
  ) {}

  register(queueName: MessageQueue, factory: () => Promise<Worker>) {
    this.factories.set(queueName, factory);
  }

  async notify(queueName: MessageQueue, availableAt = Date.now()) {
    try {
      await this.publish(queueName, availableAt);
    } catch (error) {
      this.logger.error(
        `Queue notification failed for ${queueName}; the durable Redis job requires the recovery sweep`,
        error instanceof Error ? error.message : 'Unknown publisher error',
      );
    }
  }

  async run(queueName: MessageQueue, queue: Queue): Promise<void> {
    if (this.shuttingDown) {
      throw new Error('Queue worker is shutting down');
    }

    const factory = this.factories.get(queueName);

    if (!factory) {
      throw new Error(`No processor registered for queue ${queueName}`);
    }

    const previous = this.running.get(queueName);
    const execution = (async () => {
      // A notification arriving during shutdown may refer to a newer job.
      // Serialize another drain rather than acknowledging the older drain.
      await previous?.catch(() => undefined);

      if (await queue.isPaused()) {
        return;
      }

      const worker = await factory();

      try {
        await this.drain(worker);
      } finally {
        await worker.close();
      }

      await this.scheduleNext(queueName, queue);
    })();

    this.running.set(queueName, execution);

    try {
      await execution;
    } finally {
      if (this.running.get(queueName) === execution) {
        this.running.delete(queueName);
      }
    }
  }

  async close() {
    this.shuttingDown = true;
    await Promise.allSettled(this.running.values());
  }

  private async drain(worker: Worker) {
    let closePromise: Promise<void> | undefined;
    let workerError: Error | undefined;
    const close = () => {
      closePromise ??= worker.close();
      // run() below owns failure propagation; EventEmitter cannot await us.
      void closePromise.catch(() => undefined);
    };
    const onError = (error: Error) => {
      workerError ??= error;
      close();
    };
    const timer = setTimeout(close, this.fetchWindowMilliseconds);

    worker.once('drained', close);
    worker.on('error', onError);

    try {
      await worker.run();
      await closePromise;

      if (workerError) {
        throw workerError;
      }
    } finally {
      clearTimeout(timer);
      worker.off('drained', close);
      worker.off('error', onError);
    }
  }

  async scheduleNext(queueName: MessageQueue, queue: Queue) {
    if (await queue.isPaused()) {
      return;
    }

    const [waiting, prioritized, active, delayed] = await Promise.all([
      queue.getWaitingCount(),
      queue.getPrioritizedCount(),
      queue.getActiveCount(),
      queue.getDelayed(0, 0),
    ]);

    if (waiting > 0 || prioritized > 0) {
      await this.publish(queueName, Date.now());
    } else if (delayed.length > 0 || active > 0) {
      const nextDelayed = delayed[0]
        ? delayed[0].timestamp + delayed[0].delay
        : Number.POSITIVE_INFINITY;

      // Another instance may still own a lock, or may have died holding it.
      const nextRecovery = active > 0 ? Date.now() + 60_000 : Infinity;

      await this.publish(queueName, Math.min(nextDelayed, nextRecovery));
    }
  }
}

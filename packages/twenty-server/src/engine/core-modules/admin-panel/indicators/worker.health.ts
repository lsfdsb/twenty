import { Injectable, Logger } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import {
  type HealthIndicatorResult,
  HealthIndicatorService,
} from '@nestjs/terminus';

import { Queue } from 'bullmq';
import { DataSource } from 'typeorm';

import { HEALTH_ERROR_MESSAGES } from 'src/engine/core-modules/admin-panel/constants/health-error-messages.constants';
import { METRICS_FAILURE_RATE_THRESHOLD } from 'src/engine/core-modules/admin-panel/constants/metrics-failure-rate-threshold.const';
import { type WorkerQueueHealth } from 'src/engine/core-modules/admin-panel/types/worker-queue-health.type';
import { withHealthCheckTimeout } from 'src/engine/core-modules/admin-panel/utils/health-check-timeout.util';
import { MessageQueue } from 'src/engine/core-modules/message-queue/message-queue.constants';
import { RedisClientService } from 'src/engine/core-modules/redis-client/redis-client.service';
import { TwentyConfigService } from 'src/engine/core-modules/twenty-config/twenty-config.service';

const ON_DEMAND_BACKLOG_TIMEOUT_MS = 15 * 60_000;

@Injectable()
export class WorkerHealthIndicator {
  private readonly logger = new Logger(WorkerHealthIndicator.name);

  constructor(
    private readonly redisClient: RedisClientService,
    private readonly healthIndicatorService: HealthIndicatorService,
    private readonly twentyConfigService: TwentyConfigService,
    @InjectDataSource()
    private readonly dataSource: DataSource,
  ) {}

  async isHealthy(): Promise<HealthIndicatorResult> {
    const indicator = this.healthIndicatorService.check('worker');

    try {
      const workerStatus = await withHealthCheckTimeout(
        this.checkWorkers(),
        HEALTH_ERROR_MESSAGES.WORKER_TIMEOUT,
      );

      if (workerStatus.status === 'up') {
        return indicator.up({
          queues: workerStatus.queues,
        });
      }

      return indicator.down(workerStatus.error);
    } catch (error) {
      const errorMessage =
        error.message === HEALTH_ERROR_MESSAGES.WORKER_TIMEOUT
          ? HEALTH_ERROR_MESSAGES.WORKER_TIMEOUT
          : HEALTH_ERROR_MESSAGES.WORKER_CHECK_FAILED;

      return indicator.down(errorMessage);
    }
  }

  async getQueueDetails(
    queueName: MessageQueue,
    options?: {
      pointsNeeded?: number;
    },
  ): Promise<WorkerQueueHealth | null> {
    const redis = this.redisClient.getQueueClient();
    const queue = new Queue(queueName, {
      connection: redis,
      prefix: this.redisClient.getQueuePrefix(),
    });

    try {
      const workers = await queue.getWorkers();

      if (
        workers.length > 0 ||
        this.twentyConfigService.get('MESSAGE_QUEUE_ON_DEMAND_ENABLED')
      ) {
        const metricsParams = options?.pointsNeeded
          ? [0, options.pointsNeeded - 1]
          : [];

        const [
          failedMetrics,
          completedMetrics,
          waitingCount,
          prioritizedCount,
          activeCount,
          delayedCount,
        ] = await Promise.all([
          queue.getMetrics('failed', ...metricsParams),
          queue.getMetrics('completed', ...metricsParams),
          queue.getWaitingCount(),
          queue.getPrioritizedCount(),
          queue.getActiveCount(),
          queue.getDelayedCount(),
        ]);

        const failedCount = options?.pointsNeeded
          ? this.calculateMetricsSum(failedMetrics.data)
          : failedMetrics.count;

        const completedCount = options?.pointsNeeded
          ? this.calculateMetricsSum(completedMetrics.data)
          : completedMetrics.count;

        const totalJobs = failedCount + completedCount;
        const failureRate =
          totalJobs > 0
            ? Number(((failedCount / totalJobs) * 100).toFixed(1))
            : 0;
        const pendingJobs = this.twentyConfigService.get(
          'MESSAGE_QUEUE_ON_DEMAND_ENABLED',
        )
          ? await queue.getJobs(['wait', 'prioritized', 'active'], 0, 0, true)
          : [];
        const hasStaleJobs = pendingJobs.some(
          (job) =>
            Date.now() - (job.processedOn ?? job.timestamp) >
            ON_DEMAND_BACKLOG_TIMEOUT_MS,
        );

        return {
          queueName,
          workers: workers.length,
          status:
            failureRate > METRICS_FAILURE_RATE_THRESHOLD || hasStaleJobs
              ? 'down'
              : 'up',
          metrics: {
            failed: failedCount,
            completed: completedCount,
            waiting: waitingCount + prioritizedCount,
            active: activeCount,
            delayed: delayedCount,
            failureRate,
            ...(options?.pointsNeeded && {
              failedData: failedMetrics.data.map(Number),
              completedData: completedMetrics.data.map(Number),
            }),
          },
        };
      }

      return null;
    } catch (error) {
      this.logger.error(
        `Error getting queue details for ${queueName}: ${error.message}`,
      );
      throw error;
    } finally {
      await queue.close();
    }
  }

  private calculateMetricsSum(data: string[] | number[]): number {
    const sum = data.reduce((sum: number, value: string | number) => {
      const numericValue = Number(value);

      return sum + (isNaN(numericValue) ? 0 : numericValue);
    }, 0);

    return Math.round(Number(sum));
  }

  private async checkWorkers() {
    const queues = Object.values(MessageQueue);
    const queueStatuses: WorkerQueueHealth[] = [];

    for (const queueName of queues) {
      try {
        const queueDetails = await this.getQueueDetails(queueName);

        if (queueDetails) {
          queueStatuses.push(queueDetails);
        }
      } catch (error) {
        this.logger.error(
          `Error checking worker for queue ${queueName}: ${error.message}`,
        );
      }
    }

    const hasActiveWorkers = queueStatuses.some((q) => q.workers > 0);

    if (this.twentyConfigService.get('MESSAGE_QUEUE_ON_DEMAND_ENABLED')) {
      const recoveredAt = await this.redisClient
        .getQueueClient()
        .get(`${this.redisClient.getQueuePrefix()}:enki:recovery:last-success`);

      const age = Date.now() - Number(recoveredAt);
      const recoveryHealthy =
        recoveredAt !== null && age >= 0 && age < 10 * 60_000;
      const maintenanceRows: { lastSuccessAt: Date }[] =
        await this.dataSource.query(
          'SELECT "lastSuccessAt" FROM enki_runtime.maintenance_health WHERE id = true',
        );
      const maintenanceAge = maintenanceRows[0]
        ? Date.now() - new Date(maintenanceRows[0].lastSuccessAt).getTime()
        : Infinity;
      let maintenanceMaxAge = 3 * 60_000;
      try {
        const state = JSON.parse(
          (await this.redisClient
            .getQueueClient()
            .get(
              `${this.redisClient.getQueuePrefix()}:enki:maintenance:state`,
            )) ?? 'null',
        );
        if (state?.continuous === false) {
          maintenanceMaxAge = 35 * 60_000;
        }
      } catch {
        // Missing or malformed state keeps the stricter active threshold.
      }
      const maintenanceHealthy =
        maintenanceAge >= 0 && maintenanceAge < maintenanceMaxAge;
      const queuesHealthy =
        queueStatuses.length === queues.length &&
        queueStatuses.every((queue) => queue.status === 'up');

      return {
        status:
          recoveryHealthy && queuesHealthy && maintenanceHealthy
            ? 'up'
            : 'down',
        error: !recoveryHealthy
          ? HEALTH_ERROR_MESSAGES.ON_DEMAND_RECOVERY_STALE
          : !maintenanceHealthy
            ? HEALTH_ERROR_MESSAGES.ON_DEMAND_MAINTENANCE_STALE
            : !queuesHealthy
              ? HEALTH_ERROR_MESSAGES.ON_DEMAND_QUEUE_UNHEALTHY
              : undefined,
        queues: queueStatuses,
      };
    }

    return {
      status: hasActiveWorkers ? 'up' : 'down',
      error: hasActiveWorkers
        ? undefined
        : HEALTH_ERROR_MESSAGES.NO_ACTIVE_WORKERS,
      queues: queueStatuses,
    };
  }
}

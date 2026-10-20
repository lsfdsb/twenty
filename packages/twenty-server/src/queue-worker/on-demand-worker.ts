import { createServer } from 'node:http';

import { NestFactory } from '@nestjs/core';
import { DataSource } from 'typeorm';

import { CronRegisterAllCommand } from 'src/database/commands/cron-register-all.command';
import { LoggerService } from 'src/engine/core-modules/logger/logger.service';
import { BullMQDriver } from 'src/engine/core-modules/message-queue/drivers/bullmq.driver';
import { QUEUE_DRIVER } from 'src/engine/core-modules/message-queue/message-queue.constants';
import { RedisClientService } from 'src/engine/core-modules/redis-client/redis-client.service';
import { TwentyConfigService } from 'src/engine/core-modules/twenty-config/twenty-config.service';
import { withVercelRequest } from 'src/engine/core-modules/vercel/vercel-request-context';
import {
  authenticateMaintenanceRequest,
  authenticateQueueRequest,
} from 'src/queue-worker/on-demand-request';
import { OnDemandScheduler } from 'src/queue-worker/on-demand-scheduler';
import { requiresContinuousMaintenance } from 'src/queue-worker/on-demand-maintenance-policy';
import { QueueWorkerModule } from 'src/queue-worker/queue-worker.module';
import { enableValidationMetadataCache } from 'src/utils/enable-validation-metadata-cache.util';
import 'src/instrument';

const bootstrap = async () => {
  const secret = process.env.ENKI_QUEUE_CALLBACK_SECRET;

  if (!secret || secret.length < 32) {
    throw new Error(
      'ENKI_QUEUE_CALLBACK_SECRET must have at least 32 characters',
    );
  }

  enableValidationMetadataCache();

  const app = await NestFactory.createApplicationContext(QueueWorkerModule, {
    bufferLogs: true,
  });
  const logger = app.get(LoggerService);
  const driver = app.get<BullMQDriver>(QUEUE_DRIVER);

  if (!app.get(TwentyConfigService).get('MESSAGE_QUEUE_ON_DEMAND_ENABLED')) {
    await app.close();
    throw new Error(
      'On-demand worker requires MESSAGE_QUEUE_ON_DEMAND_ENABLED',
    );
  }

  app.useLogger(logger);
  app.enableShutdownHooks();
  await app.get(CronRegisterAllCommand).run();
  const scheduler = new OnDemandScheduler(
    app.get(DataSource),
    driver.onDemandSchedules,
  );

  const server = createServer((request, response) => {
    void withVercelRequest(request, async () => {
      const isMaintenance = request.url === '/internal/maintenance/tick';
      if (
        (!isMaintenance && request.url !== '/internal/queues/drain') ||
        request.method !== 'POST'
      ) {
        response.writeHead(404).end();

        return;
      }

      let queueName;

      try {
        const chunks: Buffer[] = [];
        let size = 0;

        for await (const chunk of request) {
          const buffer = Buffer.from(chunk);

          size += buffer.length;

          if (size > 1024) {
            response.writeHead(413).end();

            return;
          }

          chunks.push(buffer);
        }

        const body = Buffer.concat(chunks).toString('utf8');
        if (isMaintenance) {
          authenticateMaintenanceRequest(request.headers, body, secret);
        } else {
          queueName = authenticateQueueRequest(request.headers, body, secret);
        }
      } catch {
        response.writeHead(401).end();

        return;
      }

      try {
        if (isMaintenance) {
          await scheduler.tick();
          const continuous = await requiresContinuousMaintenance(
            app.get(DataSource),
          );
          const redis = app.get(RedisClientService);
          await redis
            .getQueueClient()
            .set(
              `${redis.getQueuePrefix()}:enki:maintenance:state`,
              JSON.stringify({ continuous, lastSuccessAt: Date.now() }),
              'EX',
              12 * 60 * 60,
            );
        } else if (queueName) {
          await driver.drainOnDemand(queueName);
        }
        response.writeHead(204).end();
      } catch (error) {
        logger.error(
          `On-demand processing failed for ${queueName}`,
          error instanceof Error
            ? (error.stack ?? error.message)
            : 'Unknown worker error',
        );
        response.writeHead(503).end();
      }
    });
  });

  server.requestTimeout = 790_000;
  server.headersTimeout = 10_000;
  server.listen(Number(process.env.PORT || process.env.NODE_PORT || 3000));
  process.once('SIGTERM', () => server.close());
  process.once('SIGINT', () => server.close());
};

void bootstrap();

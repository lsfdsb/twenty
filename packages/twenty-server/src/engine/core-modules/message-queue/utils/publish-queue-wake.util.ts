import { QueueClient } from '@vercel/queue';

import { type MessageQueue } from 'src/engine/core-modules/message-queue/message-queue.constants';
import { getVercelRequestToken } from 'src/engine/core-modules/vercel/vercel-request-context';

export const QUEUE_WAKE_TOPIC = 'enki-twenty-queue-wake';

export const publishQueueWake = async (
  queueName: MessageQueue,
  availableAt: number,
): Promise<void> => {
  const queue = new QueueClient({
    region: 'gru1',
    token: getVercelRequestToken(),
    // Push delivery targets this deployment. BullMQ retains the durable job;
    // scheduled recovery republishes pending work on the current deployment.
  });
  const delaySeconds = Math.max(
    0,
    Math.min(6 * 24 * 60 * 60, Math.ceil((availableAt - Date.now()) / 1000)),
  );

  await queue.send(
    QUEUE_WAKE_TOPIC,
    { queueName },
    { delaySeconds, retentionSeconds: 7 * 24 * 60 * 60 },
  );
};

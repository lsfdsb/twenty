import { QueueClient } from '@vercel/queue';

import { invokeWorker } from '../lib/worker.mjs';
import queueNames from '../queue-names.json' with { type: 'json' };

const queue = new QueueClient({ region: 'gru1' });

const callback = queue.handleCallback(async (message) => {
  if (
    !message || typeof message !== 'object' ||
    Object.keys(message).length !== 1 ||
    !queueNames.includes(message.queueName)
  ) {
    throw new Error('Unknown queue notification');
  }

  await invokeWorker(message.queueName);
}, {
  visibilityTimeoutSeconds: 800,
  retry: (_error, metadata) => ({
    afterSeconds: Math.min(300, 15 * 2 ** Math.min(metadata.deliveryCount, 5)),
  }),
});

export default { fetch: callback };

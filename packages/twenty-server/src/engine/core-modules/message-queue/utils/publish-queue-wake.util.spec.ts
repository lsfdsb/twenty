import { QueueClient } from '@vercel/queue';

import { MessageQueue } from 'src/engine/core-modules/message-queue/message-queue.constants';
import { publishQueueWake } from 'src/engine/core-modules/message-queue/utils/publish-queue-wake.util';

const send = jest.fn().mockResolvedValue({});

jest.mock('@vercel/queue', () => ({
  QueueClient: jest.fn().mockImplementation(() => ({ send })),
}));

jest.mock('src/engine/core-modules/vercel/vercel-request-context', () => ({
  getVercelRequestToken: () => 'request-identity',
}));

describe('publishQueueWake', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(Date, 'now').mockReturnValue(1_000_000);
  });

  afterEach(() => jest.restoreAllMocks());

  it('uses native deployment-scoped push delivery with request identity', async () => {
    await publishQueueWake(MessageQueue.emailQueue, 1_000_000);

    expect(QueueClient).toHaveBeenCalledWith({
      region: 'gru1',
      token: 'request-identity',
    });
    expect(send).toHaveBeenCalledWith(
      'enki-twenty-queue-wake',
      { queueName: MessageQueue.emailQueue },
      { delaySeconds: 0, retentionSeconds: 7 * 24 * 60 * 60 },
    );
  });

  it('preserves delayed delivery and propagates enqueue failures', async () => {
    await publishQueueWake(MessageQueue.emailQueue, 1_002_100);
    expect(send.mock.calls[0][2].delaySeconds).toBe(3);
    send.mockRejectedValueOnce(new Error('Notification unavailable'));

    await expect(
      publishQueueWake(MessageQueue.emailQueue, 1_000_000),
    ).rejects.toThrow('Notification unavailable');
  });
});

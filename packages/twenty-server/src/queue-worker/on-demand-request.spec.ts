import { createHmac } from 'node:crypto';

import {
  authenticateMaintenanceRequest,
  authenticateQueueRequest,
} from 'src/queue-worker/on-demand-request';

describe('on-demand request authentication', () => {
  const secret = 'test-only-secret'.repeat(3);
  const timestamp = '1792476000000';
  const body = JSON.stringify({ queueName: 'email-queue' });
  const headers = {
    'x-enki-timestamp': timestamp,
    'x-enki-signature': createHmac('sha256', secret)
      .update(`${timestamp}\nPOST\n/internal/queues/drain\n${body}`)
      .digest('hex'),
  };

  it('allows a signed known queue', () => {
    expect(
      authenticateQueueRequest(headers, body, secret, Number(timestamp)),
    ).toBe('email-queue');
  });

  it('separates maintenance authorization from queue draining', () => {
    const maintenanceBody = '{"task":"maintenance"}';
    const signed = {
      'x-enki-timestamp': timestamp,
      'x-enki-signature': createHmac('sha256', secret)
        .update(
          `${timestamp}\nPOST\n/internal/maintenance/tick\n${maintenanceBody}`,
        )
        .digest('hex'),
    };
    expect(() =>
      authenticateMaintenanceRequest(
        signed,
        maintenanceBody,
        secret,
        Number(timestamp),
      ),
    ).not.toThrow();
    expect(() =>
      authenticateQueueRequest(
        signed,
        maintenanceBody,
        secret,
        Number(timestamp),
      ),
    ).toThrow();
    expect(() =>
      authenticateMaintenanceRequest(headers, body, secret, Number(timestamp)),
    ).toThrow();
  });

  it.each([
    [
      'tampered body',
      headers,
      body.replace('email', 'billing'),
      secret,
      Number(timestamp),
    ],
    ['expired signature', headers, body, secret, Number(timestamp) + 60_001],
    ['missing signature', {}, body, secret, Number(timestamp)],
    [
      'wrong secret',
      headers,
      body,
      'different-secret'.repeat(3),
      Number(timestamp),
    ],
  ])('rejects %s', (_name, requestHeaders, requestBody, requestSecret, now) => {
    expect(() =>
      authenticateQueueRequest(requestHeaders, requestBody, requestSecret, now),
    ).toThrow('Invalid queue request');
  });
});

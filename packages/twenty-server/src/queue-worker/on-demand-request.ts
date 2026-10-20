import { createHmac, timingSafeEqual } from 'node:crypto';
import { type IncomingHttpHeaders } from 'node:http';

import { MessageQueue } from 'src/engine/core-modules/message-queue/message-queue.constants';

const authenticateSignedRequest = (
  headers: IncomingHttpHeaders,
  body: string,
  secret: string,
  path: string,
  now: number,
) => {
  const timestamp = headers['x-enki-timestamp'];
  const signature = headers['x-enki-signature'];

  if (
    secret.length < 32 ||
    typeof timestamp !== 'string' ||
    !/^\d{13}$/.test(timestamp) ||
    Math.abs(now - Number(timestamp)) > 60_000 ||
    typeof signature !== 'string' ||
    !/^[a-f0-9]{64}$/.test(signature)
  ) {
    throw new Error('Invalid queue request');
  }

  const expected = createHmac('sha256', secret)
    .update(`${timestamp}\nPOST\n${path}\n${body}`)
    .digest();

  if (!timingSafeEqual(expected, Buffer.from(signature, 'hex'))) {
    throw new Error('Invalid queue request');
  }
};

export const authenticateQueueRequest = (
  headers: IncomingHttpHeaders,
  body: string,
  secret: string,
  now = Date.now(),
): MessageQueue => {
  authenticateSignedRequest(
    headers,
    body,
    secret,
    '/internal/queues/drain',
    now,
  );
  const payload: unknown = JSON.parse(body);

  if (
    typeof payload !== 'object' ||
    payload === null ||
    !('queueName' in payload) ||
    Object.keys(payload).length !== 1 ||
    !Object.values(MessageQueue).includes(payload.queueName as MessageQueue)
  ) {
    throw new Error('Invalid queue request');
  }

  return payload.queueName as MessageQueue;
};

export const authenticateMaintenanceRequest = (
  headers: IncomingHttpHeaders,
  body: string,
  secret: string,
  now = Date.now(),
) => {
  authenticateSignedRequest(
    headers,
    body,
    secret,
    '/internal/maintenance/tick',
    now,
  );

  if (body !== '{"task":"maintenance"}') {
    throw new Error('Invalid maintenance request');
  }
};

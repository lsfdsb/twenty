import { createHmac } from 'node:crypto';
import { getVercelOidcToken } from '@vercel/oidc';

export async function invokeWorker(queueName) {
  return invokePrivateWorker('/internal/queues/drain', { queueName });
}

export async function invokeMaintenance() {
  return invokePrivateWorker('/internal/maintenance/tick', { task: 'maintenance' });
}

async function invokePrivateWorker(path, payload) {
  const secret = process.env.ENKI_QUEUE_CALLBACK_SECRET;
  const origin = process.env.WORKER_URL;

  if (!secret || secret.length < 32 || !origin) {
    throw new Error('Queue service configuration is incomplete');
  }

  const body = JSON.stringify(payload);
  const timestamp = String(Date.now());
  const signature = createHmac('sha256', secret)
    .update(`${timestamp}\nPOST\n${path}\n${body}`)
    .digest('hex');
  const response = await fetch(new URL(path.slice(1), origin.endsWith('/') ? origin : `${origin}/`), {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-enki-timestamp': timestamp,
      'x-enki-signature': signature,
      'x-vercel-oidc-token': await getVercelOidcToken(),
    },
    body,
    signal: AbortSignal.timeout(780_000),
  });

  if (response.status !== 204) {
    await response.body?.cancel();
    throw new Error(`Queue worker returned HTTP ${response.status}`);
  }
}

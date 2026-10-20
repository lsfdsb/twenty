import { timingSafeEqual } from 'node:crypto';

export function authorizeCron(request, secret = process.env.CRON_SECRET) {
  const authorization = request.headers.authorization;
  const expected = Buffer.from(`Bearer ${secret || ''}`);
  const provided = Buffer.from(typeof authorization === 'string' ? authorization : '');
  return request.method === 'GET' && secret?.length >= 32 &&
    provided.length === expected.length && timingSafeEqual(provided, expected);
}

import { AsyncLocalStorage } from 'node:async_hooks';
import { type IncomingMessage } from 'node:http';

const requestContext = new AsyncLocalStorage<{ token?: string }>();

export const withVercelRequest = <TResult>(
  request: Pick<IncomingMessage, 'headers'>,
  callback: () => TResult,
): TResult => {
  const header = request.headers['x-vercel-oidc-token'];

  return requestContext.run(
    { token: typeof header === 'string' ? header : undefined },
    callback,
  );
};

export const getVercelRequestToken = (): string => {
  const token = requestContext.getStore()?.token;

  if (!token) {
    throw new Error('Vercel request identity is unavailable');
  }

  return token;
};

import { setTimeout as delay } from 'node:timers/promises';

import {
  getVercelRequestToken,
  withVercelRequest,
} from 'src/engine/core-modules/vercel/vercel-request-context';

describe('Vercel request identity', () => {
  it('keeps concurrent requests isolated across asynchronous calls', async () => {
    jest.useRealTimers();

    const result = await Promise.all(
      ['first-token', 'second-token'].map((token, index) =>
        withVercelRequest(
          { headers: { 'x-vercel-oidc-token': token } },
          async () => {
            await delay(index === 0 ? 20 : 1);

            return getVercelRequestToken();
          },
        ),
      ),
    );

    expect(result).toEqual(['first-token', 'second-token']);
    expect(() => getVercelRequestToken()).toThrow('identity is unavailable');
  });

  it('fails closed for missing or ambiguous headers', () => {
    for (const header of [undefined, ['a', 'b']]) {
      expect(() =>
        withVercelRequest(
          { headers: { 'x-vercel-oidc-token': header } },
          getVercelRequestToken,
        ),
      ).toThrow('identity is unavailable');
    }
  });
});

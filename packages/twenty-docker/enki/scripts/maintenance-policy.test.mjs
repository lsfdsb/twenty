import { test } from 'node:test';
import assert from 'node:assert/strict';

import { shouldRunMaintenance } from '../vercel/gateway/lib/maintenance.mjs';

const now = Date.parse('2026-10-20T12:00:00Z');
const check = (active, state) => shouldRunMaintenance({
  redis: { mget: async () => [active, state] },
  prefix: 'test',
  now,
});
const idle = (minutes) => JSON.stringify({
  continuous: false, lastSuccessAt: now - minutes * 60_000,
});

test('an idle installation sleeps between half-hour sweeps', async () => {
  assert.equal(await check(null, idle(29)), false);
  assert.equal(await check(null, idle(30)), true);
});

test('activity and configured background work keep minute-level scheduling', async () => {
  assert.equal(await check('1', idle(1)), true);
  assert.equal(await check(null, JSON.stringify({
    continuous: true, lastSuccessAt: now,
  })), true);
});

test('missing, invalid, expired or future state cannot suppress work', async () => {
  for (const state of [null, '{}', 'invalid', '{"continuous":false}', idle(-1), idle(720)]) {
    assert.equal(await check(null, state), true);
  }
});

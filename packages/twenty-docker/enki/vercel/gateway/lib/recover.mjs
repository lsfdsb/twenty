export async function recoverQueues({ redis, queueNames, prefix, publish, now = Date.now() }) {
  const queueKeys = (name) => ['wait', 'prioritized', 'active', 'delayed'].map(
    (state) => `${prefix}:${name}:${state}`,
  );
  // An empty installation needs one inspection, not one per native queue.
  if (queueNames.length === 0 || await redis.exists(...queueNames.flatMap(queueKeys)) === 0) {
    await redis.set(`${prefix}:enki:recovery:last-success`, String(now), 'EX', 900);
    return 0;
  }

  const pipeline = redis.pipeline();

  for (const name of queueNames) {
    pipeline.exists(...queueKeys(name));
  }

  const results = await pipeline.exec();

  if (!results || results.some(([error]) => error)) {
    throw new Error('Queue recovery could not inspect Redis');
  }

  let recovered = 0;

  for (let index = 0; index < queueNames.length; index++) {
    if (results[index][1] === 0) continue;

    const name = queueNames[index];
    const base = `${prefix}:${name}`;
    const [ready, delayed] = await Promise.all([
      redis.exists(`${base}:wait`, `${base}:prioritized`, `${base}:active`),
      redis.zrange(`${base}:delayed`, 0, 0, 'WITHSCORES'),
    ]);
    // BullMQ packs a sequence counter in the lower 12 bits of delayed scores.
    const due = delayed.length > 1 && Math.floor(Number(delayed[1]) / 4096) <= now;

    if (ready > 0 || due) {
      await publish(name);
      recovered++;
    }
  }

  await redis.set(`${prefix}:enki:recovery:last-success`, String(now), 'EX', 900);

  return recovered;
}

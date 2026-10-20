export async function shouldRunMaintenance({ redis, prefix, now = Date.now() }) {
  const [active, serialized] = await redis.mget(
    `${prefix}:enki:activity`,
    `${prefix}:enki:maintenance:state`,
  );

  if (active !== null) return true;

  try {
    const state = JSON.parse(serialized);
    if (state?.continuous !== false || !Number.isFinite(state.lastSuccessAt)) return true;
    const age = now - state.lastSuccessAt;
    return age < 0 || age >= 30 * 60_000;
  } catch {
    // Unknown or damaged state must never suppress scheduled work.
    return true;
  }
}

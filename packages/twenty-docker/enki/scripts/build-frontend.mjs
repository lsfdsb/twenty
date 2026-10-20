import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const source = fileURLToPath(new URL('../../../../', import.meta.url));
const frontend = path.join(source, 'packages/twenty-front');
const binaries = path.join(source, 'node_modules/.bin');

// Production macros omit fallback messages, so compile current catalogs first.
for (const [binary, args] of [
  ['lingui', ['extract', '--workers', '1']],
  ['lingui', ['compile', '--typescript']],
  ['vite', ['build']],
]) {
  const result = spawnSync(path.join(binaries, binary), args, {
    cwd: frontend,
    stdio: 'inherit',
    env: {
      ...process.env,
      ...(binary === 'vite' ? { NODE_ENV: 'production' } : {}),
    },
  });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status ?? 1);
}

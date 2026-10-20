import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const source = fileURLToPath(new URL('../../../../', import.meta.url));
const emails = path.join(source, 'packages/twenty-emails');
const binaries = path.join(source, 'node_modules/.bin');

for (const [binary, args] of [
  ['lingui', ['extract', '--workers', '1']],
  ['lingui', ['compile', '--typescript']],
  ['vite', ['build']],
  ['tsgo', ['-p', 'tsconfig.lib.json', '--declaration', '--emitDeclarationOnly', '--outDir', 'dist', '--rootDir', 'src', '--composite', 'false']],
  ['tsc-alias', ['-p', 'tsconfig.lib.json', '--outDir', 'dist']],
]) {
  const result = spawnSync(path.join(binaries, binary), args, {
    cwd: emails,
    stdio: 'inherit',
  });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status ?? 1);
}

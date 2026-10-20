const { spawn } = require('node:child_process');
const { prepareEnvironment } = require('./environment.cjs');

try {
  const args = process.argv.slice(2);
  if (args.length !== 1 || !['dist/main', 'dist/queue-worker/on-demand-worker'].includes(args[0])) {
    throw new Error('Expected the native Twenty server or worker entrypoint');
  }
  const child = spawn(process.execPath, args, {
    env: prepareEnvironment(process.env), stdio: 'inherit',
  });
  for (const signal of ['SIGTERM', 'SIGINT']) process.on(signal, () => child.kill(signal));
  child.on('error', () => { console.error('Failed to start Twenty'); process.exitCode = 1; });
  child.on('exit', (code, signal) => { process.exitCode = code ?? (signal === 'SIGTERM' ? 0 : 1); });
} catch (error) {
  console.error(`Enki startup: ${error.message}`);
  process.exitCode = 1;
}

const { spawn } = require('node:child_process');
const { prepareEnvironment } = require('./environment.cjs');
const { createStartupProxy } = require('./startup-proxy.cjs');

try {
  const args = process.argv.slice(2);
  if (args.length !== 1 || !['dist/main', 'dist/queue-worker/on-demand-worker'].includes(args[0])) {
    throw new Error('Expected the native Twenty server or worker entrypoint');
  }
  const env = prepareEnvironment(process.env);
  const port = Number(env.PORT || env.NODE_PORT);
  const upstreamPort = port === 3001 ? 3002 : 3001;
  const proxy = createStartupProxy({ upstreamPort });
  // Bind immediately; responses wait for the native application, including health.
  proxy.listen(port, () => {
    const child = spawn(process.execPath, args, {
      env: { ...env, PORT: String(upstreamPort), NODE_PORT: String(upstreamPort) },
      stdio: 'inherit',
    });
    for (const signal of ['SIGTERM', 'SIGINT']) process.on(signal, () => {
      proxy.close();
      child.kill(signal);
    });
    child.on('error', () => {
      console.error('Failed to start Twenty');
      proxy.close();
      proxy.closeAllConnections();
      process.exitCode = 1;
    });
    child.on('exit', (code, signal) => {
      proxy.close();
      proxy.closeAllConnections();
      process.exitCode = code ?? (signal === 'SIGTERM' ? 0 : 1);
    });
  });
  proxy.on('error', () => { console.error('Failed to bind Enki ingress'); process.exitCode = 1; });
} catch (error) {
  console.error(`Enki startup: ${error.message}`);
  process.exitCode = 1;
}

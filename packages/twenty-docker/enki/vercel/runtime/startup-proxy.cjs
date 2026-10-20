const http = require('node:http');
const net = require('node:net');
const { setTimeout: delay } = require('node:timers/promises');

async function waitForPort(port, timeoutMs, signal) {
  const deadline = Date.now() + timeoutMs;
  while (!signal.aborted && Date.now() < deadline) {
    const connected = await new Promise((resolve) => {
      const socket = net.connect({ host: '127.0.0.1', port });
      socket.setTimeout(500);
      const finish = (result) => { socket.destroy(); resolve(result); };
      socket.once('connect', () => finish(true));
      socket.once('error', () => finish(false));
      socket.once('timeout', () => finish(false));
    });
    if (connected) return;
    await delay(100, undefined, { signal });
  }
  throw new Error('Native application startup did not complete');
}

function createStartupProxy({ upstreamPort, startupTimeoutMs = 120_000 }) {
  const controller = new AbortController();
  const ready = waitForPort(upstreamPort, startupTimeoutMs, controller.signal);
  // A failed boot may precede the first request; each request still awaits it.
  void ready.catch(() => {});
  const server = http.createServer(async (request, response) => {
    try {
      await ready;
    } catch {
      response.writeHead(503, { 'Retry-After': '5' }).end();
      return;
    }
    if (request.destroyed || response.destroyed) return;
    const upstream = http.request({
      hostname: '127.0.0.1',
      port: upstreamPort,
      path: request.url,
      method: request.method,
      headers: request.headers,
    }, (result) => {
      response.writeHead(result.statusCode, result.headers);
      result.on('error', () => response.destroy());
      result.pipe(response);
    });
    upstream.on('error', () => {
      if (!response.headersSent) response.writeHead(503, { 'Retry-After': '5' }).end();
      else response.destroy();
    });
    request.on('aborted', () => upstream.destroy());
    request.on('error', () => upstream.destroy());
    response.on('close', () => {
      if (!response.writableFinished) upstream.destroy();
    });
    request.pipe(upstream);
  });
  server.headersTimeout = 10_000;
  server.requestTimeout = 790_000;
  server.on('close', () => controller.abort());
  return server;
}

module.exports = { createStartupProxy };

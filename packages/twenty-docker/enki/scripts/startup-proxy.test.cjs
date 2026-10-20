const { test } = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');
const { once } = require('node:events');
const { createStartupProxy } = require('../vercel/runtime/startup-proxy.cjs');

async function listen(server, port = 0) {
  server.listen(port, '127.0.0.1');
  await once(server, 'listening');
  return server.address().port;
}

async function close(server) {
  server.closeAllConnections();
  if (server.listening) await new Promise((resolve) => server.close(resolve));
}

async function unusedPort() {
  const server = http.createServer();
  const port = await listen(server);
  await close(server);
  return port;
}

test('accepts traffic before native boot and forwards method, body and identity headers unchanged', async () => {
  const upstreamPort = await unusedPort();
  const proxy = createStartupProxy({ upstreamPort });
  const port = await listen(proxy);
  const native = http.createServer(async (req, res) => {
    const chunks = [];
    for await (const chunk of req) chunks.push(chunk);
    res.writeHead(201, { 'Content-Type': 'application/json', 'Set-Cookie': 'session=test; HttpOnly' });
    res.end(JSON.stringify({ method: req.method, url: req.url, body: Buffer.concat(chunks).toString(), identity: req.headers['x-vercel-oidc-token'], host: req.headers.host }));
  });
  try {
    let settled = false;
    const pending = new Promise((resolve, reject) => {
      const request = http.request(`http://127.0.0.1:${port}/metadata?test=1`, {
        method: 'POST', headers: { 'x-vercel-oidc-token': 'test-identity', host: 'app.example' },
      }, async (response) => {
        const chunks = [];
        for await (const chunk of response) chunks.push(chunk);
        settled = true;
        resolve({ status: response.statusCode, headers: response.headers, body: JSON.parse(Buffer.concat(chunks)) });
      });
      request.on('error', reject);
      request.end('{"query":"test"}');
    });
    await new Promise((resolve) => setTimeout(resolve, 180));
    assert.equal(settled, false);
    await listen(native, upstreamPort);
    const response = await pending;
    assert.equal(response.status, 201);
    assert.deepEqual(response.headers['set-cookie'], ['session=test; HttpOnly']);
    assert.deepEqual(response.body, {
      method: 'POST', url: '/metadata?test=1', body: '{"query":"test"}', identity: 'test-identity', host: 'app.example',
    });
  } finally { await close(proxy); await close(native); }
});

test('does not report health as successful when native boot fails', async () => {
  const proxy = createStartupProxy({ upstreamPort: await unusedPort(), startupTimeoutMs: 100 });
  const port = await listen(proxy);
  try {
    const response = await fetch(`http://127.0.0.1:${port}/healthz`);
    assert.equal(response.status, 503);
    assert.equal(response.headers.get('retry-after'), '5');
  } finally { await close(proxy); }
});

test('returns a retryable failure if the native process stops after startup', async () => {
  const native = http.createServer((_req, res) => res.end('ready'));
  const upstreamPort = await listen(native);
  const proxy = createStartupProxy({ upstreamPort });
  const port = await listen(proxy);
  try {
    assert.equal((await fetch(`http://127.0.0.1:${port}/healthz`)).status, 200);
    await close(native);
    assert.equal((await fetch(`http://127.0.0.1:${port}/healthz`)).status, 503);
  } finally { await close(proxy); await close(native); }
});

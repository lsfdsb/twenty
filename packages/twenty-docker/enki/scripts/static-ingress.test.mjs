import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const config = JSON.parse(
  await readFile(new URL('../vercel/vercel.json', import.meta.url), 'utf8'),
);

const routeFor = (path) =>
  config.rewrites.find((rule) => new RegExp(`^${rule.source}$`).test(path))
    ?.destination.service;

test('compiled scripts and brand images use static delivery', () => {
  assert.equal(routeFor('/assets/index-IDqoCpIJ.js'), 'assets');
  assert.equal(routeFor('/assets/styles-abc12345.css'), 'assets');
  assert.equal(routeFor('/brand/enki-email-logo.png'), 'assets');
  assert.equal(config.services.assets.root, 'frontend/');
  assert.equal(config.services.assets.outputDirectory, '.');
});

test('documents, authentication and tenant data stay on the native server', () => {
  for (const path of [
    '/',
    '/welcome',
    '/index.html',
    '/reset-password/test-token',
    '/metadata',
    '/graphql',
    '/rest/companies',
    '/files/example',
    '/healthz',
  ]) {
    assert.equal(routeFor(path), 'web', path);
  }
});

test('worker ingress remains private and maintenance keeps its own service', () => {
  assert.equal(routeFor('/internal/maintenance/tick'), 'maintenance');
  assert.equal(routeFor('/internal/queues/recover'), 'recovery');
  assert.ok(!config.rewrites.some((rule) => rule.destination.service === 'worker'));
});

test('only versioned build files get immutable browser caching', () => {
  const immutableRules = config.headers.filter((rule) =>
    rule.headers.some(
      (header) =>
        header.key === 'Cache-Control' && header.value.includes('immutable'),
    ),
  );
  assert.deepEqual(
    immutableRules.map((rule) => rule.source),
    ['/assets/:path*'],
  );
  assert.equal(
    config.headers.find((rule) => rule.source === '/brand/:path*').headers[0]
      .value,
    'public, max-age=0, must-revalidate',
  );
});

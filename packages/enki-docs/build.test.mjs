import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { readGuides } from './content.mjs';

const root = dirname(fileURLToPath(import.meta.url));
const dist = join(root, 'dist');
const pages = readGuides(join(root, 'content'));
const htmlFiles = [
  'index.html',
  '404.html',
  ...pages.map((page) => `${page.slug}/index.html`),
];

test('every published guide has Portuguese metadata and resolvable local links', () => {
  for (const file of htmlFiles) {
    const html = readFileSync(join(dist, file), 'utf8');
    assert.match(html, /<html lang="pt-BR">/);
    assert.match(html, /<main id="conteudo"/);
    for (const [, link] of html.matchAll(/(?:href|src)="(\/[^"?#]*)/g)) {
      assert.ok(
        existsSync(join(dist, link)) ||
          existsSync(join(dist, link, 'index.html')),
        `${file}: broken ${link}`,
      );
    }
  }
});

test('search covers every guide exactly once', () => {
  const search = JSON.parse(readFileSync(join(dist, 'search.json'), 'utf8'));
  assert.equal(search.length, pages.length);
  assert.equal(new Set(search.map((page) => page.slug)).size, pages.length);
  assert.ok(search.every((page) => page.body.length > 400));
});

test('content explains deployment limits and preserves source licensing', () => {
  assert.match(
    pages.find((page) => page.slug === 'licencas').body,
    /GNU AGPL v3/,
  );
  assert.match(
    pages.find((page) => page.slug === 'licencas').body,
    /github.com\/lsfdsb\/twenty/,
  );
  assert.match(pages.find((page) => page.slug === 'ia').body, /pagas.*adiadas/);
  assert.match(
    pages.find((page) => page.slug === 'automacoes').body,
    /desabilitada/,
  );
  assert.ok(
    pages.every(
      (page) => page.slug === 'licencas' || !/\bTwenty\b/.test(page.body),
    ),
  );
});

test('old documentation sections redirect to published Enki guides', () => {
  const config = JSON.parse(readFileSync(join(dist, 'vercel.json'), 'utf8'));
  for (const redirect of config.redirects)
    assert.ok(existsSync(join(dist, redirect.destination, 'index.html')));
  assert.ok(
    config.headers[0].headers
      .find((header) => header.key === 'Content-Security-Policy')
      .value.includes("frame-ancestors 'none'"),
  );
});

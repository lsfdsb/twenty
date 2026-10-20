import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createElement } from 'react';
import * as emails from '../../../twenty-emails/dist/index.mjs';

const templates = Object.entries(emails).filter(
  ([, component]) => typeof component === 'function' && component.PreviewProps,
);

test('qualifies all exported transactional templates', () => {
  assert.equal(templates.length, 13);
});

for (const [name, component] of templates) {
  for (const locale of ['en', 'pt-BR']) {
    test(`${name} renders Enki branding in ${locale}`, async () => {
      const element = createElement(component, { ...component.PreviewProps, locale });
      const html = await emails.renderEmail(element);
      const text = await emails.renderEmail(element, { plainText: true });
      assert.match(html, /https:\/\/app\.enki\.now\/brand\/enki-email-logo\.png/);
      assert.match(html, /#f8f6e9/);
      assert.match(text, /Equipe Enki/);
      assert.doesNotMatch(html, /(?:app\.twenty\.com|twentyhq\.github\.io|Twenty\.com, Public)/);
      assert.doesNotMatch(html, /<!--\$!-->/);
    });
  }
}

test('password access keeps the one-time link, expiry and plain-text fallback', async () => {
  const link = `https://app.enki.now/reset-password/${'a'.repeat(64)}`;
  const element = createElement(emails.PasswordResetLinkEmail, {
    locale: 'pt-BR', link, duration: '5m', hasPassword: false,
  });
  const html = await emails.renderEmail(element);
  const text = await emails.renderEmail(element, { plainText: true });
  assert.match(html, new RegExp(`href="${link}"`));
  assert.match(text, /Definir minha senha/);
  assert.match(text, /válido por 5m/);
  assert.ok(text.includes(link));
  assert.match(text, /solicitar outro/);
});

test('invitations preserve the actual customer workspace and sender', async () => {
  const html = await emails.renderEmail(createElement(emails.SendInviteLinkEmail, {
    locale: 'pt-BR',
    link: 'https://app.enki.now/invite/example-only',
    workspace: { name: 'Cliente & Filhos', logo: undefined },
    sender: { firstName: 'Maria', lastName: 'Silva', email: 'maria@example.com' },
    serverUrl: 'https://app.enki.now',
  }));
  assert.match(html, /Cliente &amp; Filhos/);
  assert.match(html, /Maria/);
  assert.match(html, /maria@example\.com/);
  assert.match(html, /href="https:\/\/app.enki.now\/invite\/example-only"/);
});

const { test } = require('node:test');
const assert = require('node:assert/strict');
const { prepareEnvironment } = require('../vercel/runtime/environment.cjs');
const valid = {
  APP_SECRET: 'a'.repeat(64), ENCRYPTION_KEY: 'b'.repeat(64),
  DATABASE_URL_UNPOOLED: 'postgresql://test:secret@db.example/test?sslmode=require',
  REDIS_URL: 'rediss://default:secret@redis.example:6379',
  VERCEL_URL: 'enki-test.vercel.app', PORT: '3000',
  S3_BUCKET_NAME: 'test-bucket', AWS_REGION: 'sa-east-1',
  AWS_ROLE_ARN: 'arn:aws:iam::123456789012:role/test',
  VERCEL: '1', ENKI_QUEUE_CALLBACK_SECRET: 'c'.repeat(64),
  RESEND_API_KEY: 'test-key', ENKI_TRANSACTIONAL_FROM: 'conta@mail.enki.now',
};
test('maps Marketplace resources, validates TLS and enables request-scoped credentials', () => {
  const env = prepareEnvironment(valid, () => true);
  assert.equal(new URL(env.PG_DATABASE_URL).searchParams.get('sslmode'), 'verify-full');
  assert.equal(env.SERVER_URL, 'https://enki-test.vercel.app');
  assert.equal(env.STORAGE_TYPE, 's3');
  assert.equal(env.MESSAGE_QUEUE_ON_DEMAND_ENABLED, 'true');
  assert.equal(env.AWS_WEB_IDENTITY_TOKEN_FILE, undefined);
  assert.equal(env.DISABLE_DB_MIGRATIONS, 'true');
});
test('fails closed outside Vercel even when a static OIDC token exists', () => {
  assert.throws(() => prepareEnvironment({ ...valid, VERCEL: undefined, VERCEL_OIDC_TOKEN: 'expired' }), /Vercel request identity/);
});
test('does not pass bootstrap or competing permanent AWS credentials to the application', () => {
  const env = prepareEnvironment({ ...valid, ENKI_BOOTSTRAP_PASSWORD: 'private', AWS_ACCESS_KEY_ID: 'private', VERCEL_OIDC_TOKEN: 'temporary' }, () => true);
  assert.equal(env.ENKI_BOOTSTRAP_PASSWORD, undefined);
  assert.equal(env.AWS_ACCESS_KEY_ID, undefined);
  assert.equal(env.VERCEL_OIDC_TOKEN, undefined);
});
test('rejects plaintext Redis and URLs without disclosing their contents', () => {
  assert.throws(() => prepareEnvironment({ ...valid, REDIS_URL: 'redis://private:password@host' }, () => true), /^Error: Redis TLS is required$/);
  assert.throws(() => prepareEnvironment({ ...valid, DATABASE_URL_UNPOOLED: 'private-invalid-value' }, () => true), /^Error: Invalid database, Redis or server URL configuration$/);
});
test('requires verified transactional email and maps it to native SMTP over TLS', () => {
  const env = prepareEnvironment(valid);
  assert.equal(env.EMAIL_DRIVER, 'SMTP');
  assert.equal(env.EMAIL_SMTP_PORT, '465');
  assert.equal(env.EMAIL_SMTP_NO_TLS, 'false');
  assert.equal(env.EMAIL_SMTP_PASSWORD, valid.RESEND_API_KEY);
  assert.equal(env.EMAIL_FROM_ADDRESS, 'conta@mail.enki.now');
  assert.throws(() => prepareEnvironment({ ...valid, RESEND_API_KEY: '' }), /Missing configuration: RESEND_API_KEY/);
  assert.throws(() => prepareEnvironment({ ...valid, ENKI_TRANSACTIONAL_FROM: 'unverified@example.com' }), /verified Enki/);
});

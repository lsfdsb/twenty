// Qualification-only handler: never include its route in the final deployment.
import { createHash, timingSafeEqual } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { getVercelOidcToken } from '@vercel/oidc';
import { fromWebToken } from '@aws-sdk/credential-providers';
import { S3Client, GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';

const hash = (bytes) => createHash('sha256').update(bytes).digest('hex');

export default async function migrateBootstrapFiles(request, response) {
  const secret = process.env.CRON_SECRET;
  const authorization = request.headers.authorization;
  const expected = `Bearer ${secret}`;
  if (request.method !== 'POST' || !secret || secret.length < 32 ||
      typeof authorization !== 'string' ||
      Buffer.byteLength(authorization) !== Buffer.byteLength(expected) ||
      !timingSafeEqual(Buffer.from(authorization), Buffer.from(expected))) {
    response.statusCode = 401;
    response.end();
    return;
  }
  const manifest = JSON.parse(await readFile(
    new URL('../bootstrap-assets/manifest.json', import.meta.url), 'utf8',
  ));
  const uuid = /^[a-f0-9-]{36}$/;
  if (!uuid.test(manifest.workspaceId) || !Array.isArray(manifest.entries) ||
      manifest.entries.length > 100 ||
      manifest.entries.reduce((size, entry) => size + entry.size, 0) > 32 * 1024 * 1024) {
    throw new Error('Invalid migration manifest');
  }
  const s3 = new S3Client({
    region: process.env.AWS_REGION,
    credentials: fromWebToken({
      roleArn: process.env.AWS_ROLE_ARN,
      webIdentityToken: await getVercelOidcToken(),
      roleSessionName: 'enki-artifact-migration',
      clientConfig: { region: process.env.AWS_REGION },
    }),
  });
  let verified = 0;
  try {
    for (const [index, entry] of manifest.entries.entries()) {
      const segments = entry.key.split('/');
      if (segments[0] !== manifest.workspaceId || !uuid.test(segments[1]) ||
          !['source', 'dependencies'].includes(segments[2]) ||
          segments.some((segment) => !segment || segment === '.' || segment === '..') ||
          entry.key.includes('\\')) {
        throw new Error('Artifact outside the migration allowlist');
      }
      const bytes = await readFile(new URL(`../bootstrap-assets/${index}`, import.meta.url));
      if (bytes.length !== entry.size || hash(bytes) !== entry.sha256) {
        throw new Error('Artifact checksum mismatch');
      }
      const input = { Bucket: process.env.S3_BUCKET_NAME, Key: entry.key };
      try {
        const existing = await s3.send(new GetObjectCommand(input));
        if (hash(await existing.Body.transformToByteArray()) !== entry.sha256) {
          throw new Error('Existing artifact differs; refusing to overwrite');
        }
      } catch (error) {
        if (error.name !== 'NoSuchKey' && error.$metadata?.httpStatusCode !== 404) throw error;
        await s3.send(new PutObjectCommand({
          ...input, Body: bytes, ContentLength: bytes.length,
          ContentType: entry.key.endsWith('.json') ? 'application/json' : 'text/plain',
          IfNoneMatch: '*',
        }));
        const saved = await s3.send(new GetObjectCommand(input));
        if (hash(await saved.Body.transformToByteArray()) !== entry.sha256) {
          throw new Error('Stored artifact checksum mismatch');
        }
      }
      verified++;
    }
    response.setHeader('content-type', 'application/json');
    response.end(JSON.stringify({ verified }));
  } finally {
    s3.destroy();
  }
}

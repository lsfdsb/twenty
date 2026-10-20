import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { parseEnv } from 'node:util';
import { createHash } from 'node:crypto';
import pg from 'pg';

const localDirectory = process.argv[2];
const environmentPath = process.argv[3];
if (!localDirectory || !environmentPath) {
  throw new Error('Usage: verify-schema.mjs <local-compose-directory> <cloud-env-file>');
}
const sql = await readFile(new URL('../schema/catalog.sql', import.meta.url), 'utf8');
const localCatalog = JSON.parse(execFileSync('docker-compose', [
  'exec', '-T', 'db', 'psql', '-X', '-U', 'postgres', '-d', 'enki_twenty_local', '-At', '-v', 'ON_ERROR_STOP=1',
], {
  cwd: localDirectory,
  env: { ...process.env, DOCKER_CONTEXT: process.env.DOCKER_CONTEXT || 'colima-enki-twenty' },
  input: sql,
  encoding: 'utf8',
  maxBuffer: 20 * 1024 * 1024,
}));
const environment = parseEnv(await readFile(environmentPath, 'utf8'));
const connectionUrl = new URL(environment.DATABASE_URL_UNPOOLED);
connectionUrl.searchParams.set('sslmode', 'verify-full');
const database = new pg.Client({ connectionString: connectionUrl.toString(), connectionTimeoutMillis: 15000 });

const normalize = (catalog) => catalog.map((entry) =>
  JSON.stringify(entry).replaceAll(/workspace_[a-z0-9]+/g, 'workspace_TENANT'),
).sort();
const digest = (entries) => createHash('sha256').update(entries.join('\n')).digest('hex');

try {
  await database.connect();
  await database.query('BEGIN READ ONLY');
  const remoteCatalog = (await database.query(sql)).rows[0].catalog;
  const postgresVersion = (await database.query('SHOW server_version')).rows[0].server_version;
  const extensions = (await database.query('SELECT extname, extversion FROM pg_extension ORDER BY extname')).rows;
  const normalizedLocal = normalize(localCatalog);
  const normalizedRemote = normalize(remoteCatalog);
  const localSet = new Set(normalizedLocal);
  const remoteSet = new Set(normalizedRemote);
  const missing = normalizedLocal.filter((entry) => !remoteSet.has(entry));
  const extra = normalizedRemote.filter((entry) => !localSet.has(entry));
  const report = {
    checkedAt: new Date().toISOString(),
    postgresVersion,
    extensions,
    normalization: 'Tenant schema IDs and generated index names; PostgreSQL 18 NOT NULL constraints are compared as column notNull flags.',
    localTables: localCatalog.filter((entry) => entry.kind === 'table').length,
    remoteTables: remoteCatalog.filter((entry) => entry.kind === 'table').length,
    localEntries: normalizedLocal.length,
    remoteEntries: normalizedRemote.length,
    localSha256: digest(normalizedLocal),
    remoteSha256: digest(normalizedRemote),
    matches: missing.length === 0 && extra.length === 0,
    missing: missing.map(JSON.parse),
    extra: extra.map(JSON.parse),
  };
  await database.query('ROLLBACK');
  await mkdir('schema', { recursive: true });
  await writeFile('schema/parity-report.json', JSON.stringify(report, null, 2) + '\n');
  console.log(JSON.stringify({ ...report, missing: missing.length, extra: extra.length }, null, 2));
  if (!report.matches) process.exitCode = 1;
} catch (error) {
  console.error('Schema verification failed:', error.code || error.name);
  process.exitCode = 1;
} finally {
  await database.end();
}

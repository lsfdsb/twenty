import { cp, mkdir, readFile, writeFile, access } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const source = path.resolve(process.argv[2] || '.');
const destination = process.argv[3] && path.resolve(process.argv[3]);
if (!destination || destination.startsWith(source + path.sep) || destination === source) {
  throw new Error('Pass the release checkout and a new output directory outside it.');
}
const ui = JSON.parse(await readFile(path.join(source, 'packages/twenty-ui/package.json'), 'utf8'));
if (ui.version !== '2.49.0') throw new Error('The pinned backend requires Twenty 2.49.0 sources.');
const frontend = path.join(source, 'packages/twenty-front/build');
await access(path.join(frontend, 'index.html'));
const template = fileURLToPath(new URL('../vercel/', import.meta.url));
await mkdir(destination, { recursive: false });
await cp(template, destination, { recursive: true });
await cp(frontend, path.join(destination, 'frontend'), { recursive: true });
await cp(path.join(source, 'packages/twenty-server/dist'), path.join(destination, 'backend'), { recursive: true, filter: (file) => !file.endsWith('.map') && !file.endsWith('.tsbuildinfo') && !file.includes('/dist/front/') });
await writeFile(path.join(destination, 'RELEASE-NOT-APPROVED.txt'), [
  'Qualification bundle only. Do not promote or assign app.enki.now.',
  'On-demand workers require verified queue delivery and recovery before promotion.',
  'Web OIDC request-context integration, S3, email, fixtures and E2E are release gates.',
].join('\n') + '\n');
console.log('Created an allowlisted bundle without environment files or local credentials.');

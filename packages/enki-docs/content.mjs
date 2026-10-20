import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

export const readGuides = (directory) =>
  readdirSync(directory)
    .filter((file) => file.endsWith('.md'))
    .map((file) => {
      const source = readFileSync(join(directory, file), 'utf8');
      const match = source.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
      if (!match) throw new Error(`Missing metadata: ${file}`);
      const metadata = Object.fromEntries(
        match[1].split('\n').map((line) => {
          const separator = line.indexOf(':');
          return [
            line.slice(0, separator),
            JSON.parse(line.slice(separator + 1).trim()),
          ];
        }),
      );
      for (const field of ['slug', 'title', 'description', 'group']) {
        if (typeof metadata[field] !== 'string' || !metadata[field])
          throw new Error(`Missing ${field}: ${file}`);
      }
      if (!/^[a-z0-9-]+(?:\/[a-z0-9-]+)*$/.test(metadata.slug))
        throw new Error(`Invalid path: ${file}`);
      return { ...metadata, body: match[2].trim() };
    });

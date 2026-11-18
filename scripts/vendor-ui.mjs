import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const source = process.argv[2];
if (!source) throw new Error('Usage: node scripts/vendor-ui.mjs /path/to/kazuki-ui');
const sourceRoot = resolve(source);
const git = (...args) => execFileSync('git', ['-C', sourceRoot, ...args], { encoding: 'utf8' }).trim();
git('diff', '--exit-code', 'HEAD', '--', 'tokens/core.css', 'patterns/index-page.css');
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const files = ['tokens/core.css', 'patterns/index-page.css'];
const manifest = { repository: 'kazukibass/kazuki-ui', sourceCommit: git('rev-parse', 'HEAD'), files: {} };
for (const file of files) {
  const bytes = await readFile(resolve(sourceRoot, file));
  const dest = resolve(root, 'vendor/kazuki-ui', file);
  await mkdir(dirname(dest), { recursive: true });
  await writeFile(dest, bytes);
  manifest.files[file] = createHash('sha256').update(bytes).digest('hex');
}
await writeFile(resolve(root, 'vendor/kazuki-ui/manifest.json'), JSON.stringify(manifest, null, 2) + '\n');
console.log(`Vendored ${files.length} files from ${manifest.sourceCommit}`);

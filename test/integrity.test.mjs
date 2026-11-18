import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import test from 'node:test';

const html = await readFile(new URL('../index.html', import.meta.url), 'utf8');
test('standalone page and public dataset stay identical, including nulls', async () => {
  const embedded = JSON.parse(html.match(/<script id="food-data" type="application\/json">([\s\S]*?)<\/script>/)[1]);
  const dataset = JSON.parse(await readFile(new URL('../data/foods.json', import.meta.url), 'utf8'));
  assert.deepEqual(embedded, dataset);
  assert.equal(new Set(embedded.map(f => f.id)).size, embedded.length);
});
test('vendored shared CSS matches the recorded upstream snapshot', async () => {
  const manifest = JSON.parse(await readFile(new URL('../vendor/kazuki-ui/manifest.json', import.meta.url), 'utf8'));
  assert.match(manifest.sourceCommit, /^[a-f0-9]{40}$/);
  for (const [file, hash] of Object.entries(manifest.files)) {
    const bytes = await readFile(new URL('../vendor/kazuki-ui/' + file, import.meta.url));
    assert.equal(createHash('sha256').update(bytes).digest('hex'), hash, file);
  }
});

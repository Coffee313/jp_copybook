const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const source = fs.readFileSync(path.join(__dirname, '..', 'progress-sync.js'), 'utf8');
const kanaHtml = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
const kanjiHtml = fs.readFileSync(path.join(__dirname, '..', 'kanji.html'), 'utf8');

test('every saving status uses the translatable ellipsis text', () => {
  assert.doesNotMatch(source, /SavingвЂ¦/);
  assert.equal([...source.matchAll(/setSyncStatus\('Saving…'\)/g)].length, 2);
});

test('cloud saves use optimistic concurrency on both pages', () => {
  assert.match(source, /ProgressConflict\.saveWithRetry/);
  assert.match(source, /updated_at=eq\.\$\{encodeURIComponent\(expectedUpdatedAt\)\}/);
  for (const html of [kanaHtml, kanjiHtml]) {
    assert.match(html, /progress-conflict\.js[^]*progress-sync\.js/);
    assert.match(html, /progress-sync\.js\?v=20/);
  }
});

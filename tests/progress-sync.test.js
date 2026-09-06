const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const source = fs.readFileSync(path.join(__dirname, '..', 'progress-sync.js'), 'utf8');

test('every saving status uses the translatable ellipsis text', () => {
  assert.doesNotMatch(source, /SavingвЂ¦/);
  assert.equal([...source.matchAll(/setSyncStatus\('Saving…'\)/g)].length, 2);
});

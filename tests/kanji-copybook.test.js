const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const css = fs.readFileSync(path.join(__dirname, '..', 'kanji.css'), 'utf8');

test('kanji copybook cells show dashed horizontal and vertical guides like kana cells', () => {
  assert.match(css, /\.kanji-copybook-cell::before,\s*\.kanji-copybook-cell::after\s*\{[^}]*content:\s*['"]{2}/s);
  assert.match(css, /\.kanji-copybook-cell::before\s*\{[^}]*left:\s*50%[^}]*border-left:\s*1px dashed #dcd6cb/s);
  assert.match(css, /\.kanji-copybook-cell::after\s*\{[^}]*top:\s*50%[^}]*border-top:\s*1px dashed #dcd6cb/s);
});

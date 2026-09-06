const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

global.window = global;
require('../kanjivg-strokes.js');

const html = fs.readFileSync(path.join(__dirname, '..', 'kanji.html'), 'utf8');

test('guided kanji review includes stroke paths for blue', () => {
  assert.equal(KANJIVG_STROKES['青'].length, 8);
  assert.match(html, /src="kanjivg-strokes\.js\?v=2"/);
});

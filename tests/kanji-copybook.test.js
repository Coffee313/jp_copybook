const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const html = fs.readFileSync(path.join(__dirname, '..', 'kanji.html'), 'utf8');
const app = fs.readFileSync(path.join(__dirname, '..', 'kanji-app.js'), 'utf8');

test('kanji copybook has a checked Show guides in cells control', () => {
  assert.match(html, /<label[^>]*id="kanjiCopybookGuideControl"[^>]*>[\s\S]*?<input id="kanjiCopybookGuideToggle" type="checkbox" checked \/>[\s\S]*?<span>Show guides in cells<\/span>[\s\S]*?<\/label>/);
});

test('kanji copybook guide control toggles character guides in every practice cell', () => {
  assert.match(app, /guide\.hidden = !kanjiCopybookGuideToggle\.checked/);
  assert.match(app, /kanjiCopybookGuideToggle\.addEventListener\('change',[\s\S]*?querySelectorAll\('\.kanji-copybook-ghost'\)[\s\S]*?guide\.hidden = !kanjiCopybookGuideToggle\.checked/);
});

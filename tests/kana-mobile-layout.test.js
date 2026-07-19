const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const styles = fs.readFileSync(path.join(__dirname, '..', 'styles.css'), 'utf8');
const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
const kanjiHtml = fs.readFileSync(path.join(__dirname, '..', 'kanji.html'), 'utf8');

test('mobile Kana tests center the cell with I don\'t remember below it', () => {
  assert.match(styles, /body\.mobile-version\.test-active \.test-sheet-layout\s*{[^}]*grid-template-columns:\s*minmax\(0,\s*1fr\)[^}]*justify-items:\s*center/s);
  assert.match(styles, /body\.mobile-version\.test-active \.test-sheet-layout > \.sheet\s*{[^}]*grid-column:\s*1[^}]*grid-row:\s*1/s);
  assert.match(styles, /body\.mobile-version\.test-active \.test-sheet-layout > \.forgot-answer\s*{[^}]*grid-column:\s*1[^}]*grid-row:\s*2[^}]*justify-self:\s*center/s);
});

test('Kana page loads the updated mobile layout stylesheet', () => {
  assert.match(html, /href="styles\.css\?v=72"/);
  assert.match(kanjiHtml, /href="styles\.css\?v=72"/);
  assert.match(html, /data-short-version="v19\.2"[^>]*>v2026\.07\.19\.2<\/span>/);
  assert.match(kanjiHtml, /data-short-version="v19\.2"[^>]*>v2026\.07\.19\.2<\/span>/);
});

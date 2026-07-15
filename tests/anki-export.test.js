const test = require('node:test');
const assert = require('node:assert/strict');
const AnkiExport = require('../anki-export.js');

test('buildDeck creates Anki metadata and one row per vocabulary entry', () => {
  const deck = AnkiExport.buildDeck([
    { character: '水', translation: 'water', note: 'みず' },
    { character: '火', translation: 'fire', note: '' }
  ]);
  assert.match(deck, /#deck column:1/);
  assert.match(deck, /#tags column:4/);
  assert.match(deck, /Japanese Copybook::Kanji\t水\t<div>water<\/div><div><br>みず<\/div>/);
  assert.match(deck, /Japanese Copybook::Kanji\t火\t<div>fire<\/div>/);
});

test('buildDeck safely encodes notes for Anki HTML fields', () => {
  const deck = AnkiExport.buildDeck([{ character: '山', translation: 'mountain\tpeak', note: '<b>example</b>\nline' }]);
  assert.match(deck, /mountain peak/);
  assert.match(deck, /&lt;b&gt;example&lt;\/b&gt;<br>line/);
  assert.doesNotMatch(deck, /<b>example<\/b>/);
});

test('buildDeck includes the whole-word hiragana reading without pitch accent', () => {
  const deck = AnkiExport.buildDeck([{ character: '水', translation: 'water', reading: 'みず', pitchAccent: 1, note: '' }]);
  assert.match(deck, /<div>みず<\/div><div>water<\/div>/);
  assert.doesNotMatch(deck, /Pitch accent/);
});

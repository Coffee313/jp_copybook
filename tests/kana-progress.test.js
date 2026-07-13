const test = require('node:test');
const assert = require('node:assert/strict');
const progress = require('../kana-progress.js');

test('markMastered records a successful kana test', () => {
  const result = progress.markMastered({}, 'あ', new Date('2026-07-12T10:00:00Z'));
  assert.deepEqual(result['あ'], { passed: true, passedAt: '2026-07-12T10:00:00.000Z' });
});

test('mergeMastery keeps the newest result for each kana', () => {
  const local = { あ: { passed: true, passedAt: '2026-07-12T10:00:00Z' } };
  const remote = { あ: { passed: true, passedAt: '2026-07-11T10:00:00Z' }, ア: { passed: true, passedAt: '2026-07-10T10:00:00Z' } };
  assert.deepEqual(progress.mergeMastery(local, remote), { ...remote, あ: local.あ });
});

test('progressCount counts mastered kana from both alphabets', () => {
  assert.equal(progress.progressCount({ あ: { passed: true }, ア: { passed: true } }, ['あ', 'い', 'ア']), 2);
});

test('resetMastery removes only the selected script', () => {
  const mastery = { hiraA: { passed: true }, hiraI: { passed: true }, kataA: { passed: true } };
  assert.deepEqual(progress.resetMastery(mastery, ['hiraA', 'hiraI']), { kataA: { passed: true } });
  assert.equal(Object.keys(mastery).length, 3);
});

test('reset timestamps prevent older cloud mastery from returning', () => {
  const resets = progress.markScriptReset({}, 'hiragana', new Date('2026-07-13T12:00:00Z'));
  const mastery = {
    oldHiragana: { passed: true, passedAt: '2026-07-13T11:00:00Z' },
    newHiragana: { passed: true, passedAt: '2026-07-13T13:00:00Z' },
    katakana: { passed: true, passedAt: '2026-07-12T10:00:00Z' }
  };
  assert.deepEqual(progress.applyMasteryResets(mastery, resets, {
    hiragana: ['oldHiragana', 'newHiragana'], katakana: ['katakana']
  }), { newHiragana: mastery.newHiragana, katakana: mastery.katakana });
});

test('mergeResetTimes keeps the newest reset for each script', () => {
  const local = { hiragana: '2026-07-13T12:00:00Z' };
  const remote = { hiragana: '2026-07-12T12:00:00Z', katakana: '2026-07-11T12:00:00Z' };
  assert.deepEqual(progress.mergeResetTimes(local, remote), { hiragana: local.hiragana, katakana: remote.katakana });
});

test('previousTestLayer moves back one layer without going below zero', () => {
  assert.equal(progress.previousTestLayer(2), 1);
  assert.equal(progress.previousTestLayer(1), 0);
  assert.equal(progress.previousTestLayer(0), 0);
});

test('testPickerItems shows only passed kana and hides the current answer', () => {
  const values = [['a', 'a'], ['i', 'i'], ['u', 'u']];
  const mastery = { a: { passed: true }, i: { passed: true } };
  assert.deepEqual(progress.testPickerItems(values, mastery, 'a'), [['i', 'i']]);
});

test('cookieValue reads and decodes a named cookie', () => {
  assert.equal(progress.cookieValue('theme=dark; kana-input-mode=stylus; name=Test%20User', 'kana-input-mode'), 'stylus');
  assert.equal(progress.cookieValue('theme=dark', 'kana-input-mode'), null);
});

test('shuffled preserves every test item', () => {
  assert.deepEqual(progress.shuffled(['あ', 'い', 'う'], () => 0).sort(), ['あ', 'い', 'う']);
});

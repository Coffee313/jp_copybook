const test = require('node:test');
const assert = require('node:assert/strict');
const SRS = require('../srs.js');

const now = new Date('2026-07-12T10:00:00.000Z');
const card = { character: '水', interval: 0, ease: 2.5, repetitions: 0 };

test('new card rated good returns in one day', () => {
  const result = SRS.schedule(card, 'good', now);
  const nextLocalMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
  assert.equal(result.interval, 1);
  assert.equal(result.repetitions, 1);
  assert.equal(result.nextReview, nextLocalMidnight.toISOString());
});

test('a one-day interval becomes due when the local calendar day changes', () => {
  const reviewedAt = new Date(2026, 6, 12, 23, 55);
  const result = SRS.schedule(card, 'good', reviewedAt);

  assert.equal(SRS.isDue(result, new Date(2026, 6, 12, 23, 59, 59, 999)), false);
  assert.equal(SRS.isDue(result, new Date(2026, 6, 13, 0, 0)), true);
});

test('legacy day intervals also become due at local midnight', () => {
  const legacyCard = {
    interval: 1,
    repetitions: 1,
    lastReviewed: new Date(2026, 6, 12, 18, 0).toISOString(),
    nextReview: new Date(2026, 6, 13, 18, 0).toISOString()
  };

  assert.equal(SRS.isDue(legacyCard, new Date(2026, 6, 12, 23, 59)), false);
  assert.equal(SRS.isDue(legacyCard, new Date(2026, 6, 13, 0, 0)), true);
});

test('second good review uses the six day learning step', () => {
  const result = SRS.schedule({ ...card, interval: 1, repetitions: 1 }, 'good', now);
  assert.equal(result.interval, 6);
  assert.equal(result.repetitions, 2);
});

test('again resets repetitions and schedules a ten minute retry', () => {
  const result = SRS.schedule({ ...card, interval: 12, repetitions: 4 }, 'again', now);
  assert.equal(result.interval, 0);
  assert.equal(result.repetitions, 0);
  assert.equal(result.ease, 2.3);
  assert.equal(result.nextReview, '2026-07-12T10:10:00.000Z');
});

test('hard never lowers ease below the minimum', () => {
  const result = SRS.schedule({ ...card, interval: 1, ease: 1.3, repetitions: 2 }, 'hard', now);
  assert.equal(result.interval, 1);
  assert.equal(result.ease, 1.3);
});

test('easy gives a new card a four day interval', () => {
  const result = SRS.schedule(card, 'easy', now);
  assert.equal(result.interval, 4);
  assert.equal(result.ease, 2.65);
});

test('isDue accepts overdue and unscheduled cards', () => {
  assert.equal(SRS.isDue({ nextReview: '2026-07-12T09:59:00.000Z' }, now), true);
  assert.equal(SRS.isDue({ nextReview: '2026-07-12T10:01:00.000Z' }, now), false);
  assert.equal(SRS.isDue({}, now), true);
});

test('review advances only after a fully correct drawing', () => {
  assert.equal(SRS.shouldAdvanceReview('good'), true);
  assert.equal(SRS.shouldAdvanceReview('hard'), false);
  assert.equal(SRS.shouldAdvanceReview('again'), false);
});

test('review mode requires a guided retry and then an unassisted confirmation', () => {
  assert.equal(SRS.nextReviewMode('test', 'again'), 'guided');
  assert.equal(SRS.nextReviewMode('guided', 'hard'), 'guided');
  assert.equal(SRS.nextReviewMode('guided', 'good'), 'confirm');
  assert.equal(SRS.nextReviewMode('confirm', 'good'), 'complete');
  assert.equal(SRS.nextReviewMode('confirm', 'again'), 'guided');
});

test('drawing classification distinguishes exact, technique, and wrong answers', () => {
  const references = [['水', 'VV32', 1], ['水', 'VV32', 2], ['木', 'HV32', 0]];
  const directions = { 水: ['S', 'E', 'SW', 'SE'] };
  assert.equal(SRS.classifyDrawing('水', 'VV32', ['S', 'E', 'SW', 'SE'], references, [], directions), 'good');
  assert.equal(SRS.classifyDrawing('水', 'VV32', ['N', 'E', 'SW', 'SE'], references, [], directions), 'hard');
  assert.equal(SRS.classifyDrawing('水', 'V3V2', ['S', 'E', 'SW', 'SE'], references, [], directions), 'hard');
  assert.equal(SRS.classifyDrawing('水', 'HV32', ['E', 'S', 'SW', 'SE'], references, [], directions), 'again');
});

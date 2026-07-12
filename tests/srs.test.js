const test = require('node:test');
const assert = require('node:assert/strict');
const SRS = require('../srs.js');

const now = new Date('2026-07-12T10:00:00.000Z');
const card = { character: '水', interval: 0, ease: 2.5, repetitions: 0 };

test('new card rated good returns in one day', () => {
  const result = SRS.schedule(card, 'good', now);
  assert.equal(result.interval, 1);
  assert.equal(result.repetitions, 1);
  assert.equal(result.nextReview, '2026-07-13T10:00:00.000Z');
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

test('simulatedNow advances by whole days without changing the base date', () => {
  assert.equal(SRS.simulatedNow(2, now).toISOString(), '2026-07-14T10:00:00.000Z');
  assert.equal(now.toISOString(), '2026-07-12T10:00:00.000Z');
});

test('review advances only after a fully correct drawing', () => {
  assert.equal(SRS.shouldAdvanceReview('good'), true);
  assert.equal(SRS.shouldAdvanceReview('hard'), false);
  assert.equal(SRS.shouldAdvanceReview('again'), false);
});

test('drawing classification distinguishes exact, technique, and wrong answers', () => {
  const references = [['水', 'VV32', 1], ['水', 'VV32', 2], ['木', 'HV32', 0]];
  assert.equal(SRS.classifyDrawing('水', 'VV32', 1, references), 'good');
  assert.equal(SRS.classifyDrawing('水', 'VV32', 4, references), 'hard');
  assert.equal(SRS.classifyDrawing('水', 'V3V2', 1, references), 'hard');
  assert.equal(SRS.classifyDrawing('水', 'HV32', 0, references), 'again');
});

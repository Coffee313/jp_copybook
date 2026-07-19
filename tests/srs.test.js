const test = require('node:test');
const assert = require('node:assert/strict');
const SRS = require('../srs.js');

const now = new Date('2026-07-12T10:00:00.000Z');
const card = { character: '水', interval: 0, ease: 2.5, repetitions: 0 };

test('FSRS initializes a good card with its default stability and difficulty', () => {
  const result = SRS.schedule(card, 'good', now);
  const nextLocalMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 2);
  assert.equal(result.interval, 2);
  assert.equal(result.repetitions, 1);
  assert.equal(result.stability, 2.3065);
  assert.equal(result.difficulty, 2.11810397);
  assert.equal(result.fsrsVersion, 6);
  assert.equal(result.nextReview, nextLocalMidnight.toISOString());
});

test('an FSRS day interval becomes due when its local calendar day starts', () => {
  const reviewedAt = new Date(2026, 6, 12, 23, 55);
  const result = SRS.schedule(card, 'good', reviewedAt);

  assert.equal(SRS.isDue(result, new Date(2026, 6, 13, 23, 59, 59, 999)), false);
  assert.equal(SRS.isDue(result, new Date(2026, 6, 14, 0, 0)), true);
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

test('a successful FSRS review increases stability', () => {
  const reviewed = {
    ...card,
    interval: 2,
    stability: 2.3065,
    difficulty: 2.11810397,
    repetitions: 1,
    lastReviewed: '2026-07-10T10:00:00.000Z'
  };
  const result = SRS.schedule(reviewed, 'good', now);

  assert.ok(result.stability > reviewed.stability);
  assert.ok(result.interval > reviewed.interval);
  assert.equal(result.repetitions, 2);
});

test('again records an FSRS lapse and schedules a ten minute retry', () => {
  const result = SRS.schedule({
    ...card,
    interval: 12,
    stability: 12,
    difficulty: 5,
    repetitions: 4,
    lapses: 1,
    lastReviewed: '2026-06-30T10:00:00.000Z'
  }, 'again', now);
  assert.equal(result.interval, 0);
  assert.equal(result.repetitions, 5);
  assert.equal(result.lapses, 2);
  assert.ok(result.stability > 0 && result.stability < 12);
  assert.equal(result.nextReview, '2026-07-12T10:10:00.000Z');
});

test('a ten-minute retry uses the official FSRS same-day stability update', () => {
  const failed = SRS.schedule({
    ...card,
    interval: 8,
    stability: 8,
    difficulty: 5,
    repetitions: 2,
    lastReviewed: '2026-07-04T10:00:00.000Z'
  }, 'again', now);
  const retried = SRS.schedule(failed, 'good', new Date('2026-07-12T10:10:00.000Z'));

  assert.equal(retried.stability, 1.28363005);
  assert.equal(retried.difficulty, 8.32864898);
  assert.equal(retried.interval, 1);
});

test('hard produces a shorter FSRS interval than good', () => {
  const reviewed = {
    ...card,
    interval: 8,
    stability: 8,
    difficulty: 5,
    repetitions: 2,
    lastReviewed: '2026-07-04T10:00:00.000Z'
  };
  const hard = SRS.schedule(reviewed, 'hard', now);
  const good = SRS.schedule(reviewed, 'good', now);

  assert.ok(hard.interval < good.interval);
  assert.ok(hard.difficulty > good.difficulty);
});

test('reviewed card state matches the official FSRS-6 default model', () => {
  const reviewed = {
    ...card,
    interval: 8,
    stability: 8,
    difficulty: 5,
    repetitions: 2,
    lastReviewed: '2026-07-04T10:00:00.000Z'
  };
  const result = SRS.schedule(reviewed, 'good', now);
  const hard = SRS.schedule(reviewed, 'hard', now);

  assert.equal(result.stability, 26.28880011);
  assert.equal(result.difficulty, 4.99022837);
  assert.equal(result.interval, 26);
  assert.equal(hard.stability, 18.99888439);
  assert.equal(hard.difficulty, 6.66599536);
  assert.equal(hard.interval, 19);
});

test('easy gives a new card the longest FSRS initial interval', () => {
  const result = SRS.schedule(card, 'easy', now);
  assert.equal(result.interval, 8);
  assert.equal(result.stability, 8.2956);
  assert.equal(result.difficulty, 1);
});

test('legacy cards migrate to FSRS without discarding their prior interval', () => {
  const legacy = {
    ...card,
    interval: 12,
    ease: 2.5,
    repetitions: 4,
    lastReviewed: '2026-06-30T10:00:00.000Z'
  };
  const result = SRS.schedule(legacy, 'good', now);

  assert.ok(result.stability > legacy.interval);
  assert.ok(result.interval > legacy.interval);
  assert.ok(result.difficulty >= 1 && result.difficulty <= 10);
  assert.equal(result.fsrsVersion, 6);
});

test('isDue accepts overdue and unscheduled cards', () => {
  assert.equal(SRS.isDue({ nextReview: '2026-07-12T09:59:00.000Z' }, now), true);
  assert.equal(SRS.isDue({ nextReview: '2026-07-12T10:01:00.000Z' }, now), false);
  assert.equal(SRS.isDue({}, now), true);
});

test('completing an SRS test updates the review schedule', () => {
  const result = SRS.completeReview(card, 'good', false, now);

  assert.equal(result.repetitions, 1);
  assert.equal(result.stability, 2.3065);
  assert.equal(result.fsrsVersion, 6);
  assert.equal(result.lastReviewed, now.toISOString());
  assert.equal(SRS.isDue(result, new Date(2026, 6, 14, 0, 0)), true);
});

test('completing Test myself leaves every SRS timing field unchanged', () => {
  const scheduledCard = {
    ...card,
    interval: 6,
    ease: 2.35,
    repetitions: 2,
    stability: 6.4,
    difficulty: 4.2,
    lapses: 1,
    fsrsVersion: 6,
    lastReviewed: '2026-07-10T08:00:00.000Z',
    nextReview: '2026-07-16T00:00:00.000Z'
  };

  assert.deepEqual(SRS.completeReview(scheduledCard, 'again', true, now), scheduledCard);
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

(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.SRS = api;
})(typeof window !== 'undefined' ? window : globalThis, function () {
  const DAY_MS = 24 * 60 * 60 * 1000;
  const MINUTE_MS = 60 * 1000;
  const REQUEST_RETENTION = 0.9;
  const MAX_INTERVAL = 36500;
  const MIN_STABILITY = 0.001;
  const FSRS_VERSION = 6;
  const WEIGHTS = Object.freeze([
    0.212, 1.2931, 2.3065, 8.2956, 6.4133, 0.8334, 3.0194,
    0.001, 1.8722, 0.1666, 0.796, 1.4835, 0.0614, 0.2629,
    1.6483, 0.6014, 1.8729, 0.5425, 0.0912, 0.0658, 0.1542
  ]);
  const RATING_GRADE = Object.freeze({ again: 1, hard: 2, good: 3, easy: 4 });

  const clamp = (value, minimum, maximum) => Math.min(maximum, Math.max(minimum, value));
  const round = value => Number(value.toFixed(8));

  function calendarDayDueAt(reviewedAt, interval) {
    return new Date(
      reviewedAt.getFullYear(),
      reviewedAt.getMonth(),
      reviewedAt.getDate() + interval
    );
  }

  function rawInitialDifficulty(grade) {
    return round(WEIGHTS[4] - Math.exp((grade - 1) * WEIGHTS[5]) + 1);
  }

  function initialDifficulty(grade) {
    return clamp(rawInitialDifficulty(grade), 1, 10);
  }

  function nextDifficulty(difficulty, grade) {
    const delta = -WEIGHTS[6] * (grade - 3);
    const damped = round(delta * (10 - difficulty) / 9);
    const reverted = WEIGHTS[7] * rawInitialDifficulty(4) + (1 - WEIGHTS[7]) * (difficulty + damped);
    return round(clamp(reverted, 1, 10));
  }

  function forgettingCurve(elapsedDays, stability) {
    const decay = -WEIGHTS[20];
    const factor = Math.exp(Math.log(0.9) / decay) - 1;
    return Math.pow(1 + factor * elapsedDays / stability, decay);
  }

  function nextRecallStability(difficulty, stability, retrievability, grade) {
    const hardPenalty = grade === 2 ? WEIGHTS[15] : 1;
    const easyBonus = grade === 4 ? WEIGHTS[16] : 1;
    const growth = Math.exp(WEIGHTS[8]) * (11 - difficulty) *
      Math.pow(stability, -WEIGHTS[9]) *
      (Math.exp((1 - retrievability) * WEIGHTS[10]) - 1) *
      hardPenalty * easyBonus;
    return round(clamp(stability * (1 + growth), MIN_STABILITY, MAX_INTERVAL));
  }

  function nextForgetStability(difficulty, stability, retrievability) {
    const forgotten = WEIGHTS[11] * Math.pow(difficulty, -WEIGHTS[12]) *
      (Math.pow(stability + 1, WEIGHTS[13]) - 1) *
      Math.exp((1 - retrievability) * WEIGHTS[14]);
    const shortTermLimit = stability / Math.exp(WEIGHTS[17] * WEIGHTS[18]);
    return round(clamp(Math.min(forgotten, shortTermLimit), MIN_STABILITY, MAX_INTERVAL));
  }

  function nextShortTermStability(stability, grade) {
    const increase = Math.pow(stability, -WEIGHTS[19]) * Math.exp(WEIGHTS[17] * (grade - 3 + WEIGHTS[18]));
    const adjusted = grade >= 2 ? Math.max(increase, 1) : increase;
    return round(clamp(stability * adjusted, MIN_STABILITY, MAX_INTERVAL));
  }

  function migratedMemoryState(card) {
    const stability = Number(card.stability);
    const difficulty = Number(card.difficulty);
    return {
      stability: Number.isFinite(stability) && stability > 0
        ? stability
        : Math.max(Number(card.interval) || WEIGHTS[0], MIN_STABILITY),
      difficulty: Number.isFinite(difficulty) && difficulty >= 1 && difficulty <= 10
        ? difficulty
        : clamp(11 - (Number(card.ease) || 2.5) * 2, 1, 10)
    };
  }

  function intervalForStability(stability) {
    const decay = -WEIGHTS[20];
    const factor = Math.exp(Math.log(0.9) / decay) - 1;
    const modifier = (Math.pow(REQUEST_RETENTION, 1 / decay) - 1) / factor;
    return Math.min(MAX_INTERVAL, Math.max(1, Math.round(stability * modifier)));
  }

  function schedule(card, rating, now = new Date()) {
    const grade = RATING_GRADE[rating];
    if (!grade) throw new Error(`Unknown SRS rating: ${rating}`);

    const lastReviewed = new Date(card.lastReviewed);
    const reviewed = Number.isFinite(lastReviewed.getTime()) && (Number(card.repetitions) || 0) > 0;
    let stability;
    let difficulty;

    if (!reviewed) {
      stability = WEIGHTS[grade - 1];
      difficulty = initialDifficulty(grade);
    } else {
      const current = migratedMemoryState(card);
      const elapsedDays = Math.max(0, Math.floor((now.getTime() - lastReviewed.getTime()) / DAY_MS));
      const retrievability = forgettingCurve(elapsedDays, current.stability);
      difficulty = nextDifficulty(current.difficulty, grade);
      stability = elapsedDays === 0
        ? nextShortTermStability(current.stability, grade)
        : grade === 1
          ? nextForgetStability(current.difficulty, current.stability, retrievability)
          : nextRecallStability(current.difficulty, current.stability, retrievability, grade);
    }

    const interval = rating === 'again' ? 0 : intervalForStability(stability);
    const nextReview = rating === 'again'
      ? new Date(now.getTime() + 10 * MINUTE_MS)
      : calendarDayDueAt(now, interval);

    return {
      ...card,
      interval,
      stability: round(stability),
      difficulty: round(difficulty),
      repetitions: (Number(card.repetitions) || 0) + 1,
      lapses: (Number(card.lapses) || 0) + (reviewed && rating === 'again' ? 1 : 0),
      fsrsVersion: FSRS_VERSION,
      lastReviewed: now.toISOString(),
      nextReview: nextReview.toISOString()
    };
  }

  function isDue(card, now = new Date()) {
    const interval = Number(card.interval) || 0;
    const lastReviewed = new Date(card.lastReviewed);
    const calendarDueAt = interval > 0 && Number.isFinite(lastReviewed.getTime())
      ? calendarDayDueAt(lastReviewed, interval).getTime()
      : NaN;
    const dueAt = Number.isFinite(calendarDueAt)
      ? calendarDueAt
      : Date.parse(card.nextReview || card.createdAt || 0);
    return !Number.isFinite(dueAt) || dueAt <= now.getTime();
  }

  function completeReview(card, rating, selfTest = false, now = new Date()) {
    return selfTest ? card : schedule(card, rating, now);
  }

  function shouldAdvanceReview(rating) {
    return rating === 'good';
  }

  function nextReviewMode(mode, rating) {
    if (rating !== 'good') return 'guided';
    if (mode === 'guided') return 'confirm';
    return 'complete';
  }

  function classifyDrawing(character, strokeSignature, strokeDirections, references, candidates = [], directionReferences = {}) {
    const targetReferences = references.filter(reference => reference[0] === character);
    const exact = targetReferences.filter(reference => reference[1] === strokeSignature);
    const expectedDirections = directionReferences[character];
    const directionNames = ['E', 'SE', 'S', 'SW', 'W', 'NW', 'N', 'NE'];
    const directionsMatch = !expectedDirections || (
      expectedDirections.length === strokeDirections.length &&
      expectedDirections.every((direction, index) => {
        const expectedIndex = directionNames.indexOf(direction);
        const actualIndex = directionNames.indexOf(strokeDirections[index]);
        if (expectedIndex === -1 || actualIndex === -1) return direction === strokeDirections[index];
        const distance = Math.abs(expectedIndex - actualIndex);
        return Math.min(distance, directionNames.length - distance) <= 1;
      })
    );
    const signatureByDirection = {
      E: 'H', W: 'H',
      S: 'V', N: 'V',
      SE: '2', NW: '2',
      SW: '3', NE: '3'
    };
    const canonicalSignature = expectedDirections
      ? expectedDirections.map(direction => signatureByDirection[direction] || '?').join('')
      : '';
    const canonicalGuideMatch = canonicalSignature === strokeSignature && directionsMatch;
    if (canonicalGuideMatch) return 'good';
    if (exact.length && directionsMatch) return 'good';
    if (exact.length) return 'hard';

    const normalized = value => [...value].sort().join('');
    const drawnStrokes = normalized(strokeSignature || '');
    const wrongOrder = targetReferences.some(reference => normalized(reference[1] || '') === drawnStrokes);
    if (wrongOrder || candidates.includes(character)) return 'hard';
    return 'again';
  }

  return {
    schedule, isDue, completeReview, shouldAdvanceReview, nextReviewMode, classifyDrawing,
    DAY_MS, MINUTE_MS, REQUEST_RETENTION, FSRS_VERSION
  };
});

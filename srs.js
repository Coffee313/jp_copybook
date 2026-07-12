(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.SRS = api;
})(typeof window !== 'undefined' ? window : globalThis, function () {
  const DAY_MS = 24 * 60 * 60 * 1000;
  const MINUTE_MS = 60 * 1000;

  function simulatedNow(dayOffset = 0, now = new Date()) {
    const offset = Number.isFinite(Number(dayOffset)) ? Number(dayOffset) : 0;
    return new Date(now.getTime() + offset * DAY_MS);
  }

  function schedule(card, rating, now = new Date()) {
    const currentInterval = Number(card.interval) || 0;
    const currentEase = Number(card.ease) || 2.5;
    const currentRepetitions = Number(card.repetitions) || 0;
    let interval;
    let ease = currentEase;
    let repetitions = currentRepetitions + 1;
    let delay;

    if (rating === 'again') {
      interval = 0;
      ease = Math.max(1.3, currentEase - 0.2);
      repetitions = 0;
      delay = 10 * MINUTE_MS;
    } else if (rating === 'hard') {
      interval = Math.max(1, Math.round(currentInterval * 1.2));
      ease = Math.max(1.3, currentEase - 0.15);
      delay = interval * DAY_MS;
    } else if (rating === 'good') {
      interval = currentRepetitions === 0 ? 1 : currentRepetitions === 1 ? 6 : Math.max(1, Math.round(currentInterval * currentEase));
      delay = interval * DAY_MS;
    } else if (rating === 'easy') {
      ease = currentEase + 0.15;
      interval = currentRepetitions === 0 ? 4 : Math.max(2, Math.round(Math.max(1, currentInterval) * ease * 1.3));
      delay = interval * DAY_MS;
    } else {
      throw new Error(`Unknown SRS rating: ${rating}`);
    }

    return {
      ...card,
      interval,
      ease: Number(ease.toFixed(2)),
      repetitions,
      lastReviewed: now.toISOString(),
      nextReview: new Date(now.getTime() + delay).toISOString()
    };
  }

  function isDue(card, now = new Date()) {
    const dueAt = Date.parse(card.nextReview || card.createdAt || 0);
    return !Number.isFinite(dueAt) || dueAt <= now.getTime();
  }

  function shouldAdvanceReview(rating) {
    return rating === 'good';
  }

  function classifyDrawing(character, strokeSignature, directionChanges, references, candidates = []) {
    const targetReferences = references.filter(reference => reference[0] === character);
    const exact = targetReferences.filter(reference => reference[1] === strokeSignature);
    if (exact.some(reference => Number(reference[2] || 0) === Number(directionChanges || 0))) return 'good';
    if (exact.length) return 'hard';

    const normalized = value => [...value].sort().join('');
    const drawnStrokes = normalized(strokeSignature || '');
    const wrongOrder = targetReferences.some(reference => normalized(reference[1] || '') === drawnStrokes);
    if (wrongOrder || candidates.includes(character)) return 'hard';
    return 'again';
  }

  return { schedule, isDue, simulatedNow, shouldAdvanceReview, classifyDrawing, DAY_MS, MINUTE_MS };
});

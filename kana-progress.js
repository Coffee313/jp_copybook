(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.KanaProgress = api;
})(typeof window !== 'undefined' ? window : globalThis, function () {
  function markMastered(mastery, character, now = new Date()) {
    return { ...mastery, [character]: { passed: true, passedAt: now.toISOString() } };
  }

  function markLearned(learned, character, now = new Date()) {
    return { ...learned, [character]: { learned: true, learnedAt: now.toISOString() } };
  }

  function mergeMastery(local = {}, remote = {}) {
    const merged = { ...remote };
    Object.entries(local).forEach(([character, value]) => {
      if (!merged[character] || Date.parse(value.passedAt || 0) >= Date.parse(merged[character].passedAt || 0)) {
        merged[character] = value;
      }
    });
    return merged;
  }

  function mergeLearned(local = {}, remote = {}) {
    const merged = { ...remote };
    Object.entries(local).forEach(([character, value]) => {
      if (!merged[character] || Date.parse(value.learnedAt || 0) >= Date.parse(merged[character].learnedAt || 0)) {
        merged[character] = value;
      }
    });
    return merged;
  }

  function progressCount(mastery, characters) {
    return characters.filter(character => mastery[character]?.passed).length;
  }

  function resetMastery(mastery, characters) {
    const resetCharacters = new Set(characters);
    return Object.fromEntries(Object.entries(mastery).filter(([character]) => !resetCharacters.has(character)));
  }

  function markScriptReset(resetTimes, script, now = new Date()) {
    return { ...resetTimes, [script]: now.toISOString() };
  }

  function mergeResetTimes(local = {}, remote = {}) {
    const merged = { ...remote };
    Object.entries(local).forEach(([script, resetAt]) => {
      if (!merged[script] || Date.parse(resetAt || 0) >= Date.parse(merged[script] || 0)) merged[script] = resetAt;
    });
    return merged;
  }

  function applyMasteryResets(mastery, resetTimes, scripts) {
    const scriptByCharacter = new Map();
    Object.entries(scripts).forEach(([script, characters]) => {
      characters.forEach(character => scriptByCharacter.set(character, script));
    });
    return Object.fromEntries(Object.entries(mastery).filter(([character, value]) => {
      const resetAt = resetTimes[scriptByCharacter.get(character)];
      return !resetAt || Date.parse(value.passedAt || 0) > Date.parse(resetAt);
    }));
  }

  function applyLearnedResets(learned, resetTimes, scripts) {
    const scriptByCharacter = new Map();
    Object.entries(scripts).forEach(([script, characters]) => {
      characters.forEach(character => scriptByCharacter.set(character, script));
    });
    return Object.fromEntries(Object.entries(learned).filter(([character, value]) => {
      const resetAt = resetTimes[scriptByCharacter.get(character)];
      return !resetAt || Date.parse(value.learnedAt || 0) > Date.parse(resetAt);
    }));
  }

  function pendingTestItems(values, learned, mastery) {
    return values.filter(item => learned[item[0]]?.learned && !mastery[item[0]]?.passed);
  }

  function allPracticeCellsGood(results) {
    return results.length > 0 && results.every(result => result === 'good');
  }

  function previousTestLayer(layerIndex) {
    return Math.max(0, layerIndex - 1);
  }

  function testPickerItems(values, mastery, currentCharacter) {
    return values.filter(item => item[0] !== currentCharacter && mastery[item[0]]?.passed);
  }

  function cookieValue(cookieString, name) {
    const prefix = `${encodeURIComponent(name)}=`;
    const item = cookieString.split(';').map(value => value.trim()).find(value => value.startsWith(prefix));
    if (!item) return null;
    try { return decodeURIComponent(item.slice(prefix.length)); }
    catch { return null; }
  }

  function shuffled(values, random = Math.random) {
    const result = [...values];
    for (let index = result.length - 1; index > 0; index--) {
      const target = Math.floor(random() * (index + 1));
      [result[index], result[target]] = [result[target], result[index]];
    }
    return result;
  }

  function placementLevel(correct, total) {
    const ratio = total > 0 ? correct / total : 0;
    if (ratio >= .85) return 'Master of Kana';
    if (ratio >= .6) return 'Strong intermediate';
    if (ratio >= .35) return 'Intermediate';
    return 'Beginner';
  }

  function mergePlacement(local, remote) {
    if (!local) return remote || null;
    if (!remote) return local;
    return Date.parse(local.completedAt || 0) >= Date.parse(remote.completedAt || 0) ? local : remote;
  }

  return { markMastered, markLearned, mergeMastery, mergeLearned, progressCount, resetMastery, markScriptReset, mergeResetTimes, applyMasteryResets, applyLearnedResets, pendingTestItems, allPracticeCellsGood, previousTestLayer, testPickerItems, cookieValue, shuffled, placementLevel, mergePlacement };
});

(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.KanaProgress = api;
})(typeof window !== 'undefined' ? window : globalThis, function () {
  function markMastered(mastery, character, now = new Date()) {
    return { ...mastery, [character]: { passed: true, passedAt: now.toISOString() } };
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

  function progressCount(mastery, characters) {
    return characters.filter(character => mastery[character]?.passed).length;
  }

  function resetMastery(mastery, characters) {
    const resetCharacters = new Set(characters);
    return Object.fromEntries(Object.entries(mastery).filter(([character]) => !resetCharacters.has(character)));
  }

  function previousTestLayer(layerIndex) {
    return Math.max(0, layerIndex - 1);
  }

  function shuffled(values, random = Math.random) {
    const result = [...values];
    for (let index = result.length - 1; index > 0; index--) {
      const target = Math.floor(random() * (index + 1));
      [result[index], result[target]] = [result[target], result[index]];
    }
    return result;
  }

  return { markMastered, mergeMastery, progressCount, resetMastery, previousTestLayer, shuffled };
});

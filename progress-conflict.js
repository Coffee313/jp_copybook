(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.ProgressConflict = api;
})(typeof window !== 'undefined' ? window : globalThis, function () {
  async function saveWithRetry({ load, merge, update, create, maxAttempts = 4 }) {
    let lastError = null;
    for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
      const row = await load();
      const progress = await merge(row?.progress || {});
      try {
        const saved = row
          ? await update(progress, row.updatedAt)
          : await create(progress);
        if (saved) return progress;
      } catch (error) {
        lastError = error;
      }
    }
    throw new Error('Progress changed on another device too many times. Please try saving again.', { cause: lastError });
  }

  return { saveWithRetry };
});

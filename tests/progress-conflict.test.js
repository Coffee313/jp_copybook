const test = require('node:test');
const assert = require('node:assert/strict');
const ProgressConflict = require('../progress-conflict.js');

test('saveWithRetry preserves a concurrent remote change', async () => {
  let row = { progress: { kanaMastery: { あ: { passed: true } } }, updatedAt: 'version-1' };
  let updateCalls = 0;

  const saved = await ProgressConflict.saveWithRetry({
    load: async () => structuredClone(row),
    merge: async remote => ({ ...remote, dictionary: [{ character: '水' }] }),
    update: async (progress, expectedUpdatedAt) => {
      updateCalls += 1;
      if (updateCalls === 1) {
        row = {
          progress: { ...row.progress, kanaLearned: { い: { learned: true } } },
          updatedAt: 'version-2'
        };
        return false;
      }
      if (expectedUpdatedAt !== row.updatedAt) return false;
      row = { progress, updatedAt: 'version-3' };
      return true;
    },
    create: async () => false
  });

  assert.equal(updateCalls, 2);
  assert.deepEqual(saved, row.progress);
  assert.deepEqual(row.progress.kanaMastery, { あ: { passed: true } });
  assert.deepEqual(row.progress.kanaLearned, { い: { learned: true } });
  assert.deepEqual(row.progress.dictionary, [{ character: '水' }]);
});

test('saveWithRetry retries when another client creates the row first', async () => {
  let row = null;
  let createCalls = 0;

  const saved = await ProgressConflict.saveWithRetry({
    load: async () => row && structuredClone(row),
    merge: async remote => ({ ...remote, dictionary: [{ character: '火' }] }),
    create: async progress => {
      createCalls += 1;
      row = { progress: { kanaPlacement: { assignedLevel: 'Beginner' } }, updatedAt: 'created-elsewhere' };
      return false;
    },
    update: async (progress, expectedUpdatedAt) => {
      if (expectedUpdatedAt !== row.updatedAt) return false;
      row = { progress, updatedAt: 'saved' };
      return true;
    }
  });

  assert.equal(createCalls, 1);
  assert.deepEqual(saved, {
    kanaPlacement: { assignedLevel: 'Beginner' },
    dictionary: [{ character: '火' }]
  });
});

test('saveWithRetry fails clearly after repeated conflicts', async () => {
  await assert.rejects(
    ProgressConflict.saveWithRetry({
      load: async () => ({ progress: {}, updatedAt: 'version' }),
      merge: async remote => remote,
      update: async () => false,
      create: async () => false,
      maxAttempts: 2
    }),
    /changed on another device/
  );
});

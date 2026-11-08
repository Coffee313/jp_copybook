const test = require('node:test');
const assert = require('node:assert/strict');
const geometry = require('../recognizer-geometry.js');

test('canvasPoint scales CSS pixels into backing-canvas coordinates', () => {
  const canvas = {
    width: 360,
    height: 360,
    getBoundingClientRect: () => ({ left: 20, top: 40, width: 180, height: 180 })
  };
  assert.deepEqual(geometry.canvasPoint(canvas, { clientX: 110, clientY: 130 }), { x: 180, y: 180 });
});

test('vectorDirection distinguishes opposite stroke directions', () => {
  const origin = { x: 0, y: 0 };
  assert.equal(geometry.vectorDirection(origin, { x: 20, y: 0 }), 'E');
  assert.equal(geometry.vectorDirection(origin, { x: -20, y: 0 }), 'W');
  assert.equal(geometry.vectorDirection(origin, { x: 0, y: 20 }), 'S');
  assert.equal(geometry.vectorDirection(origin, { x: 0, y: -20 }), 'N');
});

function verticalMask(size, x, width = 1) {
  const mask = new Uint8Array(size * size);
  const halfWidth = Math.floor(width / 2);
  for (let y = 8; y < size - 8; y += 1) {
    for (let dx = -halfWidth; dx <= halfWidth; dx += 1) mask[y * size + x + dx] = 1;
  }
  return mask;
}

test('compareStrokeMasks accepts a close thin stroke without accepting a distant stroke', () => {
  const size = 96;
  const reference = verticalMask(size, 48, 3);
  const close = geometry.compareStrokeMasks(verticalMask(size, 52), reference, size);
  const distant = geometry.compareStrokeMasks(verticalMask(size, 56), reference, size);

  assert.equal(close.good, true);
  assert.equal(distant.good, false);
});

test('compareStrokeMasks tolerates ordinary handwriting offset in a simple stroke', () => {
  const size = 96;
  const reference = verticalMask(size, 48, 3);
  const ordinaryOffset = geometry.compareStrokeMasks(verticalMask(size, 54), reference, size);

  assert.equal(ordinaryOffset.good, true);
});

test('copybookReferenceTransform matches the visible six-percent guide inset', () => {
  const transform = geometry.copybookReferenceTransform(96);
  assert.equal(transform.inset, 5.76);
  assert.equal(transform.scale, 84.48 / 109);
});

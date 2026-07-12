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

(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.RecognizerGeometry = api;
})(typeof window !== 'undefined' ? window : globalThis, function () {
  function canvasPoint(canvas, event) {
    const rect = canvas.getBoundingClientRect();
    return {
      x: (event.clientX - rect.left) * canvas.width / rect.width,
      y: (event.clientY - rect.top) * canvas.height / rect.height
    };
  }

  function vectorDirection(startPoint, endPoint) {
    const dx = endPoint.x - startPoint.x;
    const dy = endPoint.y - startPoint.y;
    if (Math.hypot(dx, dy) < 2) return '?';
    const names = ['E', 'SE', 'S', 'SW', 'W', 'NW', 'N', 'NE'];
    return names[Math.round(Math.atan2(dy, dx) / (Math.PI / 4) + 8) % 8];
  }

  return { canvasPoint, vectorDirection };
});

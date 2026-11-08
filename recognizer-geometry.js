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

  function dilateMask(mask, size, radius) {
    const result = new Uint8Array(mask.length);
    for (let y = 0; y < size; y += 1) for (let x = 0; x < size; x += 1) {
      if (!mask[y * size + x]) continue;
      for (let dy = -radius; dy <= radius; dy += 1) for (let dx = -radius; dx <= radius; dx += 1) {
        if (dx * dx + dy * dy > radius * radius) continue;
        const nx = x + dx;
        const ny = y + dy;
        if (nx >= 0 && nx < size && ny >= 0 && ny < size) result[ny * size + nx] = 1;
      }
    }
    return result;
  }

  function compareStrokeMasks(user, target, size) {
    // Handwriting is not pixel-perfect. A wider comparison halo absorbs small
    // placement and stroke-width differences without making unrelated strokes match.
    const userWide = dilateMask(user, size, 7);
    const targetWide = dilateMask(target, size, 7);
    let userPixels = 0, targetPixels = 0, userHits = 0, targetHits = 0;
    user.forEach((value, index) => {
      if (value) { userPixels += 1; if (targetWide[index]) userHits += 1; }
      if (target[index]) { targetPixels += 1; if (userWide[index]) targetHits += 1; }
    });
    const precision = userPixels ? userHits / userPixels : 0;
    const coverage = targetPixels ? targetHits / targetPixels : 0;
    const rawScore = precision * .58 + coverage * .42;
    return {
      precision,
      coverage,
      rawScore,
      good: precision > .68 && coverage > .55 && rawScore > .65
    };
  }

  function copybookReferenceTransform(size) {
    const inset = size * .06;
    return { inset, scale: (size - inset * 2) / 109 };
  }

  return { canvasPoint, vectorDirection, compareStrokeMasks, copybookReferenceTransform };
});

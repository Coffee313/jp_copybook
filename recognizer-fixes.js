(function () {
  const directions = [];
  let start = null;
  let last = null;
  let directionPoint = null;
  const { canvasPoint, vectorDirection } = window.RecognizerGeometry;

  HTMLCanvasElement.prototype.relMouseCoords = function (event) {
    return canvasPoint(this, event);
  };

  window.addEventListener('load', () => {
    const canvas = document.querySelector('#can');
    canvas.addEventListener('mousedown', event => { start = canvasPoint(canvas, event); last = start; directionPoint = null; });
    canvas.addEventListener('mousemove', event => {
      if (!start) return;
      last = canvasPoint(canvas, event);
      if (!directionPoint && Math.hypot(last.x - start.x, last.y - start.y) >= canvas.width * 8 / 109) directionPoint = last;
    });
    canvas.addEventListener('mouseup', event => {
      if (!start) return;
      if (event.clientX || event.clientY) last = canvasPoint(canvas, event);
      directions.push(vectorDirection(start, directionPoint || last));
      start = null;
    });
  });

  const originalErase = window.erase;
  window.erase = function () { directions.length = 0; start = null; last = null; return originalErase.apply(this, arguments); };
  const originalUndo = window.undo;
  window.undo = function () { if (directions.length) directions.pop(); return originalUndo.apply(this, arguments); };

  window.getStrokeDirections = () => [...directions];
})();

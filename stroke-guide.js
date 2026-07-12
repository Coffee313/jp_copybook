(function () {
  const SVG_NS = 'http://www.w3.org/2000/svg';

  function strokeStart(pathData) {
    const match = pathData.match(/^\s*[Mm]\s*([-+\d.]+)[,\s]+([-+\d.]+)/);
    return match ? [Number(match[1]), Number(match[2])] : [0, 0];
  }

  function renderStrokeGuide(container, character) {
    container.replaceChildren();
    const strokes = window.KANJIVG_STROKES[character];
    container.hidden = !strokes;
    if (!strokes) return;
    const svg = document.createElementNS(SVG_NS, 'svg');
    svg.setAttribute('viewBox', '0 0 109 109');
    svg.setAttribute('role', 'img');
    svg.setAttribute('aria-label', `Порядок штрихов для ${character}`);
    strokes.forEach((pathData, index) => {
      const path = document.createElementNS(SVG_NS, 'path');
      path.setAttribute('d', pathData);
      path.style.setProperty('--stroke-index', index);
      svg.append(path);
      const [x, y] = strokeStart(pathData);
      const label = document.createElementNS(SVG_NS, 'text');
      label.setAttribute('x', x - 3);
      label.setAttribute('y', y - 3);
      label.textContent = String(index + 1);
      svg.append(label);
    });
    container.append(svg);
  }

  window.renderStrokeGuide = renderStrokeGuide;
})();

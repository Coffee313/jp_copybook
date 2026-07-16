(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.PitchAccent = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  const SMALL_KANA = /[\u3041\u3043\u3045\u3047\u3049\u3083\u3085\u3087\u308e\u3095\u3096]/;
  const MORA_KANA = /[\u3041-\u3096\u30fc]/;

  function toHiragana(value) {
    return String(value || '').normalize('NFKC')
      .replace(/[\u30a1-\u30f6]/g, character => String.fromCharCode(character.charCodeAt(0) - 0x60));
  }

  function getMoras(reading) {
    const moras = [];
    for (const character of toHiragana(reading)) {
      if (!MORA_KANA.test(character)) continue;
      if (SMALL_KANA.test(character) && moras.length) moras[moras.length - 1] += character;
      else moras.push(character);
    }
    return moras;
  }

  function getLevels(moraCount, accent) {
    if (accent === '' || accent === null || accent === undefined) return [];
    const type = Number(accent);
    if (!Number.isInteger(type) || type < 0 || type > moraCount) return [];
    return Array.from({ length: moraCount }, (_, index) => {
      const mora = index + 1;
      if (type === 0) return mora === 1 ? 'low' : 'high';
      if (type === 1) return mora === 1 ? 'high' : 'low';
      return mora === 1 || mora > type ? 'low' : 'high';
    });
  }

  function describe(moras, accent) {
    const type = Number(accent);
    const levels = getLevels(moras.length, type);
    if (!levels.length) return '';
    const shape = levels.map(level => level === 'high' ? 'high' : 'low').join(', ');
    const ending = type === 0 ? 'no downstep' : `downstep after mora ${type}`;
    return `Pitch accent type ${type}: ${shape}; ${ending}.`;
  }

  function render(container, reading, accent) {
    container.replaceChildren();
    const moras = getMoras(reading);
    const levels = getLevels(moras.length, accent);
    if (!levels.length) {
      container.hidden = true;
      return;
    }

    const namespace = 'http://www.w3.org/2000/svg';
    const spacing = 30;
    const width = Math.max(70, 24 + (moras.length - 1) * spacing + 28);
    const xAt = index => 14 + index * spacing;
    const yAt = level => level === 'high' ? 14 : 38;
    const svg = document.createElementNS(namespace, 'svg');
    svg.setAttribute('viewBox', `0 0 ${width} 62`);
    svg.setAttribute('role', 'img');
    svg.setAttribute('aria-label', describe(moras, accent));

    if (levels.length > 1) {
      const line = document.createElementNS(namespace, 'polyline');
      line.setAttribute('points', levels.map((level, index) => `${xAt(index)},${yAt(level)}`).join(' '));
      line.setAttribute('class', 'pitch-line');
      svg.append(line);
    }

    moras.forEach((mora, index) => {
      const dot = document.createElementNS(namespace, 'circle');
      dot.setAttribute('cx', xAt(index));
      dot.setAttribute('cy', yAt(levels[index]));
      dot.setAttribute('r', '4');
      dot.setAttribute('class', `pitch-dot pitch-${levels[index]}`);
      const label = document.createElementNS(namespace, 'text');
      label.setAttribute('x', xAt(index));
      label.setAttribute('y', '58');
      label.setAttribute('text-anchor', 'middle');
      label.textContent = mora;
      svg.append(dot, label);
    });

    const type = Number(accent);
    if (type > 0) {
      const marker = document.createElementNS(namespace, 'line');
      const accentedIndex = type - 1;
      const x = xAt(accentedIndex) + (accentedIndex === moras.length - 1 ? 10 : spacing / 2);
      marker.setAttribute('x1', x);
      marker.setAttribute('x2', x);
      marker.setAttribute('y1', '8');
      marker.setAttribute('y2', '43');
      marker.setAttribute('class', 'pitch-downstep');
      svg.append(marker);
    }

    container.append(svg);
    container.hidden = false;
  }

  return { toHiragana, getMoras, getLevels, describe, render };
});

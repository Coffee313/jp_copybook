const kana = {
  hiragana: [
    ['あ','a'],['い','i'],['う','u'],['え','e'],['お','o'],
    ['か','ka'],['き','ki'],['く','ku'],['け','ke'],['こ','ko'],
    ['さ','sa'],['し','shi'],['す','su'],['せ','se'],['そ','so'],
    ['た','ta'],['ち','chi'],['つ','tsu'],['て','te'],['と','to'],
    ['な','na'],['に','ni'],['ぬ','nu'],['ね','ne'],['の','no'],
    ['は','ha'],['ひ','hi'],['ふ','fu'],['へ','he'],['ほ','ho'],
    ['ま','ma'],['み','mi'],['む','mu'],['め','me'],['も','mo'],
    ['や','ya'],['ゆ','yu'],['よ','yo'],
    ['ら','ra'],['り','ri'],['る','ru'],['れ','re'],['ろ','ro'],
    ['わ','wa'],['を','wo'],['ん','n']
  ],
  katakana: [
    ['ア','a'],['イ','i'],['ウ','u'],['エ','e'],['オ','o'],
    ['カ','ka'],['キ','ki'],['ク','ku'],['ケ','ke'],['コ','ko'],
    ['サ','sa'],['シ','shi'],['ス','su'],['セ','se'],['ソ','so'],
    ['タ','ta'],['チ','chi'],['ツ','tsu'],['テ','te'],['ト','to'],
    ['ナ','na'],['ニ','ni'],['ヌ','nu'],['ネ','ne'],['ノ','no'],
    ['ハ','ha'],['ヒ','hi'],['フ','fu'],['ヘ','he'],['ホ','ho'],
    ['マ','ma'],['ミ','mi'],['ム','mu'],['メ','me'],['モ','mo'],
    ['ヤ','ya'],['ユ','yu'],['ヨ','yo'],
    ['ラ','ra'],['リ','ri'],['ル','ru'],['レ','re'],['ロ','ro'],
    ['ワ','wa'],['ヲ','wo'],['ン','n']
  ]
};

let script = 'hiragana';
let selected = kana.hiragana[0];
const sheet = document.querySelector('#sheet');
const picker = document.querySelector('#kanaPicker');
const ghostToggle = document.querySelector('#ghostToggle');
const guideControl = document.querySelector('#guideControl');
const penOnlyToggle = document.querySelector('#penOnlyToggle');
const MASTERY_KEY = 'kana-mastery-v1';
const allKanaCharacters = [...kana.hiragana, ...kana.katakana].map(item => item[0]);
let mastery = readMastery();
let testActive = false;
let testQueue = [];
let testIndex = 0;
let testLayerIndex = 0;

const TEST_LAYERS = [
  { key: 'order', label: 'stroke-order guide' },
  { key: 'example', label: 'background example' },
  { key: 'blank', label: 'blank background' }
];

function readMastery() {
  try { return JSON.parse(localStorage.getItem(MASTERY_KEY)) || {}; }
  catch { return {}; }
}

function saveMastery(value) {
  mastery = value;
  localStorage.setItem(MASTERY_KEY, JSON.stringify(mastery));
  renderProgress();
  window.ProgressSync?.queueSave();
}

const strokeCounts = {
  // Hiragana
  'あ':3,'い':2,'う':2,'え':2,'お':3,'か':3,'き':4,'く':1,'け':3,'こ':2,
  'さ':3,'し':1,'す':2,'せ':3,'そ':1,'た':4,'ち':2,'つ':1,'て':1,'と':2,
  'な':4,'に':3,'ぬ':2,'ね':2,'の':1,'は':3,'ひ':1,'ふ':4,'へ':1,'ほ':4,
  'ま':3,'み':2,'む':3,'め':2,'も':3,'や':3,'ゆ':2,'よ':2,'ら':2,'り':2,
  'る':1,'れ':2,'ろ':1,'わ':2,'を':3,'ん':1,
  // Katakana
  'ア':2,'イ':2,'ウ':3,'エ':3,'オ':3,'カ':2,'キ':3,'ク':2,'ケ':3,'コ':2,
  'サ':3,'シ':3,'ス':2,'セ':2,'ソ':2,'タ':3,'チ':3,'ツ':3,'テ':3,'ト':2,
  'ナ':2,'ニ':2,'ヌ':2,'ネ':4,'ノ':1,'ハ':2,'ヒ':2,'フ':1,'ヘ':1,'ホ':4,
  'マ':2,'ミ':3,'ム':2,'メ':2,'モ':3,'ヤ':2,'ユ':2,'ヨ':3,'ラ':2,'リ':2,
  'ル':2,'レ':1,'ロ':3,'ワ':2,'ヲ':3,'ン':2
};

function makeStrokeDiagram() {
  const diagram = document.createElement('div');
  diagram.className = 'stroke-diagram';
  diagram.setAttribute('aria-label', `${selected[0]}, stroke count: ${strokeCounts[selected[0]]}`);
  diagram.append(makeVectorKana(selected[0], true));
  return diagram;
}

function makeTestGuide() {
  const layer = TEST_LAYERS[testLayerIndex];
  if (!layer || layer.key !== 'order') return null;
  const guide = document.createElement('div');
  guide.className = `test-guide test-guide-${layer.key}`;
  guide.setAttribute('aria-hidden', 'true');
  guide.append(makeVectorKana(selected[0], true));
  return guide;
}

function makeVectorKana(character, numbered = false) {
  const namespace = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(namespace, 'svg');
  svg.setAttribute('viewBox', '0 0 109 109');
  svg.setAttribute('aria-hidden', 'true');
  (window.kanaGuidePaths?.[character] || []).forEach((data, index) => {
    const path = document.createElementNS(namespace, 'path');
    path.setAttribute('d', data);
    svg.append(path);
    if (numbered) {
      const start = data.match(/^\s*[Mm]\s*([-+\d.]+)[,\s]+([-+\d.]+)/);
      if (start) {
        const label = document.createElementNS(namespace, 'text');
        label.setAttribute('x', Number(start[1]) - 3);
        label.setAttribute('y', Number(start[2]) - 3);
        label.textContent = String(index + 1);
        svg.append(label);
      }
    }
  });
  return svg;
}

function makeSheet() {
  sheet.innerHTML = '';
  const cellCount = testActive ? 1 : 15;
  const testLayer = testActive ? TEST_LAYERS[testLayerIndex] : null;
  for (let i = 0; i < cellCount; i++) {
    const cell = document.createElement('div');
    cell.className = `cell${!testActive && i === 0 ? ' stroke-cell' : ''}${testActive ? ` test-cell test-cell-${TEST_LAYERS[testLayerIndex]?.key || 'blank'}` : ''}`;
    if (!testActive && i === 0) {
      cell.append(makeStrokeDiagram());
      sheet.append(cell);
      continue;
    }
    if (testActive) {
      const guide = makeTestGuide();
      if (guide) cell.append(guide);
      if (testLayer?.key === 'example') {
        const ghost = document.createElement('span');
        ghost.className = 'ghost';
        ghost.append(makeVectorKana(selected[0]));
        cell.append(ghost);
      }
    } else {
      const ghost = document.createElement('span');
      ghost.className = 'ghost';
      ghost.append(makeVectorKana(selected[0]));
      ghost.hidden = !ghostToggle.checked;
      cell.append(ghost);
    }
    const canvas = document.createElement('canvas');
    cell.append(canvas);
    sheet.append(cell);
    setupCanvas(canvas);
  }
}

function setupCanvas(canvas) {
  let baseWidth = 6;
  canvas.__strokes = [];
  const resize = () => {
    const ratio = Math.max(window.devicePixelRatio || 1, 1);
    const rect = canvas.getBoundingClientRect();
    canvas.width = Math.round(rect.width * ratio);
    canvas.height = Math.round(rect.height * ratio);
    const ctx = canvas.getContext('2d');
    ctx.scale(ratio, ratio);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = '#292927';
    baseWidth = Math.max(5, rect.width * .055);
    ctx.lineWidth = baseWidth;
  };
  requestAnimationFrame(resize);

  let drawing = false;
  let currentStroke = null;
  let gradeTimer;
  const cell = canvas.parentElement;

  const clearGrade = () => {
    clearTimeout(gradeTimer);
    cell.classList.remove('grade-good', 'grade-order', 'grade-direction', 'grade-retry');
    cell.querySelector('.grade-badge')?.remove();
  };
  const point = event => {
    const rect = canvas.getBoundingClientRect();
    return [event.clientX - rect.left, event.clientY - rect.top];
  };
  canvas.addEventListener('pointerdown', event => {
    if (penOnlyToggle.checked && event.pointerType === 'touch') return;
    event.preventDefault();
    clearGrade();
    drawing = true;
    canvas.setPointerCapture(event.pointerId);
    const ctx = canvas.getContext('2d');
    const [x, y] = point(event);
    const rect = canvas.getBoundingClientRect();
    currentStroke = [[x / rect.width, y / rect.height]];
    ctx.beginPath();
    ctx.lineWidth = event.pointerType === 'pen' ? baseWidth * (.45 + event.pressure * .95) : baseWidth;
    ctx.moveTo(x, y);
    ctx.lineTo(x + .01, y + .01);
    ctx.stroke();
  });
  canvas.addEventListener('pointermove', event => {
    if (!drawing) return;
    event.preventDefault();
    const [x, y] = point(event);
    const rect = canvas.getBoundingClientRect();
    currentStroke?.push([x / rect.width, y / rect.height]);
    const ctx = canvas.getContext('2d');
    if (event.pointerType === 'pen') ctx.lineWidth = baseWidth * (.45 + event.pressure * .95);
    ctx.lineTo(x, y);
    ctx.stroke();
  });
  canvas.addEventListener('pointerup', () => {
    if (!drawing) return;
    drawing = false;
    if (currentStroke?.length === 1) currentStroke.push(currentStroke[0]);
    if (currentStroke) canvas.__strokes.push(currentStroke);
    currentStroke = null;
    gradeTimer = setTimeout(() => gradeCanvas(canvas), 850);
  });
  canvas.addEventListener('pointercancel', () => { drawing = false; currentStroke = null; });
}

function dilate(mask, size, radius) {
  const result = new Uint8Array(mask.length);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      if (!mask[y * size + x]) continue;
      for (let dy = -radius; dy <= radius; dy++) {
        for (let dx = -radius; dx <= radius; dx++) {
          if (dx * dx + dy * dy > radius * radius) continue;
          const nx = x + dx;
          const ny = y + dy;
          if (nx >= 0 && nx < size && ny >= 0 && ny < size) result[ny * size + nx] = 1;
        }
      }
    }
  }
  return result;
}

function maskSimilarity(a, b, size) {
  const aWide = dilate(a, size, 5);
  const bWide = dilate(b, size, 5);
  let aPixels = 0, bPixels = 0, aHits = 0, bHits = 0;
  for (let i = 0; i < a.length; i++) {
    if (a[i]) { aPixels++; if (bWide[i]) aHits++; }
    if (b[i]) { bPixels++; if (aWide[i]) bHits++; }
  }
  if (!aPixels || !bPixels) return 0;
  return (aHits / aPixels) * .55 + (bHits / bPixels) * .45;
}

function permutations(values) {
  if (values.length < 2) return [values];
  const result = [];
  values.forEach((value, index) => {
    const rest = values.filter((_, itemIndex) => itemIndex !== index);
    permutations(rest).forEach(permutation => result.push([value, ...permutation]));
  });
  return result;
}

function resampleUserStroke(points, count = 14) {
  const lengths = [0];
  for (let i = 1; i < points.length; i++) {
    lengths.push(lengths[i - 1] + Math.hypot(points[i][0] - points[i - 1][0], points[i][1] - points[i - 1][1]));
  }
  const total = lengths[lengths.length - 1] || 1;
  return Array.from({ length: count }, (_, sampleIndex) => {
    const target = total * sampleIndex / (count - 1);
    let segment = 1;
    while (segment < lengths.length - 1 && lengths[segment] < target) segment++;
    const startLength = lengths[segment - 1] || 0;
    const segmentLength = (lengths[segment] || total) - startLength || 1;
    const ratio = (target - startLength) / segmentLength;
    const start = points[segment - 1] || points[0];
    const end = points[segment] || start;
    return [start[0] + (end[0] - start[0]) * ratio, start[1] + (end[1] - start[1]) * ratio];
  });
}

function sampleReferencePath(data, size, count = 14) {
  const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  path.setAttribute('d', data);
  const total = path.getTotalLength();
  return Array.from({ length: count }, (_, index) => {
    const point = path.getPointAtLength(total * index / (count - 1));
    const scale = (size - 8) / 109;
    return [(4 + point.x * scale) / size, (4 + point.y * scale) / size];
  });
}

function trajectoryError(user, reference) {
  return user.reduce((sum, point, index) => sum + Math.hypot(point[0] - reference[index][0], point[1] - reference[index][1]), 0) / user.length;
}

function checkStrokeSequence(strokes, paths, size) {
  if (strokes.length !== paths.length) return { order: false, direction: false };
  const makeMask = draw => {
    const layer = document.createElement('canvas');
    layer.width = layer.height = size;
    const context = layer.getContext('2d');
    context.strokeStyle = '#000';
    context.lineWidth = 6;
    context.lineCap = 'round';
    context.lineJoin = 'round';
    draw(context);
    const pixels = context.getImageData(0, 0, size, size).data;
    const mask = new Uint8Array(size * size);
    for (let i = 0; i < mask.length; i++) mask[i] = pixels[i * 4 + 3] > 35 ? 1 : 0;
    return mask;
  };
  const userMasks = strokes.map(stroke => makeMask(context => {
    context.beginPath();
    stroke.forEach(([x, y], index) => index ? context.lineTo(x * size, y * size) : context.moveTo(x * size, y * size));
    context.stroke();
  }));
  const scale = (size - 8) / 109;
  const referenceMasks = paths.map(path => makeMask(context => {
    context.setTransform(scale, 0, 0, scale, 4, 4);
    context.lineWidth = 4;
    context.stroke(new Path2D(path));
  }));
  const matrix = userMasks.map(user => referenceMasks.map(reference => maskSimilarity(user, reference, size)));
  const direct = matrix.reduce((sum, row, index) => sum + row[index], 0);
  const variants = permutations(paths.map((_, index) => index));
  const best = Math.max(...variants.map(order => order.reduce((sum, referenceIndex, userIndex) => sum + matrix[userIndex][referenceIndex], 0)));
  const everyStrokeMatches = matrix.every((row, index) => row[index] >= .28 && row[index] === Math.max(...row));
  const order = everyStrokeMatches && direct / Math.max(best, .001) >= .82;
  if (!order) return { order: false, direction: false };

  const direction = strokes.every((stroke, index) => {
    const user = resampleUserStroke(stroke);
    const reference = sampleReferencePath(paths[index], size);
    const forwardError = trajectoryError(user, reference);
    const reverseError = trajectoryError(user, [...reference].reverse());
    return forwardError <= reverseError * .94;
  });
  return { order: true, direction };
}

function gradeCanvas(canvas) {
  if (!canvas.isConnected) return;
  const size = 96;
  const userCanvas = document.createElement('canvas');
  const refCanvas = document.createElement('canvas');
  userCanvas.width = userCanvas.height = refCanvas.width = refCanvas.height = size;
  userCanvas.getContext('2d').drawImage(canvas, 0, 0, size, size);

  const paths = window.kanaGuidePaths?.[selected[0]];
  if (!paths?.length) return;
  const refContext = refCanvas.getContext('2d');
  const scale = (size - 8) / 109;
  refContext.setTransform(scale, 0, 0, scale, 4, 4);
  refContext.strokeStyle = '#de5c43';
  refContext.lineWidth = 4;
  refContext.lineCap = 'round';
  refContext.lineJoin = 'round';
  paths.forEach(path => refContext.stroke(new Path2D(path)));
  refContext.resetTransform();

  const toMask = context => {
    const pixels = context.getImageData(0, 0, size, size).data;
    const mask = new Uint8Array(size * size);
    for (let i = 0; i < mask.length; i++) mask[i] = pixels[i * 4 + 3] > 35 ? 1 : 0;
    return mask;
  };
  const user = toMask(userCanvas.getContext('2d'));
  const target = toMask(refCanvas.getContext('2d'));
  // A small tolerance compensates for pen width without hiding an inaccurate shape.
  const userWide = dilate(user, size, 3);
  const targetWide = dilate(target, size, 4);
  let userPixels = 0, targetPixels = 0, userHits = 0, targetHits = 0;
  for (let i = 0; i < user.length; i++) {
    if (user[i]) { userPixels++; if (targetWide[i]) userHits++; }
    if (target[i]) { targetPixels++; if (userWide[i]) targetHits++; }
  }
  if (userPixels < 35) return;
  const precision = userHits / userPixels;
  const coverage = targetHits / targetPixels;
  const rawScore = precision * .58 + coverage * .42;
  const good = precision > .68 && coverage > .55 && rawScore > .65;
  const almostExact = precision >= .985 && coverage >= .985;
  const displayScore = almostExact
    ? 100
    : Math.min(99, Math.round(Math.pow(rawScore, 1.45) * 100));
  const sequence = checkStrokeSequence(canvas.__strokes || [], paths, size);
  const result = !good ? 'retry' : !sequence.order ? 'order' : !sequence.direction ? 'direction' : 'good';
  showGrade(canvas.parentElement, result, displayScore);
}

function showGrade(cell, result, score) {
  cell.classList.add(`grade-${result}`);
  const badge = document.createElement('span');
  badge.className = 'grade-badge';
  badge.textContent = result === 'good'
    ? `Good · ${score}%`
    : result === 'order'
      ? `Good shape, wrong order · ${score}%`
      : result === 'direction'
        ? `Wrong stroke direction · ${score}%`
      : `Try again · ${score}%`;
  cell.append(badge);
  if (testActive) handleTestResult(result);
}

function renderProgress() {
  const completed = KanaProgress.progressCount(mastery, allKanaCharacters);
  document.querySelector('#kanaProgressText').textContent = `${completed} of ${allKanaCharacters.length}`;
  document.querySelector('#kanaProgressBar').style.width = `${completed / allKanaCharacters.length * 100}%`;
  document.querySelector('.kana-progress-track').setAttribute('aria-valuenow', completed);
  document.querySelectorAll('.kana-button').forEach(button => button.classList.toggle('mastered', Boolean(mastery[button.textContent]?.passed)));
}

function handleTestResult(result) {
  if (result !== 'good') {
    const canvas = document.querySelector('.test-cell canvas');
    if (canvas) canvas.style.pointerEvents = 'none';
    setTimeout(() => {
      testLayerIndex = KanaProgress.previousTestLayer(testLayerIndex);
      updateLesson();
    }, 1100);
    return;
  }
  const canvas = document.querySelector('.test-cell canvas');
  if (canvas) canvas.style.pointerEvents = 'none';
  setTimeout(() => {
    if (testLayerIndex < TEST_LAYERS.length - 1) {
      testLayerIndex += 1;
      updateLesson();
      return;
    }
    saveMastery(KanaProgress.markMastered(mastery, selected[0]));
    testIndex += 1;
    testLayerIndex = 0;
    if (testIndex >= testQueue.length) {
      stopKanaTest('Test complete');
      return;
    }
    selected = testQueue[testIndex];
    updateLesson();
  }, 900);
}

function startKanaTest() {
  testActive = true;
  testIndex = 0;
  testLayerIndex = 0;
  testQueue = KanaProgress.shuffled(kana[script]);
  selected = testQueue[0];
  if (guideControl) guideControl.hidden = true;
  document.querySelector('#startKanaTest').textContent = 'End test';
  document.querySelector('.practice-card').classList.add('test-active');
  updateLesson();
}

function stopKanaTest(message = 'Start test') {
  testActive = false;
  testQueue = [];
  testLayerIndex = 0;
  selected = kana[script][0];
  if (guideControl) guideControl.hidden = false;
  document.querySelector('#startKanaTest').textContent = message;
  document.querySelector('.practice-card').classList.remove('test-active');
  updateLesson();
  if (message !== 'Start test') setTimeout(() => { document.querySelector('#startKanaTest').textContent = 'Start test'; }, 1400);
}

function renderPicker() {
  picker.innerHTML = '';
  kana[script].forEach(item => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = `kana-button${item[0] === selected[0] ? ' active' : ''}`;
    if (mastery[item[0]]?.passed) button.classList.add('mastered');
    button.textContent = item[0];
    button.title = item[1];
    button.setAttribute('aria-label', `${item[0]} — ${item[1]}`);
    button.addEventListener('click', () => {
      selected = item;
      updateLesson();
    });
    picker.append(button);
  });
}

function updateLesson() {
  document.querySelector('#referenceKana').textContent = testActive ? '?' : selected[0];
  document.querySelector('#referenceRomanji').textContent = selected[1];
  document.querySelector('.reference-hint').textContent = testActive
    ? `Test ${testIndex + 1} of ${testQueue.length}, layer ${testLayerIndex + 1} of ${TEST_LAYERS.length}: write “${selected[1]}” with the ${TEST_LAYERS[testLayerIndex].label}`
    : 'Repeat the character in each cell';
  renderPicker();
  makeSheet();
}

document.querySelectorAll('.script-button').forEach(button => {
  button.addEventListener('click', () => {
    if (testActive) stopKanaTest();
    script = button.dataset.script;
    selected = kana[script][0];
    document.querySelectorAll('.script-button').forEach(item => item.classList.toggle('active', item === button));
    updateLesson();
  });
});

document.querySelector('#startKanaTest').addEventListener('click', () => testActive ? stopKanaTest() : startKanaTest());

document.querySelectorAll('[data-reset-script]').forEach(button => {
  button.addEventListener('click', () => {
    const targetScript = button.dataset.resetScript;
    const label = targetScript === 'hiragana' ? 'Hiragana' : 'Katakana';
    if (!window.confirm(`Reset all ${label} learning progress? This cannot be undone.`)) return;
    if (testActive) stopKanaTest();
    const characters = kana[targetScript].map(item => item[0]);
    saveMastery(KanaProgress.resetMastery(mastery, characters));
    button.closest('details')?.removeAttribute('open');
  });
});

ghostToggle.addEventListener('change', () => {
  document.querySelectorAll('.ghost').forEach(ghost => { ghost.hidden = !ghostToggle.checked; });
});

penOnlyToggle.addEventListener('change', () => {
  document.querySelector('.tablet-tip').firstChild.textContent = penOnlyToggle.checked
    ? ' Stylus mode is active; palm touches are ignored. '
    : ' Finger drawing is enabled. ';
});

document.querySelector('#clearButton').addEventListener('click', () => {
  document.querySelectorAll('canvas').forEach(canvas => {
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    canvas.__strokes = [];
  });
  document.querySelectorAll('.cell').forEach(cell => {
    cell.classList.remove('grade-good', 'grade-order', 'grade-direction', 'grade-retry');
    cell.querySelector('.grade-badge')?.remove();
  });
});

window.addEventListener('resize', () => {
  clearTimeout(window.__resizeTimer);
  window.__resizeTimer = setTimeout(makeSheet, 150);
});

updateLesson();
renderProgress();
ProgressSync.initialize({
  getLocalProgress: () => ({ kanaMastery: mastery }),
  applyRemoteProgress: remote => saveMastery(KanaProgress.mergeMastery(mastery, remote.kanaMastery || {}))
});

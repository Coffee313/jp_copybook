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

const advancedKana = {
  hiragana: [
    ['が','ga'],['ぎ','gi'],['ぐ','gu'],['げ','ge'],['ご','go'],
    ['ざ','za'],['じ','ji'],['ず','zu'],['ぜ','ze'],['ぞ','zo'],
    ['だ','da'],['ぢ','ji'],['づ','zu'],['で','de'],['ど','do'],
    ['ば','ba'],['び','bi'],['ぶ','bu'],['べ','be'],['ぼ','bo'],
    ['ぱ','pa'],['ぴ','pi'],['ぷ','pu'],['ぺ','pe'],['ぽ','po']
  ],
  katakana: [
    ['ガ','ga'],['ギ','gi'],['グ','gu'],['ゲ','ge'],['ゴ','go'],
    ['ザ','za'],['ジ','ji'],['ズ','zu'],['ゼ','ze'],['ゾ','zo'],
    ['ダ','da'],['ヂ','ji'],['ヅ','zu'],['デ','de'],['ド','do'],
    ['バ','ba'],['ビ','bi'],['ブ','bu'],['ベ','be'],['ボ','bo'],
    ['パ','pa'],['ピ','pi'],['プ','pu'],['ペ','pe'],['ポ','po']
  ]
};
Object.entries(advancedKana).forEach(([name, items]) => kana[name].push(...items));

const voicedBases = {
  'が':'か','ぎ':'き','ぐ':'く','げ':'け','ご':'こ','ざ':'さ','じ':'し','ず':'す','ぜ':'せ','ぞ':'そ','だ':'た','ぢ':'ち','づ':'つ','で':'て','ど':'と','ば':'は','び':'ひ','ぶ':'ふ','べ':'へ','ぼ':'ほ','ぱ':'は','ぴ':'ひ','ぷ':'ふ','ぺ':'へ','ぽ':'ほ',
  'ガ':'カ','ギ':'キ','グ':'ク','ゲ':'ケ','ゴ':'コ','ザ':'サ','ジ':'シ','ズ':'ス','ゼ':'セ','ゾ':'ソ','ダ':'タ','ヂ':'チ','ヅ':'ツ','デ':'テ','ド':'ト','バ':'ハ','ビ':'ヒ','ブ':'フ','ベ':'ヘ','ボ':'ホ','パ':'ハ','ピ':'ヒ','プ':'フ','ペ':'ヘ','ポ':'ホ'
};
const handakutenKana = new Set(['ぱ','ぴ','ぷ','ぺ','ぽ','パ','ピ','プ','ペ','ポ']);
const dakutenPaths = ['M 78 12 Q 83 17 87 24', 'M 89 9 Q 94 14 98 21'];
const handakutenPaths = ['M 82 12 C 94 8 102 19 97 29 C 92 39 77 35 77 24 C 77 18 79 14 82 12'];
Object.entries(voicedBases).forEach(([character, base]) => {
  const paths = window.kanaGuidePaths?.[base];
  if (paths) window.kanaGuidePaths[character] = [...paths, ...(handakutenKana.has(character) ? handakutenPaths : dakutenPaths)];
});

const curriculumDefinitions = {
  hiragana: [
    ['vowels','Vowels','あいうえお'],['k','K row','かきくけこ'],['s','S row','さしすせそ'],['t','T row','たちつてと'],['n','N row','なにぬねの'],['h','H row','はひふへほ'],['m','M row','まみむめも'],['y','Y row','やゆよ'],['r','R row','らりるれろ'],['w','W row','わをん'],
    ['g','G row · dakuten','がぎぐげご',true],['z','Z row · dakuten','ざじずぜぞ',true],['d','D row · dakuten','だぢづでど',true],['b','B row · dakuten','ばびぶべぼ',true],['p','P row · handakuten','ぱぴぷぺぽ',true]
  ],
  katakana: [
    ['vowels','Vowels','アイウエオ'],['k','K row','カキクケコ'],['s','S row','サシスセソ'],['t','T row','タチツテト'],['n','N row','ナニヌネノ'],['h','H row','ハヒフヘホ'],['m','M row','マミムメモ'],['y','Y row','ヤユヨ'],['r','R row','ラリルレロ'],['w','W row','ワヲン'],
    ['g','G row · dakuten','ガギグゲゴ',true],['z','Z row · dakuten','ザジズゼゾ',true],['d','D row · dakuten','ダヂヅデド',true],['b','B row · dakuten','バビブベボ',true],['p','P row · handakuten','パピプペポ',true]
  ]
};
const ADVANCED_UNLOCK_COUNT = 33;

let script = 'hiragana';
let selected = kana.hiragana[0];
const sheet = document.querySelector('#sheet');
const picker = document.querySelector('#kanaPicker');
const ghostToggle = document.querySelector('#ghostToggle');
const guideControl = document.querySelector('#guideControl');
const penOnlyToggle = document.querySelector('#penOnlyToggle');
const MASTERY_KEY = 'kana-mastery-v1';
const LEARNED_KEY = 'kana-learned-v1';
const MASTERY_RESETS_KEY = 'kana-mastery-resets-v1';
const INPUT_MODE_COOKIE = 'kana-input-mode';
const PLACEMENT_KEY = 'kana-placement-v1';
const MOBILE_MODE_KEY = 'japanese-copybook-mobile-version-v1';
const MOBILE_SUGGESTION_SESSION_KEY = 'japanese-copybook-mobile-suggestion-dismissed-v2';
const MOBILE_SCREEN_QUERY = '(max-width: 760px), (max-height: 600px) and (pointer: coarse)';
const MOBILE_PRACTICE_KEY = 'kana-mobile-practice-v1';
const MOBILE_PRACTICE_TARGET = 14;
const allKanaCharacters = [...kana.hiragana, ...kana.katakana].map(item => item[0]);
let mastery = readMastery();
let learned = readLearned();
let masteryResets = readMasteryResets();
let placement = readPlacement();
let mobilePractice = readMobilePractice();
let testActive = false;
let testQueue = [];
let testIndex = 0;
let testLayerIndex = 0;
let currentTestHadError = false;
let selfTestActive = false;
let knownKanaTestActive = false;
let copybookMode = false;
let mobileMode = false;
let mobilePracticeRecoveryActive = false;
let mobilePracticeLayerIndex = 0;
let mobilePracticeRecoveryCharacter = '';
let placementActive = false;
let placementSelectedLevel = '';
let placementCorrect = new Set();
let progressReady = Promise.resolve();

const PLACEMENT_SAMPLE_INDICES = {
  intermediate: {
    hiragana: [0, 6, 12, 18],
    katakana: [1, 7, 13, 19]
  },
  master: {
    hiragana: [0, 6, 12, 18, 24, 27, 32, 39, 46, 66],
    katakana: [1, 7, 13, 19, 52, 67]
  }
};

const TEST_LAYERS = [
  { key: 'order', label: 'stroke order and directions' },
  { key: 'example', label: 'background example' },
  { key: 'blank', label: 'blank background' }
];

let vectorMarkerId = 0;
let activeDrawingCanvas = null;

function lockDrawingViewport(canvas) {
  activeDrawingCanvas = canvas;
  if (!document.documentElement.classList.contains('apple-fullscreen-ui') || !document.body.classList.contains('concentration-mode')) return;
  document.documentElement.classList.add('drawing-active');
  document.body.classList.add('drawing-active');
}

function unlockDrawingViewport(canvas) {
  if (activeDrawingCanvas === canvas) activeDrawingCanvas = null;
  document.documentElement.classList.remove('drawing-active');
  document.body.classList.remove('drawing-active');
  if (window.__drawingResizePending) {
    window.__drawingResizePending = false;
    clearTimeout(window.__resizeTimer);
    window.__resizeTimer = setTimeout(() => makeSheet(true), 0);
  }
}

const preventDrawingGesture = event => {
  if (activeDrawingCanvas && event.cancelable) event.preventDefault();
};
document.addEventListener('touchmove', preventDrawingGesture, { capture: true, passive: false });
document.addEventListener('gesturestart', preventDrawingGesture, { capture: true, passive: false });
document.addEventListener('gesturechange', preventDrawingGesture, { capture: true, passive: false });
document.addEventListener('gestureend', preventDrawingGesture, { capture: true, passive: false });

function readMastery() {
  try { return JSON.parse(localStorage.getItem(MASTERY_KEY)) || {}; }
  catch { return {}; }
}

function readLearned() {
  try { return JSON.parse(localStorage.getItem(LEARNED_KEY)) || {}; }
  catch { return {}; }
}

function readMasteryResets() {
  try { return JSON.parse(localStorage.getItem(MASTERY_RESETS_KEY)) || {}; }
  catch { return {}; }
}

function readPlacement() {
  try { return JSON.parse(localStorage.getItem(PLACEMENT_KEY)) || null; }
  catch { return null; }
}

function readMobilePractice() {
  try { return JSON.parse(localStorage.getItem(MOBILE_PRACTICE_KEY)) || {}; }
  catch { return {}; }
}

function saveMobilePractice(value) {
  mobilePractice = value;
  localStorage.setItem(MOBILE_PRACTICE_KEY, JSON.stringify(mobilePractice));
}

function savePlacement(value) {
  placement = value;
  localStorage.setItem(PLACEMENT_KEY, JSON.stringify(placement));
  window.ProgressSync?.queueSave();
}

function saveMasteryResets(value) {
  masteryResets = value;
  localStorage.setItem(MASTERY_RESETS_KEY, JSON.stringify(masteryResets));
}

function kanaScripts() {
  return Object.fromEntries(Object.entries(kana).map(([name, items]) => [name, items.map(item => item[0])]));
}

function saveMastery(value) {
  mastery = value;
  localStorage.setItem(MASTERY_KEY, JSON.stringify(mastery));
  renderProgress();
  window.ProgressSync?.queueSave();
}

function saveLearned(value) {
  learned = value;
  localStorage.setItem(LEARNED_KEY, JSON.stringify(learned));
  renderProgress();
  window.ProgressSync?.queueSave();
}

function rowItems(row, scriptName = script) {
  const byCharacter = new Map(kana[scriptName].map(item => [item[0], item]));
  return Array.from(row[2]).map(character => byCharacter.get(character)).filter(Boolean);
}

function basicCharacters(scriptName = script) {
  return curriculumDefinitions[scriptName].filter(row => !row[3]).flatMap(row => Array.from(row[2]));
}

function advancedRowsUnlocked(scriptName = script) {
  return KanaProgress.progressCount(mastery, basicCharacters(scriptName)) >= ADVANCED_UNLOCK_COUNT;
}

function availableRows(scriptName = script) {
  return curriculumDefinitions[scriptName].filter(row => !row[3] || advancedRowsUnlocked(scriptName));
}

function characterIsLearned(character) {
  return Boolean(learned[character]?.learned || mastery[character]?.passed);
}

function currentLearningRow(scriptName = script) {
  return availableRows(scriptName).find(row => rowItems(row, scriptName).some(item => !characterIsLearned(item[0]))) || null;
}

function currentFastTrackRow(scriptName = script) {
  return currentLearningRow(scriptName)
    || availableRows(scriptName).find(row => rowItems(row, scriptName).some(item => !mastery[item[0]]?.passed))
    || null;
}

function nextLearningItem(scriptName = script) {
  const row = currentLearningRow(scriptName);
  if (row) return rowItems(row, scriptName).find(item => !characterIsLearned(item[0]));
  return pendingTestKana(scriptName)[0] || rowItems(curriculumDefinitions[scriptName][0], scriptName)[0];
}

function canFastTrackKana() {
  return Boolean(placement);
}

function pendingTestKana(scriptName = script) {
  return KanaProgress.pendingTestItems(kana[scriptName], learned, mastery);
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
  diagram.setAttribute('aria-label', `${selected[0]}, stroke count: ${strokeCounts[selected[0]] || window.kanaGuidePaths?.[selected[0]]?.length || 0}`);
  diagram.append(makeVectorKana(selected[0], true));
  return diagram;
}

function makeTestGuide(layerIndex = testLayerIndex) {
  const layer = TEST_LAYERS[layerIndex];
  if (!layer || layer.key !== 'order') return null;
  const guide = document.createElement('div');
  guide.className = `test-guide test-guide-${layer.key}`;
  guide.setAttribute('aria-hidden', 'true');
  guide.append(makeVectorKana(selected[0], true, true));
  return guide;
}

function makeVectorKana(character, numbered = false, directional = false) {
  const namespace = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(namespace, 'svg');
  svg.setAttribute('viewBox', '0 0 109 109');
  svg.setAttribute('aria-hidden', 'true');
  let markerId = '';
  if (directional) {
    markerId = `kana-direction-${vectorMarkerId++}`;
    const defs = document.createElementNS(namespace, 'defs');
    const marker = document.createElementNS(namespace, 'marker');
    marker.setAttribute('id', markerId);
    marker.setAttribute('viewBox', '0 0 10 10');
    marker.setAttribute('refX', '8');
    marker.setAttribute('refY', '5');
    marker.setAttribute('markerWidth', '2');
    marker.setAttribute('markerHeight', '2');
    marker.setAttribute('orient', 'auto');
    const arrow = document.createElementNS(namespace, 'path');
    arrow.setAttribute('class', 'direction-arrow');
    arrow.setAttribute('d', 'M 0 0 L 10 5 L 0 10 z');
    marker.append(arrow);
    defs.append(marker);
    svg.append(defs);
  }
  (window.kanaGuidePaths?.[character] || []).forEach((data, index) => {
    const path = document.createElementNS(namespace, 'path');
    path.setAttribute('d', data);
    if (directional) path.setAttribute('marker-end', `url(#${markerId})`);
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

function captureSheetState() {
  return [...sheet.querySelectorAll('canvas')].map(canvas => {
    const cell = canvas.parentElement;
    const grade = ['good', 'order', 'direction', 'retry'].find(value => cell.classList.contains(`grade-${value}`));
    return {
      strokes: canvas.__autoClearPending ? [] : (canvas.__strokes || []).map(stroke => stroke.map(point => [...point])),
      grade,
      badge: cell.querySelector('.grade-badge')?.textContent || ''
    };
  });
}

function makeSheet(preserve = false) {
  const savedStates = preserve ? captureSheetState() : [];
  sheet.innerHTML = '';
  const cellCount = testActive || mobileMode ? 1 : 15;
  const recoveryActive = mobileMode && !testActive && mobilePracticeRecoveryActive;
  const activeLayerIndex = testActive ? testLayerIndex : mobilePracticeLayerIndex;
  const testLayer = testActive || recoveryActive ? TEST_LAYERS[activeLayerIndex] : null;
  let canvasIndex = 0;
  for (let i = 0; i < cellCount; i++) {
    const cell = document.createElement('div');
    cell.className = `cell${!testActive && !mobileMode && i === 0 ? ' stroke-cell' : ''}${!testActive && mobileMode ? ' mobile-practice-cell' : ''}${recoveryActive ? ` mobile-recovery-cell test-cell-${testLayer?.key || 'blank'}` : ''}${testActive ? ` test-cell test-cell-${testLayer?.key || 'blank'}` : ''}`;
    if (!testActive && !mobileMode && i === 0) {
      cell.append(makeStrokeDiagram());
      sheet.append(cell);
      continue;
    }
    if (testActive || recoveryActive) {
      const guide = makeTestGuide(activeLayerIndex);
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
    const savedState = savedStates[canvasIndex++];
    if (savedState?.grade) {
      cell.classList.add(`grade-${savedState.grade}`);
      const badge = document.createElement('span');
      badge.className = 'grade-badge';
      badge.textContent = savedState.badge;
      cell.append(badge);
      if (testActive && savedState.grade === 'good') revealTestComparison(cell);
    }
    setupCanvas(canvas, savedState);
  }
}

function setupCanvas(canvas, savedState = null) {
  let baseWidth = 2.5;
  canvas.__strokes = savedState?.strokes || [];
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
    baseWidth = Math.max(2.5, rect.width * .03);
    ctx.lineWidth = baseWidth;
    canvas.__strokes.forEach(stroke => {
      ctx.beginPath();
      stroke.forEach(([x, y], index) => index ? ctx.lineTo(x * rect.width, y * rect.height) : ctx.moveTo(x * rect.width, y * rect.height));
      ctx.stroke();
    });
  };
  requestAnimationFrame(resize);

  let drawing = false;
  let currentStroke = null;
  let drawingRect = null;
  let gradeTimer;
  const cell = canvas.parentElement;

  const clearGrade = () => {
    clearTimeout(gradeTimer);
    cell.classList.remove('grade-good', 'grade-order', 'grade-direction', 'grade-retry');
    cell.querySelector('.grade-badge')?.remove();
  };
  const point = event => {
    const rect = drawingRect || canvas.getBoundingClientRect();
    return [event.clientX - rect.left, event.clientY - rect.top];
  };
  const preventCanvasGesture = event => {
    if (event.cancelable) event.preventDefault();
  };
  canvas.addEventListener('touchstart', preventCanvasGesture, { capture: true, passive: false });
  canvas.addEventListener('touchmove', preventCanvasGesture, { capture: true, passive: false });
  canvas.addEventListener('touchend', preventCanvasGesture, { capture: true, passive: false });
  canvas.addEventListener('gesturestart', preventCanvasGesture, { capture: true, passive: false });
  canvas.addEventListener('gesturechange', preventCanvasGesture, { capture: true, passive: false });
  canvas.addEventListener('pointerdown', event => {
    if (penOnlyToggle.checked && event.pointerType === 'touch') return;
    event.preventDefault();
    clearGrade();
    drawing = true;
    drawingRect = canvas.getBoundingClientRect();
    lockDrawingViewport(canvas);
    try { canvas.setPointerCapture(event.pointerId); }
    catch { /* Older Safari versions can reject capture for Apple Pencil events. */ }
    const ctx = canvas.getContext('2d');
    const [x, y] = point(event);
    const rect = drawingRect;
    currentStroke = [[x / rect.width, y / rect.height]];
    ctx.beginPath();
    ctx.lineWidth = event.pointerType === 'pen' ? baseWidth * (.7 + event.pressure * .55) : baseWidth;
    ctx.moveTo(x, y);
    ctx.lineTo(x + .01, y + .01);
    ctx.stroke();
  });
  canvas.addEventListener('pointermove', event => {
    if (!drawing) return;
    event.preventDefault();
    const [x, y] = point(event);
    const rect = drawingRect;
    currentStroke?.push([x / rect.width, y / rect.height]);
    const ctx = canvas.getContext('2d');
    if (event.pointerType === 'pen') ctx.lineWidth = baseWidth * (.7 + event.pressure * .55);
    ctx.lineTo(x, y);
    ctx.stroke();
  });
  canvas.addEventListener('pointerup', event => {
    if (!drawing) return;
    drawing = false;
    if (currentStroke?.length === 1) currentStroke.push(currentStroke[0]);
    if (currentStroke) canvas.__strokes.push(currentStroke);
    currentStroke = null;
    drawingRect = null;
    try { canvas.releasePointerCapture(event.pointerId); }
    catch { /* Capture may already have been released by Safari. */ }
    unlockDrawingViewport(canvas);
    gradeTimer = setTimeout(() => gradeCanvas(canvas), 1400);
  });
  canvas.addEventListener('pointercancel', () => {
    drawing = false;
    currentStroke = null;
    drawingRect = null;
    unlockDrawingViewport(canvas);
  });
  if (canvas.__strokes.length && !savedState?.grade) gradeTimer = setTimeout(() => gradeCanvas(canvas), 1400);
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
      : `Shape needs work · ${score}%`;
  cell.append(badge);
  if (testActive && result === 'good') revealTestComparison(cell);
  if (!testActive && result !== 'good' && (!mobileMode || copybookMode)) {
    const canvas = cell.querySelector('canvas');
    if (canvas) {
      canvas.__autoClearPending = true;
      canvas.style.pointerEvents = 'none';
      setTimeout(() => {
        if (!canvas.isConnected) return;
        canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);
        canvas.__strokes = [];
        canvas.__autoClearPending = false;
        canvas.style.pointerEvents = '';
      }, 900);
    }
  }
  if (testActive) handleTestResult(result);
  else if (!copybookMode && mobileMode) handleMobilePracticeResult(result, cell);
  else if (result === 'good' && !copybookMode) recordLearningSuccess();
}

function revealTestComparison(cell) {
  let ghost = cell.querySelector('.ghost');
  if (!ghost) {
    ghost = document.createElement('span');
    ghost.className = 'ghost';
    ghost.append(makeVectorKana(selected[0]));
    cell.insertBefore(ghost, cell.querySelector('canvas'));
  }
  ghost.hidden = false;
  ghost.classList.add('test-result-ghost');
}

function recordLearningSuccess() {
  const character = selected[0];
  if (characterIsLearned(character)) return;
  const practiceCells = [...document.querySelectorAll('.cell:not(.stroke-cell)')];
  const results = practiceCells.map(cell => cell.classList.contains('grade-good') ? 'good' : 'pending');
  if (!KanaProgress.allPracticeCellsGood(results)) return;
  const activeRow = currentLearningRow();
  if (!activeRow || !rowItems(activeRow).some(item => item[0] === character)) return;
  saveLearned(KanaProgress.markLearned(learned, character));
  if (scheduleCompletedRowTest(activeRow, character, 1000)) return;
  const nextInRow = rowItems(activeRow).find(item => !characterIsLearned(item[0]));
  const nextRow = currentLearningRow();
  const nextItem = nextInRow || (nextRow ? rowItems(nextRow)[0] : null);
  if (!nextItem) return;
  setTimeout(() => {
    if (testActive || selected[0] !== character || characterIsLearned(nextItem[0])) return;
    const learningRow = currentLearningRow();
    if (!learningRow || !rowItems(learningRow).some(item => item[0] === nextItem[0])) return;
    selected = nextItem;
    updateLesson();
  }, 1000);
}

function scheduleCompletedRowTest(row, character, delay) {
  const candidates = KanaProgress.completedRowTestItems(rowItems(row), learned, mastery);
  if (!candidates.length) return false;
  setTimeout(() => {
    if (testActive || selected[0] !== character) return;
    startKanaTest(candidates);
  }, delay);
  return true;
}

function mobilePracticeCount(character = selected[0]) {
  if (characterIsLearned(character)) return MOBILE_PRACTICE_TARGET;
  return Math.min(MOBILE_PRACTICE_TARGET, Math.max(0, Number(mobilePractice[character]) || 0));
}

function updateMobilePracticeProgress() {
  const progress = document.querySelector('#mobilePracticeProgress');
  const visible = mobileMode && !testActive && !copybookMode;
  progress.hidden = !visible;
  if (visible) progress.textContent = `${mobilePracticeCount()} of ${MOBILE_PRACTICE_TARGET} repetitions complete`;
}

function resetMobilePracticeRecovery() {
  mobilePracticeRecoveryActive = false;
  mobilePracticeLayerIndex = 0;
  mobilePracticeRecoveryCharacter = '';
}

function handleMobilePracticeResult(result, cell) {
  const character = selected[0];
  const canvas = cell.querySelector('canvas');
  if (canvas) canvas.style.pointerEvents = 'none';
  if (!mobilePracticeRecoveryActive && result !== 'good') {
    mobilePracticeRecoveryActive = true;
    mobilePracticeLayerIndex = 0;
    mobilePracticeRecoveryCharacter = character;
    setTimeout(() => {
      if (!testActive && mobileMode && selected[0] === character) updateLesson();
    }, 900);
    return;
  }
  if (!mobilePracticeRecoveryActive) {
    recordMobilePracticeSuccess(cell);
    return;
  }
  const transition = KanaProgress.practiceRecoveryTransition(mobilePracticeLayerIndex, result, TEST_LAYERS.length);
  mobilePracticeLayerIndex = transition.layerIndex;
  if (transition.complete) {
    resetMobilePracticeRecovery();
    recordMobilePracticeSuccess(cell);
    return;
  }
  setTimeout(() => {
    if (!testActive && mobileMode && selected[0] === character) updateLesson();
  }, 900);
}

function recordMobilePracticeSuccess(cell) {
  const character = selected[0];
  const canvas = cell.querySelector('canvas');
  if (canvas) canvas.style.pointerEvents = 'none';
  if (characterIsLearned(character)) {
    setTimeout(() => { if (selected[0] === character && !testActive) makeSheet(); }, 850);
    return;
  }
  const count = KanaProgress.advancePracticeCount(mobilePracticeCount(character), MOBILE_PRACTICE_TARGET);
  saveMobilePractice({ ...mobilePractice, [character]: count });
  updateMobilePracticeProgress();
  if (count < MOBILE_PRACTICE_TARGET) {
    setTimeout(() => { if (selected[0] === character && mobileMode && !testActive) makeSheet(); }, 850);
    return;
  }
  const completedPractice = { ...mobilePractice };
  delete completedPractice[character];
  saveMobilePractice(completedPractice);
  saveLearned(KanaProgress.markLearned(learned, character));
  const completedRow = availableRows().find(row => rowItems(row).some(item => item[0] === character));
  if (completedRow && scheduleCompletedRowTest(completedRow, character, 850)) return;
  const nextItem = nextLearningItem();
  setTimeout(() => {
    if (testActive || selected[0] !== character) return;
    selected = nextItem;
    updateLesson();
  }, 850);
}

function renderProgress() {
  const completed = KanaProgress.progressCount(mastery, allKanaCharacters);
  document.querySelector('#kanaProgressText').textContent = `${completed} of ${allKanaCharacters.length}`;
  document.querySelector('#kanaProgressBar').style.width = `${completed / allKanaCharacters.length * 100}%`;
  document.querySelector('.kana-progress-track').setAttribute('aria-valuemax', allKanaCharacters.length);
  document.querySelector('.kana-progress-track').setAttribute('aria-valuenow', completed);
  document.querySelectorAll('.kana-button').forEach(button => button.classList.toggle('mastered', Boolean(mastery[button.textContent]?.passed)));
  const pending = pendingTestKana();
  const testButton = document.querySelector('#startKanaTest');
  const selfTestButton = document.querySelector('#testMyself');
  if (!testActive) {
    testButton.disabled = pending.length === 0;
    testButton.textContent = pending.length ? `Test new kanas · ${pending.length}` : 'Test new kanas';
    const masteredCount = kana[script].filter(item => mastery[item[0]]?.passed).length;
    selfTestButton.disabled = masteredCount === 0;
    selfTestButton.textContent = masteredCount ? `Test myself · ${masteredCount}` : 'Test myself';
  }
  renderLearningPath();
}

function renderLearningPath() {
  const row = currentLearningRow();
  const fastTrackRow = currentFastTrackRow();
  const rowTitle = document.querySelector('#learningRowTitle');
  const rowProgress = document.querySelector('#learningRowProgress');
  const knowButton = document.querySelector('#knowCurrentRow');
  const fastTrackEligible = canFastTrackKana();
  if (row) {
    const items = rowItems(row);
    const learnedCount = items.filter(item => characterIsLearned(item[0])).length;
    rowTitle.textContent = row[1];
    rowProgress.textContent = `${learnedCount} of ${items.length} learned · fill every copybook cell in green`;
    const remaining = items.filter(item => !mastery[item[0]]?.passed).length;
    knowButton.hidden = !fastTrackEligible || testActive;
    if (!testActive) {
      knowButton.disabled = remaining === 0;
      knowButton.textContent = 'I know these kanas';
    }
  } else if (!advancedRowsUnlocked()) {
    rowTitle.textContent = 'Dakuten rows are locked';
    rowProgress.textContent = `Master ${ADVANCED_UNLOCK_COUNT} basic kana to unlock voiced sounds.`;
    const remaining = fastTrackRow ? rowItems(fastTrackRow).filter(item => !mastery[item[0]]?.passed).length : 0;
    knowButton.hidden = !fastTrackEligible || remaining === 0 || testActive;
    knowButton.disabled = remaining === 0;
    knowButton.textContent = 'I know these kanas';
  } else {
    rowTitle.textContent = 'All rows learned';
    rowProgress.textContent = 'Complete the remaining tests to master every kana.';
    const remaining = fastTrackRow ? rowItems(fastTrackRow).filter(item => !mastery[item[0]]?.passed).length : 0;
    knowButton.hidden = !fastTrackEligible || remaining === 0 || testActive;
    knowButton.disabled = remaining === 0;
    knowButton.textContent = 'I know these kanas';
  }
  const masteredList = document.querySelector('#masteredKanaList');
  masteredList.innerHTML = '';
  const masteredItems = kana[script].filter(item => mastery[item[0]]?.passed);
  masteredItems.forEach(item => {
    const badge = document.createElement('span');
    badge.textContent = item[0];
    badge.title = item[1];
    masteredList.append(badge);
  });
  if (!masteredItems.length) masteredList.textContent = 'Pass learned-kana tests to build this list.';
}

function placementItems(level) {
  const samples = PLACEMENT_SAMPLE_INDICES[level];
  if (!samples) return [];
  const seenCharacters = new Set();
  const seenReadings = new Set();
  return Object.entries(samples)
    .flatMap(([scriptName, indices]) => indices.map(index => kana[scriptName][index]).filter(Boolean))
    .filter(item => {
      if (seenCharacters.has(item[0]) || seenReadings.has(item[1])) return false;
      seenCharacters.add(item[0]);
      seenReadings.add(item[1]);
      return true;
    });
}

function showPlacementResult(result) {
  const dialog = document.querySelector('#placementDialog');
  document.querySelector('#placementChoice').hidden = true;
  document.querySelector('#placementResult').hidden = false;
  document.querySelector('#placementResultLevel').textContent = result.assignedLevel;
  document.querySelector('#placementResultSummary').textContent = result.total
    ? `You drew ${result.correct} of ${result.total} kana correctly. Correct answers were added to Mastered kana.`
    : 'We will begin with the vowel row and build your kana step by step.';
  document.querySelector('#placementRegistration').hidden = document.querySelector('#openAccount').dataset.signedIn === 'true';
  if (!dialog.open) dialog.showModal();
}

function completeBeginnerPlacement() {
  const result = {
    selectedLevel: 'beginner',
    assignedLevel: 'Beginner',
    correct: 0,
    total: 0,
    completedAt: new Date().toISOString()
  };
  savePlacement(result);
  renderLearningPath();
  showPlacementResult(result);
}

function startPlacementTest(level) {
  const items = placementItems(level);
  if (!items.length) return;
  resetMobilePracticeRecovery();
  placementActive = true;
  placementSelectedLevel = level;
  placementCorrect = new Set();
  testActive = true;
  testIndex = 0;
  testLayerIndex = TEST_LAYERS.length - 1;
  testQueue = KanaProgress.shuffled(items);
  selected = testQueue[0];
  guideControl.hidden = true;
  document.querySelector('#placementDialog').close();
  document.querySelector('.practice-card').classList.add('test-active', 'placement-active');
  updateLesson();
}

function finishPlacementTest() {
  const correct = placementCorrect.size;
  const total = testQueue.length;
  const result = {
    selectedLevel: placementSelectedLevel,
    assignedLevel: KanaProgress.placementLevel(correct, total),
    correct,
    total,
    completedAt: new Date().toISOString()
  };
  let nextMastery = mastery;
  const completedAt = new Date(result.completedAt);
  placementCorrect.forEach(character => { nextMastery = KanaProgress.markMastered(nextMastery, character, completedAt); });
  placementActive = false;
  testActive = false;
  testQueue = [];
  testIndex = 0;
  testLayerIndex = 0;
  placementSelectedLevel = '';
  placementCorrect = new Set();
  document.querySelector('.practice-card').classList.remove('test-active', 'placement-active');
  guideControl.hidden = false;
  saveMastery(nextMastery);
  savePlacement(result);
  selected = nextLearningItem();
  updateLesson();
  renderProgress();
  showPlacementResult(result);
}

function handlePlacementResult(result) {
  const canvas = document.querySelector('.test-cell canvas');
  if (canvas) canvas.style.pointerEvents = 'none';
  if (result === 'good') placementCorrect.add(selected[0]);
  setTimeout(() => {
    testIndex += 1;
    if (testIndex >= testQueue.length) {
      finishPlacementTest();
      return;
    }
    selected = testQueue[testIndex];
    updateLesson();
  }, 900);
}

function handleTestResult(result) {
  if (placementActive) {
    handlePlacementResult(result);
    return;
  }
  if (result !== 'good') {
    if (knownKanaTestActive) {
      const canvas = document.querySelector('.test-cell canvas');
      if (canvas) canvas.style.pointerEvents = 'none';
      setTimeout(() => {
        testIndex += 1;
        testLayerIndex = TEST_LAYERS.length - 1;
        currentTestHadError = false;
        if (testIndex >= testQueue.length) {
          stopKanaTest('Knowledge check complete');
          return;
        }
        selected = testQueue[testIndex];
        updateLesson();
      }, 1100);
      return;
    }
    currentTestHadError = true;
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
    const repeatRequired = currentTestHadError;
    if (repeatRequired) testQueue.push(selected);
    else if (!selfTestActive) saveMastery(KanaProgress.markMastered(mastery, selected[0]));
    testIndex += 1;
    testLayerIndex = TEST_LAYERS.length - 1;
    currentTestHadError = false;
    if (testIndex >= testQueue.length) {
      stopKanaTest(knownKanaTestActive ? 'Knowledge check complete' : selfTestActive ? 'Self-test complete' : 'Test complete');
      return;
    }
    selected = testQueue[testIndex];
    updateLesson();
  }, 900);
}

function startKanaTest(candidates = null) {
  const pending = candidates || pendingTestKana();
  if (!pending.length) return;
  resetMobilePracticeRecovery();
  testActive = true;
  knownKanaTestActive = false;
  selfTestActive = false;
  testIndex = 0;
  testLayerIndex = TEST_LAYERS.length - 1;
  currentTestHadError = false;
  testQueue = KanaProgress.shuffled(pending);
  selected = testQueue[0];
  if (guideControl) guideControl.hidden = true;
  document.querySelector('#startKanaTest').textContent = 'End test';
  document.querySelector('#testMyself').disabled = true;
  document.querySelector('#knowCurrentRow').hidden = true;
  document.querySelector('.practice-card').classList.add('test-active');
  updateLesson();
}

function startSelfTest() {
  const mastered = kana[script].filter(item => mastery[item[0]]?.passed);
  if (!mastered.length) return;
  resetMobilePracticeRecovery();
  testActive = true;
  knownKanaTestActive = false;
  selfTestActive = true;
  testIndex = 0;
  testLayerIndex = TEST_LAYERS.length - 1;
  currentTestHadError = false;
  testQueue = KanaProgress.shuffled(mastered);
  selected = testQueue[0];
  guideControl.hidden = true;
  document.querySelector('#startKanaTest').disabled = true;
  document.querySelector('#testMyself').textContent = 'End self-test';
  document.querySelector('#knowCurrentRow').hidden = true;
  document.querySelector('.practice-card').classList.add('test-active');
  updateLesson();
}

function startKnownKanaTest() {
  const row = currentFastTrackRow();
  if (!row || !canFastTrackKana()) return;
  const candidates = rowItems(row).filter(item => !mastery[item[0]]?.passed);
  if (!candidates.length) return;
  resetMobilePracticeRecovery();
  testActive = true;
  knownKanaTestActive = true;
  selfTestActive = false;
  testIndex = 0;
  testLayerIndex = TEST_LAYERS.length - 1;
  currentTestHadError = false;
  testQueue = KanaProgress.shuffled(candidates);
  selected = testQueue[0];
  guideControl.hidden = true;
  document.querySelector('#startKanaTest').disabled = false;
  document.querySelector('#startKanaTest').textContent = 'End test';
  document.querySelector('#testMyself').disabled = true;
  const knowButton = document.querySelector('#knowCurrentRow');
  knowButton.dataset.active = 'true';
  knowButton.textContent = 'End knowledge check';
  knowButton.hidden = true;
  document.querySelector('.practice-card').classList.add('test-active');
  updateLesson();
}

function stopKanaTest(message = 'Start test') {
  testActive = false;
  selfTestActive = false;
  knownKanaTestActive = false;
  testQueue = [];
  testLayerIndex = 0;
  currentTestHadError = false;
  selected = nextLearningItem();
  if (guideControl) guideControl.hidden = false;
  document.querySelector('.practice-card').classList.remove('test-active');
  document.querySelector('#knowCurrentRow').removeAttribute('data-active');
  updateLesson();
  renderProgress();
  if (message !== 'Start test') {
    const statusButton = message === 'Knowledge check complete'
      ? document.querySelector('#knowCurrentRow')
      : document.querySelector('#startKanaTest');
    statusButton.hidden = false;
    statusButton.textContent = message;
    setTimeout(renderProgress, 1400);
  }
}

function renderPicker() {
  picker.innerHTML = '';
  const items = placementActive
    ? []
    : testActive
    ? KanaProgress.testPickerItems(kana[script], mastery, selected[0])
    : copybookMode
    ? kana[script]
    : rowItems(currentLearningRow() || curriculumDefinitions[script][0]);
  items.forEach(item => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = `kana-button${item[0] === selected[0] ? ' active' : ''}`;
    if (mastery[item[0]]?.passed) button.classList.add('mastered');
    else if (learned[item[0]]?.learned) button.classList.add('learned');
    button.textContent = item[0];
    button.title = item[1];
    button.setAttribute('aria-label', `${item[0]} — ${item[1]}`);
    button.addEventListener('click', () => {
      selected = item;
      updateLesson();
    });
    picker.append(button);
  });
  if (!items.length) {
    const empty = document.createElement('span');
    empty.className = 'picker-empty';
    empty.textContent = testActive ? 'Mastered kana will appear here.' : 'Complete learned-kana tests to unlock the next stage.';
    picker.append(empty);
  }
}

function updateConcentrationScriptIcons() {
  const hiraganaButton = document.querySelector('.concentration-script-switch [data-script="hiragana"]');
  const katakanaButton = document.querySelector('.concentration-script-switch [data-script="katakana"]');
  if (hiraganaButton) hiraganaButton.textContent = testActive && selected[0] === 'あ' ? 'ア' : 'あ';
  if (katakanaButton) katakanaButton.textContent = testActive && selected[0] === 'ア' ? 'あ' : 'ア';
}

function updateLesson() {
  if (mobilePracticeRecoveryActive && mobilePracticeRecoveryCharacter !== selected[0]) resetMobilePracticeRecovery();
  updateConcentrationScriptIcons();
  const placementScript = kana.hiragana.some(item => item[0] === selected[0]) ? 'Hiragana' : 'Katakana';
  document.querySelector('#referenceKana').textContent = testActive ? selected[1] : selected[0];
  document.querySelector('#referenceRomanji').textContent = placementActive ? `${placementScript} · ${selected[1]}` : selected[1];
  document.querySelector('.reference-hint').textContent = placementActive
    ? `Placement ${testIndex + 1} of ${testQueue.length}: write “${selected[1]}” without hints`
    : knownKanaTestActive
    ? `Knowledge check ${testIndex + 1} of ${testQueue.length}: write “${selected[1]}” without hints`
    : testActive
    ? `Test ${testIndex + 1} of ${testQueue.length}, layer ${testLayerIndex + 1} of ${TEST_LAYERS.length}: write “${selected[1]}” with the ${TEST_LAYERS[testLayerIndex].label}`
    : mobilePracticeRecoveryActive
    ? `Correction ${mobilePracticeLayerIndex + 1} of ${TEST_LAYERS.length} · ${TEST_LAYERS[mobilePracticeLayerIndex].label}`
    : copybookMode
    ? 'Choose any kana and practise freely'
    : mobileMode
    ? `${mobilePracticeCount()} of ${MOBILE_PRACTICE_TARGET} repetitions complete · draw the kana again`
    : 'Repeat the character in each cell';
  document.querySelector('#forgotKana').hidden = !testActive || TEST_LAYERS[testLayerIndex]?.key !== 'blank';
  renderPicker();
  updateMobilePracticeProgress();
  makeSheet();
}

function mobileSuggestionDismissed() {
  try { return sessionStorage.getItem(MOBILE_SUGGESTION_SESSION_KEY) === 'true'; }
  catch { return false; }
}

function dismissMobileSuggestion() {
  try { sessionStorage.setItem(MOBILE_SUGGESTION_SESSION_KEY, 'true'); }
  catch { /* The suggestion can still be hidden for this page. */ }
  document.querySelector('#mobileSuggestion').hidden = true;
  document.body.classList.remove('mobile-suggestion-open');
}

function updateMobileSuggestion() {
  const suggestion = document.querySelector('#mobileSuggestion');
  const shouldShow = !mobileMode && window.matchMedia(MOBILE_SCREEN_QUERY).matches && !mobileSuggestionDismissed();
  const opening = suggestion.hidden && shouldShow;
  suggestion.hidden = !shouldShow;
  document.body.classList.toggle('mobile-suggestion-open', shouldShow);
  if (opening) requestAnimationFrame(() => document.querySelector('#mobileSuggestionEnable').focus());
}

function setMobileMode(active, persist = true) {
  if (!active) resetMobilePracticeRecovery();
  mobileMode = active;
  document.body.classList.toggle('mobile-version', active);
  const button = document.querySelector('#mobileModeToggle');
  button.setAttribute('aria-pressed', active ? 'true' : 'false');
  const label = active ? 'Exit mobile version' : 'Mobile version';
  button.setAttribute('aria-label', window.I18n?.translate?.(label) || label);
  button.querySelector('span:last-child').textContent = label;
  if (persist) {
    localStorage.setItem(MOBILE_MODE_KEY, active ? 'true' : 'false');
    dismissMobileSuggestion();
  }
  updateMobileSuggestion();
  updateLesson();
}

function initializeMobileMode() {
  const saved = localStorage.getItem(MOBILE_MODE_KEY);
  const active = saved === 'true';
  mobileMode = active;
  document.body.classList.toggle('mobile-version', active);
  const button = document.querySelector('#mobileModeToggle');
  button.setAttribute('aria-pressed', active ? 'true' : 'false');
  const label = active ? 'Exit mobile version' : 'Mobile version';
  button.setAttribute('aria-label', window.I18n?.translate?.(label) || label);
  button.querySelector('span:last-child').textContent = label;
  updateMobileSuggestion();
}

function setCopybookMode(active) {
  if (active && testActive) stopKanaTest();
  resetMobilePracticeRecovery();
  copybookMode = active;
  document.body.classList.toggle('copybook-mode', active);
  const button = document.querySelector('#copybookModeToggle');
  button.setAttribute('aria-pressed', active ? 'true' : 'false');
  button.querySelector('span:last-child').textContent = active ? 'Exit copybook mode' : 'Copybook mode';
  selected = active
    ? (kana[script].find(item => item[0] === selected[0]) || kana[script][0])
    : nextLearningItem();
  updateLesson();
}

document.querySelectorAll('.script-button').forEach(button => {
  button.addEventListener('click', () => {
    if (testActive) stopKanaTest();
    script = button.dataset.script;
    selected = copybookMode ? kana[script][0] : nextLearningItem();
    document.querySelectorAll('.script-button').forEach(item => item.classList.toggle('active', item.dataset.script === script));
    updateLesson();
    renderProgress();
  });
});

document.querySelector('#startKanaTest').addEventListener('click', () => testActive ? stopKanaTest() : startKanaTest());
document.querySelector('#testMyself').addEventListener('click', () => testActive ? stopKanaTest() : startSelfTest());
document.querySelector('#knowCurrentRow').addEventListener('click', () => knownKanaTestActive ? stopKanaTest() : startKnownKanaTest());
document.querySelector('#copybookModeToggle').addEventListener('click', () => setCopybookMode(!copybookMode));
document.querySelector('#mobileModeToggle').addEventListener('click', () => setMobileMode(!mobileMode));
document.querySelector('#mobileSuggestionEnable').addEventListener('click', () => setMobileMode(true));
document.querySelector('#mobileSuggestionDismiss').addEventListener('click', dismissMobileSuggestion);
document.querySelector('#mobileSuggestion').addEventListener('keydown', event => {
  if (event.key === 'Escape') dismissMobileSuggestion();
  if (event.key !== 'Tab') return;
  const focusable = [document.querySelector('#mobileSuggestionEnable'), document.querySelector('#mobileSuggestionDismiss')];
  if (event.shiftKey && document.activeElement === focusable[0]) {
    event.preventDefault();
    focusable[1].focus();
  } else if (!event.shiftKey && document.activeElement === focusable[1]) {
    event.preventDefault();
    focusable[0].focus();
  }
});
document.querySelector('#forgotKana').addEventListener('click', () => {
  if (!testActive || TEST_LAYERS[testLayerIndex]?.key !== 'blank') return;
  const cell = document.querySelector('.test-cell');
  if (placementActive || knownKanaTestActive) {
    const canvas = cell?.querySelector('canvas');
    if (cell) revealTestComparison(cell);
    if (canvas) canvas.style.pointerEvents = 'none';
    document.querySelector('#forgotKana').hidden = true;
    handleTestResult('retry');
    return;
  }
  currentTestHadError = true;
  testLayerIndex = KanaProgress.previousTestLayer(testLayerIndex);
  updateLesson();
});

document.querySelectorAll('[data-reset-script]').forEach(button => {
  button.addEventListener('click', () => {
    const targetScript = button.dataset.resetScript;
    const label = targetScript === 'hiragana' ? 'Hiragana' : 'Katakana';
    const resetPrompt = `Reset all ${label} learning progress? This cannot be undone.`;
    if (!window.confirm(window.I18n?.translate?.(resetPrompt) || resetPrompt)) return;
    if (testActive) stopKanaTest();
    const characters = kana[targetScript].map(item => item[0]);
    saveMobilePractice(Object.fromEntries(Object.entries(mobilePractice).filter(([character]) => !characters.includes(character))));
    saveMasteryResets(KanaProgress.markScriptReset(masteryResets, targetScript));
    saveMastery(KanaProgress.resetMastery(mastery, characters));
    saveLearned(KanaProgress.resetMastery(learned, characters));
    if (targetScript === script) {
      selected = rowItems(curriculumDefinitions[script][0])[0];
      updateLesson();
    }
    window.ProgressSync?.flushSave();
    button.closest('details')?.removeAttribute('open');
  });
});

ghostToggle.addEventListener('change', () => {
  document.querySelectorAll('.ghost').forEach(ghost => { ghost.hidden = !ghostToggle.checked; });
});

function updateInputModeTip() {
  document.querySelector('#inputModeTip').textContent = penOnlyToggle.checked
    ? ' Stylus mode is active; palm touches are ignored. '
    : ' Finger drawing is enabled. ';
}

function setInputMode(mode, persist = true) {
  const stylusMode = mode === 'stylus';
  penOnlyToggle.checked = stylusMode;
  updateInputModeTip();
  if (persist) document.cookie = `${encodeURIComponent(INPUT_MODE_COOKIE)}=${mode}; Max-Age=31536000; Path=/; SameSite=Lax`;
}

function initializeInputMode() {
  const savedMode = KanaProgress.cookieValue(document.cookie, INPUT_MODE_COOKIE);
  if (savedMode === 'stylus' || savedMode === 'finger') {
    setInputMode(savedMode, false);
    return true;
  }
  setInputMode('finger', false);
  requestAnimationFrame(() => document.querySelector('#inputModeDialog').showModal());
  return false;
}

function initializePlacement() {
  if (placement) {
    markProductTourReady();
    return;
  }
  if (Object.keys(mastery).length || Object.keys(learned).length) {
    savePlacement({
      selectedLevel: 'existing',
      assignedLevel: 'Returning learner',
      correct: KanaProgress.progressCount(mastery, allKanaCharacters),
      total: allKanaCharacters.length,
      skipped: true,
      completedAt: new Date().toISOString()
    });
    renderLearningPath();
    markProductTourReady();
    return;
  }
  const dialog = document.querySelector('#placementDialog');
  document.querySelector('#placementChoice').hidden = false;
  document.querySelector('#placementResult').hidden = true;
  requestAnimationFrame(() => dialog.showModal());
}

function markProductTourReady() {
  document.body.dataset.productTourReady = 'true';
  document.dispatchEvent(new CustomEvent('copybook-product-tour-ready'));
}

penOnlyToggle.addEventListener('change', () => setInputMode(penOnlyToggle.checked ? 'stylus' : 'finger'));
document.querySelector('#inputModeDialog').addEventListener('cancel', event => event.preventDefault());
document.querySelectorAll('[data-input-mode]').forEach(button => {
  button.addEventListener('click', () => {
    setInputMode(button.dataset.inputMode);
    document.querySelector('#inputModeDialog').close();
    progressReady.finally(initializePlacement);
  });
});
document.querySelector('#placementDialog').addEventListener('cancel', event => event.preventDefault());
document.querySelectorAll('[data-placement-level]').forEach(button => {
  button.addEventListener('click', () => {
    const level = button.dataset.placementLevel;
    if (level === 'beginner') completeBeginnerPlacement();
    else startPlacementTest(level);
  });
});
document.querySelector('#placementContinue').addEventListener('click', () => {
  document.querySelector('#placementDialog').close();
  markProductTourReady();
});
document.querySelector('#placementRegister').addEventListener('click', () => {
  document.querySelector('#placementDialog').close();
  markProductTourReady();
  document.querySelector('#openAccount').click();
});

const CONCENTRATION_SESSION_KEY = 'japanese-copybook-concentration';
const IS_CONCENTRATION_FRAME = new URLSearchParams(window.location.search).has('concentration-frame');
const USE_NATIVE_FULLSCREEN = !document.documentElement.classList.contains('apple-fullscreen-ui');
let concentrationNavigation = false;

function rememberConcentrationMode(active) {
  try {
    if (active) sessionStorage.setItem(CONCENTRATION_SESSION_KEY, 'active');
    else sessionStorage.removeItem(CONCENTRATION_SESSION_KEY);
  } catch { /* The active page still keeps the CSS mode when storage is unavailable. */ }
}

function setConcentrationMode(active, remember = true) {
  document.body.classList.toggle('concentration-mode', active);
  document.querySelector('#concentrationEnter').setAttribute('aria-pressed', active ? 'true' : 'false');
  if (remember) rememberConcentrationMode(active);
  requestAnimationFrame(() => makeSheet(true));
}

function cleanConcentrationUrl(value) {
  const url = new URL(value, window.location.href);
  url.searchParams.delete('concentration-frame');
  return url;
}

function openConcentrationFrame(value) {
  const target = cleanConcentrationUrl(value);
  let frame = document.querySelector('.concentration-page-frame');
  if (!frame) {
    frame = document.createElement('iframe');
    frame.className = 'concentration-page-frame';
    frame.title = 'Concentration mode';
    document.body.append(frame);
  }
  frame.dataset.target = target.href;
  target.searchParams.set('concentration-frame', '1');
  frame.src = target.href;
}

function concentrationDestinationChanged(targetValue) {
  if (!targetValue) return false;
  const target = cleanConcentrationUrl(targetValue);
  const current = cleanConcentrationUrl(window.location.href);
  return target.pathname !== current.pathname || target.search !== current.search;
}

async function closeConcentrationFrame(navigate = true) {
  const frame = document.querySelector('.concentration-page-frame');
  const target = frame?.dataset.target;
  frame?.remove();
  setConcentrationMode(false);
  if (document.fullscreenElement && document.exitFullscreen) {
    try { await document.exitFullscreen(); }
    catch { /* The fullscreen document has already closed. */ }
  }
  if (navigate && concentrationDestinationChanged(target)) window.location.assign(target);
}

window.addEventListener('message', event => {
  const frame = document.querySelector('.concentration-page-frame');
  if (!frame || event.source !== frame.contentWindow || event.origin !== window.location.origin) return;
  if (event.data?.type === 'copybook-concentration-switch') openConcentrationFrame(event.data.href);
  if (event.data?.type === 'copybook-concentration-exit') closeConcentrationFrame();
});

document.querySelectorAll('.concentration-nav a').forEach(link => {
  link.addEventListener('click', event => {
    if (!document.body.classList.contains('concentration-mode')) return;
    if (IS_CONCENTRATION_FRAME && window.parent !== window) {
      event.preventDefault();
      window.parent.postMessage({ type: 'copybook-concentration-switch', href: link.href }, window.location.origin);
      return;
    }
    if (document.fullscreenElement) {
      event.preventDefault();
      const target = cleanConcentrationUrl(link.href);
      if (target.pathname !== window.location.pathname) openConcentrationFrame(target.href);
      return;
    }
    concentrationNavigation = true;
    rememberConcentrationMode(true);
  });
});

document.querySelector('#concentrationEnter').addEventListener('click', async () => {
  setConcentrationMode(true);
  if (USE_NATIVE_FULLSCREEN && !document.fullscreenElement && document.documentElement.requestFullscreen) {
    try { await document.documentElement.requestFullscreen(); }
    catch { /* CSS concentration mode still works when fullscreen is unavailable. */ }
  }
});

document.querySelector('#concentrationExit').addEventListener('click', async () => {
  if (IS_CONCENTRATION_FRAME && window.parent !== window) {
    window.parent.postMessage({ type: 'copybook-concentration-exit' }, window.location.origin);
    return;
  }
  if (document.querySelector('.concentration-page-frame')) {
    await closeConcentrationFrame();
    return;
  }
  setConcentrationMode(false);
  if (document.fullscreenElement && document.exitFullscreen) {
    try { await document.exitFullscreen(); }
    catch { /* The distraction-free layout has already been closed. */ }
  }
});

document.addEventListener('fullscreenchange', () => {
  if (document.fullscreenElement || !document.body.classList.contains('concentration-mode') || concentrationNavigation) return;
  const frame = document.querySelector('.concentration-page-frame');
  const target = frame?.dataset.target;
  frame?.remove();
  setConcentrationMode(false);
  if (concentrationDestinationChanged(target)) window.location.assign(target);
});

try {
  if (IS_CONCENTRATION_FRAME) {
    setConcentrationMode(true, false);
  } else if (sessionStorage.getItem(CONCENTRATION_SESSION_KEY) === 'active') {
    setConcentrationMode(true, false);
    requestAnimationFrame(async () => {
      if (USE_NATIVE_FULLSCREEN && !document.fullscreenElement && document.documentElement.requestFullscreen) {
        try { await document.documentElement.requestFullscreen(); }
        catch { /* The distraction-free CSS layout remains active across navigation. */ }
      }
    });
  }
} catch { /* Session persistence is optional. */ }

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

let layoutViewportWidth = document.documentElement.clientWidth;
window.addEventListener('resize', () => {
  const nextWidth = document.documentElement.clientWidth;
  if (Math.abs(nextWidth - layoutViewportWidth) < 2) return;
  layoutViewportWidth = nextWidth;
  updateMobileSuggestion();
  if (activeDrawingCanvas) {
    window.__drawingResizePending = true;
    return;
  }
  clearTimeout(window.__resizeTimer);
  window.__resizeTimer = setTimeout(() => makeSheet(true), 150);
});

initializeMobileMode();
selected = nextLearningItem();
updateLesson();
renderProgress();
progressReady = ProgressSync.initialize({
  getLocalProgress: () => ({ kanaMastery: mastery, kanaLearned: learned, kanaMasteryResets: masteryResets, kanaPlacement: placement }),
  replaceLocalProgress: remote => {
    masteryResets = remote.kanaMasteryResets || {};
    mastery = KanaProgress.applyMasteryResets(remote.kanaMastery || {}, masteryResets, kanaScripts());
    learned = KanaProgress.applyLearnedResets(remote.kanaLearned || {}, masteryResets, kanaScripts());
    placement = remote.kanaPlacement || null;
    localStorage.setItem(MASTERY_RESETS_KEY, JSON.stringify(masteryResets));
    localStorage.setItem(MASTERY_KEY, JSON.stringify(mastery));
    localStorage.setItem(LEARNED_KEY, JSON.stringify(learned));
    localStorage.setItem(PLACEMENT_KEY, JSON.stringify(placement));
    selected = nextLearningItem();
    updateLesson();
    renderProgress();
  },
  applyRemoteProgress: remote => {
    saveMasteryResets(KanaProgress.mergeResetTimes(masteryResets, remote.kanaMasteryResets || {}));
    const merged = KanaProgress.mergeMastery(mastery, remote.kanaMastery || {});
    saveMastery(KanaProgress.applyMasteryResets(merged, masteryResets, kanaScripts()));
    const mergedLearned = KanaProgress.mergeLearned(learned, remote.kanaLearned || {});
    saveLearned(KanaProgress.applyLearnedResets(mergedLearned, masteryResets, kanaScripts()));
    const mergedPlacement = KanaProgress.mergePlacement(placement, remote.kanaPlacement);
    if (mergedPlacement) savePlacement(mergedPlacement);
    const row = currentLearningRow();
    if (!testActive && row && (!rowItems(row).some(item => item[0] === selected[0]) || characterIsLearned(selected[0]))) {
      selected = nextLearningItem();
    }
    updateLesson();
  }
});
window.I18n.ready.then(() => {
  if (initializeInputMode()) progressReady.finally(initializePlacement);
});

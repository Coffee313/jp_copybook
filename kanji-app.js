const STORAGE_KEY = 'kana-kanji-dictionary-v1';
const DELETED_STORAGE_KEY = 'kana-kanji-dictionary-deleted-v1';
const MEANING_CACHE_KEY = 'kana-kanji-meanings-v2';
const INPUT_MODE_COOKIE = 'kana-input-mode';
const INPUT_MODE_STORAGE_KEY = 'japanese-copybook-input-mode-v1';
const MOBILE_MODE_KEY = 'japanese-copybook-mobile-version-v1';
const MOBILE_SUGGESTION_SESSION_KEY = 'japanese-copybook-mobile-suggestion-dismissed-v2';
const MOBILE_SCREEN_QUERY = '(max-width: 760px), (max-height: 600px) and (pointer: coarse)';
let selectedCharacter = '';
let wordLength = 1;
let wordCharacters = [''];
let activeWordIndex = 0;
let reviewQueue = [];
let reviewIndex = 0;
let reviewActive = false;
let reviewMode = 'test';
let reviewSelfTest = false;
let reviewCharacterIndex = 0;
let reviewCardRating = 'good';
let reviewAdvanceTimer;
let reviewCellImages = [];

function cookieValue(name) {
  const prefix = `${encodeURIComponent(name)}=`;
  const item = document.cookie.split(';').map(value => value.trim()).find(value => value.startsWith(prefix));
  return item ? decodeURIComponent(item.slice(prefix.length)) : null;
}

function initializeDrawingControls() {
  const penOnlyToggle = document.querySelector('#penOnlyToggle');
  const canvas = document.querySelector('#can');
  canvas.relMouseCoords = event => {
    const rect = canvas.getBoundingClientRect();
    return {
      x: (event.clientX - rect.left) * canvas.width / rect.width,
      y: (event.clientY - rect.top) * canvas.height / rect.height
    };
  };
  const stylusOnly = () => penOnlyToggle.checked;
  penOnlyToggle.checked = (localStorage.getItem(INPUT_MODE_STORAGE_KEY) || cookieValue(INPUT_MODE_COOKIE)) === 'stylus';
  penOnlyToggle.addEventListener('change', () => {
    const mode = penOnlyToggle.checked ? 'stylus' : 'finger';
    document.cookie = `${encodeURIComponent(INPUT_MODE_COOKIE)}=${mode}; Max-Age=31536000; Path=/; SameSite=Lax`;
    localStorage.setItem(INPUT_MODE_STORAGE_KEY, mode);
  });
  window.addEventListener('storage', event => {
    if (event.key === INPUT_MODE_STORAGE_KEY && (event.newValue === 'stylus' || event.newValue === 'finger')) {
      penOnlyToggle.checked = event.newValue === 'stylus';
    }
  });

  const mobileModeToggle = document.querySelector('#mobileModeToggle');
  const savedMobileMode = localStorage.getItem(MOBILE_MODE_KEY);
  let mobileMode = savedMobileMode === 'true';
  const mobileSuggestion = document.querySelector('#mobileSuggestion');
  const mobileSuggestionDismissed = () => {
    try { return sessionStorage.getItem(MOBILE_SUGGESTION_SESSION_KEY) === 'true'; }
    catch { return false; }
  };
  const updateMobileSuggestion = () => {
    const shouldShow = !mobileMode && window.matchMedia(MOBILE_SCREEN_QUERY).matches && !mobileSuggestionDismissed();
    const opening = mobileSuggestion.hidden && shouldShow;
    mobileSuggestion.hidden = !shouldShow;
    document.body.classList.toggle('mobile-suggestion-open', shouldShow);
    if (opening) requestAnimationFrame(() => document.querySelector('#mobileSuggestionEnable').focus());
  };
  const dismissMobileSuggestion = () => {
    try { sessionStorage.setItem(MOBILE_SUGGESTION_SESSION_KEY, 'true'); }
    catch { /* The suggestion can still be hidden for this page. */ }
    mobileSuggestion.hidden = true;
    document.body.classList.remove('mobile-suggestion-open');
  };
  const applyMobileMode = active => {
    mobileMode = active;
    document.body.classList.toggle('mobile-version', active);
    mobileModeToggle.setAttribute('aria-pressed', active ? 'true' : 'false');
    const label = active ? 'Exit mobile version' : 'Mobile version';
    mobileModeToggle.setAttribute('aria-label', window.I18n?.translate?.(label) || label);
    mobileModeToggle.querySelector('span:last-child').textContent = label;
    updateMobileSuggestion();
  };
  applyMobileMode(mobileMode);
  mobileModeToggle.addEventListener('click', () => {
    applyMobileMode(!mobileMode);
    localStorage.setItem(MOBILE_MODE_KEY, mobileMode ? 'true' : 'false');
    dismissMobileSuggestion();
  });
  document.querySelector('#mobileSuggestionEnable').addEventListener('click', () => {
    applyMobileMode(true);
    localStorage.setItem(MOBILE_MODE_KEY, 'true');
    dismissMobileSuggestion();
  });
  document.querySelector('#mobileSuggestionDismiss').addEventListener('click', dismissMobileSuggestion);
  mobileSuggestion.addEventListener('keydown', event => {
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
  window.addEventListener('resize', updateMobileSuggestion);

  let activeStylusPointer = null;
  const dispatchStylusMouse = (type, event) => {
    const synthetic = new MouseEvent(type, {
      bubbles: true,
      cancelable: true,
      clientX: event.clientX,
      clientY: event.clientY,
      buttons: type === 'mouseup' || type === 'mouseout' ? 0 : 1
    });
    Object.defineProperty(synthetic, 'stylusInput', { value: true });
    canvas.dispatchEvent(synthetic);
  };
  ['pointerdown', 'pointermove', 'pointerup', 'pointercancel'].forEach(type => {
    canvas.addEventListener(type, event => {
      if (!stylusOnly()) return;
      event.preventDefault();
      event.stopImmediatePropagation();
      if (event.pointerType !== 'pen') return;
      if (type === 'pointerdown') {
        if (activeStylusPointer !== null) return;
        activeStylusPointer = event.pointerId;
        try { canvas.setPointerCapture(event.pointerId); } catch { /* Capture is optional on older Safari. */ }
        dispatchStylusMouse('mousedown', event);
      } else if (event.pointerId === activeStylusPointer && type === 'pointermove') {
        dispatchStylusMouse('mousemove', event);
      } else if (event.pointerId === activeStylusPointer) {
        dispatchStylusMouse(type === 'pointerup' ? 'mouseup' : 'mouseout', event);
        try { canvas.releasePointerCapture(event.pointerId); } catch { /* Capture may already be gone. */ }
        activeStylusPointer = null;
      }
    }, { capture: true, passive: false });
  });
  ['touchstart', 'touchmove', 'touchend'].forEach(type => {
    canvas.addEventListener(type, event => {
      if (!stylusOnly()) return;
      event.preventDefault();
      event.stopImmediatePropagation();
    }, { capture: true, passive: false });
  });
  ['mousedown', 'mousemove', 'mouseup'].forEach(type => {
    canvas.addEventListener(type, event => {
      if (!stylusOnly() || event.stylusInput) return;
      event.preventDefault();
      event.stopImmediatePropagation();
    }, { capture: true });
  });

  const concentrationSessionKey = 'japanese-copybook-concentration';
  const isConcentrationFrame = new URLSearchParams(window.location.search).has('concentration-frame');
  const useNativeFullscreen = !document.documentElement.classList.contains('apple-fullscreen-ui');
  let concentrationNavigation = false;
  const rememberConcentrationMode = active => {
    try {
      if (active) sessionStorage.setItem(concentrationSessionKey, 'active');
      else sessionStorage.removeItem(concentrationSessionKey);
    } catch { /* The active page still keeps the CSS mode when storage is unavailable. */ }
  };
  const setConcentrationMode = (active, remember = true) => {
    document.body.classList.toggle('concentration-mode', active);
    document.querySelector('#concentrationEnter').setAttribute('aria-pressed', active ? 'true' : 'false');
    if (remember) rememberConcentrationMode(active);
  };
  const cleanConcentrationUrl = value => {
    const url = new URL(value, window.location.href);
    url.searchParams.delete('concentration-frame');
    return url;
  };
  const openConcentrationFrame = value => {
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
  };
  const concentrationDestinationChanged = targetValue => {
    if (!targetValue) return false;
    const target = cleanConcentrationUrl(targetValue);
    const current = cleanConcentrationUrl(window.location.href);
    return target.pathname !== current.pathname || target.search !== current.search;
  };
  const closeConcentrationFrame = async (navigate = true) => {
    const frame = document.querySelector('.concentration-page-frame');
    const target = frame?.dataset.target;
    frame?.remove();
    setConcentrationMode(false);
    if (document.fullscreenElement && document.exitFullscreen) {
      try { await document.exitFullscreen(); }
      catch { /* The fullscreen document has already closed. */ }
    }
    if (navigate && concentrationDestinationChanged(target)) window.location.assign(target);
  };
  window.addEventListener('message', event => {
    const frame = document.querySelector('.concentration-page-frame');
    if (!frame || event.source !== frame.contentWindow || event.origin !== window.location.origin) return;
    if (event.data?.type === 'copybook-concentration-switch') openConcentrationFrame(event.data.href);
    if (event.data?.type === 'copybook-concentration-exit') closeConcentrationFrame();
  });
  document.querySelectorAll('.concentration-nav a').forEach(link => {
    link.addEventListener('click', event => {
      if (!document.body.classList.contains('concentration-mode')) return;
      if (isConcentrationFrame && window.parent !== window) {
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
    if (useNativeFullscreen && !document.fullscreenElement && document.documentElement.requestFullscreen) {
      try { await document.documentElement.requestFullscreen(); }
      catch { /* The CSS concentration layout remains available. */ }
    }
  });
  document.querySelector('#concentrationExit').addEventListener('click', async () => {
    if (isConcentrationFrame && window.parent !== window) {
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
      catch { /* The concentration layout has already closed. */ }
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
    if (isConcentrationFrame) {
      setConcentrationMode(true, false);
    } else if (sessionStorage.getItem(concentrationSessionKey) === 'active') {
      setConcentrationMode(true, false);
      requestAnimationFrame(async () => {
        if (useNativeFullscreen && !document.fullscreenElement && document.documentElement.requestFullscreen) {
          try { await document.documentElement.requestFullscreen(); }
          catch { /* The distraction-free CSS layout remains active across navigation. */ }
        }
      });
    }
  } catch { /* Session persistence is optional. */ }
}

initializeDrawingControls();

window.addEventListener('load', () => {
  window.draw = function drawThinKanjiStroke() {
    ctx.beginPath();
    ctx.moveTo(prevX, prevY);
    ctx.lineTo(currX, currY);
    ctx.strokeStyle = 'black';
    ctx.lineWidth = 3;
    ctx.shadowColor = 'black';
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
    ctx.shadowBlur = 1;
    ctx.closePath();
    ctx.stroke();
    ctx.arc(currX, currY, .8, 0, 2 * Math.PI, true);
    ctx.fillStyle = 'black';
    ctx.closePath();
    ctx.fill();
    ctx.shadowBlur = 0;
  };
});

async function fetchJson(url, timeout = 5000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);
  try {
    const response = await fetch(url, { signal: controller.signal });
    if (!response.ok) throw new Error(`Request failed: ${response.status}`);
    const text = await response.text();
    if (!text.trim()) throw new Error('Request returned an empty response.');
    try { return JSON.parse(text); }
    catch { throw new Error('Request returned invalid JSON.'); }
  } finally {
    clearTimeout(timer);
  }
}

// Common kanji remain available offline; KanjiAPI supplies the rest.
const ENGLISH_MEANINGS = {
  '一':['one'], '二':['two'], '三':['three'], '四':['four'], '五':['five'],
  '六':['six'], '七':['seven'], '八':['eight'], '九':['nine'], '十':['ten'],
  '日':['day','sun'], '月':['month','moon'], '火':['fire'], '水':['water'],
  '木':['tree','wood'], '金':['gold','money'], '土':['earth','soil'], '山':['mountain'],
  '川':['river'], '田':['rice field'], '人':['person'], '子':['child'],
  '女':['woman'], '男':['man'], '父':['father'], '母':['mother'], '友':['friend'],
  '私':['I','private'], '先':['ahead','previous'], '生':['life','birth'],
  '学':['study','learning'], '校':['school'], '本':['book','origin'], '語':['language','word'],
  '年':['year'], '時':['time','hour'], '分':['minute','part'], '今':['now'],
  '上':['up','above'], '下':['down','below'], '中':['middle','inside'],
  '大':['big'], '小':['small'], '長':['long','leader'], '高':['high','expensive'],
  '新':['new'], '古':['old'], '白':['white'], '黒':['black'], '赤':['red'],
  '青':['blue','green'], '行':['go','movement'], '来':['come'], '見':['see'],
  '聞':['hear','ask'], '話':['speak','talk'], '読':['read'], '書':['write'],
  '食':['eat','food'], '飲':['drink'], '買':['buy'], '車':['car'], '電':['electricity'],
  '国':['country'], '家':['home','family'], '店':['shop'], '駅':['station'], '道':['road','way'],
  '何':['what'], '名':['name'], '気':['spirit','mood'], '雨':['rain'], '空':['sky','empty']
};

const WHOLE_WORD_READINGS = {
  '一':'いち', '二':'に', '三':'さん', '四':'よん', '五':'ご',
  '六':'ろく', '七':'なな', '八':'はち', '九':'きゅう', '十':'じゅう',
  '日':'ひ', '月':'つき', '火':'ひ', '水':'みず', '木':'き', '金':'かね',
  '土':'つち', '山':'やま', '川':'かわ', '田':'た', '人':'ひと', '子':'こ',
  '女':'おんな', '男':'おとこ', '父':'ちち', '母':'はは', '友':'とも',
  '私':'わたし', '先':'さき', '生':'せい', '学':'がく', '校':'こう',
  '本':'ほん', '語':'ご', '年':'とし', '時':'とき', '分':'ふん', '今':'いま',
  '上':'うえ', '下':'した', '中':'なか', '大':'だい', '小':'しょう',
  '長':'ちょう', '高':'こう', '新':'しん', '古':'こ', '白':'しろ',
  '黒':'くろ', '赤':'あか', '青':'あお', '行':'こう', '来':'らい',
  '見':'みる', '聞':'きく', '話':'はなす', '読':'よむ', '書':'かく',
  '食':'たべる', '飲':'のむ', '買':'かう', '車':'くるま', '電':'でん',
  '国':'くに', '家':'いえ', '店':'みせ', '駅':'えき', '道':'みち',
  '何':'なに', '名':'な', '気':'き', '雨':'あめ', '空':'そら'
};

const readJson = (key, fallback) => {
  try { return JSON.parse(localStorage.getItem(key)) || fallback; }
  catch { return fallback; }
};

function getDictionary() {
  return readJson(STORAGE_KEY, []);
}
function getDictionaryDeletions() {
  return readJson(DELETED_STORAGE_KEY, {});
}
function saveDictionary(items) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  window.ProgressSync?.flushSave();
}

function mergeDictionaryDeletions(remoteDeletions = {}) {
  const merged = { ...remoteDeletions };
  Object.entries(getDictionaryDeletions()).forEach(([character, deletedAt]) => {
    if ((Date.parse(deletedAt) || 0) >= (Date.parse(merged[character]) || 0)) merged[character] = deletedAt;
  });
  return merged;
}

function dictionaryItemTimestamp(item) {
  return Math.max(
    Date.parse(item?.updatedAt || 0) || 0,
    Date.parse(item?.lastReviewed || 0) || 0,
    Date.parse(item?.createdAt || 0) || 0
  );
}

function mergeDictionary(remoteItems = [], deletions = getDictionaryDeletions(), localItems = getDictionary()) {
  const merged = new Map(remoteItems.map(item => [item.character, item]));
  localItems.forEach(localItem => {
    const remoteItem = merged.get(localItem.character);
    const localDate = dictionaryItemTimestamp(localItem);
    const remoteDate = dictionaryItemTimestamp(remoteItem);
    if (!remoteItem || localDate >= remoteDate) merged.set(localItem.character, localItem);
  });
  return [...merged.values()].filter(item => {
    const deletedAt = Date.parse(deletions[item.character]) || 0;
    return !deletedAt || dictionaryItemTimestamp(item) > deletedAt;
  });
}

function deleteDictionaryWord(character, now = new Date()) {
  const deletions = getDictionaryDeletions();
  deletions[character] = now.toISOString();
  localStorage.setItem(DELETED_STORAGE_KEY, JSON.stringify(deletions));
  saveDictionary(getDictionary().filter(item => item.character !== character));
}

function toHiragana(value) {
  return String(value || '').replace(/[ァ-ヶ]/g, character => String.fromCharCode(character.charCodeAt(0) - 0x60));
}

function normalizeWordReading(value) {
  return toHiragana(value).replace(/[.・-]/g, '').trim();
}

function updatePitchAccentPreview() {
  const reading = document.querySelector('#readingInput').value;
  const input = document.querySelector('#pitchAccentInput');
  const help = document.querySelector('#pitchAccentHelp');
  const preview = document.querySelector('#pitchAccentPreview');
  if (!window.PitchAccent) {
    input.setCustomValidity('');
    preview.hidden = true;
    help.textContent = 'Pitch preview is unavailable, but you can still save the word.';
    return;
  }
  const moras = window.PitchAccent.getMoras(reading);
  const value = input.value.trim();
  const type = value === '' ? null : Number(value);
  input.querySelectorAll('[data-accent-type]').forEach(option => {
    const optionType = Number(option.dataset.accentType);
    option.disabled = optionType > 0 && (!moras.length || optionType > moras.length);
  });

  if (!moras.length) {
    input.setCustomValidity(value ? 'Enter the whole-word reading in kana first.' : '');
    help.textContent = 'Enter the reading first; small combined kana count as part of the preceding mora.';
  } else if (type !== null && (!Number.isInteger(type) || type < 0 || type > moras.length)) {
    input.setCustomValidity(`Choose a pitch accent type from 0 to ${moras.length}.`);
    help.textContent = `${moras.length} mora${moras.length === 1 ? '' : 's'}: valid types are 0–${moras.length}.`;
  } else {
    input.setCustomValidity('');
    help.textContent = `${moras.length} mora${moras.length === 1 ? '' : 's'}: 0 is heiban; 1–${moras.length} mark the downstep.`;
  }
  window.PitchAccent.render(preview, reading, type);
}

function kanjiInWord(word) {
  return [...String(word || '')].filter(character => /\p{Script=Han}/u.test(character));
}

function localVocabularyEntry(word) {
  return window.JMDICT_COMMON?.entries?.[word] || null;
}

function searchVocabularyEntries(query, entries, limit = 12) {
  const term = String(query || '').normalize('NFKC').trim().toLocaleLowerCase();
  if (!term || !entries) return [];
  const readingTerm = normalizeWordReading(term);
  const matches = [];
  Object.entries(entries).forEach(([word, entry]) => {
    const characters = kanjiInWord(word);
    if (!characters.length || characters.length > 4) return;
    const normalizedWord = word.normalize('NFKC').toLocaleLowerCase();
    const readings = entry.r.map(normalizeWordReading);
    const meanings = entry.m.map(value => value.toLocaleLowerCase());
    let score = normalizedWord === term || readings.includes(readingTerm) || meanings.includes(term) ? 0
      : normalizedWord.startsWith(term) || readings.some(value => value.startsWith(readingTerm)) || meanings.some(value => value.startsWith(term)) ? 1
        : normalizedWord.includes(term) || readings.some(value => value.includes(readingTerm)) || meanings.some(value => value.includes(term)) ? 2
          : -1;
    if (score === -1) return;
    matches.push({ word, entry, score });
  });
  return matches
    .sort((a, b) => a.score - b.score || kanjiInWord(a.word).length - kanjiInWord(b.word).length || a.word.localeCompare(b.word, 'ja'))
    .slice(0, limit);
}

function searchLocalVocabulary(query, limit = 12) {
  return searchVocabularyEntries(query, window.JMDICT_COMMON?.entries, limit);
}

let extendedVocabularyPromise;
function loadExtendedVocabulary() {
  if (window.JMDICT_EXTENDED?.entries) return Promise.resolve(window.JMDICT_EXTENDED.entries);
  if (extendedVocabularyPromise) return extendedVocabularyPromise;
  extendedVocabularyPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'assets/jmdict-extended.js?v=2';
    script.onload = () => window.JMDICT_EXTENDED?.entries
      ? resolve(window.JMDICT_EXTENDED.entries)
      : reject(new Error('Extended vocabulary did not load'));
    script.onerror = () => reject(new Error('Extended vocabulary is unavailable'));
    document.head.append(script);
  });
  return extendedVocabularyPromise;
}

function selectedMeanings() {
  return document.querySelector('#translationInput').value
    .split(',')
    .map(value => value.trim())
    .filter(Boolean);
}

function syncMeaningSuggestionState() {
  const selected = new Set(selectedMeanings().map(value => value.toLocaleLowerCase()));
  document.querySelectorAll('#meaningSuggestions button').forEach(button => {
    const active = selected.has(button.textContent.trim().toLocaleLowerCase());
    button.classList.toggle('selected', active);
    button.setAttribute('aria-pressed', active ? 'true' : 'false');
  });
}

function filterDictionaryItems(items, query) {
  const term = String(query || '').normalize('NFKC').trim().toLocaleLowerCase();
  if (!term) return [...items];
  return items.filter(item => [item.character, item.translation, item.reading, item.note]
    .map(value => String(value || '').normalize('NFKC').toLocaleLowerCase())
    .some(value => value.includes(term)));
}

function renderWordCells() {
  const cells = document.querySelector('#wordCells');
  cells.innerHTML = '';
  wordCharacters.forEach((character, index) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'word-cell';
    button.classList.toggle('active', index === activeWordIndex);
    button.classList.toggle('complete', Boolean(character));
    button.textContent = character || String(index + 1);
    button.setAttribute('aria-label', character ? `Kanji ${index + 1}: ${character}` : `Draw kanji ${index + 1}`);
    button.addEventListener('click', () => {
      activeWordIndex = index;
      renderWordCells();
      clearRecognizerDrawing();
    });
    cells.append(button);
  });
  const label = `Draw kanji ${activeWordIndex + 1} of ${wordLength} below, then choose the matching result.`;
  document.querySelector('#activeCellLabel').textContent = label;
}

function clearRecognizerDrawing() {
  if (typeof erase === 'function' && typeof ctx !== 'undefined' && ctx) erase();
}

function resetWordBuilder(length) {
  wordLength = length;
  wordCharacters = Array(length).fill('');
  activeWordIndex = 0;
  selectedCharacter = '';
  document.querySelector('#kanjiForm').reset();
  document.querySelector('.save-kanji').textContent = 'Add to dictionary';
  document.querySelector('#kanjiForm').hidden = true;
  document.querySelector('#selectionEmpty').hidden = false;
  document.querySelectorAll('#wordLengthOptions button').forEach(button => {
    const active = Number(button.dataset.wordLength) === length;
    button.classList.toggle('active', active);
    button.setAttribute('aria-pressed', active ? 'true' : 'false');
  });
  renderWordCells();
  clearRecognizerDrawing();
}

function selectWord(word, source) {
  selectedCharacter = word;
  const existing = getDictionary().find(item => item.character === word);
  document.querySelector('#selectionEmpty').hidden = true;
  document.querySelector('#kanjiForm').hidden = false;
  document.querySelector('#selectedKanji').textContent = word;
  const examples = document.querySelector('#wordStrokeExamples');
  examples.innerHTML = '';
  kanjiInWord(word).forEach((character, index) => {
    const example = document.createElement('div');
    example.className = 'word-stroke-example';
    const label = document.createElement('span');
    label.textContent = `${index + 1}. ${character}`;
    const guide = document.createElement('div');
    guide.className = 'add-stroke-example';
    renderStrokeGuide(guide, character);
    example.append(label, guide);
    examples.append(example);
  });
  examples.hidden = false;
  document.querySelector('#translationInput').value = existing?.translation || '';
  document.querySelector('#readingInput').value = existing?.reading || '';
  document.querySelector('#pitchAccentInput').value = existing?.pitchAccent ?? '';
  document.querySelector('#noteInput').value = existing?.note || '';
  document.querySelector('.save-kanji').textContent = existing ? 'Save changes' : 'Add to dictionary';
  loadWordDetails(word).catch(() => {
    if (selectedCharacter !== word) return;
    document.querySelector('#meaningSuggestions').innerHTML = '<span>Suggestions are unavailable. Enter a meaning manually.</span>';
    document.querySelector('#readingInfo').textContent = 'Reading suggestions are unavailable. Enter the whole-word reading manually.';
  });
  updatePitchAccentPreview();
  source?.scrollIntoView({ block: 'nearest' });
}

function editDictionaryWord(item) {
  const characters = kanjiInWord(item.character);
  if (!characters.length) return;
  dictionaryDialog.close();
  wordLength = Math.min(4, characters.length);
  wordCharacters = characters.slice(0, wordLength);
  activeWordIndex = 0;
  document.querySelectorAll('#wordLengthOptions button').forEach(button => {
    const active = Number(button.dataset.wordLength) === wordLength;
    button.classList.toggle('active', active);
    button.setAttribute('aria-pressed', active ? 'true' : 'false');
  });
  renderWordCells();
  clearRecognizerDrawing();
  selectWord(item.character);
  document.querySelector('.dictionary-card').scrollIntoView({ behavior: 'smooth', block: 'start' });
  requestAnimationFrame(() => document.querySelector('#translationInput').focus());
}

async function loadWordDetails(word) {
  const suggestions = document.querySelector('#meaningSuggestions');
  const readingSuggestions = document.querySelector('#readingSuggestions');
  const info = document.querySelector('#readingInfo');
  suggestions.innerHTML = '<span>Looking up meanings…</span>';
  readingSuggestions.innerHTML = '';
  info.textContent = '';
  let meanings = [];
  let readings = [];
  const localEntry = localVocabularyEntry(word);
  if (localEntry) {
    meanings = [...localEntry.m];
    readings = localEntry.r.map(normalizeWordReading);
  } else {
    try {
      const targetLanguage = document.documentElement.lang === 'ru' ? 'ru' : 'en';
      const result = await fetchJson(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(word)}&langpair=ja|${targetLanguage}`);
      meanings = [...new Set([result.responseData?.translatedText, ...(result.matches || []).map(match => match.translation)]
        .map(value => String(value || '').trim())
        .filter(Boolean))];
    } catch { /* Manual entry and the single-kanji fallback remain available. */ }
  }
  if (word.length === 1 && (!meanings.length || !readings.length)) {
    const cache = readJson(MEANING_CACHE_KEY, {});
    let data = cache[word];
    try {
      if (!data) data = await fetchJson(`https://kanjiapi.dev/v1/kanji/${encodeURIComponent(word)}`);
    } catch { data = {}; }
    cache[word] = data;
    localStorage.setItem(MEANING_CACHE_KEY, JSON.stringify(cache));
    if (!meanings.length) meanings = ENGLISH_MEANINGS[word] || data.meanings || [];
    if (!readings.length) {
      readings = [...new Set([WHOLE_WORD_READINGS[word], ...(data.kun_readings || []), ...(data.on_readings || [])]
        .map(normalizeWordReading)
        .filter(Boolean))];
    }
  }
  if (selectedCharacter !== word) return;
  suggestions.innerHTML = '';
  meanings.slice(0, 8).forEach(meaning => {
    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = meaning;
    button.setAttribute('aria-pressed', 'false');
    button.addEventListener('click', () => {
      const input = document.querySelector('#translationInput');
      const values = selectedMeanings();
      const existingIndex = values.findIndex(value => value.toLocaleLowerCase() === meaning.toLocaleLowerCase());
      if (existingIndex === -1) values.push(meaning); else values.splice(existingIndex, 1);
      input.value = values.join(', ');
      syncMeaningSuggestionState();
    });
    suggestions.append(button);
  });
  syncMeaningSuggestionState();
  if (!meanings.length) {
    suggestions.innerHTML = '<span>No suggested meaning was found for this word. Enter one manually.</span>';
  }
  readings.slice(0, 10).forEach(reading => {
    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = reading;
    button.addEventListener('click', () => {
      document.querySelector('#readingInput').value = reading;
      updatePitchAccentPreview();
    });
    readingSuggestions.append(button);
  });
  const readingInput = document.querySelector('#readingInput');
  if (!readingInput.value && readings.length) readingInput.value = readings[0];
  updatePitchAccentPreview();
  info.textContent = 'The reading applies to the complete word. Stroke order is shown above for each kanji.';
}

document.querySelector('#readingInput').addEventListener('input', updatePitchAccentPreview);
document.querySelector('#pitchAccentInput').addEventListener('change', updatePitchAccentPreview);

document.addEventListener('click', event => {
  const candidate = event.target.closest('.kmatch');
  if (!candidate || reviewActive) return;
  event.preventDefault();
  wordCharacters[activeWordIndex] = candidate.textContent.trim();
  const nextEmpty = wordCharacters.findIndex((character, index) => !character && index > activeWordIndex);
  if (nextEmpty !== -1) activeWordIndex = nextEmpty;
  renderWordCells();
  clearRecognizerDrawing();
  if (wordCharacters.every(Boolean)) selectWord(wordCharacters.join(''), candidate);
});

document.querySelector('#wordLengthOptions').addEventListener('click', event => {
  const button = event.target.closest('[data-word-length]');
  if (button) resetWordBuilder(Number(button.dataset.wordLength));
});

const wordLookupForm = document.querySelector('#wordLookupForm');
const wordLookupInput = document.querySelector('#wordLookupInput');
const wordLookupStatus = document.querySelector('#wordLookupStatus');
const wordLookupResults = document.querySelector('#wordLookupResults');
const toggleWordLookup = document.querySelector('#toggleWordLookup');

toggleWordLookup.addEventListener('click', () => {
  const opening = wordLookupForm.hidden;
  wordLookupForm.hidden = !opening;
  toggleWordLookup.setAttribute('aria-expanded', opening ? 'true' : 'false');
  if (opening) requestAnimationFrame(() => wordLookupInput.focus());
});

wordLookupForm.addEventListener('submit', async event => {
  event.preventDefault();
  const originalQuery = wordLookupInput.value.trim();
  if (!originalQuery) return;
  wordLookupResults.innerHTML = '';
  wordLookupStatus.textContent = 'Looking for Japanese words…';
  const sourceLanguage = /[\u3040-\u30ff\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff]/u.test(originalQuery)
    ? 'ja'
    : /[А-Яа-яЁё]/u.test(originalQuery) ? 'ru' : 'en';
  try {
    let lookupQuery = originalQuery;
    if (sourceLanguage === 'ru') {
      const translation = await fetchJson(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(originalQuery)}&langpair=ru|en`);
      lookupQuery = translation.responseData?.translatedText?.trim() || originalQuery;
    }
    const suggestions = new Map();
    searchLocalVocabulary(lookupQuery).forEach(({ word, entry }) => {
      const characters = kanjiInWord(word);
      suggestions.set(word, { word, characters, reading: normalizeWordReading(entry.r[0]), meanings: entry.m });
    });
    if (!suggestions.size && sourceLanguage === 'ja') {
      const extendedEntries = await loadExtendedVocabulary();
      searchVocabularyEntries(originalQuery, extendedEntries).forEach(({ word, entry }) => {
        const characters = kanjiInWord(word);
        suggestions.set(word, { word, characters, reading: normalizeWordReading(entry.r[0]), meanings: entry.m });
      });
    }
    if (!suggestions.size && sourceLanguage !== 'ja') {
      const fallback = await fetchJson(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(originalQuery)}&langpair=${sourceLanguage}|ja`);
      [fallback.responseData?.translatedText, ...(fallback.matches || []).map(match => match.translation)].forEach(value => {
        const word = String(value || '').trim();
        const characters = kanjiInWord(word);
        if (!word || !characters.length || characters.length > 4 || suggestions.has(word)) return;
        const entry = localVocabularyEntry(word);
        suggestions.set(word, { word, characters, reading: normalizeWordReading(entry?.r?.[0]), meanings: entry?.m || [] });
      });
    }
    [...suggestions.values()].slice(0, 12).forEach(suggestion => {
      const button = document.createElement('button');
      button.type = 'button';
      const word = document.createElement('strong');
      word.lang = 'ja';
      word.textContent = suggestion.word;
      const details = document.createElement('span');
      details.textContent = [suggestion.reading, suggestion.meanings.slice(0, 2).join(', ')].filter(Boolean).join(' — ') || originalQuery;
      button.append(word, details);
      button.addEventListener('click', () => {
        resetWordBuilder(suggestion.characters.length);
        wordCharacters = [...suggestion.characters];
        activeWordIndex = 0;
        renderWordCells();
        selectWord(suggestion.word, button);
        document.querySelector('#translationInput').value = sourceLanguage === 'ja'
          ? suggestion.meanings[0] || originalQuery
          : originalQuery;
        syncMeaningSuggestionState();
        wordLookupForm.hidden = true;
        toggleWordLookup.setAttribute('aria-expanded', 'false');
      });
      wordLookupResults.append(button);
    });
    wordLookupStatus.textContent = suggestions.size
      ? (lookupQuery.toLocaleLowerCase() === originalQuery.toLocaleLowerCase() ? 'Choose the word you meant.' : `Translated as “${lookupQuery}”. Choose the word you meant.`)
      : 'No kanji words were found. Try a simpler meaning.';
  } catch {
    wordLookupStatus.textContent = sourceLanguage === 'ja'
      ? 'The Japanese dictionary could not be loaded. Please refresh and try again.'
      : 'Word lookup is unavailable right now. Please try again.';
  }
});

document.querySelector('#translationInput').addEventListener('input', syncMeaningSuggestionState);

const candidateObserver = new MutationObserver(() => {
  const hasCandidates = [...document.querySelectorAll('.candidate-list')].some(list => list.textContent.trim());
  document.querySelector('#emptyCandidates').hidden = hasCandidates;
});
document.querySelectorAll('.candidate-list').forEach(list => candidateObserver.observe(list, { childList: true, subtree: true }));

document.querySelector('#kanjiForm').addEventListener('submit', event => {
  event.preventDefault();
  const translation = document.querySelector('#translationInput').value.trim();
  const reading = normalizeWordReading(document.querySelector('#readingInput').value);
  const pitchAccentValue = document.querySelector('#pitchAccentInput').value.trim();
  if (!selectedCharacter || !translation) return;
  const items = getDictionary();
  const existing = items.find(item => item.character === selectedCharacter);
  const card = {
    character: selectedCharacter,
    translation,
    reading,
    pitchAccent: pitchAccentValue === '' ? null : Number(pitchAccentValue),
    note: document.querySelector('#noteInput').value.trim(),
    updatedAt: new Date().toISOString(),
    createdAt: existing?.createdAt || new Date().toISOString(),
    nextReview: existing?.nextReview || null,
    interval: existing?.interval || 0,
    ease: existing?.ease || 2.5,
    repetitions: existing?.repetitions || 0
  };
  if (existing) Object.assign(existing, card); else items.unshift(card);
  saveDictionary(items);
  renderDictionary();
  event.target.reset();
  updatePitchAccentPreview();
  document.querySelector('#kanjiForm').hidden = true;
  document.querySelector('#selectionEmpty').hidden = false;
  selectedCharacter = '';
  resetWordBuilder(wordLength);
});

function appendDictionaryPitchAccent(details, item) {
  if (!item.reading || item.pitchAccent === null || item.pitchAccent === undefined) return;
  const section = document.createElement('section');
  section.className = 'dictionary-pitch-section';
  const heading = document.createElement('div');
  heading.className = 'dictionary-pitch-heading';
  heading.textContent = `Pitch accent · Type ${item.pitchAccent}`;
  const pitchAccent = document.createElement('div');
  pitchAccent.className = 'dictionary-pitch-accent pitch-accent-preview';
  section.append(heading, pitchAccent);
  details.append(section);
  if (window.PitchAccent) {
    window.PitchAccent.render(pitchAccent, item.reading, item.pitchAccent);
  } else {
    pitchAccent.hidden = false;
    pitchAccent.textContent = 'Diagram unavailable. Refresh the page to load it.';
  }
}

function renderDictionary() {
  const list = document.querySelector('#dictionaryList');
  const allItems = getDictionary();
  const items = filterDictionaryItems(allItems, document.querySelector('#dictionarySearch').value);
  updateReviewSummary(allItems);
  document.querySelector('#dictionaryCount').textContent = `${allItems.length} ${allItems.length === 1 ? 'card' : 'cards'}`;
  document.querySelector('#dictionaryLauncherCount').textContent = allItems.length;
  document.querySelector('#exportAnki').disabled = allItems.length === 0;
  list.innerHTML = '';
  if (!allItems.length || !items.length) {
    const empty = document.createElement('p');
    empty.className = 'dictionary-empty';
    empty.textContent = allItems.length
      ? 'No vocabulary matches your search.'
      : 'Your dictionary is empty. Build your first word and add its meaning.';
    list.append(empty);
    return;
  }
  items.forEach(item => {
    const card = document.createElement('details');
    card.className = 'dictionary-item';
    let hoverCloseTimer;
    card.addEventListener('toggle', () => {
      if (!card.open) return;
      list.querySelectorAll('.dictionary-item[open]').forEach(other => {
        if (other !== card) other.removeAttribute('open');
      });
      requestAnimationFrame(() => positionDictionaryPopover(card));
    });
    card.addEventListener('pointerenter', () => {
      if (!window.matchMedia('(hover: hover)').matches) return;
      clearTimeout(hoverCloseTimer);
      card.setAttribute('open', '');
    });
    card.addEventListener('pointerleave', () => {
      if (!window.matchMedia('(hover: hover)').matches) return;
      clearTimeout(hoverCloseTimer);
      hoverCloseTimer = setTimeout(() => {
        if (!card.matches(':hover') && !card.matches(':focus-within')) card.removeAttribute('open');
      }, 150);
    });
    const character = document.createElement('summary');
    character.className = 'character';
    character.dataset.length = String(Math.min(4, [...item.character].length));
    character.textContent = item.character;
    character.addEventListener('click', event => {
      if (!window.matchMedia('(hover: hover)').matches) return;
      event.preventDefault();
      card.setAttribute('open', '');
    });
    const details = document.createElement('div');
    details.className = 'dictionary-popover';
    if (item.reading) {
      const reading = document.createElement('span');
      reading.className = 'dictionary-reading';
      reading.lang = 'ja';
      reading.textContent = toHiragana(item.reading);
      details.append(reading);
    }
    appendDictionaryPitchAccent(details, item);
    const meaning = document.createElement('strong');
    meaning.textContent = item.translation;
    const note = document.createElement('small');
    note.textContent = item.note || 'Ready for the first review';
    details.append(meaning, note);
    const actions = document.createElement('div');
    actions.className = 'dictionary-item-actions';
    const edit = document.createElement('button');
    edit.className = 'dictionary-edit';
    edit.type = 'button';
    edit.setAttribute('aria-label', `Edit ${item.character}`);
    edit.setAttribute('title', 'Edit word');
    edit.textContent = '✎';
    edit.addEventListener('click', event => {
      event.preventDefault();
      event.stopPropagation();
      editDictionaryWord(item);
    });
    const remove = document.createElement('button');
    remove.className = 'dictionary-remove';
    remove.type = 'button';
    remove.setAttribute('aria-label', `Delete ${item.character}`);
    remove.textContent = '×';
    remove.addEventListener('click', event => {
      event.preventDefault();
      event.stopPropagation();
      deleteDictionaryWord(item.character);
      renderDictionary();
    });
    actions.append(edit, remove);
    details.append(actions);
    card.append(character, details);
    list.append(card);
  });
}

const dictionaryDialog = document.querySelector('#dictionaryDialog');
const dictionarySearch = document.querySelector('#dictionarySearch');

function positionDictionaryPopover(card) {
  const popover = card.querySelector('.dictionary-popover');
  if (!popover) return;
  popover.style.setProperty('--popover-shift', '0px');
  const dialogBounds = dictionaryDialog.getBoundingClientRect();
  const popoverBounds = popover.getBoundingClientRect();
  const inset = 10;
  let shift = 0;
  if (popoverBounds.left < dialogBounds.left + inset) shift += dialogBounds.left + inset - popoverBounds.left;
  if (popoverBounds.right + shift > dialogBounds.right - inset) shift -= popoverBounds.right + shift - dialogBounds.right + inset;
  popover.style.setProperty('--popover-shift', `${Math.round(shift)}px`);
}

document.querySelector('#dictionaryList').addEventListener('pointerover', event => {
  const hovered = event.target.closest('.dictionary-item');
  if (!hovered) return;
  document.querySelectorAll('.dictionary-item[open]').forEach(item => {
    if (item !== hovered) item.removeAttribute('open');
  });
  requestAnimationFrame(() => positionDictionaryPopover(hovered));
});
document.addEventListener('click', event => {
  if (event.target.closest('.dictionary-item')) return;
  document.querySelectorAll('.dictionary-item[open]').forEach(item => item.removeAttribute('open'));
});
document.querySelector('#openDictionary').addEventListener('click', () => {
  dictionarySearch.value = '';
  renderDictionary();
  dictionaryDialog.showModal();
  requestAnimationFrame(() => dictionarySearch.focus());
});
document.querySelector('#closeDictionary').addEventListener('click', () => dictionaryDialog.close());
dictionarySearch.addEventListener('input', renderDictionary);

const kanjiCopybookDialog = document.querySelector('#kanjiCopybookDialog');
const kanjiCopybookSearch = document.querySelector('#kanjiCopybookSearch');
const kanjiCopybookGuideToggle = document.querySelector('#kanjiCopybookGuideToggle');
let kanjiCopybookItem = null;
let kanjiCopybookCharacterIndex = 0;
let kanjiCopybookMobileLayout = null;

function copybookDilate(mask, size, radius) {
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

function copybookMask(context, size) {
  const pixels = context.getImageData(0, 0, size, size).data;
  return Uint8Array.from({ length: size * size }, (_, index) => pixels[index * 4 + 3] > 35 ? 1 : 0);
}

function copybookMaskSimilarity(first, second, size) {
  const firstWide = copybookDilate(first, size, 5);
  const secondWide = copybookDilate(second, size, 5);
  let firstPixels = 0, secondPixels = 0, firstHits = 0, secondHits = 0;
  first.forEach((value, index) => {
    if (value) { firstPixels += 1; if (secondWide[index]) firstHits += 1; }
    if (second[index]) { secondPixels += 1; if (firstWide[index]) secondHits += 1; }
  });
  return firstPixels && secondPixels ? (firstHits / firstPixels) * .55 + (secondHits / secondPixels) * .45 : 0;
}

function copybookStrokeMask(stroke, size) {
  const layer = document.createElement('canvas');
  layer.width = layer.height = size;
  const context = layer.getContext('2d');
  context.strokeStyle = '#000';
  context.lineWidth = 6;
  context.lineCap = 'round';
  context.lineJoin = 'round';
  context.beginPath();
  stroke.forEach(([x, y], index) => index ? context.lineTo(x * size, y * size) : context.moveTo(x * size, y * size));
  context.stroke();
  return copybookMask(context, size);
}

function copybookReferenceMask(path, size) {
  const layer = document.createElement('canvas');
  layer.width = layer.height = size;
  const context = layer.getContext('2d');
  context.setTransform((size - 8) / 109, 0, 0, (size - 8) / 109, 4, 4);
  context.strokeStyle = '#000';
  context.lineWidth = 4;
  context.lineCap = 'round';
  context.lineJoin = 'round';
  context.stroke(new Path2D(path));
  return copybookMask(context, size);
}

function copybookResample(points, count = 14) {
  const lengths = [0];
  for (let index = 1; index < points.length; index += 1) lengths.push(lengths[index - 1] + Math.hypot(points[index][0] - points[index - 1][0], points[index][1] - points[index - 1][1]));
  const total = lengths[lengths.length - 1] || 1;
  return Array.from({ length: count }, (_, sampleIndex) => {
    const target = total * sampleIndex / (count - 1);
    let segment = 1;
    while (segment < lengths.length - 1 && lengths[segment] < target) segment += 1;
    const segmentLength = (lengths[segment] || total) - (lengths[segment - 1] || 0) || 1;
    const ratio = (target - (lengths[segment - 1] || 0)) / segmentLength;
    const start = points[segment - 1] || points[0];
    const end = points[segment] || start;
    return [start[0] + (end[0] - start[0]) * ratio, start[1] + (end[1] - start[1]) * ratio];
  });
}

function copybookReferencePoints(pathData, size, count = 14) {
  const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  path.setAttribute('d', pathData);
  const total = path.getTotalLength();
  return Array.from({ length: count }, (_, index) => {
    const point = path.getPointAtLength(total * index / (count - 1));
    return [(4 + point.x * (size - 8) / 109) / size, (4 + point.y * (size - 8) / 109) / size];
  });
}

function gradeKanjiCopybookCanvas(canvas, character) {
  if (!canvas.isConnected) return;
  const paths = window.KANJIVG_STROKES?.[character];
  if (!paths?.length || !(canvas.__strokes || []).length) return;
  const size = 96;
  const userLayer = document.createElement('canvas');
  userLayer.width = userLayer.height = size;
  userLayer.getContext('2d').drawImage(canvas, 0, 0, size, size);
  const targetLayer = document.createElement('canvas');
  targetLayer.width = targetLayer.height = size;
  const targetContext = targetLayer.getContext('2d');
  targetContext.setTransform((size - 8) / 109, 0, 0, (size - 8) / 109, 4, 4);
  targetContext.strokeStyle = '#000';
  targetContext.lineWidth = 4;
  targetContext.lineCap = 'round';
  targetContext.lineJoin = 'round';
  paths.forEach(path => targetContext.stroke(new Path2D(path)));
  const user = copybookMask(userLayer.getContext('2d'), size);
  const target = copybookMask(targetLayer.getContext('2d'), size);
  const userWide = copybookDilate(user, size, 3);
  const targetWide = copybookDilate(target, size, 4);
  let userPixels = 0, targetPixels = 0, userHits = 0, targetHits = 0;
  user.forEach((value, index) => {
    if (value) { userPixels += 1; if (targetWide[index]) userHits += 1; }
    if (target[index]) { targetPixels += 1; if (userWide[index]) targetHits += 1; }
  });
  if (userPixels < 35) return;
  const precision = userHits / userPixels;
  const coverage = targetHits / targetPixels;
  const rawScore = precision * .58 + coverage * .42;
  const shapeGood = precision > .68 && coverage > .55 && rawScore > .65;
  let order = false;
  let direction = false;
  const strokes = canvas.__strokes || [];
  if (strokes.length === paths.length) {
    const userStrokes = strokes.map(stroke => copybookStrokeMask(stroke, size));
    const references = paths.map(path => copybookReferenceMask(path, size));
    const matrix = userStrokes.map(stroke => references.map(reference => copybookMaskSimilarity(stroke, reference, size)));
    const direct = matrix.reduce((sum, row, index) => sum + row[index], 0);
    const best = matrix.reduce((sum, row) => sum + Math.max(...row), 0);
    order = matrix.every((row, index) => row[index] >= .28 && row[index] >= Math.max(...row) * .82) && direct / Math.max(best, .001) >= .82;
    if (order) direction = strokes.every((stroke, index) => {
      const sampled = copybookResample(stroke);
      const reference = copybookReferencePoints(paths[index], size);
      const error = points => sampled.reduce((sum, point, pointIndex) => sum + Math.hypot(point[0] - points[pointIndex][0], point[1] - points[pointIndex][1]), 0);
      return error(reference) <= error([...reference].reverse()) * .94;
    });
  }
  const result = !shapeGood ? 'retry' : !order ? 'order' : !direction ? 'direction' : 'good';
  const score = precision >= .985 && coverage >= .985 ? 100 : Math.min(99, Math.round(Math.pow(rawScore, 1.45) * 100));
  const cell = canvas.parentElement;
  cell.classList.add(`grade-${result}`);
  const badge = document.createElement('span');
  badge.className = 'grade-badge';
  badge.textContent = result === 'good' ? `Good · ${score}%` : result === 'order' ? `Wrong order · ${score}%` : result === 'direction' ? `Wrong direction · ${score}%` : `Try again · ${score}%`;
  cell.append(badge);
  if (result !== 'good') {
    canvas.style.pointerEvents = 'none';
    setTimeout(() => {
      if (!canvas.isConnected) return;
      canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);
      canvas.__strokes = [];
      cell.classList.remove('grade-order', 'grade-direction', 'grade-retry');
      cell.querySelector('.grade-badge')?.remove();
      canvas.style.pointerEvents = '';
    }, 900);
  }
}

function setupCopybookCanvas(canvas, character) {
  const context = canvas.getContext('2d');
  let drawing = false;
  let pointerId = null;
  let currentStroke = null;
  let gradeTimer;
  const scheduleGrade = () => {
    const expectedStrokes = window.KANJIVG_STROKES?.[character]?.length || 0;
    if (!expectedStrokes || canvas.__strokes.length < expectedStrokes) return;
    gradeTimer = setTimeout(() => gradeKanjiCopybookCanvas(canvas, character), 1400);
  };
  const point = event => {
    const rect = canvas.getBoundingClientRect();
    return [(event.clientX - rect.left) / rect.width, (event.clientY - rect.top) / rect.height];
  };
  const resize = () => {
    const rect = canvas.getBoundingClientRect();
    if (!rect.width) return;
    const ratio = Math.max(window.devicePixelRatio || 1, 1);
    canvas.width = Math.round(rect.width * ratio);
    canvas.height = Math.round(rect.height * ratio);
    context.lineCap = 'round';
    context.lineJoin = 'round';
    context.strokeStyle = '#2f2d29';
    context.lineWidth = Math.max(3, canvas.width / 110);
    (canvas.__strokes || []).forEach(stroke => {
      context.beginPath();
      stroke.forEach(([x, y], index) => index ? context.lineTo(x * canvas.width, y * canvas.height) : context.moveTo(x * canvas.width, y * canvas.height));
      context.stroke();
    });
  };
  canvas.__strokes = [];
  canvas.addEventListener('pointerdown', event => {
    const stylusOnly = localStorage.getItem(INPUT_MODE_STORAGE_KEY) === 'stylus';
    if (stylusOnly && event.pointerType !== 'pen') return;
    drawing = true;
    pointerId = event.pointerId;
    clearTimeout(gradeTimer);
    canvas.parentElement.classList.remove('grade-good', 'grade-order', 'grade-direction', 'grade-retry');
    canvas.parentElement.querySelector('.grade-badge')?.remove();
    canvas.setPointerCapture?.(pointerId);
    const [x, y] = point(event);
    currentStroke = [[x, y]];
    context.beginPath();
    context.moveTo(x * canvas.width, y * canvas.height);
    event.preventDefault();
  });
  canvas.addEventListener('pointermove', event => {
    if (!drawing || event.pointerId !== pointerId) return;
    const [x, y] = point(event);
    currentStroke.push([x, y]);
    context.lineTo(x * canvas.width, y * canvas.height);
    context.stroke();
    event.preventDefault();
  });
  const finish = event => {
    if (!drawing || event.pointerId !== pointerId) return;
    drawing = false;
    pointerId = null;
    if (currentStroke?.length === 1) currentStroke.push(currentStroke[0]);
    if (currentStroke) canvas.__strokes.push(currentStroke);
    currentStroke = null;
    scheduleGrade();
  };
  canvas.addEventListener('pointerup', finish);
  canvas.addEventListener('pointercancel', finish);
  requestAnimationFrame(resize);
}

function makeCopybookDrawingCell(character, index, mobile) {
  const cell = document.createElement('div');
  cell.className = 'kanji-copybook-cell';
  const guide = document.createElement('div');
  guide.className = 'kanji-copybook-ghost';
  renderStrokeGuide(guide, character);
  guide.querySelectorAll('text').forEach(label => label.remove());
  guide.hidden = !kanjiCopybookGuideToggle.checked;
  const canvas = document.createElement('canvas');
  canvas.setAttribute('aria-label', `Practise ${character}${mobile ? '' : `, cell ${index}`}`);
  cell.append(guide, canvas);
  setupCopybookCanvas(canvas, character);
  return cell;
}

function renderKanjiCopybookSheet() {
  if (!kanjiCopybookItem) return;
  const characters = kanjiInWord(kanjiCopybookItem.character);
  const character = characters[kanjiCopybookCharacterIndex] || characters[0];
  const tabs = document.querySelector('#kanjiCopybookCharacterTabs');
  tabs.innerHTML = '';
  characters.forEach((value, index) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = value;
    button.classList.toggle('active', index === kanjiCopybookCharacterIndex);
    button.setAttribute('aria-pressed', index === kanjiCopybookCharacterIndex ? 'true' : 'false');
    button.addEventListener('click', () => {
      kanjiCopybookCharacterIndex = index;
      renderKanjiCopybookSheet();
    });
    tabs.append(button);
  });
  const sheet = document.querySelector('#kanjiCopybookSheet');
  sheet.innerHTML = '';
  const mobile = document.body.classList.contains('mobile-version') || window.matchMedia('(max-width: 680px)').matches;
  kanjiCopybookMobileLayout = mobile;
  if (!mobile) {
    const example = document.createElement('div');
    example.className = 'kanji-copybook-cell kanji-copybook-example';
    const strokeGuide = document.createElement('div');
    strokeGuide.className = 'kanji-copybook-stroke-guide';
    renderStrokeGuide(strokeGuide, character);
    example.append(strokeGuide);
    sheet.append(example);
  }
  const count = mobile ? 1 : 14;
  for (let index = 1; index <= count; index += 1) sheet.append(makeCopybookDrawingCell(character, index, mobile));
}

function openKanjiCopybookPractice(item) {
  kanjiCopybookItem = item;
  kanjiCopybookCharacterIndex = 0;
  document.querySelector('#kanjiCopybookPicker').hidden = true;
  document.querySelector('#kanjiCopybookPractice').hidden = false;
  document.querySelector('#kanjiCopybookWord').textContent = item.character;
  document.querySelector('#kanjiCopybookDetails').textContent = [item.reading ? toHiragana(item.reading) : '', item.translation].filter(Boolean).join(' · ');
  renderKanjiCopybookSheet();
}

function showKanjiCopybookPicker() {
  kanjiCopybookItem = null;
  document.querySelector('#kanjiCopybookPractice').hidden = true;
  document.querySelector('#kanjiCopybookPicker').hidden = false;
  renderKanjiCopybookDictionary();
  requestAnimationFrame(() => kanjiCopybookSearch.focus());
}

function renderKanjiCopybookDictionary() {
  const allItems = getDictionary().filter(item => kanjiInWord(item.character).length);
  const items = filterDictionaryItems(allItems, kanjiCopybookSearch.value);
  const list = document.querySelector('#kanjiCopybookWords');
  document.querySelector('#kanjiCopybookCount').textContent = `${allItems.length} ${allItems.length === 1 ? 'word' : 'words'}`;
  list.innerHTML = '';
  if (!items.length) {
    const empty = document.createElement('p');
    empty.className = 'dictionary-empty';
    empty.textContent = allItems.length ? 'No vocabulary matches your search.' : 'Add words to your dictionary before opening the copybook.';
    list.append(empty);
    return;
  }
  items.forEach(item => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'kanji-copybook-word';
    const word = document.createElement('strong');
    word.lang = 'ja';
    word.textContent = item.character;
    const reading = document.createElement('span');
    reading.lang = 'ja';
    reading.textContent = item.reading ? toHiragana(item.reading) : 'Reading not added';
    const meaning = document.createElement('small');
    meaning.textContent = item.translation;
    button.append(word, reading, meaning);
    button.addEventListener('click', () => openKanjiCopybookPractice(item));
    list.append(button);
  });
}

function openKanjiCopybook() {
  kanjiCopybookSearch.value = '';
  showKanjiCopybookPicker();
  if (!kanjiCopybookDialog.open) kanjiCopybookDialog.showModal();
}

document.querySelector('#openKanjiCopybook').addEventListener('click', openKanjiCopybook);
document.querySelector('#concentrationKanjiCopybook').addEventListener('click', openKanjiCopybook);
document.querySelector('#kanjiCopybookBack').addEventListener('click', showKanjiCopybookPicker);
document.querySelector('#clearKanjiCopybook').addEventListener('click', renderKanjiCopybookSheet);
kanjiCopybookGuideToggle.addEventListener('change', () => {
  document.querySelectorAll('.kanji-copybook-ghost').forEach(guide => {
    guide.hidden = !kanjiCopybookGuideToggle.checked;
  });
});
document.querySelector('#closeKanjiCopybook').addEventListener('click', () => kanjiCopybookDialog.close());
document.querySelector('#closeKanjiCopybookPractice').addEventListener('click', () => kanjiCopybookDialog.close());
kanjiCopybookSearch.addEventListener('input', renderKanjiCopybookDictionary);
window.addEventListener('resize', () => {
  const mobile = document.body.classList.contains('mobile-version') || window.matchMedia('(max-width: 680px)').matches;
  if (kanjiCopybookDialog.open && kanjiCopybookItem && mobile !== kanjiCopybookMobileLayout) renderKanjiCopybookSheet();
});

document.querySelector('#exportAnki').addEventListener('click', () => {
  const items = getDictionary();
  if (!items.length || !window.AnkiExport) return;
  const content = `\uFEFF${window.AnkiExport.buildDeck(items)}`;
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const download = document.createElement('a');
  const date = new Date().toISOString().slice(0, 10);
  download.href = url;
  download.download = `japanese-copybook-kanji-${date}.txt`;
  document.body.append(download);
  download.click();
  download.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
});

function isCardDueForReview(card) {
  const neverReviewed = !card.lastReviewed && (Number(card.repetitions) || 0) === 0;
  return neverReviewed || SRS.isDue(card);
}

function reviewableCards(items, dueOnly = false) {
  return items.filter(item => kanjiInWord(item.character).length && (!dueOnly || isCardDueForReview(item)));
}

function updateReviewSummary(items = getDictionary()) {
  const practiceCards = reviewableCards(items);
  const due = reviewableCards(items, true);
  const startButton = document.querySelector('#startReview');
  const selfTestButton = document.querySelector('#testKanjiMyself');
  document.querySelector('#dueCount').textContent = due.length;
  startButton.disabled = due.length === 0;
  selfTestButton.disabled = practiceCards.length === 0;
  const empty = document.querySelector('#reviewEmpty');
  empty.hidden = due.length > 0;
  empty.textContent = practiceCards.length
    ? (due.length ? '' : 'All reviews are complete for today. Come back later.')
    : 'Add cards to your dictionary and vocabulary words will appear here immediately.';
  renderReviewPracticeIcons(due);
}

function scheduleMidnightReviewRefresh(now = new Date()) {
  const nextMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
  setTimeout(() => {
    updateReviewSummary();
    scheduleMidnightReviewRefresh();
  }, Math.max(0, nextMidnight.getTime() - now.getTime()) + 50);
}

function combineReviewRating(current, next) {
  const weight = { good: 0, hard: 1, again: 2 };
  return weight[next] > weight[current] ? next : current;
}

function renderPassedPitchAccent(card) {
  const container = document.querySelector('#reviewPassedDetails');
  const word = document.querySelector('#reviewPassedWord');
  const pitch = document.querySelector('#reviewPassedPitch');
  container.hidden = true;
  pitch.replaceChildren();
  document.querySelector('#reviewCard').removeAttribute('data-passed');
  word.textContent = card?.character || '';
  let pitchShown = false;

  if (card?.reading && card.pitchAccent !== null && card.pitchAccent !== undefined && window.PitchAccent) {
    const heading = document.createElement('div');
    heading.className = 'review-pitch-heading';
    heading.textContent = `${toHiragana(card.reading)} · Pitch accent type ${card.pitchAccent}`;
    const diagram = document.createElement('div');
    diagram.className = 'review-pitch-diagram pitch-accent-preview';
    window.PitchAccent.render(diagram, card.reading, card.pitchAccent);
    if (!diagram.hidden) {
      pitch.append(heading, diagram);
      pitchShown = true;
    }
  }
  container.hidden = false;
  document.querySelector('#reviewCard').dataset.passed = 'true';
  document.querySelector('#reviewWordCells').hidden = true;
  return pitchShown;
}

function advancePassedReview() {
  if (document.querySelector('#reviewCard').dataset.passed !== 'true') return;
  reviewIndex += 1;
  reviewCharacterIndex = 0;
  reviewCardRating = 'good';
  reviewCellImages = [];
  reviewMode = 'test';
  showReviewCard();
}

function renderReviewWordCells(targets) {
  const cells = document.querySelector('#reviewWordCells');
  const drawPanel = document.querySelector('.draw-panel');
  const canvasWrap = document.querySelector('.canvas-wrap');
  const drawActions = document.querySelector('.draw-actions');
  if (canvasWrap.parentElement !== drawPanel) drawPanel.insertBefore(canvasWrap, drawActions);
  cells.replaceChildren();
  cells.dataset.count = targets.length;
  targets.forEach((target, index) => {
    const cell = document.createElement('div');
    cell.className = 'review-word-cell';
    const number = document.createElement('span');
    number.className = 'review-cell-number';
    number.textContent = index + 1;
    cell.append(number);
    if (reviewCellImages[index]) {
      const image = document.createElement('img');
      image.src = reviewCellImages[index];
      image.alt = `Completed kanji ${index + 1}`;
      cell.dataset.state = 'complete';
      cell.append(image);
    } else if (index === reviewCharacterIndex) {
      cell.dataset.state = 'active';
      cell.setAttribute('aria-label', `Draw kanji ${index + 1} of ${targets.length}`);
      cell.append(canvasWrap);
    } else {
      cell.dataset.state = 'pending';
      cell.setAttribute('aria-label', `Kanji ${index + 1} of ${targets.length}, waiting`);
    }
    cells.append(cell);
  });
}

function renderReviewPracticeIcons(cards) {
  const container = document.querySelector('#reviewPracticeIcons');
  const list = document.querySelector('#reviewPracticeIconList');
  list.replaceChildren();
  cards.forEach((card, index) => {
    const icon = document.createElement('span');
    icon.className = 'review-practice-icon';
    icon.setAttribute('aria-label', `Practice word ${index + 1} of ${cards.length}`);
    const word = document.createElement('span');
    word.lang = 'ja';
    word.textContent = card.character;
    icon.append(word);
    list.append(icon);
  });
  container.hidden = reviewActive || !cards.length;
}

function clearReviewDrawing() {
  const guide = document.querySelector('#reviewStrokeGuide');
  guide.hidden = true;
  guide.replaceChildren();
  clearRecognizerDrawing();
}

function leaveReviewTest(message = 'Test exited. Your unfinished card was not reviewed.') {
  clearTimeout(reviewAdvanceTimer);
  clearReviewDrawing();
  reviewActive = false;
  reviewSelfTest = false;
  reviewMode = 'test';
  reviewCharacterIndex = 0;
  reviewCardRating = 'good';
  reviewCellImages = [];
  document.body.classList.remove('kanji-test-active');
  document.querySelector('#exitReview').hidden = true;
  const recognizer = document.querySelector('.recognizer-card');
  const drawPanel = document.querySelector('.draw-panel');
  const candidatePanel = document.querySelector('.candidate-panel');
  const wordCells = document.querySelector('#reviewWordCells');
  const canvasWrap = document.querySelector('.canvas-wrap');
  const drawActions = document.querySelector('.draw-actions');
  drawPanel.append(canvasWrap, drawActions);
  wordCells.hidden = true;
  document.querySelector('#reviewCanvasHost').before(wordCells);
  if (drawPanel.parentElement !== recognizer) recognizer.insertBefore(drawPanel, candidatePanel);
  recognizer.hidden = false;
  candidatePanel.hidden = false;
  document.querySelector('#reviewCard').hidden = true;
  document.querySelector('#reviewCard').removeAttribute('data-passed');
  document.querySelector('#reviewPassedDetails').hidden = true;
  document.querySelector('#reviewPracticeIcons').hidden = true;
  const empty = document.querySelector('#reviewEmpty');
  updateReviewSummary();
  if (message) {
    empty.hidden = false;
    empty.textContent = message;
  }
  clearReviewDrawing();
}

function showReviewCard() {
  const reviewCard = document.querySelector('#reviewCard');
  const empty = document.querySelector('#reviewEmpty');
  if (reviewIndex >= reviewQueue.length) {
    const completedSelfTest = reviewSelfTest;
    leaveReviewTest(completedSelfTest
      ? 'Self-test complete. Your review schedule was not changed.'
      : 'Review complete. Your next review schedule has been saved.');
    return;
  }

  const card = reviewQueue[reviewIndex];
  const targets = kanjiInWord(card.character);
  const target = targets[reviewCharacterIndex];
  reviewActive = true;
  empty.hidden = true;
  reviewCard.hidden = false;
  reviewCard.removeAttribute('data-passed');
  document.querySelector('#reviewPassedDetails').hidden = true;
  document.querySelector('#reviewWordCells').hidden = false;
  document.querySelector('#reviewPracticeIcons').hidden = true;
  document.querySelector('#reviewProgress').textContent = targets.length > 1
    ? `Word ${reviewIndex + 1} of ${reviewQueue.length} · Kanji ${reviewCharacterIndex + 1} of ${targets.length}`
    : `Word ${reviewIndex + 1} of ${reviewQueue.length}`;
  document.querySelector('#reviewTranslation').textContent = card.translation;
  const prompt = document.querySelector('.review-prompt');
  const guide = document.querySelector('#reviewStrokeGuide');
  renderReviewWordCells(targets);
  renderStrokeGuide(guide, target);
  guide.hidden = reviewMode !== 'guided' || !KANJIVG_STROKES[target];
  document.querySelector('#forgotKanji').hidden = reviewMode === 'guided';
  prompt.textContent = reviewMode === 'guided'
    ? 'Trace the kanji using the guide. After a correct attempt, you will write it once more without help.'
    : reviewMode === 'confirm'
      ? 'Now write the same kanji once more without the guide.'
      : targets.length > 1
        ? `Draw kanji ${reviewCharacterIndex + 1} of ${targets.length} for this word. Follow the correct stroke order and direction.`
        : 'Draw the kanji for this meaning. Follow the correct stroke order and direction.';
  const feedback = document.querySelector('#reviewFeedback');
  feedback.hidden = true;
  feedback.removeAttribute('data-result');
  document.querySelector('#checkDrawing').disabled = false;
  erase();
}

function startReviewTest(items, selfTest = false) {
  reviewQueue = items;
  reviewSelfTest = selfTest;
  reviewIndex = 0;
  reviewCharacterIndex = 0;
  reviewCardRating = 'good';
  reviewCellImages = [];
  reviewMode = 'test';
  document.body.classList.add('kanji-test-active');
  document.querySelector('#exitReview').hidden = false;
  const drawPanel = document.querySelector('.draw-panel');
  const wordCells = document.querySelector('#reviewWordCells');
  wordCells.hidden = false;
  drawPanel.prepend(wordCells);
  document.querySelector('#reviewCanvasHost').append(drawPanel);
  document.querySelector('.recognizer-card').hidden = true;
  document.querySelector('.candidate-panel').hidden = true;
  showReviewCard();
  document.querySelector('#reviewSection').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

document.querySelector('#startReview').addEventListener('click', () => {
  startReviewTest(reviewableCards(getDictionary(), true)
    .sort((a, b) => Date.parse(a.nextReview || 0) - Date.parse(b.nextReview || 0)));
});

document.querySelector('#testKanjiMyself').addEventListener('click', () => {
  startReviewTest(reviewableCards(getDictionary()).sort(() => Math.random() - .5), true);
});

document.querySelector('#exitReview').addEventListener('click', () => leaveReviewTest());
document.querySelector('#reviewNext').addEventListener('click', advancePassedReview);

document.querySelector('#forgotKanji').addEventListener('click', () => {
  if (!reviewActive || reviewMode === 'guided') return;
  const reviewed = reviewQueue[reviewIndex];
  const target = kanjiInWord(reviewed.character)[reviewCharacterIndex];
  reviewCardRating = combineReviewRating(reviewCardRating, 'again');
  reviewMode = 'guided';
  showReviewCard();
  const feedback = document.querySelector('#reviewFeedback');
  feedback.textContent = `The correct kanji is ${target}. Trace it using the guide.`;
  feedback.dataset.result = 'again';
  feedback.hidden = false;
});

document.querySelector('#checkDrawing').addEventListener('click', () => {
  const checkButton = document.querySelector('#checkDrawing');
  const feedback = document.querySelector('#reviewFeedback');
  if (!testk) {
    feedback.textContent = 'Draw a kanji first.';
    feedback.hidden = false;
    return;
  }
  const reviewed = reviewQueue[reviewIndex];
  const targets = kanjiInWord(reviewed.character);
  const target = targets[reviewCharacterIndex];
  const candidates = [...document.querySelectorAll('.candidate-list .kmatch')]
    .map(candidate => candidate.textContent.trim());
  const rating = SRS.classifyDrawing(target, testk, getStrokeDirections(), kanji, candidates, KANJIVG_DIRECTIONS);
  const attemptMode = reviewMode;
  const nextMode = SRS.nextReviewMode(attemptMode, rating);
  const messages = {
    good: `Correct: ${target}. The stroke order and direction are right.`,
    hard: `This is ${target}, but the stroke order or direction needs more practice.`,
    again: `Incorrect. The correct kanji is ${target}.`
  };
  feedback.textContent = rating === 'good' && attemptMode === 'guided'
    ? `Correct: ${target}. Now repeat it without the guide.`
    : messages[rating];
  feedback.dataset.result = rating;
  feedback.hidden = false;
  checkButton.disabled = true;

  if (attemptMode !== 'guided') reviewCardRating = combineReviewRating(reviewCardRating, rating);
  reviewAdvanceTimer = setTimeout(() => {
    if (nextMode === 'complete') {
      reviewCellImages[reviewCharacterIndex] = document.querySelector('#can').toDataURL('image/png', 1);
      if (reviewCharacterIndex < targets.length - 1) {
        reviewCharacterIndex += 1;
      } else {
        if (!reviewSelfTest) {
          const items = getDictionary();
          const storedIndex = items.findIndex(item => item.character === reviewed.character);
          if (storedIndex !== -1) items[storedIndex] = SRS.schedule(items[storedIndex], reviewCardRating);
          saveDictionary(items);
          renderDictionary();
        }
        renderReviewWordCells(targets);
        const pitchShown = renderPassedPitchAccent(reviewed);
        feedback.textContent = pitchShown
          ? 'Word passed. Review its reading and pitch accent.'
          : 'Word passed.';
        feedback.dataset.result = 'good';
        feedback.hidden = true;
        reviewMode = 'test';
        return;
      }
      reviewMode = 'test';
    } else {
      reviewMode = nextMode;
    }
    showReviewCard();
  }, 1200);
});

renderWordCells();
renderDictionary();
scheduleMidnightReviewRefresh();
ProgressSync.initialize({
  getLocalProgress: () => ({ dictionary: getDictionary(), dictionaryDeleted: getDictionaryDeletions() }),
  replaceLocalProgress: remote => {
    const deletions = remote.dictionaryDeleted || {};
    localStorage.setItem(DELETED_STORAGE_KEY, JSON.stringify(deletions));
    localStorage.setItem(STORAGE_KEY, JSON.stringify(mergeDictionary(remote.dictionary, deletions, [])));
    renderDictionary();
  },
  applyRemoteProgress: remote => {
    const deletions = mergeDictionaryDeletions(remote.dictionaryDeleted);
    localStorage.setItem(DELETED_STORAGE_KEY, JSON.stringify(deletions));
    localStorage.setItem(STORAGE_KEY, JSON.stringify(mergeDictionary(remote.dictionary, deletions)));
    renderDictionary();
  }
}).finally(() => window.I18n.ready);

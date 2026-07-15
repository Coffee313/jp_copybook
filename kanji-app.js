const STORAGE_KEY = 'kana-kanji-dictionary-v1';
const MEANING_CACHE_KEY = 'kana-kanji-meanings-v2';
const INPUT_MODE_COOKIE = 'kana-input-mode';
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
  let lastPenEventAt = 0;
  const stylusOnly = () => penOnlyToggle.checked;
  penOnlyToggle.checked = cookieValue(INPUT_MODE_COOKIE) === 'stylus';
  penOnlyToggle.addEventListener('change', () => {
    const mode = penOnlyToggle.checked ? 'stylus' : 'finger';
    document.cookie = `${encodeURIComponent(INPUT_MODE_COOKIE)}=${mode}; Max-Age=31536000; Path=/; SameSite=Lax`;
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

  ['pointerdown', 'pointermove', 'pointerup'].forEach(type => {
    canvas.addEventListener(type, event => {
      if (event.pointerType === 'pen') {
        lastPenEventAt = Date.now();
        return;
      }
      if (!stylusOnly()) return;
      event.preventDefault();
      event.stopImmediatePropagation();
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
      if (!stylusOnly() || Date.now() - lastPenEventAt < 1000) return;
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
  return readJson(STORAGE_KEY, []).map(({ pitchAccent, ...item }) => item);
}
function saveDictionary(items) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  window.ProgressSync?.flushSave();
}

function mergeDictionary(remoteItems = []) {
  const merged = new Map(remoteItems.map(item => [item.character, item]));
  getDictionary().forEach(localItem => {
    const remoteItem = merged.get(localItem.character);
    const localDate = Date.parse(localItem.lastReviewed || localItem.createdAt || 0) || 0;
    const remoteDate = Date.parse(remoteItem?.lastReviewed || remoteItem?.createdAt || 0) || 0;
    if (!remoteItem || localDate >= remoteDate) merged.set(localItem.character, localItem);
  });
  return [...merged.values()];
}

function toHiragana(value) {
  return String(value || '').replace(/[ァ-ヶ]/g, character => String.fromCharCode(character.charCodeAt(0) - 0x60));
}

function normalizeWordReading(value) {
  return toHiragana(value).replace(/[.・-]/g, '').trim();
}

function kanjiInWord(word) {
  return [...String(word || '')].filter(character => /[\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff]/u.test(character));
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
  document.querySelector('#noteInput').value = existing?.note || '';
  loadWordDetails(word);
  source?.scrollIntoView({ block: 'nearest' });
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
  try {
    const targetLanguage = document.documentElement.lang === 'ru' ? 'ru' : 'en';
    const result = await fetchJson(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(word)}&langpair=ja|${targetLanguage}`);
    meanings = [...new Set([result.responseData?.translatedText, ...(result.matches || []).map(match => match.translation)]
      .map(value => String(value || '').trim())
      .filter(Boolean))];
  } catch { /* Manual entry and the single-kanji fallback remain available. */ }
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
    button.addEventListener('click', () => { document.querySelector('#readingInput').value = reading; });
    readingSuggestions.append(button);
  });
  const readingInput = document.querySelector('#readingInput');
  if (!readingInput.value && readings.length) readingInput.value = readings[0];
  info.textContent = 'The reading applies to the complete word. Stroke order is shown above for each kanji.';
}

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
  try {
    const sourceLanguage = /[А-Яа-яЁё]/u.test(originalQuery) ? 'ru' : 'en';
    const result = await fetchJson(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(originalQuery)}&langpair=${sourceLanguage}|ja`);
    const suggestions = new Map();
    const translations = [result.responseData?.translatedText, ...(result.matches || []).map(match => match.translation)];
    translations.forEach(value => {
      const word = String(value || '').trim();
      const characters = kanjiInWord(word);
      if (!word || !characters.length || characters.length > 4 || suggestions.has(word)) return;
      suggestions.set(word, { word, characters });
    });
    [...suggestions.values()].slice(0, 12).forEach(suggestion => {
      const button = document.createElement('button');
      button.type = 'button';
      const word = document.createElement('strong');
      word.lang = 'ja';
      word.textContent = suggestion.word;
      const details = document.createElement('span');
      details.textContent = originalQuery;
      button.append(word, details);
      button.addEventListener('click', () => {
        resetWordBuilder(suggestion.characters.length);
        wordCharacters = [...suggestion.characters];
        activeWordIndex = 0;
        renderWordCells();
        selectWord(suggestion.word, button);
        document.querySelector('#translationInput').value = originalQuery;
        syncMeaningSuggestionState();
        wordLookupForm.hidden = true;
        toggleWordLookup.setAttribute('aria-expanded', 'false');
      });
      wordLookupResults.append(button);
    });
    wordLookupStatus.textContent = suggestions.size
      ? 'Choose the word you meant.'
      : 'No kanji words were found. Try a simpler meaning.';
  } catch {
    wordLookupStatus.textContent = 'Word lookup is unavailable right now. Please try again.';
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
  if (!selectedCharacter || !translation) return;
  const items = getDictionary();
  const existing = items.find(item => item.character === selectedCharacter);
  const card = {
    character: selectedCharacter,
    translation,
    reading,
    note: document.querySelector('#noteInput').value.trim(),
    createdAt: existing?.createdAt || new Date().toISOString(),
    nextReview: new Date().toISOString(),
    interval: existing?.interval || 0,
    ease: existing?.ease || 2.5,
    repetitions: existing?.repetitions || 0
  };
  if (existing) Object.assign(existing, card); else items.unshift(card);
  saveDictionary(items);
  renderDictionary();
  event.target.reset();
  document.querySelector('#kanjiForm').hidden = true;
  document.querySelector('#selectionEmpty').hidden = false;
  selectedCharacter = '';
  resetWordBuilder(wordLength);
});

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
    card.addEventListener('toggle', () => {
      if (!card.open) return;
      list.querySelectorAll('.dictionary-item[open]').forEach(other => {
        if (other !== card) other.removeAttribute('open');
      });
      requestAnimationFrame(() => positionDictionaryPopover(card));
    });
    card.addEventListener('pointerleave', () => {
      if (window.matchMedia('(hover: hover)').matches) card.removeAttribute('open');
    });
    const character = document.createElement('summary');
    character.className = 'character';
    character.classList.toggle('single-character', [...item.character].length === 1);
    character.textContent = item.character;
    const details = document.createElement('div');
    details.className = 'dictionary-popover';
    if (item.reading) {
      const reading = document.createElement('span');
      reading.className = 'dictionary-reading';
      reading.lang = 'ja';
      reading.textContent = toHiragana(item.reading);
      details.append(reading);
    }
    const meaning = document.createElement('strong');
    meaning.textContent = item.translation;
    const note = document.createElement('small');
    note.textContent = item.note || 'Ready for the first review';
    details.append(meaning, note);
    const remove = document.createElement('button');
    remove.className = 'dictionary-remove';
    remove.type = 'button';
    remove.setAttribute('aria-label', `Delete ${item.character}`);
    remove.textContent = '×';
    remove.addEventListener('click', event => {
      event.preventDefault();
      event.stopPropagation();
      saveDictionary(getDictionary().filter(entry => entry.character !== item.character));
      renderDictionary();
    });
    details.append(remove);
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

function updateReviewSummary(items = getDictionary()) {
  const kanjiCards = items.filter(item => [...item.character].length === 1);
  const due = kanjiCards.filter(item => SRS.isDue(item));
  const startButton = document.querySelector('#startReview');
  const selfTestButton = document.querySelector('#testKanjiMyself');
  document.querySelector('#dueCount').textContent = due.length;
  startButton.disabled = due.length === 0;
  selfTestButton.disabled = kanjiCards.length === 0;
  document.querySelector('#reviewEmpty').textContent = kanjiCards.length
    ? (due.length ? `${due.length} ${due.length === 1 ? 'card is' : 'cards are'} ready for review.` : 'All reviews are complete for today. Come back later.')
    : (items.length ? 'Whole words are saved in vocabulary. Add a one-kanji card to use drawing review.' : 'Add cards to your dictionary and new kanji will appear here immediately.');
}

function showReviewCard() {
  const reviewCard = document.querySelector('#reviewCard');
  const empty = document.querySelector('#reviewEmpty');
  if (reviewIndex >= reviewQueue.length) {
    const completedSelfTest = reviewSelfTest;
    reviewActive = false;
    reviewSelfTest = false;
    const recognizer = document.querySelector('.recognizer-card');
    const drawPanel = document.querySelector('.draw-panel');
    const candidatePanel = document.querySelector('.candidate-panel');
    recognizer.insertBefore(drawPanel, candidatePanel);
    recognizer.hidden = false;
    candidatePanel.hidden = false;
    reviewCard.hidden = true;
    empty.hidden = false;
    updateReviewSummary();
    empty.textContent = completedSelfTest
      ? 'Self-test complete. Your review schedule was not changed.'
      : 'Review complete. Your next review schedule has been saved.';
    return;
  }

  const card = reviewQueue[reviewIndex];
  reviewActive = true;
  empty.hidden = true;
  reviewCard.hidden = false;
  document.querySelector('#reviewProgress').textContent = `Card ${reviewIndex + 1} of ${reviewQueue.length}`;
  document.querySelector('#reviewTranslation').textContent = card.translation;
  const prompt = document.querySelector('.review-prompt');
  const guide = document.querySelector('#reviewStrokeGuide');
  renderStrokeGuide(guide, card.character);
  guide.hidden = reviewMode !== 'guided' || !KANJIVG_STROKES[card.character];
  document.querySelector('#forgotKanji').hidden = reviewMode === 'guided';
  prompt.textContent = reviewMode === 'guided'
    ? 'Trace the kanji using the guide. After a correct attempt, you will write it once more without help.'
    : reviewMode === 'confirm'
      ? 'Now write the same kanji once more without the guide.'
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
  reviewMode = 'test';
  document.querySelector('#reviewCanvasHost').append(document.querySelector('.draw-panel'));
  document.querySelector('.recognizer-card').hidden = true;
  document.querySelector('.candidate-panel').hidden = true;
  showReviewCard();
  document.querySelector('#reviewSection').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

document.querySelector('#startReview').addEventListener('click', () => {
  startReviewTest(getDictionary()
    .filter(item => [...item.character].length === 1 && SRS.isDue(item))
    .sort((a, b) => Date.parse(a.nextReview || 0) - Date.parse(b.nextReview || 0)));
});

document.querySelector('#testKanjiMyself').addEventListener('click', () => {
  startReviewTest(getDictionary().filter(item => [...item.character].length === 1).sort(() => Math.random() - .5), true);
});

document.querySelector('#forgotKanji').addEventListener('click', () => {
  if (!reviewActive || reviewMode === 'guided') return;
  const reviewed = reviewQueue[reviewIndex];
  if (!reviewSelfTest) {
    const items = getDictionary();
    const storedIndex = items.findIndex(item => item.character === reviewed.character);
    if (storedIndex !== -1) items[storedIndex] = SRS.schedule(items[storedIndex], 'again');
    saveDictionary(items);
    renderDictionary();
  }
  reviewMode = 'guided';
  showReviewCard();
  const feedback = document.querySelector('#reviewFeedback');
  feedback.textContent = `The correct kanji is ${reviewed.character}. Trace it using the guide.`;
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
  const candidates = [...document.querySelectorAll('.candidate-list .kmatch')]
    .map(candidate => candidate.textContent.trim());
  const rating = SRS.classifyDrawing(reviewed.character, testk, getStrokeDirections(), kanji, candidates, KANJIVG_DIRECTIONS);
  const attemptMode = reviewMode;
  const nextMode = SRS.nextReviewMode(attemptMode, rating);
  const messages = {
    good: `Correct: ${reviewed.character}. The stroke order and direction are right.`,
    hard: `This is ${reviewed.character}, but the stroke order or direction needs more practice.`,
    again: `Incorrect. The correct kanji is ${reviewed.character}.`
  };
  feedback.textContent = rating === 'good' && attemptMode === 'guided'
    ? `Correct: ${reviewed.character}. Now repeat it without the guide.`
    : messages[rating];
  feedback.dataset.result = rating;
  feedback.hidden = false;
  checkButton.disabled = true;

  if (attemptMode !== 'guided' && !reviewSelfTest) {
    const items = getDictionary();
    const storedIndex = items.findIndex(item => item.character === reviewed.character);
    if (storedIndex !== -1) items[storedIndex] = SRS.schedule(items[storedIndex], rating);
    saveDictionary(items);
    renderDictionary();
  }
  setTimeout(() => {
    if (nextMode === 'complete') {
      reviewIndex += 1;
      reviewMode = 'test';
    } else {
      reviewMode = nextMode;
    }
    showReviewCard();
  }, 1200);
});

renderWordCells();
renderDictionary();
ProgressSync.initialize({
  getLocalProgress: () => ({ dictionary: getDictionary() }),
  replaceLocalProgress: remote => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(remote.dictionary || []));
    renderDictionary();
  },
  applyRemoteProgress: remote => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(mergeDictionary(remote.dictionary)));
    renderDictionary();
  }
}).finally(() => window.I18n.ready);

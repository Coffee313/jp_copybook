const STORAGE_KEY = 'kana-kanji-dictionary-v1';
const MEANING_CACHE_KEY = 'kana-kanji-meanings-v2';
const INPUT_MODE_COOKIE = 'kana-input-mode';
const MOBILE_MODE_KEY = 'japanese-copybook-mobile-version-v1';
const MOBILE_SUGGESTION_SESSION_KEY = 'japanese-copybook-mobile-suggestion-dismissed-v2';
const MOBILE_SCREEN_QUERY = '(max-width: 760px), (max-height: 600px) and (pointer: coarse)';
let selectedCharacter = '';
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

const readJson = (key, fallback) => {
  try { return JSON.parse(localStorage.getItem(key)) || fallback; }
  catch { return fallback; }
};

function getDictionary() { return readJson(STORAGE_KEY, []); }
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

function selectKanji(character, source) {
  selectedCharacter = character;
  document.querySelectorAll('.kmatch').forEach(item => item.classList.toggle('selected', item.textContent.trim() === character));
  document.querySelector('#selectionEmpty').hidden = true;
  document.querySelector('#kanjiForm').hidden = false;
  document.querySelector('#selectedKanji').textContent = character;
  renderStrokeGuide(document.querySelector('#addStrokeExample'), character);
  document.querySelector('#translationInput').value = '';
  document.querySelector('#noteInput').value = '';
  loadMeanings(character);
  source?.scrollIntoView({ block: 'nearest' });
}

async function loadMeanings(character) {
  const suggestions = document.querySelector('#meaningSuggestions');
  const info = document.querySelector('#readingInfo');
  const cache = readJson(MEANING_CACHE_KEY, {});
  suggestions.innerHTML = '<span>Looking up meanings…</span>';
  info.textContent = '';
  let data = cache[character];
  if (!data) {
    try {
      data = await fetchJson(`https://kanjiapi.dev/v1/kanji/${encodeURIComponent(character)}`);
    } catch {
      data = {};
    }
  }
  if (selectedCharacter !== character) return;
  const meanings = ENGLISH_MEANINGS[character] || data.meanings || [];
  if (selectedCharacter !== character) return;
  cache[character] = data;
  localStorage.setItem(MEANING_CACHE_KEY, JSON.stringify(cache));
  suggestions.innerHTML = '';
  meanings.slice(0, 8).forEach(meaning => {
    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = meaning;
    button.addEventListener('click', () => { document.querySelector('#translationInput').value = meaning; });
    suggestions.append(button);
  });
  if (!meanings.length) {
    suggestions.innerHTML = '<span>No suggested meanings are available for this kanji. Enter one manually.</span>';
  }
  const on = data.on_readings?.length ? `On: ${data.on_readings.join('、')}` : '';
  const kun = data.kun_readings?.length ? `Kun: ${data.kun_readings.join('、')}` : '';
  info.textContent = [on, kun, data.stroke_count ? `Strokes: ${data.stroke_count}` : ''].filter(Boolean).join(' · ');
}

document.addEventListener('click', event => {
  const candidate = event.target.closest('.kmatch');
  if (!candidate || reviewActive) return;
  event.preventDefault();
  selectKanji(candidate.textContent.trim(), candidate);
});

const candidateObserver = new MutationObserver(() => {
  const hasCandidates = [...document.querySelectorAll('.candidate-list')].some(list => list.textContent.trim());
  document.querySelector('#emptyCandidates').hidden = hasCandidates;
});
document.querySelectorAll('.candidate-list').forEach(list => candidateObserver.observe(list, { childList: true, subtree: true }));

document.querySelector('#kanjiForm').addEventListener('submit', event => {
  event.preventDefault();
  const translation = document.querySelector('#translationInput').value.trim();
  if (!selectedCharacter || !translation) return;
  const items = getDictionary();
  const existing = items.find(item => item.character === selectedCharacter);
  const card = {
    character: selectedCharacter,
    translation,
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
});

function renderDictionary() {
  const list = document.querySelector('#dictionaryList');
  const allItems = getDictionary();
  const items = window.KanjiVocabulary?.filterItems(allItems, document.querySelector('#dictionarySearch').value) || allItems;
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
      : 'Your dictionary is empty. Draw your first kanji and add a meaning.';
    list.append(empty);
    return;
  }
  items.forEach(item => {
    const card = document.createElement('article');
    card.className = 'dictionary-item';
    const character = document.createElement('span');
    character.className = 'character';
    character.textContent = item.character;
    const details = document.createElement('div');
    const meaning = document.createElement('strong');
    meaning.textContent = item.translation;
    const note = document.createElement('small');
    note.textContent = item.note || 'Ready for the first review';
    details.append(meaning, note);
    const remove = document.createElement('button');
    remove.type = 'button';
    remove.setAttribute('aria-label', `Delete ${item.character}`);
    remove.textContent = '×';
    remove.addEventListener('click', () => {
      saveDictionary(getDictionary().filter(entry => entry.character !== item.character));
      renderDictionary();
    });
    card.append(character, details, remove);
    list.append(card);
  });
}

const dictionaryDialog = document.querySelector('#dictionaryDialog');
const dictionarySearch = document.querySelector('#dictionarySearch');
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
  const due = items.filter(item => SRS.isDue(item));
  const startButton = document.querySelector('#startReview');
  const selfTestButton = document.querySelector('#testKanjiMyself');
  document.querySelector('#dueCount').textContent = due.length;
  startButton.disabled = due.length === 0;
  selfTestButton.disabled = items.length === 0;
  document.querySelector('#reviewEmpty').textContent = items.length
    ? (due.length ? `${due.length} ${due.length === 1 ? 'card is' : 'cards are'} ready for review.` : 'All reviews are complete for today. Come back later.')
    : 'Add cards to your dictionary and new kanji will appear here immediately.';
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
    .filter(item => SRS.isDue(item))
    .sort((a, b) => Date.parse(a.nextReview || 0) - Date.parse(b.nextReview || 0)));
});

document.querySelector('#testKanjiMyself').addEventListener('click', () => {
  startReviewTest([...getDictionary()].sort(() => Math.random() - .5), true);
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

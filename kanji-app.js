const STORAGE_KEY = 'kana-kanji-dictionary-v1';
const MEANING_CACHE_KEY = 'kana-kanji-meanings-v2';
let selectedCharacter = '';
let reviewQueue = [];
let reviewIndex = 0;
let reviewActive = false;
let reviewMode = 'test';

async function fetchJson(url, timeout = 5000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);
  try {
    const response = await fetch(url, { signal: controller.signal });
    if (!response.ok) throw new Error(`Request failed: ${response.status}`);
    return await response.json();
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
  window.ProgressSync?.queueSave();
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
  const items = getDictionary();
  updateReviewSummary(items);
  document.querySelector('#dictionaryCount').textContent = `${items.length} ${items.length === 1 ? 'card' : 'cards'}`;
  list.innerHTML = '';
  if (!items.length) {
    list.innerHTML = '<p class="dictionary-empty">Your dictionary is empty. Draw your first kanji and add a meaning.</p>';
    return;
  }
  items.forEach(item => {
    const card = document.createElement('article');
    card.className = 'dictionary-item';
    card.innerHTML = `<span class="character">${item.character}</span><div><strong>${item.translation}</strong><small>${item.note || 'Ready for the first review'}</small></div><button type="button" aria-label="Delete ${item.character}">×</button>`;
    card.querySelector('button').addEventListener('click', () => {
      saveDictionary(getDictionary().filter(entry => entry.character !== item.character));
      renderDictionary();
    });
    list.append(card);
  });
}

function updateReviewSummary(items = getDictionary()) {
  const due = items.filter(item => SRS.isDue(item));
  const startButton = document.querySelector('#startReview');
  document.querySelector('#dueCount').textContent = due.length;
  startButton.disabled = due.length === 0;
  document.querySelector('#reviewEmpty').textContent = items.length
    ? (due.length ? `${due.length} ${due.length === 1 ? 'card is' : 'cards are'} ready for review.` : 'All reviews are complete for today. Come back later.')
    : 'Add cards to your dictionary and new kanji will appear here immediately.';
}

function showReviewCard() {
  const reviewCard = document.querySelector('#reviewCard');
  const empty = document.querySelector('#reviewEmpty');
  if (reviewIndex >= reviewQueue.length) {
    reviewActive = false;
    const recognizer = document.querySelector('.recognizer-card');
    const drawPanel = document.querySelector('.draw-panel');
    const candidatePanel = document.querySelector('.candidate-panel');
    recognizer.insertBefore(drawPanel, candidatePanel);
    recognizer.hidden = false;
    candidatePanel.hidden = false;
    reviewCard.hidden = true;
    empty.hidden = false;
    empty.textContent = 'Review complete. Your next review schedule has been saved.';
    updateReviewSummary();
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

document.querySelector('#startReview').addEventListener('click', () => {
  reviewQueue = getDictionary()
    .filter(item => SRS.isDue(item))
    .sort((a, b) => Date.parse(a.nextReview || 0) - Date.parse(b.nextReview || 0));
  reviewIndex = 0;
  reviewMode = 'test';
  document.querySelector('#reviewCanvasHost').append(document.querySelector('.draw-panel'));
  document.querySelector('.recognizer-card').hidden = true;
  document.querySelector('.candidate-panel').hidden = true;
  showReviewCard();
  document.querySelector('#reviewSection').scrollIntoView({ behavior: 'smooth', block: 'start' });
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

  if (attemptMode !== 'guided') {
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
  applyRemoteProgress: remote => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(mergeDictionary(remote.dictionary)));
    renderDictionary();
  }
});

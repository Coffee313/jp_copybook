const STORAGE_KEY = 'kana-kanji-dictionary-v1';
const MEANING_CACHE_KEY = 'kana-kanji-meanings-v1';
const SRS_DAY_OFFSET_KEY = 'kana-kanji-srs-day-offset-v1';
let selectedCharacter = '';
const meaningRequests = new Map();
let reviewQueue = [];
let reviewIndex = 0;
let reviewActive = false;

function getDayOffset() {
  const value = Number(localStorage.getItem(SRS_DAY_OFFSET_KEY));
  return Number.isInteger(value) && value >= 0 ? value : 0;
}

function currentSrsTime() { return SRS.simulatedNow(getDayOffset()); }

function renderSimulatedDate() {
  const offset = getDayOffset();
  document.querySelector('#simulatedDate').textContent = currentSrsTime().toLocaleDateString('ru-RU');
  document.querySelector('#dayOffsetLabel').textContent = offset ? `+${offset} ${offset === 1 ? 'день' : 'дн.'}` : 'Сегодня';
  document.querySelector('#resetDayOffset').disabled = offset === 0;
}

function changeDayOffset(days) {
  localStorage.setItem(SRS_DAY_OFFSET_KEY, String(Math.max(0, getDayOffset() + days)));
  renderSimulatedDate();
  updateReviewSummary();
}

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

// Частые кандзи доступны без сети. Для остальных значений используем
// KanjiAPI и переводим их на русский, после чего сохраняем в локальный кэш.
const RUSSIAN_MEANINGS = {
  '一':['один'], '二':['два'], '三':['три'], '四':['четыре'], '五':['пять'],
  '六':['шесть'], '七':['семь'], '八':['восемь'], '九':['девять'], '十':['десять'],
  '日':['день','солнце'], '月':['месяц','луна'], '火':['огонь'], '水':['вода'],
  '木':['дерево'], '金':['золото','деньги'], '土':['земля','почва'], '山':['гора'],
  '川':['река'], '田':['рисовое поле'], '人':['человек'], '子':['ребёнок'],
  '女':['женщина'], '男':['мужчина'], '父':['отец'], '母':['мать'], '友':['друг'],
  '私':['я','частный'], '先':['впереди','предыдущий'], '生':['жизнь','рождение'],
  '学':['учёба','изучать'], '校':['школа'], '本':['книга','основа'], '語':['язык','слово'],
  '年':['год'], '時':['время','час'], '分':['минута','часть'], '今':['сейчас'],
  '上':['верх','подниматься'], '下':['низ','опускаться'], '中':['середина','внутри'],
  '大':['большой'], '小':['маленький'], '長':['длинный','начальник'], '高':['высокий','дорогой'],
  '新':['новый'], '古':['старый'], '白':['белый'], '黒':['чёрный'], '赤':['красный'],
  '青':['синий','голубой'], '行':['идти','движение'], '来':['приходить'], '見':['видеть'],
  '聞':['слышать','спрашивать'], '話':['говорить','разговор'], '読':['читать'], '書':['писать'],
  '食':['есть','еда'], '飲':['пить'], '買':['покупать'], '車':['машина'], '電':['электричество'],
  '国':['страна'], '家':['дом','семья'], '店':['магазин'], '駅':['станция'], '道':['дорога','путь'],
  '何':['что'], '名':['имя'], '気':['дух','настроение'], '雨':['дождь'], '空':['небо','пустота']
};

const readJson = (key, fallback) => {
  try { return JSON.parse(localStorage.getItem(key)) || fallback; }
  catch { return fallback; }
};

function getDictionary() { return readJson(STORAGE_KEY, []); }
function saveDictionary(items) { localStorage.setItem(STORAGE_KEY, JSON.stringify(items)); }

function selectKanji(character, source) {
  selectedCharacter = character;
  document.querySelectorAll('.kmatch').forEach(item => item.classList.toggle('selected', item.textContent.trim() === character));
  document.querySelector('#selectionEmpty').hidden = true;
  document.querySelector('#kanjiForm').hidden = false;
  document.querySelector('#selectedKanji').textContent = character;
  document.querySelector('#translationInput').value = '';
  document.querySelector('#noteInput').value = '';
  loadMeanings(character);
  source?.scrollIntoView({ block: 'nearest' });
}

async function loadMeanings(character) {
  const suggestions = document.querySelector('#meaningSuggestions');
  const info = document.querySelector('#readingInfo');
  const cache = readJson(MEANING_CACHE_KEY, {});
  suggestions.innerHTML = '<span>Ищем варианты перевода…</span>';
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
  let russianMeanings = RUSSIAN_MEANINGS[character] || data.russianMeanings || [];
  if (!russianMeanings.length && data.meanings?.length) {
    const translations = data.meanings.slice(0, 6).map(meaning => {
      const requestKey = meaning.toLowerCase();
      let request = meaningRequests.get(requestKey);
      if (!request) {
        const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(meaning)}&langpair=en|ru`;
        request = fetchJson(url).then(result => result.responseData?.translatedText?.trim()).catch(() => null);
        meaningRequests.set(requestKey, request);
        request.finally(() => meaningRequests.delete(requestKey));
      }
      return request.then(translation => {
        if (!translation || selectedCharacter !== character) return translation;
        if (!suggestions.querySelector('button')) suggestions.innerHTML = '';
        const button = document.createElement('button');
        button.type = 'button';
        button.textContent = translation;
        button.addEventListener('click', () => { document.querySelector('#translationInput').value = translation; });
        suggestions.append(button);
        return translation;
      });
    });
    russianMeanings = (await Promise.all(translations)).filter(Boolean);
  }
  if (selectedCharacter !== character) return;
  data.russianMeanings = russianMeanings;
  cache[character] = data;
  localStorage.setItem(MEANING_CACHE_KEY, JSON.stringify(cache));
  suggestions.innerHTML = '';
  russianMeanings.slice(0, 8).forEach(meaning => {
    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = meaning;
    button.addEventListener('click', () => { document.querySelector('#translationInput').value = meaning; });
    suggestions.append(button);
  });
  if (!russianMeanings.length) {
    suggestions.innerHTML = '<span>Для этого кандзи пока нет русских подсказок. Введите перевод вручную.</span>';
  }
  const on = data.on_readings?.length ? `Он: ${data.on_readings.join('、')}` : '';
  const kun = data.kun_readings?.length ? `Кун: ${data.kun_readings.join('、')}` : '';
  info.textContent = [on, kun, data.stroke_count ? `Штрихов: ${data.stroke_count}` : ''].filter(Boolean).join(' · ');
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
    createdAt: existing?.createdAt || currentSrsTime().toISOString(),
    nextReview: currentSrsTime().toISOString(),
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
  document.querySelector('#dictionaryCount').textContent = `${items.length} ${items.length === 1 ? 'карточка' : 'карточек'}`;
  list.innerHTML = '';
  if (!items.length) {
    list.innerHTML = '<p class="dictionary-empty">Словарь пока пуст. Нарисуйте первый кандзи и добавьте перевод.</p>';
    return;
  }
  items.forEach(item => {
    const card = document.createElement('article');
    card.className = 'dictionary-item';
    card.innerHTML = `<span class="character">${item.character}</span><div><strong>${item.translation}</strong><small>${item.note || 'Готов к первому повторению'}</small></div><button type="button" aria-label="Удалить ${item.character}">×</button>`;
    card.querySelector('button').addEventListener('click', () => {
      saveDictionary(getDictionary().filter(entry => entry.character !== item.character));
      renderDictionary();
    });
    list.append(card);
  });
}

function updateReviewSummary(items = getDictionary()) {
  const due = items.filter(item => SRS.isDue(item, currentSrsTime()));
  const startButton = document.querySelector('#startReview');
  document.querySelector('#dueCount').textContent = due.length;
  startButton.disabled = due.length === 0;
  document.querySelector('#reviewEmpty').textContent = items.length
    ? (due.length ? `${due.length} карточек готовы к повторению.` : 'На сегодня всё повторено. Возвращайтесь позже.')
    : 'Добавьте карточки в словарь — новые кандзи сразу появятся здесь.';
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
    empty.textContent = 'Тест завершён. Расписание следующих повторений сохранено.';
    updateReviewSummary();
    return;
  }

  const card = reviewQueue[reviewIndex];
  reviewActive = true;
  empty.hidden = true;
  reviewCard.hidden = false;
  document.querySelector('#reviewProgress').textContent = `Карточка ${reviewIndex + 1} из ${reviewQueue.length}`;
  document.querySelector('#reviewTranslation').textContent = card.translation;
  const feedback = document.querySelector('#reviewFeedback');
  feedback.hidden = true;
  feedback.removeAttribute('data-result');
  document.querySelector('#checkDrawing').disabled = false;
  erase();
}

document.querySelector('#startReview').addEventListener('click', () => {
  reviewQueue = getDictionary()
    .filter(item => SRS.isDue(item, currentSrsTime()))
    .sort((a, b) => Date.parse(a.nextReview || 0) - Date.parse(b.nextReview || 0));
  reviewIndex = 0;
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
    feedback.textContent = 'Сначала нарисуйте кандзи.';
    feedback.hidden = false;
    return;
  }
  const reviewed = reviewQueue[reviewIndex];
  const candidates = [...document.querySelectorAll('.candidate-list .kmatch')]
    .map(candidate => candidate.textContent.trim());
  const rating = SRS.classifyDrawing(reviewed.character, testk, dir_count, kanji, candidates);
  const messages = {
    good: `Верно: ${reviewed.character}. Порядок и направление штрихов правильные.`,
    hard: `Это ${reviewed.character}, но порядок или направление штрихов нужно повторить.`,
    again: `Неверно. Правильный кандзи: ${reviewed.character}.`
  };
  feedback.textContent = messages[rating];
  feedback.dataset.result = rating;
  feedback.hidden = false;
  checkButton.disabled = true;

  const items = getDictionary();
  const storedIndex = items.findIndex(item => item.character === reviewed.character);
  if (storedIndex !== -1) items[storedIndex] = SRS.schedule(items[storedIndex], rating, currentSrsTime());
  saveDictionary(items);
  renderDictionary();
  setTimeout(() => {
    if (SRS.shouldAdvanceReview(rating)) reviewIndex += 1;
    showReviewCard();
  }, 1200);
});

document.querySelector('#advanceOneDay').addEventListener('click', () => changeDayOffset(1));
document.querySelector('#advanceTwoDays').addEventListener('click', () => changeDayOffset(2));
document.querySelector('#resetDayOffset').addEventListener('click', () => {
  localStorage.removeItem(SRS_DAY_OFFSET_KEY);
  renderSimulatedDate();
  updateReviewSummary();
});

renderSimulatedDate();
renderDictionary();

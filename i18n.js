(function () {
  const COOKIE_NAME = 'japanese-copybook-language';
  const STORAGE_KEY = 'japanese-copybook-language-v2';
  const supported = new Set(['en', 'ru']);
  const russian = {
    'Kana': 'Кана',
    'Kanji': 'Кандзи',
    'Concentration mode': 'Режим концентрации',
    'Tutorial': 'Обучение',
    'Start tutorial': 'Запустить обучение',
    'Feedback': 'Обратная связь',
    'Copybook mode': 'Режим прописи',
    'Exit copybook mode': 'Выйти из режима прописи',
    'Mobile version': 'Мобильная версия',
    'Exit mobile version': 'Выйти из мобильной версии',
    'Small screen detected. Mobile version gives you one large practice cell.': 'Обнаружен небольшой экран. В мобильной версии доступна одна большая клетка для практики.',
    'Small screen detected. Mobile version gives you larger drawing controls.': 'Обнаружен небольшой экран. В мобильной версии элементы для рисования крупнее.',
    'Use mobile version': 'Включить мобильную версию',
    'Use mobile version?': 'Включить мобильную версию?',
    'Dismiss mobile suggestion': 'Закрыть предложение мобильной версии',
    'Skip tour': 'Пропустить',
    'Back': 'Назад',
    'Next': 'Далее',
    'Done': 'Готово',
    'Choose Kana or Kanji': 'Выберите кану или кандзи',
    'Use these tabs to move between kana practice and the kanji dictionary.': 'Используйте эти вкладки, чтобы переключаться между практикой каны и словарём кандзи.',
    'Choose a script': 'Выберите азбуку',
    'Switch between Hiragana and Katakana practice at any time.': 'Переключайтесь между практикой хираганы и катаканы в любое время.',
    'Use copybook mode': 'Используйте режим прописи',
    'Turn on copybook mode to choose and practise any kana outside the guided learning path.': 'Включите режим прописи, чтобы выбрать и практиковать любой знак каны вне программы обучения.',
    'Practice handwriting': 'Практикуйте письмо',
    'Follow the guide and draw in every cell. Mobile version gives you one large reusable cell.': 'Следуйте образцу и пишите в каждой клетке. В мобильной версии доступна одна большая многоразовая клетка.',
    'Take tests': 'Проходите тесты',
    'A test starts automatically after you finish a row. You can also test new or mastered kana here.': 'Тест запускается автоматически после завершения ряда. Здесь также можно проверить новые или освоенные знаки.',
    'Use concentration mode': 'Используйте режим концентрации',
    'Open a distraction-free fullscreen practice view. The controls move around phone camera cutouts.': 'Откройте полноэкранный режим практики без отвлекающих элементов. Кнопки располагаются по сторонам от камеры телефона.',
    'Draw a kanji': 'Нарисуйте кандзи',
    'Write a kanji in this large area. Stroke order and direction improve recognition.': 'Напишите кандзи в большой области. Правильный порядок и направление черт улучшают распознавание.',
    'Choose a match': 'Выберите совпадение',
    'Select the matching kanji from the recognition results, then add its meaning.': 'Выберите подходящий кандзи в результатах распознавания, затем добавьте его значение.',
    'Review your kanji': 'Повторяйте кандзи',
    'Start tests here to review saved kanji with spaced repetition.': 'Запускайте здесь тесты для интервального повторения сохранённых кандзи.',
    'Open a distraction-free fullscreen drawing view with camera-safe controls.': 'Откройте полноэкранный режим рисования без отвлекающих элементов и с кнопками по сторонам от камеры.',
    'Stylus only': 'Только стилус',
    'Sign In': 'Войти',
    'Cloud progress': 'Синхронизация прогресса',
    'Your account': 'Ваш аккаунт',
    'Profile settings': 'Настройки профиля',
    'Sign in or create an account to save your test results.': 'Войдите или создайте аккаунт, чтобы сохранять результаты.',
    'Sign in or create an account to save your dictionary and review schedule.': 'Войдите или создайте аккаунт, чтобы сохранять словарь и расписание повторений.',
    'Email': 'Электронная почта',
    'Password': 'Пароль',
    'Sign in': 'Войти',
    'Create account': 'Создать аккаунт',
    'Reset password': 'Сбросить пароль',
    'New password': 'Новый пароль',
    'Save new password': 'Сохранить новый пароль',
    'Statistics': 'Статистика',
    'Reset progress': 'Сбросить прогресс',
    'Language': 'Язык',
    'Logout': 'Выйти',
    'Choose which kana learning path to restart. This cannot be undone.': 'Выберите, для какой азбуки сбросить прогресс. Это действие нельзя отменить.',
    'Reset Hiragana': 'Сбросить прогресс хираганы',
    'Reset Katakana': 'Сбросить прогресс катаканы',
    'English': 'English',
    'Russian': 'Русский',
    'Choose language': 'Выберите язык',
    'You can change the language later in Profile settings.': 'Язык можно изменить позже в настройках профиля.',
    'Welcome': 'Добро пожаловать',
    'How will you practise?': 'Как вы будете практиковаться?',
    'Choose your drawing input. You can change this later in Profile settings.': 'Выберите способ ввода. Его можно изменить позже в настройках профиля.',
    'Stylus': 'Стилус',
    'Input mode': 'Способ ввода',
    'Choose which drawing input the copybook accepts.': 'Выберите способ ввода для прописей.',
    'Ignore finger and palm touches': 'Игнорировать касания пальцами и ладонью',
    'Finger / mouse': 'Палец или мышь',
    'Draw using touch or a mouse': 'Рисовать пальцем или мышью',
    'What is your kana level?': 'Насколько хорошо вы знаете кану?',
    'We will use a short check to place you at the right point in the learning path.': 'Короткая проверка поможет выбрать подходящее место в программе обучения.',
    'Beginner': 'Начинающий',
    'Start learning from the vowel row': 'Начать с ряда гласных',
    'Intermediate': 'Средний уровень',
    'Draw 8 basic kana without hints': 'Написать 8 базовых знаков без подсказок',
    'Master of Kana': 'Мастер каны',
    'Draw 16 basic and voiced kana without hints': 'Написать 16 базовых и озвончённых знаков без подсказок',
    'Placement complete': 'Определение уровня завершено',
    'Start learning': 'Начать обучение',
    'Save your level and learning progress across devices.': 'Сохраните свой уровень и прогресс обучения, чтобы продолжать занятия на разных устройствах.',
    'Create account or sign in': 'Создать аккаунт или войти',
    'Kana mastery': 'Освоение каны',
    'Test new kanas': 'Проверить новые знаки',
    'Test myself': 'Проверить себя',
    'I know these kanas': 'Я знаю эти знаки',
    "I don't remember": 'Не помню',
    'End knowledge check': 'Завершить проверку знаний',
    'Knowledge check complete': 'Проверка знаний завершена',
    'Current learning row': 'Текущий ряд',
    'Vowels': 'Гласные',
    'Hiragana': 'Хирагана',
    'Katakana': 'Катакана',
    'Show guides in cells': 'Показывать образцы в клетках',
    'Clear drawings': 'Очистить поля',
    'Repeat the character in each cell': 'Напишите знак в каждой клетке',
    'Draw the kana in the large cell 14 times to make it ready for the test.': 'Напишите знак в большой клетке 14 раз, чтобы открыть тест.',
    'Choose any kana and practise freely': 'Выберите любой знак каны и тренируйтесь свободно',
    'Mastered kana': 'Освоенные знаки каны',
    'Pass learned-kana tests to build this list.': 'Пройдите тесты по изученным знакам, чтобы они появились здесь.',
    'Rotate your tablet to landscape for larger cells.': 'Поверните планшет горизонтально, чтобы увеличить размер клеток.',
    'Practice matters more than a perfect line.': 'Практика важнее идеальной линии.',
    'Progress is stored on this device': 'Прогресс хранится на этом устройстве',
    'Draw a kanji': 'Напишите кандзи',
    'Undo stroke': 'Отменить черту',
    'Clear': 'Очистить',
    'Candidates': 'Варианты',
    'What did you write?': 'Что вы написали?',
    'Choose the closest match. The best candidates appear first.': 'Выберите ближайший вариант. Лучшие совпадения показаны первыми.',
    'Exact match': 'Точное совпадение',
    'Similar': 'Похожие',
    'Other candidates': 'Другие варианты',
    'Partial match': 'Частичное совпадение',
    'Similar stroke set': 'Похожий набор черт',
    'Possibly a different order': 'Возможно, другой порядок',
    'Start writing and candidates will appear here.': 'Начните писать, и здесь появятся варианты.',
    'Choose a kanji': 'Выберите кандзи',
    'Confirm a candidate to see its meanings and add a card to your dictionary.': 'Подтвердите вариант, чтобы увидеть значения и добавить карточку в словарь.',
    'Build a vocabulary word': 'Составьте слово для словаря',
    'Kanji count': 'Количество кандзи',
    'Number of kanji': 'Количество кандзи',
    'Kanji in this word': 'Кандзи в этом слове',
    "I can't draw my word": 'Не могу написать слово',
    'Type the word in English, Russian, or Japanese': 'Введите слово на английском, русском или японском',
    'For example: school, школа, or がっこう': 'Например: school, школа или がっこう',
    'Find kanji': 'Найти кандзи',
    'Translating the Russian word for lookup…': 'Переводим русское слово для поиска…',
    'Looking for Japanese words…': 'Ищем японские слова…',
    'Choose the word you meant.': 'Выберите нужное слово.',
    'No kanji words were found. Try a simpler meaning.': 'Слова с кандзи не найдены. Попробуйте более простое значение.',
    'Word lookup is unavailable right now. Please try again.': 'Поиск слов сейчас недоступен. Попробуйте ещё раз.',
    'My dictionary': 'Мой словарь',
    'Search vocabulary': 'Поиск по словарю',
    'Search by word, reading, meaning, or note': 'Поиск по слову, чтению, значению или заметке',
    'No vocabulary matches your search.': 'По вашему запросу ничего не найдено.',
    'Export to Anki': 'Экспорт в Anki',
    'Meaning': 'Значение',
    'Main whole-word reading': 'Основное чтение слова целиком',
    'For example: みず': 'Например: みず',
    'Note': 'Заметка',
    'Add to dictionary': 'Добавить в словарь',
    'Stored on this device': 'Хранится на этом устройстве',
    'Review test': 'Тест повторения',
    'Spaced repetition': 'Интервальное повторение',
    'Start test': 'Начать тест',
    'Exit test': 'Выйти из теста',
    'Check writing': 'Проверить написание',
    'Draw the kanji for this meaning. Follow the correct stroke order and direction.': 'Напишите кандзи с этим значением, соблюдая порядок и направление черт.',
    'Recognition runs locally.': 'Распознавание работает на устройстве.',
    'In vocabulary': 'В словаре',
    'Not learned': 'Не изучено',
    'Learned a little': 'Немного изучено',
    'Learned well': 'Хорошо изучено',
    'Kana progress': 'Прогресс в изучении каны',
    'Kanji vocabulary': 'Словарь кандзи',
    'Placement': 'Определение уровня',
    'Cloud sync is on': 'Облачная синхронизация включена',
    'Progress saved': 'Прогресс сохранён',
    'Saving…': 'Сохранение…',
    'Password updated.': 'Пароль обновлён.',
    'Self-test complete': 'Самопроверка завершена',
    'Test complete': 'Тест завершён',
    'stroke order and directions': 'порядок и направление черт',
    'background example': 'силуэт знака',
    'blank background': 'без фона',
    'Sign in or create an account to save your learning progress.': 'Войдите или создайте аккаунт, чтобы сохранять учебный прогресс.',
    'Choose a new password for your account.': 'Выберите новый пароль для аккаунта.',
    'Sending password reset email…': 'Отправка письма для сброса пароля…',
    'Check your email for a password reset link.': 'Проверьте почту — мы отправили ссылку для сброса пароля.',
    'Saving new password…': 'Сохранение нового пароля…',
    'Creating account…': 'Создание аккаунта…',
    'Signing in…': 'Вход…',
    'Signed in.': 'Вход выполнен.',
    'Account created.': 'Аккаунт создан.',
    'Check your email to confirm your account.': 'Проверьте почту, чтобы подтвердить аккаунт.',
    'This password reset link has expired. Request a new one.': 'Срок действия ссылки для сброса пароля истёк. Запросите новую ссылку.',
    'Finger drawing is enabled.': 'Рисование пальцем включено.',
    'Stylus mode is active; palm touches are ignored.': 'Режим стилуса включён; касания ладонью игнорируются.',
    'All rows learned': 'Все ряды изучены',
    'Complete the remaining tests to master every kana.': 'Пройдите оставшиеся тесты, чтобы освоить всю кану.',
    'Dakuten rows are locked': 'Ряды с дакутэном заблокированы',
    'Self-test complete. Your review schedule was not changed.': 'Самопроверка завершена. Расписание повторений не изменилось.',
    'Review complete. Your next review schedule has been saved.': 'Повторение завершено. Новое расписание сохранено.',
    'All reviews are complete for today. Come back later.': 'Все повторения на сегодня завершены. Возвращайтесь позже.',
    'Add cards to your dictionary and new kanji will appear here immediately.': 'Добавьте карточки в словарь, и новые кандзи сразу появятся здесь.',
    'Your dictionary is empty. Build your first word and add its meaning.': 'Ваш словарь пуст. Составьте первое слово и добавьте его значение.',
    'Trace the kanji using the guide. After a correct attempt, you will write it once more without help.': 'Обведите кандзи по образцу. После правильной попытки напишите его ещё раз без помощи.',
    'Now write the same kanji once more without the guide.': 'Теперь напишите тот же кандзи ещё раз без образца.',
    'We will begin with the vowel row and build your kana step by step.': 'Начнём с ряда гласных и будем осваивать знаки каны шаг за шагом.',
    'Returning learner': 'Продолжающий обучение',
    'End test': 'Завершить тест',
    'End self-test': 'Завершить самопроверку',
    'Mastered kana will appear here.': 'Здесь появятся освоенные знаки каны.',
    'Complete learned-kana tests to unlock the next stage.': 'Пройдите тесты по изученным знакам, чтобы открыть следующий этап.',
    'Looking up meanings…': 'Загрузка значений…',
    'No suggested meaning was found for this word. Enter one manually.': 'Для этого слова не найдено подходящего значения. Введите его вручную.',
    'The reading applies to the complete word. Stroke order is shown above for each kanji.': 'Чтение относится ко всему слову. Порядок черт показан выше для каждого кандзи.',
    'Whole words are saved in vocabulary. Add a one-kanji card to use drawing review.': 'Целые слова сохранены в словаре. Для тренировки письма добавьте карточку из одного кандзи.',
    'Ready for the first review': 'Готово к первому повторению',
    'Draw a kanji first.': 'Сначала напишите кандзи.',
    'Open profile': 'Открыть профиль',
    'Sections': 'Разделы',
    'Enter concentration mode': 'Включить режим концентрации',
    'Exit concentration mode': 'Выйти из режима концентрации',
    'K row': 'Ряд K',
    'S row': 'Ряд S',
    'T row': 'Ряд T',
    'N row': 'Ряд N',
    'H row': 'Ряд H',
    'M row': 'Ряд M',
    'Y row': 'Ряд Y',
    'R row': 'Ряд R',
    'W row': 'Ряд W',
    'G row · dakuten': 'Ряд G · дакутэн',
    'Z row · dakuten': 'Ряд Z · дакутэн',
    'D row · dakuten': 'Ряд D · дакутэн',
    'B row · dakuten': 'Ряд B · дакутэн',
    'P row · handakuten': 'Ряд P · хандакутэн',
    'Continue in English': 'Продолжить на английском',
    'For example: water': 'Например, вода',
    'Reading, association, or example': 'Чтение, ассоциация или пример'
  };

  function cookieValue(name) {
    const prefix = `${encodeURIComponent(name)}=`;
    const item = document.cookie.split(';').map(value => value.trim()).find(value => value.startsWith(prefix));
    return item ? decodeURIComponent(item.slice(prefix.length)) : null;
  }

  let storedLanguage = null;
  try { storedLanguage = localStorage.getItem(STORAGE_KEY); }
  catch { storedLanguage = null; }
  const cookieLanguage = cookieValue(COOKIE_NAME);
  let language = supported.has(storedLanguage) ? storedLanguage : supported.has(cookieLanguage) ? cookieLanguage : null;
  let needsLanguageChoice = !supported.has(storedLanguage);
  let applying = false;
  let initializePromise = null;

  function translatedText(text) {
    if (language !== 'ru') return text;
    const trimmed = text.trim();
    if (!trimmed) return text;
    let translated = russian[trimmed];
    if (!translated) {
      const russianForm = (number, one, few, many) => {
        const value = Math.abs(Number(number));
        const lastTwo = value % 100;
        const last = value % 10;
        if (lastTwo >= 11 && lastTwo <= 14) return many;
        if (last === 1) return one;
        if (last >= 2 && last <= 4) return few;
        return many;
      };
      const patterns = [
        [/^Test new kanas · (\d+)$/, 'Проверить новые знаки · $1'],
        [/^Test myself · (\d+)$/, 'Проверить себя · $1'],
        [/^Knowledge check (\d+) of (\d+): write “(.+)” without hints$/, 'Проверка знаний $1 из $2: напишите «$3» без подсказок'],
        [/^Correction (\d+) of (\d+) · (.+)$/, (_, current, total, guide) => {
          const instructions = {
            'stroke order and directions': 'порядок и направление черт',
            'background example': 'образец на фоне',
            'blank background': 'без образца'
          };
          return `Исправление ${current} из ${total} · ${instructions[guide] || guide}`;
        }],
        [/^Step (\d+) of (\d+)$/, 'Шаг $1 из $2'],
        [/^(\d+) of (\d+) learned · fill every copybook cell in green$/, '$1 из $2 изучено · заполните все клетки правильно'],
        [/^(\d+) of (\d+) repetitions complete$/, '$1 из $2 повторений выполнено'],
        [/^(\d+) of (\d+) repetitions complete · draw the kana again$/, '$1 из $2 повторений выполнено · напишите знак ещё раз'],
        [/^Placement (\d+) of (\d+): write “(.+)” without hints$/, 'Определение уровня $1 из $2: напишите «$3» без подсказок'],
        [/^Test (\d+) of (\d+), layer (\d+) of (\d+): write “(.+)” with the (.+)$/, (_, current, total, layer, layerTotal, reading, guide) => {
          const instructions = {
            'stroke order and directions': 'с подсказками порядка и направления черт',
            'background example': 'с силуэтом знака',
            'blank background': 'без подсказок'
          };
          return `Тест ${current} из ${total}, этап ${layer} из ${layerTotal}: напишите «${reading}» ${instructions[guide] || guide}`;
        }],
        [/^Hiragana · (.+)$/, 'Хирагана · $1'],
        [/^Katakana · (.+)$/, 'Катакана · $1'],
        [/^Card (\d+) of (\d+)$/, 'Карточка $1 из $2'],
        [/^(\d+) cards$/, (_, count) => `${count} ${russianForm(count, 'карточка', 'карточки', 'карточек')}`],
        [/^(\d+) card$/, '$1 карточка'],
        [/^(\d+) (card is|cards are) ready for review\.$/, (_, count) => `К повторению ${Number(count) === 1 ? 'готова' : 'готовы'} ${count} ${russianForm(count, 'карточка', 'карточки', 'карточек')}.`],
        [/^Signed in as (.+)\. Your progress is synced across devices\.$/, 'Выполнен вход: $1. Прогресс синхронизируется между устройствами.'],
        [/^Open profile for (.+)$/, 'Открыть профиль: $1'],
        [/^(.+), stroke count: (\d+)$/, '$1, количество черт: $2'],
        [/^Strokes: (\d+)$/, (_, count) => `Черт: ${count}`],
        [/^On: (.+)$/, 'Он: $1'],
        [/^Kun: (.+)$/, 'Кун: $1'],
        [/^Delete (.+)$/, 'Удалить $1'],
        [/^Reset all (Hiragana|Katakana) learning progress\? This cannot be undone\.$/, (_, alphabet) => `Сбросить весь прогресс ${alphabet === 'Hiragana' ? 'хираганы' : 'катаканы'}? Это действие нельзя отменить.`],
        [/^Correct: (.+)\. The stroke order and direction are right\.$/, 'Верно: $1. Порядок и направление черт правильные.'],
        [/^This is (.+), but the stroke order or direction needs more practice\.$/, 'Это $1, но порядок или направление черт нужно отработать.'],
        [/^Incorrect\. The correct kanji is (.+)\.$/, 'Неверно. Правильный кандзи: $1.'],
        [/^The correct kanji is (.+)\. Trace it using the guide\.$/, 'Правильный кандзи: $1. Обведите его по образцу.'],
        [/^Correct: (.+)\. Now repeat it without the guide\.$/, 'Верно: $1. Теперь напишите его ещё раз без образца.'],
        [/^Good · (\d+)%$/, 'Хорошо · $1%'],
        [/^Good shape, wrong order · (\d+)%$/, 'Форма верная, порядок черт неверный · $1%'],
        [/^Wrong stroke direction · (\d+)%$/, 'Неверное направление черты · $1%'],
        [/^Shape needs work · (\d+)%$/, 'Нужно исправить форму · $1%'],
        [/^You drew (\d+) of (\d+) kana correctly\. Correct answers were added to Mastered kana\.$/, 'Вы правильно написали $1 из $2 знаков. Правильно написанные знаки добавлены в список освоенных.'],
        [/^Master (\d+) basic kana to unlock voiced sounds\.$/, (_, count) => `Освойте ${count} ${russianForm(count, 'базовый знак', 'базовых знака', 'базовых знаков')}, чтобы открыть озвончённые звуки.`]
      ];
      const match = patterns.find(([pattern]) => pattern.test(trimmed));
      if (match) translated = trimmed.replace(match[0], match[1]);
    }
    if (!translated) return text;
    return text.replace(trimmed, translated);
  }

  function staysInEnglish(node) {
    const element = node?.nodeType === Node.ELEMENT_NODE ? node : node?.parentElement;
    return Boolean(element?.closest?.('[data-language-static="en"]'));
  }

  function apply(root = document) {
    if (language !== 'ru' || applying) return;
    applying = true;
    const walker = document.createTreeWalker(root, window.NodeFilter?.SHOW_TEXT || 4);
    const nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    nodes.forEach(node => {
      if (node.parentElement?.matches('script, style, textarea') || staysInEnglish(node)) return;
      const value = translatedText(node.nodeValue);
      if (value !== node.nodeValue) node.nodeValue = value;
    });
    const elements = root.querySelectorAll ? [root, ...root.querySelectorAll('[placeholder], [title], [aria-label]')] : [];
    elements.forEach(element => {
      if (staysInEnglish(element)) return;
      ['placeholder', 'title', 'aria-label'].forEach(attribute => {
        if (!element?.hasAttribute?.(attribute)) return;
        const value = translatedText(element.getAttribute(attribute));
        element.setAttribute(attribute, value);
      });
    });
    document.documentElement.lang = 'ru';
    applying = false;
  }

  function setLanguage(value, reload = false) {
    if (!supported.has(value)) return;
    language = value;
    needsLanguageChoice = false;
    try { localStorage.setItem(STORAGE_KEY, value); }
    catch { /* Cookies remain available when local storage is restricted. */ }
    document.cookie = `${encodeURIComponent(COOKIE_NAME)}=${value}; Max-Age=31536000; Path=/; SameSite=Lax`;
    if (reload) {
      window.location.reload();
      return;
    }
    document.documentElement.lang = value;
    apply(document);
  }

  function bindSettings() {
    document.querySelectorAll('[data-language-setting]').forEach(button => {
      button.classList.toggle('active', button.dataset.languageSetting === language);
      if (button.dataset.languageBound) return;
      button.dataset.languageBound = 'true';
      button.addEventListener('click', () => {
        const nextLanguage = button.dataset.languageSetting;
        if (nextLanguage === language) return;
        setLanguage(nextLanguage, nextLanguage === 'en');
        bindSettings();
      });
    });
  }

  function initialize() {
    if (initializePromise) return initializePromise;
    initializePromise = new Promise(resolve => {
      bindSettings();
      if (language && !needsLanguageChoice) {
        apply(document);
        resolve(language);
        return;
      }
      const dialog = document.querySelector('#languageDialog');
      if (!dialog) {
        setLanguage('en');
        resolve(language);
        return;
      }
      dialog.addEventListener('cancel', event => event.preventDefault());
      dialog.querySelectorAll('[data-language-choice]').forEach(button => {
        button.addEventListener('click', () => {
          setLanguage(button.dataset.languageChoice);
          bindSettings();
          dialog.close();
          resolve(language);
        }, { once: true });
      });
      requestAnimationFrame(() => {
        try {
          if (!dialog.open) dialog.showModal();
        } catch {
          dialog.setAttribute('open', '');
        }
      });
    });
    return initializePromise;
  }

  new MutationObserver(records => {
    if (language !== 'ru' || applying) return;
    records.forEach(record => {
      if (record.type === 'characterData') {
        if (staysInEnglish(record.target)) return;
        const value = translatedText(record.target.nodeValue);
        if (value !== record.target.nodeValue) record.target.nodeValue = value;
      }
      record.addedNodes.forEach(node => {
      if (node.nodeType === Node.TEXT_NODE) {
        if (staysInEnglish(node)) return;
        const value = translatedText(node.nodeValue);
        if (value !== node.nodeValue) node.nodeValue = value;
      } else if (node.nodeType === Node.ELEMENT_NODE) apply(node);
      });
    });
  }).observe(document.documentElement, { childList: true, characterData: true, subtree: true });

  if (language) apply(document);
  window.I18n = { initialize, setLanguage, apply, translate: translatedText, get language() { return language || 'en'; } };
  window.I18n.ready = initialize();
})();

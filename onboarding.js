(function () {
  const PAGE = document.body.classList.contains('kanji-page') ? 'kanji' : 'kana';
  const STORAGE_KEY = `japanese-copybook-tour-${PAGE}-v3`;
  const isFrame = new URLSearchParams(window.location.search).has('concentration-frame');
  const steps = PAGE === 'kana' ? [
    {
      target: '.main-nav',
      title: 'Choose Kana or Kanji',
      text: 'Use these tabs to move between kana practice and the kanji dictionary.'
    },
    {
      target: '.header-script-switch',
      title: 'Choose a script',
      text: 'Switch between Hiragana and Katakana practice at any time.'
    },
    {
      target: '.sheet-wrap',
      title: 'Practice handwriting',
      text: 'Follow the guide and draw in every cell. Mobile version gives you one large reusable cell.'
    },
    {
      target: '.kana-progress-panel',
      title: 'Take tests',
      text: 'A test starts automatically after you finish a row. You can also test new or mastered kana here.'
    },
    {
      target: '#concentrationEnter',
      title: 'Use concentration mode',
      text: 'Open a distraction-free fullscreen practice view. The controls move around phone camera cutouts.'
    }
  ] : [
    {
      target: '.main-nav',
      title: 'Choose Kana or Kanji',
      text: 'Use these tabs to move between kana practice and the kanji dictionary.'
    },
    {
      target: '#can',
      title: 'Draw a kanji',
      text: 'Write a kanji in this large area. Stroke order and direction improve recognition.'
    },
    {
      target: '.candidate-panel',
      title: 'Choose a match',
      text: 'Select the matching kanji from the recognition results, then add its meaning.'
    },
    {
      target: '#reviewSection',
      title: 'Review your kanji',
      text: 'Start tests here to review saved kanji with spaced repetition.'
    },
    {
      target: '#concentrationEnter',
      title: 'Use concentration mode',
      text: 'Open a distraction-free fullscreen drawing view with camera-safe controls.'
    }
  ];

  let index = 0;
  let active = false;
  let target = null;
  let previousFocus = null;
  let startTimer = null;
  let pausedMobileSuggestion = false;

  const root = document.createElement('div');
  root.className = 'product-tour';
  root.hidden = true;
  root.setAttribute('role', 'dialog');
  root.setAttribute('aria-modal', 'true');
  root.setAttribute('aria-labelledby', 'productTourTitle');
  root.innerHTML = `
    <div class="product-tour-spotlight" aria-hidden="true"></div>
    <section class="product-tour-popover" data-placement="bottom">
      <span class="product-tour-arrow" aria-hidden="true"></span>
      <p class="product-tour-progress"></p>
      <h2 id="productTourTitle"></h2>
      <p class="product-tour-copy"></p>
      <div class="product-tour-actions">
        <button class="product-tour-skip" type="button">Skip tour</button>
        <span></span>
        <button class="product-tour-back" type="button">Back</button>
        <button class="product-tour-next" type="button">Next</button>
      </div>
    </section>`;
  document.body.append(root);

  const spotlight = root.querySelector('.product-tour-spotlight');
  const popover = root.querySelector('.product-tour-popover');
  const progress = root.querySelector('.product-tour-progress');
  const title = root.querySelector('h2');
  const copy = root.querySelector('.product-tour-copy');
  const back = root.querySelector('.product-tour-back');
  const next = root.querySelector('.product-tour-next');
  const skip = root.querySelector('.product-tour-skip');

  const translate = value => window.I18n?.translate?.(value) || value;
  const clamp = (value, minimum, maximum) => Math.min(Math.max(value, minimum), Math.max(minimum, maximum));
  const visible = element => {
    if (!element) return false;
    const rect = element.getBoundingClientRect();
    const style = getComputedStyle(element);
    return rect.width > 0 && rect.height > 0 && style.display !== 'none' && style.visibility !== 'hidden';
  };

  function currentViewport() {
    const viewport = window.visualViewport;
    return {
      width: viewport?.width || document.documentElement.clientWidth,
      height: viewport?.height || document.documentElement.clientHeight,
      left: viewport?.offsetLeft || 0,
      top: viewport?.offsetTop || 0
    };
  }

  function positionTour() {
    if (!active || !visible(target)) return;
    const viewport = currentViewport();
    const rect = target.getBoundingClientRect();
    const padding = 6;
    const margin = 12;
    const gap = 15;
    const spotLeft = clamp(rect.left - padding, viewport.left + 4, viewport.left + viewport.width - 8);
    const spotTop = clamp(rect.top - padding, viewport.top + 4, viewport.top + viewport.height - 8);
    const spotRight = clamp(rect.right + padding, spotLeft + 4, viewport.left + viewport.width - 4);
    const spotBottom = clamp(rect.bottom + padding, spotTop + 4, viewport.top + viewport.height - 4);
    spotlight.style.left = `${spotLeft}px`;
    spotlight.style.top = `${spotTop}px`;
    spotlight.style.width = `${spotRight - spotLeft}px`;
    spotlight.style.height = `${spotBottom - spotTop}px`;

    popover.style.left = `${margin}px`;
    popover.style.top = `${margin}px`;
    const popRect = popover.getBoundingClientRect();
    const spaces = {
      bottom: viewport.top + viewport.height - spotBottom,
      top: spotTop - viewport.top,
      right: viewport.left + viewport.width - spotRight,
      left: spotLeft - viewport.left
    };
    let placement = spaces.bottom >= popRect.height + gap ? 'bottom'
      : spaces.top >= popRect.height + gap ? 'top'
        : viewport.width >= 700 && spaces.right >= popRect.width + gap ? 'right'
          : viewport.width >= 700 && spaces.left >= popRect.width + gap ? 'left'
            : spaces.bottom >= spaces.top ? 'bottom' : 'top';
    let left = spotLeft + (spotRight - spotLeft - popRect.width) / 2;
    let top = placement === 'bottom' ? spotBottom + gap : spotTop - popRect.height - gap;
    if (placement === 'right') {
      left = spotRight + gap;
      top = spotTop + (spotBottom - spotTop - popRect.height) / 2;
    } else if (placement === 'left') {
      left = spotLeft - popRect.width - gap;
      top = spotTop + (spotBottom - spotTop - popRect.height) / 2;
    }
    left = clamp(left, viewport.left + margin, viewport.left + viewport.width - popRect.width - margin);
    top = clamp(top, viewport.top + margin, viewport.top + viewport.height - popRect.height - margin);
    popover.dataset.placement = placement;
    popover.style.left = `${left}px`;
    popover.style.top = `${top}px`;
    if (placement === 'top' || placement === 'bottom') {
      popover.style.setProperty('--tour-arrow-offset', `${clamp((spotLeft + spotRight) / 2 - left, 24, popRect.width - 24)}px`);
    } else {
      popover.style.setProperty('--tour-arrow-offset', `${clamp((spotTop + spotBottom) / 2 - top, 24, popRect.height - 24)}px`);
    }
  }

  function showStep(nextIndex) {
    const previousIndex = index;
    index = clamp(nextIndex, 0, steps.length - 1);
    let step = steps[index];
    target = document.querySelector(step.target);
    if (!visible(target)) {
      const direction = index < previousIndex ? -1 : 1;
      const candidate = index + direction;
      if (candidate >= 0 && candidate < steps.length) return showStep(candidate);
      return finish();
    }
    progress.textContent = translate(`Step ${index + 1} of ${steps.length}`);
    title.textContent = translate(step.title);
    copy.textContent = translate(step.text);
    back.hidden = index === 0;
    next.textContent = translate(index === steps.length - 1 ? 'Done' : 'Next');
    root.hidden = false;
    document.body.classList.add('product-tour-open');
    const rect = target.getBoundingClientRect();
    const viewport = currentViewport();
    if (rect.top < viewport.top + 70 || rect.bottom > viewport.top + viewport.height - 70) {
      target.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' });
      setTimeout(positionTour, 350);
    }
    requestAnimationFrame(() => {
      positionTour();
      next.focus({ preventScroll: true });
    });
  }

  function finish() {
    active = false;
    root.hidden = true;
    document.body.classList.remove('product-tour-open');
    const mobileSuggestion = document.querySelector('#mobileSuggestion');
    if (pausedMobileSuggestion && mobileSuggestion && !document.body.classList.contains('mobile-version')) {
      mobileSuggestion.hidden = false;
      document.body.classList.add('mobile-suggestion-open');
    }
    pausedMobileSuggestion = false;
    try { localStorage.setItem(STORAGE_KEY, 'complete'); }
    catch { /* The tour simply returns on the next visit if storage is unavailable. */ }
    previousFocus?.focus?.({ preventScroll: true });
  }

  function start(force = false) {
    if (active || isFrame) return;
    if (!force) {
      try { if (localStorage.getItem(STORAGE_KEY) === 'complete') return; }
      catch { /* Continue with the first-run tour. */ }
    }
    active = true;
    previousFocus = document.activeElement;
    const mobileSuggestion = document.querySelector('#mobileSuggestion');
    pausedMobileSuggestion = Boolean(mobileSuggestion && !mobileSuggestion.hidden);
    if (pausedMobileSuggestion) {
      mobileSuggestion.hidden = true;
      document.body.classList.remove('mobile-suggestion-open');
    }
    showStep(0);
  }

  back.addEventListener('click', () => showStep(index - 1));
  next.addEventListener('click', () => index === steps.length - 1 ? finish() : showStep(index + 1));
  skip.addEventListener('click', finish);
  root.addEventListener('keydown', event => {
    if (event.key === 'Escape') return finish();
    if (event.key !== 'Tab') return;
    const controls = [...root.querySelectorAll('button:not([hidden])')];
    const first = controls[0];
    const last = controls[controls.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  });
  window.addEventListener('resize', positionTour);
  window.addEventListener('orientationchange', () => setTimeout(positionTour, 180));
  window.visualViewport?.addEventListener('resize', positionTour);
  window.visualViewport?.addEventListener('scroll', positionTour);
  document.querySelector('#startProductTour')?.addEventListener('click', () => start(true));

  function pageIsReady() {
    const appReady = PAGE !== 'kana' || document.body.dataset.productTourReady === 'true';
    return appReady && !document.querySelector('dialog[open]')
      && !document.body.classList.contains('concentration-mode');
  }
  if (!isFrame) {
    let readySince = 0;
    startTimer = setInterval(() => {
      if (!pageIsReady()) {
        readySince = 0;
        return;
      }
      if (!readySince) {
        readySince = Date.now();
        return;
      }
      if (Date.now() - readySince < 600) return;
      clearInterval(startTimer);
      start();
    }, 200);
  }
  window.ProductTour = { start: () => start(true), finish };
})();

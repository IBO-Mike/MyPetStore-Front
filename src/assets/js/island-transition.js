import loadingIslandSvg from '../../images/animal-island/loading-island.svg';

const TRANSITION_KEY = 'mypetstore:island-store-transition';
const TRANSITION_VALUE = 'catalog';
const DEPARTURE_MS = 850;
const ARRIVAL_MS = 2240;

let loadingIslandMarkupPromise;

function reduceMotion() {
  return window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
}

function rememberTransition() {
  try {
    sessionStorage.setItem(TRANSITION_KEY, TRANSITION_VALUE);
  } catch {
    // Session storage can be unavailable in strict privacy modes.
  }
}

function consumeTransition() {
  try {
    const value = sessionStorage.getItem(TRANSITION_KEY);
    sessionStorage.removeItem(TRANSITION_KEY);
    return value === TRANSITION_VALUE;
  } catch {
    return false;
  }
}

function loadLoadingIslandMarkup() {
  if (!loadingIslandMarkupPromise) {
    loadingIslandMarkupPromise = fetch(loadingIslandSvg)
      .then((response) => {
        if (!response.ok) {
          throw new Error(`Unable to load island svg: ${response.status}`);
        }
        return response.text();
      })
      .catch(() => '');
  }

  return loadingIslandMarkupPromise;
}

function hydrateLoadingIsland(overlay) {
  const mount = overlay.querySelector('[data-loading-island]');
  if (!mount) {
    return;
  }

  loadLoadingIslandMarkup().then((markup) => {
    if (!markup || !mount.isConnected) {
      return;
    }

    mount.innerHTML = markup;
  });
}

function createTransition(mode) {
  const overlay = document.createElement('div');
  overlay.className = `island-transition island-transition--${mode} animal-cursor`;
  overlay.setAttribute('aria-hidden', 'true');
  overlay.innerHTML = `<div class="island-transition__curtain"></div>
    <div class="island-transition__island" aria-hidden="true">
      <div class="island-transition__svg" data-loading-island>
        <img class="island-transition__image" src="${loadingIslandSvg}" alt="" />
      </div>
    </div>`;
  hydrateLoadingIsland(overlay);
  return overlay;
}

export function bindStoreStartTransition(selector = '[data-start-button]') {
  const trigger = document.querySelector(selector);
  if (!trigger || trigger.dataset.transitionBound === 'true') {
    return;
  }

  trigger.dataset.transitionBound = 'true';
  trigger.addEventListener('click', (event) => {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) {
      return;
    }

    event.preventDefault();
    const href = trigger.href;
    rememberTransition();

    if (reduceMotion()) {
      window.location.href = href;
      return;
    }

    const overlay = createTransition('departure');
    document.body.appendChild(overlay);
    requestAnimationFrame(() => overlay.classList.add('is-visible'));
    window.setTimeout(() => {
      window.location.href = href;
    }, DEPARTURE_MS);
  });
}

export function playStoreArrivalTransition() {
  if (!consumeTransition() || reduceMotion()) {
    document.documentElement.classList.remove('store-transition-boot');
    return;
  }

  const overlay = createTransition('arrival');
  document.body.appendChild(overlay);
  requestAnimationFrame(() => {
    overlay.classList.add('is-visible', 'is-opening');
    document.documentElement.classList.remove('store-transition-boot');
  });
  window.setTimeout(() => overlay.classList.add('is-finishing'), ARRIVAL_MS - 180);
  window.setTimeout(() => overlay.remove(), ARRIVAL_MS);
}

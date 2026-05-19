const ANIMAL_CURSOR_CLASS = 'animal-cursor';

let cursorEventsBound = false;

export function applyAnimalCursor() {
  document.documentElement.classList.add(ANIMAL_CURSOR_CLASS);
  document.body?.classList.add(ANIMAL_CURSOR_CLASS);
  document.querySelectorAll('[data-app-shell]').forEach((shell) => {
    shell.classList.add(ANIMAL_CURSOR_CLASS);
  });
}

export function installAnimalCursor() {
  applyAnimalCursor();

  if (!cursorEventsBound) {
    cursorEventsBound = true;
    document.addEventListener('DOMContentLoaded', applyAnimalCursor);
    window.addEventListener('pageshow', applyAnimalCursor);
  }

  return applyAnimalCursor;
}

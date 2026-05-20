import '../../assets/js/layout';
import { login } from '../../assets/js/auth';
import { qs, qsa, setLoading } from '../../assets/js/utils';
import './login.css';

const loginRoot = qs('[data-login-root]');
const form = qs('[data-login-form]');
const emailInput = qs('[data-email-input]');
const passwordInput = qs('[data-password-input]');
const passwordToggle = qs('[data-password-toggle]');
const errorMessage = qs('[data-error-message]');
const loginSuccessUrl = '/catalog.html';

const characters = {
  purple: qs('[data-character="purple"]'),
  black: qs('[data-character="black"]'),
  orange: qs('[data-character="orange"]'),
  yellow: qs('[data-character="yellow"]'),
};

const eyeGroups = {
  purple: qs('[data-eye-group="purple"]'),
  black: qs('[data-eye-group="black"]'),
  orange: qs('[data-eye-group="orange"]'),
  yellow: qs('[data-eye-group="yellow"]'),
};

const yellowMouth = qs('[data-yellow-mouth]');

let mouseX = 0;
let mouseY = 0;
let isTyping = false;
let showPassword = false;
let isLookingAtEachOther = false;
let isPurplePeeking = false;
let frameId = null;
let peerTimer = null;
let peekTimer = null;
let errorTimer = null;

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function setPosition(element, x, y) {
  if (!element) return;
  element.style.left = `${x}px`;
  element.style.top = `${y}px`;
}

function calculatePosition(element) {
  if (!element) {
    return { faceX: 0, faceY: 0, bodySkew: 0 };
  }

  const rect = element.getBoundingClientRect();
  const centerX = rect.left + rect.width / 2;
  const centerY = rect.top + rect.height / 3;
  const deltaX = mouseX - centerX;
  const deltaY = mouseY - centerY;

  return {
    faceX: clamp(deltaX / 20, -15, 15),
    faceY: clamp(deltaY / 30, -10, 10),
    bodySkew: clamp(-deltaX / 120, -6, 6),
  };
}

function moveWithinCircle(element, size, maxDistance, forceLookX, forceLookY) {
  if (!element) return;

  if (forceLookX !== undefined && forceLookY !== undefined) {
    element.style.transform = `translate(${forceLookX}px, ${forceLookY}px)`;
    return;
  }

  const rect = element.getBoundingClientRect();
  const centerX = rect.left + rect.width / 2;
  const centerY = rect.top + rect.height / 2;
  const deltaX = mouseX - centerX;
  const deltaY = mouseY - centerY;
  const distance = Math.min(Math.sqrt(deltaX ** 2 + deltaY ** 2), maxDistance);
  const angle = Math.atan2(deltaY, deltaX);
  const x = Math.cos(angle) * distance;
  const y = Math.sin(angle) * distance;

  element.style.width = `${size}px`;
  element.style.height = `${size}px`;
  element.style.transform = `translate(${x}px, ${y}px)`;
}

function moveEyes(role, forceLookX, forceLookY) {
  const eyeGroup = eyeGroups[role];
  if (!eyeGroup) return;

  qsa('[data-eye]', eyeGroup).forEach((eye) => {
    const size = Number(eye.dataset.eyeSize || 18);
    const pupilSize = Number(eye.dataset.pupilSize || 7);
    const maxDistance = Number(eye.dataset.maxDistance || 5);
    const pupil = qs('.cc-pupil', eye);

    eye.style.width = `${size}px`;
    if (!characters[role]?.classList.contains('is-blinking')) {
      eye.style.height = `${size}px`;
    }
    moveWithinCircle(pupil, pupilSize, maxDistance, forceLookX, forceLookY);
  });

  qsa('[data-dot]', eyeGroup).forEach((dot) => {
    const size = Number(dot.dataset.dotSize || 12);
    const maxDistance = Number(dot.dataset.maxDistance || 5);
    moveWithinCircle(dot, size, maxDistance, forceLookX, forceLookY);
  });
}

function updateCharacters() {
  frameId = null;

  const passwordLength = passwordInput?.value.length || 0;
  const isHidingPassword = passwordLength > 0 && !showPassword;
  const isShowingPassword = passwordLength > 0 && showPassword;
  const purplePos = calculatePosition(characters.purple);
  const blackPos = calculatePosition(characters.black);
  const orangePos = calculatePosition(characters.orange);
  const yellowPos = calculatePosition(characters.yellow);

  if (characters.purple) {
    characters.purple.style.height = isTyping || isHidingPassword ? '440px' : '400px';
    characters.purple.style.transform = isShowingPassword
      ? 'skewX(0deg)'
      : isTyping || isHidingPassword
        ? `skewX(${purplePos.bodySkew - 12}deg) translateX(40px)`
        : `skewX(${purplePos.bodySkew}deg)`;
  }

  if (characters.black) {
    characters.black.style.transform = isShowingPassword
      ? 'skewX(0deg)'
      : isLookingAtEachOther
        ? `skewX(${blackPos.bodySkew * 1.5 + 10}deg) translateX(20px)`
        : isTyping || isHidingPassword
          ? `skewX(${blackPos.bodySkew * 1.5}deg)`
          : `skewX(${blackPos.bodySkew}deg)`;
  }

  if (characters.orange) {
    characters.orange.style.transform = isShowingPassword ? 'skewX(0deg)' : `skewX(${orangePos.bodySkew}deg)`;
  }

  if (characters.yellow) {
    characters.yellow.style.transform = isShowingPassword ? 'skewX(0deg)' : `skewX(${yellowPos.bodySkew}deg)`;
  }

  setPosition(
    eyeGroups.purple,
    isShowingPassword ? 20 : isLookingAtEachOther ? 55 : 45 + purplePos.faceX,
    isShowingPassword ? 35 : isLookingAtEachOther ? 65 : 40 + purplePos.faceY,
  );
  setPosition(
    eyeGroups.black,
    isShowingPassword ? 10 : isLookingAtEachOther ? 32 : 26 + blackPos.faceX,
    isShowingPassword ? 28 : isLookingAtEachOther ? 12 : 32 + blackPos.faceY,
  );
  setPosition(
    eyeGroups.orange,
    isShowingPassword ? 50 : 82 + orangePos.faceX,
    isShowingPassword ? 85 : 90 + orangePos.faceY,
  );
  setPosition(
    eyeGroups.yellow,
    isShowingPassword ? 20 : 52 + yellowPos.faceX,
    isShowingPassword ? 35 : 40 + yellowPos.faceY,
  );
  setPosition(yellowMouth, isShowingPassword ? 10 : 40 + yellowPos.faceX, isShowingPassword ? 88 : 88 + yellowPos.faceY);

  moveEyes(
    'purple',
    isShowingPassword ? (isPurplePeeking ? 4 : -4) : isLookingAtEachOther ? 3 : undefined,
    isShowingPassword ? (isPurplePeeking ? 5 : -4) : isLookingAtEachOther ? 4 : undefined,
  );
  moveEyes('black', isShowingPassword ? -4 : isLookingAtEachOther ? 0 : undefined, isShowingPassword ? -4 : isLookingAtEachOther ? -4 : undefined);
  moveEyes('orange', isShowingPassword ? -5 : undefined, isShowingPassword ? -4 : undefined);
  moveEyes('yellow', isShowingPassword ? -5 : undefined, isShowingPassword ? -4 : undefined);
}

function queueCharacterFrame() {
  if (frameId) return;
  frameId = window.requestAnimationFrame(updateCharacters);
}

function triggerPeerLook() {
  window.clearTimeout(peerTimer);
  isLookingAtEachOther = true;
  queueCharacterFrame();
  peerTimer = window.setTimeout(() => {
    isLookingAtEachOther = false;
    queueCharacterFrame();
  }, 800);
}

function schedulePurplePeek() {
  window.clearTimeout(peekTimer);

  if (!showPassword || !passwordInput?.value) {
    isPurplePeeking = false;
    queueCharacterFrame();
    return;
  }

  peekTimer = window.setTimeout(() => {
    isPurplePeeking = true;
    queueCharacterFrame();
    window.setTimeout(() => {
      isPurplePeeking = false;
      queueCharacterFrame();
      schedulePurplePeek();
    }, 800);
  }, Math.random() * 3000 + 2000);
}

function scheduleBlink(character) {
  const timer = window.setTimeout(
    () => {
      character?.classList.add('is-blinking');
      queueCharacterFrame();
      window.setTimeout(() => {
        character?.classList.remove('is-blinking');
        queueCharacterFrame();
        scheduleBlink(character);
      }, 150);
    },
    Math.random() * 4000 + 3000,
  );

  return timer;
}

function clearErrorState() {
  errorMessage?.classList.remove('is-visible');
  if (errorMessage) errorMessage.textContent = '';
  emailInput?.classList.remove('is-invalid');
  passwordInput?.classList.remove('is-invalid');
}

function showError(message) {
  if (errorMessage) {
    errorMessage.textContent = message;
    errorMessage.classList.add('is-visible');
  }

  window.clearTimeout(errorTimer);
  loginRoot?.classList.add('is-login-error');
  errorTimer = window.setTimeout(() => {
    loginRoot?.classList.remove('is-login-error');
  }, 520);
}

emailInput?.addEventListener('focus', () => {
  isTyping = true;
  clearErrorState();
  triggerPeerLook();
  queueCharacterFrame();
});

emailInput?.addEventListener('input', () => {
  isTyping = true;
  clearErrorState();
  triggerPeerLook();
  queueCharacterFrame();
});

emailInput?.addEventListener('blur', () => {
  isTyping = false;
  isLookingAtEachOther = false;
  queueCharacterFrame();
});

passwordInput?.addEventListener('focus', () => {
  clearErrorState();
  queueCharacterFrame();
});

passwordInput?.addEventListener('input', () => {
  clearErrorState();
  queueCharacterFrame();
  schedulePurplePeek();
});

passwordToggle?.addEventListener('click', () => {
  if (!passwordInput) return;

  showPassword = passwordInput.type === 'password';
  passwordInput.type = showPassword ? 'text' : 'password';
  passwordToggle.classList.toggle('is-visible', showPassword);
  passwordToggle.setAttribute('aria-pressed', String(showPassword));
  passwordToggle.setAttribute('aria-label', showPassword ? '隐藏密码' : '显示密码');
  passwordInput.focus({ preventScroll: true });
  queueCharacterFrame();
  schedulePurplePeek();
});

window.addEventListener('mousemove', (event) => {
  mouseX = event.clientX;
  mouseY = event.clientY;
  queueCharacterFrame();
});

window.addEventListener('resize', queueCharacterFrame);

scheduleBlink(characters.purple);
scheduleBlink(characters.black);
queueCharacterFrame();

form?.addEventListener('submit', async (event) => {
  event.preventDefault();

  const button = event.submitter;
  const formData = new FormData(event.currentTarget);
  const username = String(formData.get('username') || '').trim();
  const password = String(formData.get('password') || '').trim();

  clearErrorState();

  if (!username || !password) {
    if (!username) emailInput?.classList.add('is-invalid');
    if (!password) passwordInput?.classList.add('is-invalid');
    showError('请输入用户名和密码。');
    return;
  }

  setLoading(button, true, '登录中...');
  try {
    await login(username, password);
    try {
      sessionStorage.removeItem('mypetstore:island-store-transition');
    } catch {
      // Session storage can be unavailable in strict privacy modes.
    }
    setLoading(button, true, '登录成功');
    window.setTimeout(() => {
      window.location.replace(loginSuccessUrl);
    }, 250);
  } catch (error) {
    passwordInput?.classList.add('is-invalid');
    showError(error.message || '用户名或密码不正确，请重试。');
  } finally {
    if (!localStorage.getItem('mypetstore_token')) {
      setLoading(button, false);
    }
  }
});

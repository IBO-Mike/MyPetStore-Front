import '../css/base.css';
import '../css/layout.css';
import '../css/components.css';
import '../css/island-transition.css';
import { installAnimalCursor } from './animal-cursor';
import { isLoggedIn, logout, getUserInfo } from './auth';

const syncAnimalCursor = installAnimalCursor();

const navItems = [
  { href: '/catalog.html', label: '首页' },
  { href: '/catalog.html', label: '商品列表' },
  { href: '/cart.html', label: '购物车', auth: true },
  { href: '/favorites.html', label: '我的收藏', auth: true },
  { href: '/compare.html', label: '商品对比', auth: true },
  { href: '/order.html', label: '我的订单', auth: true },
  { href: '/user.html', label: '个人中心', auth: true },
  { href: '/login.html', label: '登录', guest: true },
  { href: '/register.html', label: '注册', guest: true },
];

function isActive(href) {
  const current = window.location.pathname;
  if (href === '/catalog.html') {
    return current === '/' || current.endsWith('/index.html') || current.endsWith('/catalog.html');
  }
  return current.endsWith(href);
}

export function renderLayout(activeLabel = '') {
  const shell = document.querySelector('[data-app-shell]');
  if (!shell) {
    return;
  }
  syncAnimalCursor();

  const loggedIn = isLoggedIn();
  const user = getUserInfo();
  const visibleNav = navItems.filter((item) => {
    if (item.auth) return loggedIn;
    if (item.guest) return !loggedIn;
    return true;
  });

  const navHtml = visibleNav
    .map((item) => {
      const active = activeLabel === item.label || isActive(item.href) ? ' is-active' : '';
      return `<a class="site-nav__link${active}" href="${item.href}">${item.label}</a>`;
    })
    .join('');

  shell.insertAdjacentHTML(
    'afterbegin',
    `<header class="site-header">
      <div class="container site-header__inner">
        <div class="site-brand-group">
          <a class="site-header__brand" href="/catalog.html">MyPetStore</a>
          <div class="site-time" aria-label="当前时间" data-site-time></div>
        </div>
        <nav class="site-nav" aria-label="主导航">
          ${navHtml}
          ${loggedIn ? `<span class="badge">${user?.username || '已登录'}</span><button class="site-nav__button" type="button" data-logout>退出</button>` : ''}
        </nav>
      </div>
    </header>`,
  );

  shell.insertAdjacentHTML(
    'beforeend',
    `<footer class="footer">
      <div class="container">MyPetStore MPA Frontend · Webpack</div>
    </footer>`,
  );

  const logoutButton = document.querySelector('[data-logout]');
  logoutButton?.addEventListener('click', async () => {
    await logout();
    window.location.href = '/login.html';
  });

  const timeEl = document.querySelector('[data-site-time]');
  const weekdays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  function renderTime() {
    if (!timeEl) return;
    const now = new Date();
    timeEl.innerHTML = `<span class="site-time__date">
      <span class="site-time__weekday">${weekdays[now.getDay()]}</span>
      <span class="site-time__monthday">${months[now.getMonth()]} ${now.getDate()}</span>
    </span>
    <span class="site-time__clock">${String(now.getHours()).padStart(2, '0')}<span class="site-time__colon">:</span>${String(now.getMinutes()).padStart(2, '0')}</span>`;
  }

  renderTime();
  window.setInterval(renderTime, 1000);
}

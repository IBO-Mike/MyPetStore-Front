import '../css/base.css';
import '../css/layout.css';
import '../css/components.css';
import { isLoggedIn, logout, getUserInfo } from './auth';

const navItems = [
  { href: '/', label: '首页' },
  { href: '/cart.html', label: '购物车', auth: true },
  { href: '/order.html', label: '我的订单', auth: true },
  { href: '/user.html', label: '个人中心', auth: true },
  { href: '/login.html', label: '登录 / 注册', guest: true },
];

function isActive(href) {
  const current = window.location.pathname;
  if (href === '/') {
    return current === '/' || current.endsWith('/index.html');
  }
  return current.endsWith(href);
}

export function renderLayout(activeLabel = '') {
  const shell = document.querySelector('[data-app-shell]');
  if (!shell) {
    return;
  }

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
        <a class="site-header__brand" href="/">MyPetStore</a>
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
}

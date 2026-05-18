import '../../assets/js/layout';
import { renderLayout } from '../../assets/js/layout';
import { api } from '../../assets/js/api';
import { logout, requireAuth, saveUserInfo, getUserInfo } from '../../assets/js/auth';
import { qs, showNotice, setLoading } from '../../assets/js/utils';
import './user.css';

renderLayout('个人中心');

if (!requireAuth()) {
  throw new Error('Authentication required');
}

const notice = qs('[data-notice]');
const profileForm = qs('[data-profile-form]');
const favoritesList = qs('[data-favorites-list]');
const MAX_PASSWORD_LENGTH = 25;

function stripHtmlTags(html) {
  if (!html) return '';
  const div = document.createElement('div');
  div.innerHTML = html;
  return div.textContent || div.innerText || '';
}

const profileFields = [
  ['firstName', '名'],
  ['lastName', '姓'],
  ['email', '邮箱'],
  ['phone', '电话'],
  ['address1', '地址 1'],
  ['address2', '地址 2'],
  ['city', '城市'],
  ['state', '州/省'],
  ['zip', '邮编'],
  ['country', '国家'],
  ['languagePreference', '语言偏好'],
  ['favoriteCategory', '偏好分类'],
];

function renderProfile(user) {
  profileForm.innerHTML = profileFields
    .map(
      ([name, label]) => `<label class="form-group">
        <span class="form-label">${label}</span>
        <input class="form-control" name="${name}" value="${user?.[name] || ''}" />
      </label>`,
    )
    .join('');

  profileForm.insertAdjacentHTML(
    'afterbegin',
    `<label class="form-group">
      <span class="form-label">用户名</span>
      <input class="form-control" value="${user.username}" disabled />
    </label>`,
  );
  profileForm.insertAdjacentHTML(
    'beforeend',
    '<div class="form-group form-group--full"><button class="btn btn-primary" type="submit">保存资料</button></div>',
  );
}

function renderFavorites(favorites, products = {}) {
  if (!favorites || favorites.length === 0) {
    favoritesList.innerHTML = '<div class="empty-state">暂无收藏商品</div>';
    return;
  }

  favoritesList.innerHTML = favorites
    .map((favorite) => {
      const product = products[favorite.productId];
      return `<div class="favorite-item" data-favorite-id="${favorite.id}">
        <div class="favorite-item__info">
          <div class="favorite-item__product">
            <span class="badge">${product?.categoryId || ''}</span>
            <h3>${product?.name || favorite.productId}</h3>
            ${product?.description ? `<p>${stripHtmlTags(product.description)}</p>` : ''}
          </div>
          <div class="favorite-item__meta">
            <span>收藏时间: ${favorite.createTime}</span>
          </div>
        </div>
        <div class="favorite-item__actions">
          <a class="btn btn-outline btn-sm" href="/product.html?productId=${favorite.productId}">查看商品</a>
          <button class="btn btn-danger btn-sm" type="button" data-remove-favorite="${favorite.id}">取消收藏</button>
        </div>
      </div>`;
    })
    .join('');
}

profileForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const button = event.submitter;
  const formData = new FormData(event.currentTarget);
  const payload = Object.fromEntries(profileFields.map(([name]) => [name, formData.get(name)?.trim() || '']));

  setLoading(button, true, '保存中...');
  try {
    const updated = await api.put('/account/profile', payload);
    saveUserInfo(updated);
    showNotice(notice, '个人资料已更新', 'success');
  } catch (error) {
    showNotice(notice, error.message, 'error');
  } finally {
    setLoading(button, false);
  }
});

qs('[data-password-form]').addEventListener('submit', async (event) => {
  event.preventDefault();
  const form = event.currentTarget;
  const button = event.submitter;
  const formData = new FormData(form);
  const payload = {
    oldPassword: formData.get('oldPassword').trim(),
    newPassword: formData.get('newPassword').trim(),
    confirmPassword: formData.get('confirmPassword').trim(),
  };

  if (payload.newPassword !== payload.confirmPassword) {
    showNotice(notice, '两次输入的新密码不一致', 'error');
    return;
  }

  if (payload.newPassword.length > MAX_PASSWORD_LENGTH) {
    showNotice(notice, `密码不能超过 ${MAX_PASSWORD_LENGTH} 位`, 'error');
    return;
  }

  setLoading(button, true, '保存中...');
  try {
    await api.post('/account/change-password', payload);
    form.reset();
    showNotice(notice, '密码已更新', 'success');
  } catch (error) {
    showNotice(notice, error.message, 'error');
  } finally {
    setLoading(button, false);
  }
});

favoritesList.addEventListener('click', async (event) => {
  const button = event.target.closest('[data-remove-favorite]');
  if (!button) return;

  const favoriteId = parseInt(button.dataset.removeFavorite, 10);
  setLoading(button, true, '删除中...');
  
  try {
    await api.favorites.remove(favoriteId);
    showNotice(notice, '已取消收藏', 'success');
    await loadFavorites();
  } catch (error) {
    showNotice(notice, error.message, 'error');
  } finally {
    setLoading(button, false);
  }
});

qs('[data-logout-page]').addEventListener('click', async () => {
  await logout();
  window.location.href = '/login.html';
});

let favoritesData = [];
let productsData = {};

async function loadFavorites() {
  try {
    const user = getUserInfo();
    const result = await api.favorites.getByUser(user.username);
    favoritesData = result.favorites || [];
    
    const productIds = [...new Set(favoritesData.map(f => f.productId))];
    const productPromises = productIds.map(id => 
      api.get(`/catalog/products/${encodeURIComponent(id)}`).catch(() => null)
    );
    const products = await Promise.all(productPromises);
    
    productsData = {};
    products.forEach(p => {
      if (p) productsData[p.productId] = p;
    });
    
    renderFavorites(favoritesData, productsData);
  } catch (error) {
    console.error('Failed to load favorites:', error);
    favoritesList.innerHTML = '<div class="empty-state">收藏列表加载失败</div>';
  }
}

async function init() {
  profileForm.innerHTML = '<div class="empty-state form-group--full">正在加载个人资料...</div>';
  favoritesList.innerHTML = '<div class="empty-state">正在加载收藏...</div>';
  
  try {
    const profile = await api.get('/account/profile');
    saveUserInfo(profile);
    renderProfile(profile);
    await loadFavorites();
  } catch (error) {
    showNotice(notice, error.message, 'error');
  }
}

init();

import '../../assets/js/layout';
import { renderLayout } from '../../assets/js/layout';
import { api } from '../../assets/js/api';
import { isLoggedIn, getUserInfo } from '../../assets/js/auth';
import { formatPrice, getQueryParam, qs, showNotice, setLoading } from '../../assets/js/utils';
import './product.css';

renderLayout('首页');

const detail = qs('[data-product-detail]');
const notice = qs('[data-notice]');
const productId = getQueryParam('productId');

function stripHtmlTags(html) {
  if (!html) return '';
  const div = document.createElement('div');
  div.innerHTML = html;
  return div.textContent || div.innerText || '';
}

function renderProduct(product, userFavorites = [], userCompares = []) {
  const items = product.items || [];
  const isFavorited = userFavorites.some(fav => fav.productId === product.productId);
  const isCompared = userCompares.some(cmp => cmp.productId === product.productId);
  const description = stripHtmlTags(product.description);
  detail.innerHTML = `<article class="card product-summary">
      <span class="badge">${product.categoryId}</span>
      <h1>${product.name}</h1>
      <p>${description || '暂无商品描述'}</p>
      <div class="product-actions">
        <button class="btn ${isFavorited ? 'btn-secondary' : 'btn-outline'}" type="button" data-toggle-favorite>
          ${isFavorited ? '已收藏' : '收藏'}
        </button>
        <button class="btn ${isCompared ? 'btn-secondary' : 'btn-outline'}" type="button" data-toggle-compare>
          ${isCompared ? '已对比' : '对比'}
        </button>
        <a class="btn btn-primary" href="/compare.html">查看对比</a>
      </div>
    </article>
    <section class="panel">
      <div class="panel__header">
        <h2>可选 SKU</h2>
      </div>
      <div class="panel__body sku-list">
        ${
          items.length
            ? items
                .map((item) => {
                  const attrs = [item.attribute1, item.attribute2, item.attribute3, item.attribute4, item.attribute5]
                    .filter(Boolean)
                    .map((attr) => `<span class="badge">${attr}</span>`)
                    .join('');
                  return `<div class="sku-card">
                    <div>
                      <h3>${item.itemId}</h3>
                      <div class="price">${formatPrice(item.listPrice)}</div>
                      <div class="sku-card__attrs">${attrs || '<span class="badge">标准规格</span>'}</div>
                    </div>
                    <button class="btn btn-primary" type="button" data-add-cart="${item.itemId}">加入购物车</button>
                  </div>`;
                })
                .join('')
            : '<div class="empty-state">暂无可售 SKU</div>'
        }
      </div>
    </section>`;
}

let currentProduct = null;
let userFavorites = [];
let userCompares = [];

detail.addEventListener('click', async (event) => {
  const addCartButton = event.target.closest('[data-add-cart]');
  if (addCartButton) {
    if (!isLoggedIn()) {
      showNotice(notice, '请先登录后再加入购物车', 'error');
      window.setTimeout(() => {
        window.location.href = `/login.html?redirect=${encodeURIComponent(window.location.pathname + window.location.search)}`;
      }, 700);
      return;
    }

    setLoading(addCartButton, true, '添加中...');
    try {
      await api.post('/cart/items', {
        itemId: addCartButton.dataset.addCart,
        quantity: 1,
      });
      showNotice(notice, '已加入购物车', 'success');
    } catch (error) {
      showNotice(notice, error.message, 'error');
    } finally {
      setLoading(addCartButton, false);
    }
    return;
  }

  const favoriteButton = event.target.closest('[data-toggle-favorite]');
  if (favoriteButton) {
    if (!isLoggedIn()) {
      showNotice(notice, '请先登录后再收藏', 'error');
      window.setTimeout(() => {
        window.location.href = `/login.html?redirect=${encodeURIComponent(window.location.pathname + window.location.search)}`;
      }, 700);
      return;
    }

    const user = getUserInfo();
    const isFavorited = userFavorites.some(fav => fav.productId === currentProduct.productId);
    
    setLoading(favoriteButton, true, '处理中...');
    try {
      if (isFavorited) {
        const favorite = userFavorites.find(fav => fav.productId === currentProduct.productId);
        await api.favorites.remove(favorite.id);
        userFavorites = userFavorites.filter(fav => fav.id !== favorite.id);
        showNotice(notice, '已取消收藏', 'success');
      } else {
        const favorite = await api.favorites.add(user.username, currentProduct.productId);
        userFavorites.push(favorite);
        showNotice(notice, '已添加到收藏', 'success');
      }
      renderProduct(currentProduct, userFavorites, userCompares);
    } catch (error) {
      showNotice(notice, error.message, 'error');
    } finally {
      setLoading(favoriteButton, false);
    }
  }

  const compareButton = event.target.closest('[data-toggle-compare]');
  if (compareButton) {
    if (!isLoggedIn()) {
      showNotice(notice, '请先登录后再对比', 'error');
      window.setTimeout(() => {
        window.location.href = `/login.html?redirect=${encodeURIComponent(window.location.pathname + window.location.search)}`;
      }, 700);
      return;
    }

    const user = getUserInfo();
    const isCompared = userCompares.some(cmp => cmp.productId === currentProduct.productId);
    
    setLoading(compareButton, true, '处理中...');
    try {
      if (isCompared) {
        const compare = userCompares.find(cmp => cmp.productId === currentProduct.productId);
        await api.compares.remove(compare.id);
        userCompares = userCompares.filter(cmp => cmp.id !== compare.id);
        showNotice(notice, '已从对比中移除', 'success');
      } else {
        const compare = await api.compares.add(user.username, currentProduct.productId);
        userCompares.push(compare);
        showNotice(notice, '已添加到对比', 'success');
      }
      renderProduct(currentProduct, userFavorites, userCompares);
    } catch (error) {
      showNotice(notice, error.message, 'error');
    } finally {
      setLoading(compareButton, false);
    }
  }
});

async function loadUserFavorites() {
  if (!isLoggedIn()) return [];
  try {
    const user = getUserInfo();
    const result = await api.favorites.getByUser(user.username);
    return result.favorites || [];
  } catch (error) {
    console.error('Failed to load favorites:', error);
    return [];
  }
}

async function loadUserCompares() {
  if (!isLoggedIn()) return [];
  try {
    const user = getUserInfo();
    const result = await api.compares.getByUser(user.username);
    return result.compares || [];
  } catch (error) {
    console.error('Failed to load compares:', error);
    return [];
  }
}

async function init() {
  if (!productId) {
    detail.innerHTML = '<div class="empty-state">缺少 productId 参数</div>';
    return;
  }

  detail.innerHTML = '<div class="empty-state">正在加载商品详情...</div>';
  try {
    userFavorites = await loadUserFavorites();
    userCompares = await loadUserCompares();
    currentProduct = await api.get(`/catalog/products/${encodeURIComponent(productId)}`);
    renderProduct(currentProduct, userFavorites, userCompares);
  } catch (error) {
    showNotice(notice, error.message, 'error');
    detail.innerHTML = '<div class="empty-state">商品详情加载失败</div>';
  }
}

init();

import '../../assets/js/layout';
import { renderLayout } from '../../assets/js/layout';
import { api } from '../../assets/js/api';
import { getUserInfo, isLoggedIn } from '../../assets/js/auth';
import { formatPrice, getQueryParam, qs, showNotice, setLoading } from '../../assets/js/utils';
import './product.css';

renderLayout('商品列表');

const detail = qs('[data-product-detail]');
const notice = qs('[data-notice]');
const productId = getQueryParam('productId');

let currentProduct = null;
let favoriteEntries = [];
let compareEntries = [];

function escapeHtml(value = '') {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function stripHtml(value = '') {
  const template = document.createElement('template');
  template.innerHTML = value;
  return template.content.textContent.trim();
}

function getCurrentUserId() {
  const user = getUserInfo();
  return user?.userId || user?.username || '';
}

function redirectToLogin(message) {
  showNotice(notice, message, 'error');
  window.setTimeout(() => {
    window.location.href = `/login.html?redirect=${encodeURIComponent(window.location.pathname + window.location.search)}`;
  }, 700);
}

function findProductEntry(entries, targetProductId) {
  return entries.find((entry) => String(entry.productId) === String(targetProductId));
}

function renderProduct(product) {
  const items = product.items || [];
  const favoriteEntry = findProductEntry(favoriteEntries, product.productId);
  const compareEntry = findProductEntry(compareEntries, product.productId);
  const description = stripHtml(product.description) || '暂无商品描述';

  detail.innerHTML = `<article class="card product-summary">
      <span class="badge">${escapeHtml(product.categoryId)}</span>
      <h1>${escapeHtml(product.name)}</h1>
      <p>${escapeHtml(description)}</p>
      <div class="product-actions" aria-label="商品操作">
        <button class="btn btn-secondary product-action${favoriteEntry ? ' product-action--active' : ''}" type="button" data-toggle-favorite aria-pressed="${favoriteEntry ? 'true' : 'false'}">
          ${favoriteEntry ? '已收藏' : '收藏商品'}
        </button>
        <button class="btn btn-secondary product-action${compareEntry ? ' product-action--active' : ''}" type="button" data-toggle-compare aria-pressed="${compareEntry ? 'true' : 'false'}">
          ${compareEntry ? '已加入对比' : '加入对比'}
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
                    .map((attr) => `<span class="badge">${escapeHtml(attr)}</span>`)
                    .join('');
                  return `<div class="sku-card">
                    <div>
                      <h3>${escapeHtml(item.itemId)}</h3>
                      <div class="price">${formatPrice(item.listPrice)}</div>
                      <div class="sku-card__attrs">${attrs || '<span class="badge">标准规格</span>'}</div>
                    </div>
                    <button class="btn btn-primary" type="button" data-add-cart="${escapeHtml(item.itemId)}">加入购物车</button>
                  </div>`;
                })
                .join('')
            : '<div class="empty-state">暂无可售 SKU</div>'
        }
      </div>
    </section>`;
}

detail.addEventListener('click', async (event) => {
  const addCartButton = event.target.closest('[data-add-cart]');

  if (addCartButton) {
    if (!isLoggedIn()) {
      redirectToLogin('请先登录后再加入购物车');
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
      redirectToLogin('请先登录后再收藏商品');
      return;
    }

    const userId = getCurrentUserId();
    if (!userId || !currentProduct) {
      showNotice(notice, '用户信息或商品信息不完整，请重新登录后再试', 'error');
      return;
    }

    setLoading(favoriteButton, true);
    try {
      const favoriteEntry = findProductEntry(favoriteEntries, currentProduct.productId);
      if (favoriteEntry) {
        await api.favorites.remove(favoriteEntry.id);
        favoriteEntries = favoriteEntries.filter((entry) => entry.id !== favoriteEntry.id);
        showNotice(notice, '已取消收藏', 'success');
      } else {
        const favorite = await api.favorites.add(userId, currentProduct.productId);
        favoriteEntries = [
          favorite,
          ...favoriteEntries.filter((entry) => String(entry.productId) !== String(currentProduct.productId)),
        ].filter(Boolean);
        showNotice(notice, '已收藏商品', 'success');
      }
      renderProduct(currentProduct);
    } catch (error) {
      showNotice(notice, error.message, 'error');
    } finally {
      setLoading(favoriteButton, false);
    }
    return;
  }

  const compareButton = event.target.closest('[data-toggle-compare]');
  if (compareButton) {
    if (!isLoggedIn()) {
      redirectToLogin('请先登录后再加入商品对比');
      return;
    }

    const userId = getCurrentUserId();
    if (!userId || !currentProduct) {
      showNotice(notice, '用户信息或商品信息不完整，请重新登录后再试', 'error');
      return;
    }

    setLoading(compareButton, true);
    try {
      const compareEntry = findProductEntry(compareEntries, currentProduct.productId);
      if (compareEntry) {
        await api.compares.remove(compareEntry.id);
        compareEntries = compareEntries.filter((entry) => entry.id !== compareEntry.id);
        showNotice(notice, '已移出商品对比', 'success');
      } else {
        const compare = await api.compares.add(userId, currentProduct.productId);
        compareEntries = [
          compare,
          ...compareEntries.filter((entry) => String(entry.productId) !== String(currentProduct.productId)),
        ].filter(Boolean);
        showNotice(notice, '已加入商品对比', 'success');
      }
      renderProduct(currentProduct);
    } catch (error) {
      showNotice(notice, error.message, 'error');
    } finally {
      setLoading(compareButton, false);
    }
  }
});

async function loadUserCollections() {
  if (!isLoggedIn()) {
    return {
      favorites: [],
      compares: [],
    };
  }

  const userId = getCurrentUserId();
  if (!userId) {
    return {
      favorites: [],
      compares: [],
    };
  }

  const [favoritesResult, comparesResult] = await Promise.allSettled([
    api.favorites.getByUser(userId),
    api.compares.getByUser(userId),
  ]);

  return {
    favorites: favoritesResult.status === 'fulfilled' ? favoritesResult.value?.favorites || [] : [],
    compares: comparesResult.status === 'fulfilled' ? comparesResult.value?.compares || [] : [],
  };
}

async function init() {
  if (!productId) {
    detail.innerHTML = '<div class="empty-state">缺少 productId 参数</div>';
    return;
  }

  detail.innerHTML = '<div class="empty-state">正在加载商品详情...</div>';
  try {
    const [product, collections] = await Promise.all([
      api.get(`/catalog/products/${encodeURIComponent(productId)}`),
      loadUserCollections(),
    ]);
    currentProduct = product;
    favoriteEntries = collections.favorites;
    compareEntries = collections.compares;
    renderProduct(currentProduct);
  } catch (error) {
    showNotice(notice, error.message, 'error');
    detail.innerHTML = '<div class="empty-state">商品详情加载失败</div>';
  }
}

init();

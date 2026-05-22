import '../../assets/js/layout';
import { renderLayout } from '../../assets/js/layout';
import { api } from '../../assets/js/api';
import { getUserInfo, requireAuth } from '../../assets/js/auth';
import { formatDate, formatPrice, qs, showNotice, setLoading } from '../../assets/js/utils';
import birdsBanner from '../../images/banner_birds.gif';
import catsBanner from '../../images/banner_cats.gif';
import dogsBanner from '../../images/banner_dogs.gif';
import fishBanner from '../../images/banner_fish.gif';
import reptilesBanner from '../../images/banner_reptiles.gif';
import './favorites.css';

renderLayout('我的收藏');

const content = qs('[data-favorites-content]');
const meta = qs('[data-favorites-meta]');
const notice = qs('[data-notice]');

const categoryBanners = {
  BIRDS: birdsBanner,
  CATS: catsBanner,
  DOGS: dogsBanner,
  FISH: fishBanner,
  REPTILES: reptilesBanner,
};

let compareProductIds = new Set();

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

function getSamplePrice(product) {
  const prices = (product.items || []).map((item) => Number(item.listPrice)).filter((price) => Number.isFinite(price));
  if (!prices.length) {
    return '暂无价格';
  }

  const min = Math.min(...prices);
  const max = Math.max(...prices);
  return min === max ? formatPrice(min) : `${formatPrice(min)} - ${formatPrice(max)}`;
}

function getBanner(product) {
  const key = (product?.categoryId || 'FISH').toUpperCase();
  return categoryBanners[key] || fishBanner;
}

function renderFavorites(entries) {
  meta.textContent = `共 ${entries.length} 件收藏商品`;

  if (!entries.length) {
    content.innerHTML = '<div class="empty-state">收藏列表为空，先去商品详情页收藏喜欢的商品。</div>';
    return;
  }

  content.innerHTML = `<div class="favorites-grid">
    ${entries
      .map(({ favorite, product }) => {
        if (!product) {
          return `<article class="card favorite-card favorite-card--missing">
            <div class="favorite-card__body">
              <span class="badge">已失效</span>
              <h2>${escapeHtml(favorite.productId)}</h2>
              <p>这个商品暂时无法读取详情。</p>
              <button class="btn btn-danger" type="button" data-remove-favorite="${escapeHtml(favorite.id)}">取消收藏</button>
            </div>
          </article>`;
        }

        const inCompare = compareProductIds.has(String(product.productId));
        return `<article class="card favorite-card" style="--favorite-banner: url('${getBanner(product)}')">
          <div class="favorite-card__banner">
            <span class="badge">${escapeHtml(product.categoryId || 'Catalog')}</span>
          </div>
          <div class="favorite-card__body">
            <h2>${escapeHtml(product.name || product.productId)}</h2>
            <p>${escapeHtml(stripHtml(product.description) || '暂无商品描述')}</p>
            <div class="favorite-card__meta">
              <span class="price">${getSamplePrice(product)}</span>
              <span>${formatDate(favorite.createTime)}</span>
            </div>
            <div class="favorite-card__actions">
              <a class="btn btn-secondary" href="/product.html?productId=${encodeURIComponent(product.productId)}">查看详情</a>
              ${
                inCompare
                  ? '<a class="btn btn-primary" href="/compare.html">已在对比</a>'
                  : `<button class="btn btn-primary" type="button" data-add-compare="${escapeHtml(product.productId)}">加入对比</button>`
              }
              <button class="btn btn-danger" type="button" data-remove-favorite="${escapeHtml(favorite.id)}">取消收藏</button>
            </div>
          </div>
        </article>`;
      })
      .join('')}
  </div>`;
}

async function loadFavorites() {
  const userId = getCurrentUserId();
  if (!userId) {
    showNotice(notice, '用户信息不完整，请重新登录后再试', 'error');
    content.innerHTML = '<div class="empty-state">无法读取当前用户信息</div>';
    return;
  }

  content.innerHTML = '<div class="empty-state">正在加载收藏商品...</div>';

  try {
    const [favoritesResult, comparesResult] = await Promise.all([
      api.favorites.getByUser(userId),
      api.compares.getByUser(userId).catch(() => ({ compares: [] })),
    ]);

    compareProductIds = new Set((comparesResult?.compares || []).map((compare) => String(compare.productId)));
    const favorites = favoritesResult?.favorites || [];
    const productResults = await Promise.all(
      favorites.map((favorite) =>
        api
          .get(`/catalog/products/${encodeURIComponent(favorite.productId)}`)
          .then((product) => ({ favorite, product }))
          .catch(() => ({ favorite, product: null })),
      ),
    );

    renderFavorites(productResults);
  } catch (error) {
    showNotice(notice, error.message, 'error');
    content.innerHTML = '<div class="empty-state">收藏列表加载失败</div>';
  }
}

content.addEventListener('click', async (event) => {
  const removeButton = event.target.closest('[data-remove-favorite]');
  if (removeButton) {
    setLoading(removeButton, true, '取消中...');
    try {
      await api.favorites.remove(removeButton.dataset.removeFavorite);
      showNotice(notice, '已取消收藏', 'success');
      await loadFavorites();
    } catch (error) {
      showNotice(notice, error.message, 'error');
    } finally {
      setLoading(removeButton, false);
    }
    return;
  }

  const compareButton = event.target.closest('[data-add-compare]');
  if (!compareButton) return;

  const userId = getCurrentUserId();
  if (!userId) {
    showNotice(notice, '用户信息不完整，请重新登录后再试', 'error');
    return;
  }

  setLoading(compareButton, true, '添加中...');
  try {
    await api.compares.add(userId, compareButton.dataset.addCompare);
    showNotice(notice, '已加入商品对比', 'success');
    await loadFavorites();
  } catch (error) {
    showNotice(notice, error.message, 'error');
  } finally {
    setLoading(compareButton, false);
  }
});

if (requireAuth()) {
  loadFavorites();
}


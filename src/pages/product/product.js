import '../../assets/js/layout';
import { renderLayout } from '../../assets/js/layout';
import { api } from '../../assets/js/api';
import { isLoggedIn } from '../../assets/js/auth';
import { formatPrice, getQueryParam, qs, showNotice, setLoading } from '../../assets/js/utils';
import './product.css';

renderLayout('首页');

const detail = qs('[data-product-detail]');
const notice = qs('[data-notice]');
const productId = getQueryParam('productId');

function renderProduct(product) {
  const items = product.items || [];
  detail.innerHTML = `<article class="card product-summary">
      <span class="badge">${product.categoryId}</span>
      <h1>${product.name}</h1>
      <p>${product.description || '暂无商品描述'}</p>
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

detail.addEventListener('click', async (event) => {
  const button = event.target.closest('[data-add-cart]');
  if (!button) return;

  if (!isLoggedIn()) {
    showNotice(notice, '请先登录后再加入购物车', 'error');
    window.setTimeout(() => {
      window.location.href = `/login.html?redirect=${encodeURIComponent(window.location.pathname + window.location.search)}`;
    }, 700);
    return;
  }

  setLoading(button, true, '添加中...');
  try {
    await api.post('/cart/items', {
      itemId: button.dataset.addCart,
      quantity: 1,
    });
    showNotice(notice, '已加入购物车', 'success');
  } catch (error) {
    showNotice(notice, error.message, 'error');
  } finally {
    setLoading(button, false);
  }
});

async function init() {
  if (!productId) {
    detail.innerHTML = '<div class="empty-state">缺少 productId 参数</div>';
    return;
  }

  detail.innerHTML = '<div class="empty-state">正在加载商品详情...</div>';
  try {
    const product = await api.get(`/catalog/products/${encodeURIComponent(productId)}`);
    renderProduct(product);
  } catch (error) {
    showNotice(notice, error.message, 'error');
    detail.innerHTML = '<div class="empty-state">商品详情加载失败</div>';
  }
}

init();

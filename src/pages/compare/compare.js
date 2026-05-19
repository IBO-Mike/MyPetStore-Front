import '../../assets/js/layout';
import { renderLayout } from '../../assets/js/layout';
import { api } from '../../assets/js/api';
import { getUserInfo, requireAuth } from '../../assets/js/auth';
import { formatPrice, qs, showNotice, setLoading } from '../../assets/js/utils';
import './compare.css';

renderLayout('商品对比');

const content = qs('[data-compare-content]');
const meta = qs('[data-compare-meta]');
const notice = qs('[data-notice]');
const clearButton = qs('[data-clear-compare]');

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

function getMinPrice(product) {
  const prices = (product.items || []).map((item) => Number(item.listPrice)).filter((price) => Number.isFinite(price));
  return prices.length ? Math.min(...prices) : null;
}

function renderCompare(entries) {
  compareEntries = entries;
  meta.textContent = `共 ${entries.length} 件商品`;
  clearButton.disabled = entries.length === 0;

  if (!entries.length) {
    content.innerHTML = '<div class="empty-state">对比列表为空，先去商品详情页添加商品。</div>';
    return;
  }

  const prices = entries.map(({ product }) => getMinPrice(product)).filter((price) => price !== null);
  const minPrice = prices.length ? Math.min(...prices) : null;
  const maxPrice = prices.length ? Math.max(...prices) : null;

  const rows = [
    {
      label: '分类',
      render(product) {
        return escapeHtml(product.categoryId || '-');
      },
    },
    {
      label: '描述',
      render(product) {
        return escapeHtml(stripHtml(product.description) || '-');
      },
    },
    {
      label: '最低价格',
      render(product) {
        const price = getMinPrice(product);
        if (price === null) return '-';
        return formatPrice(price);
      },
      valueClass(product) {
        const price = getMinPrice(product);
        if (price === null || minPrice === maxPrice) return '';
        if (price === minPrice) return ' compare-value--best';
        if (price === maxPrice) return ' compare-value--high';
        return '';
      },
    },
    {
      label: 'SKU 数量',
      render(product) {
        return `${(product.items || []).length}`;
      },
    },
  ];

  content.innerHTML = `<div class="compare-table-wrap">
    <table class="table compare-table">
      <thead>
        <tr>
          <th>项目</th>
          ${entries
            .map(
              ({ compare, product }) => `<th>
                <div class="compare-product-head">
                  <span class="badge">${escapeHtml(product.categoryId || 'Catalog')}</span>
                  <h2>${escapeHtml(product.name || product.productId)}</h2>
                  <a class="compare-product-link" href="/product.html?productId=${encodeURIComponent(product.productId)}">查看详情</a>
                  <button class="btn btn-danger compare-remove" type="button" data-remove-compare="${escapeHtml(compare.id)}">移除</button>
                </div>
              </th>`,
            )
            .join('')}
        </tr>
      </thead>
      <tbody>
        ${rows
          .map(
            (row) => `<tr>
              <th scope="row">${row.label}</th>
              ${entries
                .map(({ product }) => `<td class="compare-value${row.valueClass?.(product) || ''}">${row.render(product)}</td>`)
                .join('')}
            </tr>`,
          )
          .join('')}
      </tbody>
    </table>
  </div>`;
}

async function loadCompareList() {
  const userId = getCurrentUserId();
  if (!userId) {
    showNotice(notice, '用户信息不完整，请重新登录后再试', 'error');
    content.innerHTML = '<div class="empty-state">无法读取当前用户信息</div>';
    return;
  }

  content.innerHTML = '<div class="empty-state">正在加载商品对比...</div>';
  clearButton.disabled = true;

  try {
    const result = await api.compares.getByUser(userId);
    const compares = result?.compares || [];
    const productResults = await Promise.all(
      compares.map((compare) =>
        api
          .get(`/catalog/products/${encodeURIComponent(compare.productId)}`)
          .then((product) => ({ compare, product }))
          .catch(() => null),
      ),
    );

    renderCompare(productResults.filter(Boolean));
  } catch (error) {
    showNotice(notice, error.message, 'error');
    content.innerHTML = '<div class="empty-state">商品对比加载失败</div>';
  }
}

content.addEventListener('click', async (event) => {
  const button = event.target.closest('[data-remove-compare]');
  if (!button) return;

  setLoading(button, true, '移除中...');
  try {
    await api.compares.remove(button.dataset.removeCompare);
    showNotice(notice, '已移出商品对比', 'success');
    await loadCompareList();
  } catch (error) {
    showNotice(notice, error.message, 'error');
  } finally {
    setLoading(button, false);
    clearButton.disabled = compareEntries.length === 0;
  }
});

clearButton.addEventListener('click', async (event) => {
  if (!compareEntries.length) return;

  const userId = getCurrentUserId();
  if (!userId) {
    showNotice(notice, '用户信息不完整，请重新登录后再试', 'error');
    return;
  }

  const button = event.currentTarget;
  setLoading(button, true, '清空中...');
  try {
    await api.compares.clear(userId);
    showNotice(notice, '对比列表已清空', 'success');
    await loadCompareList();
  } catch (error) {
    showNotice(notice, error.message, 'error');
  } finally {
    setLoading(button, false);
  }
});

if (requireAuth()) {
  loadCompareList();
}

import '../../assets/js/layout';
import { renderLayout } from '../../assets/js/layout';
import { api } from '../../assets/js/api';
import { requireAuth, getUserInfo } from '../../assets/js/auth';
import { formatPrice, qs, showNotice, setLoading } from '../../assets/js/utils';
import './compare.css';

renderLayout('商品对比');

if (!requireAuth()) {
  throw new Error('Authentication required');
}

const content = qs('[data-compare-content]');
const meta = qs('[data-compare-meta]');
const notice = qs('[data-notice]');

function stripHtmlTags(html) {
  if (!html) return '';
  const div = document.createElement('div');
  div.innerHTML = html;
  return div.textContent || div.innerText || '';
}

function getProductMinPrice(product) {
  const items = product.items || [];
  if (items.length === 0) return '-';
  const prices = items.map(item => item.listPrice).filter(price => price != null);
  if (prices.length === 0) return '-';
  const minPrice = Math.min(...prices);
  return formatPrice(minPrice);
}

function renderCompare(compares, products = {}) {
  const productList = compares.map(c => products[c.productId]).filter(Boolean);
  
  meta.textContent = `共 ${productList.length} 件商品`;

  if (!productList.length) {
    content.innerHTML = '<div class="empty-state">对比列表为空，去商品详情页添加商品吧！</div>';
    return;
  }

  const attributes = [
    { key: 'categoryId', label: '分类' },
    { key: 'description', label: '描述' },
    { key: 'price', label: '价格' },
  ];

  const prices = productList.map(product => {
    const items = product.items || [];
    if (items.length === 0) return null;
    const itemPrices = items.map(item => item.listPrice).filter(price => price != null);
    if (itemPrices.length === 0) return null;
    return Math.min(...itemPrices);
  }).filter(p => p != null);

  const minPrice = prices.length > 0 ? Math.min(...prices) : null;
  const maxPrice = prices.length > 0 ? Math.max(...prices) : null;

  content.innerHTML = `
    <div class="compare-table-wrap">
      <table class="table compare-table">
        <thead>
          <tr>
            <th>属性</th>
            ${productList.map((product, index) => `
              <th>
                <button class="btn btn-sm btn-outline compare-remove" type="button" data-remove-compare="${compares[index].id}" data-product-id="${product.productId}">
                  ×
                </button>
                <h3>${product.name}</h3>
              </th>
            `).join('')}
          </tr>
        </thead>
        <tbody>
          ${attributes.map(attr => `
            <tr>
              <td class="compare-attr-label">${attr.label}</td>
              ${productList.map(product => {
                let value;
                let className = '';
                
                if (attr.key === 'description') {
                  value = stripHtmlTags(product.description) || '-';
                } else if (attr.key === 'price') {
                  const items = product.items || [];
                  if (items.length > 0) {
                    const itemPrices = items.map(item => item.listPrice).filter(price => price != null);
                    if (itemPrices.length > 0) {
                      const price = Math.min(...itemPrices);
                      value = formatPrice(price);
                      if (minPrice !== null && price === minPrice) {
                        className = 'price-low';
                      } else if (maxPrice !== null && price === maxPrice) {
                        className = 'price-high';
                      }
                    } else {
                      value = '-';
                    }
                  } else {
                    value = '-';
                  }
                } else {
                  value = product[attr.key] || '-';
                }
                return `<td class="compare-value ${className}">${value}</td>`;
              }).join('')}
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `;
}

let comparesData = [];
let productsData = {};

async function loadCompares() {
  content.innerHTML = '<div class="empty-state">正在加载对比列表...</div>';
  try {
    const user = getUserInfo();
    const result = await api.compares.getByUser(user.username);
    comparesData = result.compares || [];
    
    const productIds = [...new Set(comparesData.map(c => c.productId))];
    const productPromises = productIds.map(id => 
      api.get(`/catalog/products/${encodeURIComponent(id)}`).catch(() => null)
    );
    const products = await Promise.all(productPromises);
    
    productsData = {};
    products.forEach(p => {
      if (p) productsData[p.productId] = p;
    });
    
    renderCompare(comparesData, productsData);
  } catch (error) {
    console.error('Failed to load compares:', error);
    content.innerHTML = '<div class="empty-state">对比列表加载失败</div>';
  }
}

content.addEventListener('click', async (event) => {
  const button = event.target.closest('[data-remove-compare]');
  if (!button) return;

  setLoading(button, true, '删除中...');
  try {
    const compareId = parseInt(button.dataset.removeCompare, 10);
    await api.compares.remove(compareId);
    showNotice(notice, '已从对比中移除', 'success');
    await loadCompares();
  } catch (error) {
    showNotice(notice, error.message, 'error');
  } finally {
    setLoading(button, false);
  }
});

qs('[data-clear-compare]').addEventListener('click', async () => {
  const button = event.target;
  setLoading(button, true, '清空中...');
  try {
    const user = getUserInfo();
    await api.compares.clear(user.username);
    showNotice(notice, '对比列表已清空', 'success');
    await loadCompares();
  } catch (error) {
    showNotice(notice, error.message, 'error');
  } finally {
    setLoading(button, false);
  }
});

loadCompares();

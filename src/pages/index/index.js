import '../../assets/js/layout';
import { renderLayout } from '../../assets/js/layout';
import { api } from '../../assets/js/api';
import { formatPrice, normalizePageResult, qs, showNotice } from '../../assets/js/utils';
import './index.css';

renderLayout('首页');

const state = {
  page: 1,
  pageSize: 9,
  categoryId: '',
  keyword: '',
  totalPages: 1,
};

const categoryList = qs('[data-category-list]');
const productList = qs('[data-product-list]');
const listTitle = qs('[data-list-title]');
const listMeta = qs('[data-list-meta]');
const notice = qs('[data-notice]');

function getSamplePrice(product) {
  const prices = (product.items || []).map((item) => Number(item.listPrice)).filter(Boolean);
  if (!prices.length) {
    return '查看详情';
  }
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  return min === max ? formatPrice(min) : `${formatPrice(min)} - ${formatPrice(max)}`;
}

function getProductImage(productId, categoryId) {
  const imageMap = {
    'AV-CB-01': 'bird1',
    'AV-SB-02': 'bird2',
    'FI-SW-01': 'fish1',
    'FI-SW-02': 'fish2',
    'FI-FW-01': 'fish3',
    'FI-FW-02': 'fish4',
    'K9-BD-01': 'dog1',
    'K9-CW-01': 'dog2',
    'K9-DL-01': 'dog3',
    'K9-RT-01': 'dog4',
    'K9-RT-02': 'dog5',
    'K9-PO-02': 'dog6',
    'FL-DSH-01': 'cat1',
    'FL-DLH-02': 'cat2',
    'RP-LI-02': 'lizard1',
    'RP-SN-01': 'snake1',
  };
  
  const defaultImageMap = {
    'BIRDS': 'bird1',
    'CATS': 'cat1',
    'DOGS': 'dog1',
    'FISH': 'fish1',
    'REPTILES': 'lizard1',
  };
  
  const imageName = imageMap[productId] || defaultImageMap[categoryId] || 'dog1';
  return `/src/images/${imageName}.gif`;
}

function stripHtmlTags(html) {
  if (!html) return '';
  const div = document.createElement('div');
  div.innerHTML = html;
  return div.textContent || div.innerText || '';
}

function renderProducts(pageResult) {
  state.totalPages = pageResult.totalPages;
  listMeta.textContent = `共 ${pageResult.total} 个结果，第 ${pageResult.page} / ${pageResult.totalPages || 1} 页`;

  if (!pageResult.items.length) {
    productList.innerHTML = '<div class="empty-state">暂无商品</div>';
    return;
  }

  productList.innerHTML = pageResult.items
    .map(
      (product) => {
        const categoryId = product.categoryId || 'CATALOG';
        const productId = product.productId || '';
        const imageUrl = getProductImage(productId, categoryId);
        const description = stripHtmlTags(product.description);
        return `<article class="card product-card">
        <div>
          <span class="badge">${categoryId}</span>
          <img src="${imageUrl}" alt="${product.name}" onerror="this.style.display='none'" />
          <h3>${product.name}</h3>
          <p>${description || '暂无商品描述'}</p>
        </div>
        <div class="product-card__meta">
          <span class="price">${getSamplePrice(product)}</span>
          <a class="btn btn-primary" href="/product.html?productId=${encodeURIComponent(product.productId)}">查看</a>
        </div>
      </article>`;
      },
    )
    .join('');
}

async function loadCategories() {
  const categories = await api.get('/catalog/categories');
  state.categoryId = categories[0]?.categoryId || '';
  categoryList.innerHTML = categories.length
    ? categories
        .map(
          (category, index) =>
            `<button class="catalog-category${index === 0 ? ' is-active' : ''}" type="button" data-category="${category.categoryId}">${category.name}</button>`,
        )
        .join('')
    : '<div class="empty-state">暂无分类</div>';
}

async function loadAllProductsFromCategories() {
  const categories = await api.get('/catalog/categories');
  const products = await Promise.all(
    categories.map(
      (category) =>
        api.get(`/catalog/categories/${encodeURIComponent(category.categoryId)}/products`, {
          page: 1,
          pageSize: 3,
        }),
    ),
  );
  return {
    total: products.reduce((sum, page) => sum + (page.total || 0), 0),
    page: 1,
    pageSize: products.reduce((sum, page) => sum + (page.items?.length || 0), 0),
    totalPages: 1,
    items: products.flatMap((page) => page.items || []),
  };
}

async function loadProducts() {
  productList.innerHTML = '<div class="empty-state">正在加载商品...</div>';
  try {
    let result;
    if (state.keyword) {
      listTitle.textContent = `搜索：${state.keyword}`;
      result = await api.get('/catalog/search', {
        keyword: state.keyword,
        categoryId: state.categoryId,
        page: state.page,
        pageSize: state.pageSize,
      });
    } else if (state.categoryId) {
      listTitle.textContent = `分类：${state.categoryId}`;
      result = await api.get(`/catalog/categories/${encodeURIComponent(state.categoryId)}/products`, {
        page: state.page,
        pageSize: state.pageSize,
      });
    } else {
      listTitle.textContent = '全部商品';
      result = await loadAllProductsFromCategories();
    }
    renderProducts(normalizePageResult(result));
  } catch (error) {
    showNotice(notice, error.message, 'error');
    productList.innerHTML = '<div class="empty-state">商品加载失败</div>';
  }
}

categoryList.addEventListener('click', (event) => {
  const button = event.target.closest('[data-category]');
  if (!button) return;
  categoryList.querySelectorAll('.catalog-category').forEach((item) => item.classList.remove('is-active'));
  button.classList.add('is-active');
  state.categoryId = button.dataset.category;
  state.page = 1;
  loadProducts();
});

qs('[data-search-form]').addEventListener('submit', (event) => {
  event.preventDefault();
  state.keyword = new FormData(event.currentTarget).get('keyword').trim();
  state.page = 1;
  loadProducts();
});

qs('[data-prev-page]').addEventListener('click', () => {
  if (state.page > 1) {
    state.page -= 1;
    loadProducts();
  }
});

qs('[data-next-page]').addEventListener('click', () => {
  if (state.page < state.totalPages) {
    state.page += 1;
    loadProducts();
  }
});

loadCategories().then(loadProducts).catch((error) => showNotice(notice, error.message, 'error'));

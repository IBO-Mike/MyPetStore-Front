import '../../assets/js/layout';
import { renderLayout } from '../../assets/js/layout';
import { api } from '../../assets/js/api';
import { requireAuth } from '../../assets/js/auth';
import { formatDate, formatPrice, normalizePageResult, qs, showNotice } from '../../assets/js/utils';
import './order.css';

renderLayout('我的订单');

if (!requireAuth()) {
  throw new Error('Authentication required');
}

const state = {
  page: 1,
  pageSize: 10,
  totalPages: 1,
  status: '',
};

const orderList = qs('[data-order-list]');
const orderMeta = qs('[data-order-meta]');
const notice = qs('[data-notice]');

function renderOrders(result) {
  state.totalPages = result.totalPages;
  orderMeta.textContent = `共 ${result.total} 个订单，第 ${result.page} / ${result.totalPages || 1} 页`;

  if (!result.items.length) {
    orderList.innerHTML = '<div class="empty-state">暂无订单</div>';
    return;
  }

  orderList.innerHTML = `<div class="table-wrap">
    <table class="table table-striped">
      <thead>
        <tr>
          <th>订单号</th>
          <th>下单时间</th>
          <th>总金额</th>
          <th>状态</th>
          <th>收件人</th>
          <th>操作</th>
        </tr>
      </thead>
      <tbody>
        ${result.items
          .map(
            (order) => `<tr>
              <td><a class="order-link" href="/order-detail.html?orderId=${encodeURIComponent(order.orderId)}">#${order.orderId}</a></td>
              <td>${formatDate(order.createTime || order.orderDate)}</td>
              <td>${formatPrice(order.totalPrice)}</td>
              <td><span class="badge">${order.status}</span></td>
              <td>${order.billToFirstName || ''} ${order.billToLastName || ''}</td>
              <td><a class="btn btn-secondary" href="/order-detail.html?orderId=${encodeURIComponent(order.orderId)}">详情</a></td>
            </tr>`,
          )
          .join('')}
      </tbody>
    </table>
  </div>`;
}

async function loadOrders() {
  orderList.innerHTML = '<div class="empty-state">正在加载订单...</div>';
  try {
    const result = await api.get('/orders', {
      page: state.page,
      pageSize: state.pageSize,
      status: state.status,
    });
    renderOrders(normalizePageResult(result));
  } catch (error) {
    showNotice(notice, error.message, 'error');
  }
}

qs('[data-status]').addEventListener('change', (event) => {
  state.status = event.target.value;
  state.page = 1;
  loadOrders();
});

qs('[data-prev-page]').addEventListener('click', () => {
  if (state.page > 1) {
    state.page -= 1;
    loadOrders();
  }
});

qs('[data-next-page]').addEventListener('click', () => {
  if (state.page < state.totalPages) {
    state.page += 1;
    loadOrders();
  }
});

loadOrders();

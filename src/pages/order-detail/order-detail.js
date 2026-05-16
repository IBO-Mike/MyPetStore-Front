import '../../assets/js/layout';
import { renderLayout } from '../../assets/js/layout';
import { api } from '../../assets/js/api';
import { requireAuth } from '../../assets/js/auth';
import { formatDate, formatPrice, getQueryParam, qs, showNotice } from '../../assets/js/utils';
import './order-detail.css';

renderLayout('我的订单');

if (!requireAuth()) {
  throw new Error('Authentication required');
}

const detail = qs('[data-order-detail]');
const notice = qs('[data-notice]');
const orderId = getQueryParam('orderId');

function formatAddress(order, prefix) {
  const name = `${order[`${prefix}ToFirstName`] || ''} ${order[`${prefix}ToLastName`] || ''}`.trim();
  return [
    name,
    order[`${prefix}Address1`],
    order[`${prefix}Address2`],
    `${order[`${prefix}City`] || ''} ${order[`${prefix}State`] || ''} ${order[`${prefix}Zip`] || ''}`.trim(),
    order[`${prefix}Country`],
  ]
    .filter(Boolean)
    .join('<br />');
}

function renderOrder(order) {
  const canCancel = String(order.status).toLowerCase() === 'pending';
  detail.innerHTML = `<div class="order-detail">
    <div class="page-head">
      <div>
        <h1>订单 #${order.orderId}</h1>
        <p>${formatDate(order.createTime || order.orderDate)}</p>
      </div>
      ${canCancel ? '<button class="btn btn-danger" type="button" data-cancel-order>取消订单</button>' : ''}
    </div>
    <section class="order-summary">
      <div class="order-summary__item"><span class="text-muted">状态</span><h3>${order.status}</h3></div>
      <div class="order-summary__item"><span class="text-muted">总金额</span><h3 class="price">${formatPrice(order.totalPrice)}</h3></div>
      <div class="order-summary__item"><span class="text-muted">配送</span><h3>${order.courier || '-'}</h3></div>
      <div class="order-summary__item"><span class="text-muted">支付</span><h3>${order.cardType || '-'}</h3></div>
    </section>
    <section class="address-grid">
      <article class="panel">
        <div class="panel__header"><h2>账单地址</h2></div>
        <div class="panel__body">${formatAddress(order, 'bill') || '-'}</div>
      </article>
      <article class="panel">
        <div class="panel__header"><h2>收货地址</h2></div>
        <div class="panel__body">${formatAddress(order, 'ship') || '-'}</div>
      </article>
    </section>
    <section class="panel">
      <div class="panel__header"><h2>订单项</h2></div>
      <div class="table-wrap">
        <table class="table table-striped">
          <thead>
            <tr>
              <th>#</th>
              <th>商品</th>
              <th>SKU</th>
              <th>数量</th>
              <th>单价</th>
              <th>小计</th>
            </tr>
          </thead>
          <tbody>
            ${(order.lineItems || [])
              .map(
                (item) => `<tr>
                  <td>${item.lineNumber}</td>
                  <td>${item.productName || '-'}</td>
                  <td>${item.itemId}</td>
                  <td>${item.quantity}</td>
                  <td>${formatPrice(item.unitPrice)}</td>
                  <td>${formatPrice(item.subtotal || item.quantity * item.unitPrice)}</td>
                </tr>`,
              )
              .join('')}
          </tbody>
        </table>
      </div>
    </section>
  </div>`;
}

detail.addEventListener('click', async (event) => {
  const button = event.target.closest('[data-cancel-order]');
  if (!button) return;
  try {
    await api.delete(`/orders/${encodeURIComponent(orderId)}`);
    showNotice(notice, '订单已取消', 'success');
    await loadOrder();
  } catch (error) {
    showNotice(notice, error.message, 'error');
  }
});

async function loadOrder() {
  if (!orderId) {
    detail.innerHTML = '<div class="empty-state">缺少 orderId 参数</div>';
    return;
  }

  detail.innerHTML = '<div class="empty-state">正在加载订单详情...</div>';
  try {
    renderOrder(await api.get(`/orders/${encodeURIComponent(orderId)}`));
  } catch (error) {
    showNotice(notice, error.message, 'error');
    detail.innerHTML = '<div class="empty-state">订单详情加载失败</div>';
  }
}

loadOrder();

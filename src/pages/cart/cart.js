import '../../assets/js/layout';
import { renderLayout } from '../../assets/js/layout';
import { api } from '../../assets/js/api';
import { requireAuth, getUserInfo } from '../../assets/js/auth';
import { formatPrice, qs, showNotice } from '../../assets/js/utils';
import './cart.css';

renderLayout('购物车');

if (!requireAuth()) {
  throw new Error('Authentication required');
}

const content = qs('[data-cart-content]');
const meta = qs('[data-cart-meta]');
const notice = qs('[data-notice]');

function renderCart(cart) {
  meta.textContent = `共 ${cart.totalItems || 0} 件商品`;
  const items = cart.items || [];

  if (!items.length) {
    content.innerHTML = '<div class="empty-state">购物车为空</div>';
    return;
  }

  content.innerHTML = `<div class="table-wrap">
    <table class="table table-striped">
      <thead>
        <tr>
          <th>商品</th>
          <th>SKU</th>
          <th>单价</th>
          <th>数量</th>
          <th>小计</th>
          <th>操作</th>
        </tr>
      </thead>
      <tbody>
        ${items
          .map(
            (item) => `<tr>
              <td>${item.productName}<br /><span class="text-muted">${item.attribute1 || ''}</span></td>
              <td>${item.itemId}</td>
              <td>${formatPrice(item.listPrice)}</td>
              <td><input class="form-control cart-qty" type="number" min="1" value="${item.quantity}" data-qty="${item.itemId}" /></td>
              <td>${formatPrice(item.subtotal)}</td>
              <td><button class="btn btn-danger" type="button" data-remove="${item.itemId}">删除</button></td>
            </tr>`,
          )
          .join('')}
      </tbody>
    </table>
  </div>
  <div class="cart-total">合计：<span class="price">${formatPrice(cart.totalPrice)}</span></div>`;
}

async function loadCart() {
  content.innerHTML = '<div class="empty-state">正在加载购物车...</div>';
  try {
    renderCart(await api.get('/cart'));
  } catch (error) {
    showNotice(notice, error.message, 'error');
  }
}

content.addEventListener('change', async (event) => {
  const input = event.target.closest('[data-qty]');
  if (!input) return;
  const quantity = Math.max(1, Number(input.value || 1));
  try {
    await api.put(`/cart/items/${encodeURIComponent(input.dataset.qty)}`, { quantity });
    await loadCart();
  } catch (error) {
    showNotice(notice, error.message, 'error');
  }
});

content.addEventListener('click', async (event) => {
  const button = event.target.closest('[data-remove]');
  if (!button) return;
  try {
    await api.delete(`/cart/items/${encodeURIComponent(button.dataset.remove)}`);
    await loadCart();
  } catch (error) {
    showNotice(notice, error.message, 'error');
  }
});

qs('[data-checkout]').addEventListener('click', async () => {
  const user = getUserInfo() || {};
  const orderPayload = {
    billToFirstName: user.firstName || 'Customer',
    billToLastName: user.lastName || user.username || 'User',
    billAddress1: user.address1 || 'N/A',
    billAddress2: user.address2 || '',
    billCity: user.city || 'N/A',
    billState: user.state || 'N/A',
    billZip: user.zip || '000000',
    billCountry: user.country || 'USA',
    shipToFirstName: user.firstName || 'Customer',
    shipToLastName: user.lastName || user.username || 'User',
    shipAddress1: user.address1 || 'N/A',
    shipAddress2: user.address2 || '',
    shipCity: user.city || 'N/A',
    shipState: user.state || 'N/A',
    shipZip: user.zip || '000000',
    shipCountry: user.country || 'USA',
    creditCard: '4111-1111-1111-1111',
    cardType: 'Visa',
  };

  try {
    const order = await api.post('/orders', orderPayload);
    window.location.href = `/order-detail.html?orderId=${encodeURIComponent(order.orderId)}`;
  } catch (error) {
    showNotice(notice, error.message, 'error');
  }
});

loadCart();

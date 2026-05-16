export function formatDate(value) {
  if (!value) {
    return '-';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

export function formatPrice(value) {
  const amount = Number(value || 0);
  return new Intl.NumberFormat('zh-CN', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(amount);
}

export function getQueryParam(name, fallback = '') {
  return new URLSearchParams(window.location.search).get(name) || fallback;
}

export function createElement(tag, options = {}, children = []) {
  const element = document.createElement(tag);
  const { className, text, html, attrs = {} } = options;

  if (className) {
    element.className = className;
  }
  if (text !== undefined) {
    element.textContent = text;
  }
  if (html !== undefined) {
    element.innerHTML = html;
  }
  Object.entries(attrs).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      element.setAttribute(key, value);
    }
  });
  children.forEach((child) => element.append(child));

  return element;
}

export function qs(selector, root = document) {
  return root.querySelector(selector);
}

export function qsa(selector, root = document) {
  return Array.from(root.querySelectorAll(selector));
}

export function showNotice(element, message, type = 'success') {
  if (!element) {
    return;
  }

  element.className = `notice notice--${type} is-visible`;
  element.textContent = message;
}

export function clearNotice(element) {
  if (!element) {
    return;
  }

  element.className = 'notice';
  element.textContent = '';
}

export function setLoading(button, loading, text = '处理中...') {
  if (!button) {
    return;
  }

  if (loading) {
    button.dataset.originalText = button.textContent;
    button.textContent = text;
    button.disabled = true;
    return;
  }

  button.textContent = button.dataset.originalText || button.textContent;
  button.disabled = false;
}

export function normalizePageResult(result) {
  if (Array.isArray(result)) {
    return {
      total: result.length,
      page: 1,
      pageSize: result.length,
      totalPages: 1,
      items: result,
    };
  }

  return {
    total: result?.total || 0,
    page: result?.page || 1,
    pageSize: result?.pageSize || 10,
    totalPages: result?.totalPages || 1,
    items: result?.items || [],
  };
}

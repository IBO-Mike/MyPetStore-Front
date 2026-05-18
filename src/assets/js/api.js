const API_BASE_URL = process.env.API_BASE_URL || '/api';
const TOKEN_KEY = 'mypetstore_token';

export class ApiError extends Error {
  constructor(message, status, data) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

function buildUrl(path, params = {}) {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  const url = new URL(`${API_BASE_URL}${normalizedPath}`, window.location.origin);

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      url.searchParams.set(key, value);
    }
  });

  return url.toString();
}

function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

async function parseResponse(response) {
  if (response.status === 204) {
    return null;
  }

  const text = await response.text();
  if (!text) {
    return null;
  }

  try {
    return JSON.parse(text);
  } catch (error) {
    throw new ApiError('服务器返回了无法解析的数据', response.status, text);
  }
}

async function request(path, options = {}) {
  const { method = 'GET', data, params, headers = {} } = options;
  const token = getToken();
  const requestHeaders = {
    Accept: 'application/json',
    ...headers,
  };

  const config = {
    method,
    headers: requestHeaders,
  };

  if (token) {
    requestHeaders.Authorization = `Bearer ${token}`;
  }

  if (data !== undefined) {
    requestHeaders['Content-Type'] = 'application/json';
    config.body = JSON.stringify(data);
  }

  const response = await fetch(buildUrl(path, params), config);
  const payload = await parseResponse(response);
  const apiCode = payload?.code ?? response.status;

  if (apiCode === 401 || response.status === 401) {
    localStorage.removeItem(TOKEN_KEY);
    const redirect = encodeURIComponent(`${window.location.pathname}${window.location.search}`);
    window.location.href = `/login.html?redirect=${redirect}`;
    throw new ApiError(payload?.message || '请先登录', 401, payload?.data);
  }

  if (!response.ok || ![200, 201, 204].includes(apiCode)) {
    throw new ApiError(payload?.message || '请求失败', apiCode, payload?.data);
  }

  return payload?.data ?? null;
}

export const api = {
  get(path, params) {
    return request(path, { method: 'GET', params });
  },
  post(path, data) {
    return request(path, { method: 'POST', data });
  },
  put(path, data) {
    return request(path, { method: 'PUT', data });
  },
  delete(path, params) {
    return request(path, { method: 'DELETE', params });
  },
  favorites: {
    add(userId, productId) {
      return api.post('/favorites', { userId, productId });
    },
    remove(id) {
      return api.delete(`/favorites/${id}`);
    },
    getByUser(userId) {
      return api.get(`/favorites/users/${userId}`);
    },
  },
  compares: {
    add(userId, productId) {
      return api.post('/compares', { userId, productId });
    },
    remove(id) {
      return api.delete(`/compares/${id}`);
    },
    removeByProductId(userId, productId) {
      return api.delete(`/compares/products/${productId}`, { params: { userId } });
    },
    clear(userId) {
      return api.delete('/compares', { params: { userId } });
    },
    getByUser(userId) {
      return api.get(`/compares/users/${userId}`);
    },
  },
};

export { API_BASE_URL, TOKEN_KEY };

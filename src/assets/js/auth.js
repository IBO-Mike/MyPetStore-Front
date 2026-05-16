import { api, TOKEN_KEY } from './api';

const USER_KEY = 'mypetstore_user';

export async function login(username, password) {
  const data = await api.post('/auth/sign-in', { username, password });
  localStorage.setItem(TOKEN_KEY, data.token);
  localStorage.setItem(USER_KEY, JSON.stringify(data));
  return data;
}

export async function register(payload) {
  return api.post('/auth/sign-up', payload);
}

export async function logout() {
  try {
    if (isLoggedIn()) {
      await api.post('/auth/sign-out');
    }
  } finally {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  }
}

export function isLoggedIn() {
  return Boolean(localStorage.getItem(TOKEN_KEY));
}

export function getUserInfo() {
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw);
  } catch (error) {
    localStorage.removeItem(USER_KEY);
    return null;
  }
}

export function saveUserInfo(user) {
  localStorage.setItem(USER_KEY, JSON.stringify({ ...getUserInfo(), ...user }));
}

export function requireAuth() {
  if (!isLoggedIn()) {
    const redirect = encodeURIComponent(`${window.location.pathname}${window.location.search}`);
    window.location.href = `/login.html?redirect=${redirect}`;
    return false;
  }

  return true;
}

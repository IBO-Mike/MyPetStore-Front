import '../../assets/js/layout';
import { renderLayout } from '../../assets/js/layout';
import { login, register } from '../../assets/js/auth';
import { getQueryParam, qs, showNotice, setLoading } from '../../assets/js/utils';
import './login.css';

renderLayout('登录 / 注册');

const notice = qs('[data-notice]');
const redirect = getQueryParam('redirect', '/');

qs('[data-login-form]').addEventListener('submit', async (event) => {
  event.preventDefault();
  const button = event.submitter;
  const formData = new FormData(event.currentTarget);
  const username = formData.get('username').trim();
  const password = formData.get('password').trim();

  if (!username || !password) {
    showNotice(notice, '用户名和密码不能为空', 'error');
    return;
  }

  setLoading(button, true, '登录中...');
  try {
    await login(username, password);
    window.location.href = redirect;
  } catch (error) {
    showNotice(notice, error.message, 'error');
  } finally {
    setLoading(button, false);
  }
});

qs('[data-register-form]').addEventListener('submit', async (event) => {
  event.preventDefault();
  const button = event.submitter;
  const formData = new FormData(event.currentTarget);
  const payload = {
    username: formData.get('username').trim(),
    password: formData.get('password').trim(),
    confirmPassword: formData.get('confirmPassword').trim(),
  };

  if (!payload.username || !payload.password) {
    showNotice(notice, '用户名和密码不能为空', 'error');
    return;
  }
  if (payload.password !== payload.confirmPassword) {
    showNotice(notice, '两次输入的密码不一致', 'error');
    return;
  }

  setLoading(button, true, '注册中...');
  try {
    await register(payload);
    showNotice(notice, '注册成功，请登录', 'success');
    event.currentTarget.reset();
  } catch (error) {
    showNotice(notice, error.message, 'error');
  } finally {
    setLoading(button, false);
  }
});

import '../../assets/js/layout';
import { renderLayout } from '../../assets/js/layout';
import { login } from '../../assets/js/auth';
import { getQueryParam, qs, showNotice, setLoading } from '../../assets/js/utils';
import './login.css';

renderLayout('登录');

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

import '../../assets/js/layout';
import { renderLayout } from '../../assets/js/layout';
import { register } from '../../assets/js/auth';
import { qs, showNotice, setLoading } from '../../assets/js/utils';
import './register.css';

renderLayout('注册');

const notice = qs('[data-notice]');
const MAX_PASSWORD_LENGTH = 25;

const requiredFields = [
  'username',
  'password',
  'confirmPassword',
  'email',
  'firstName',
  'lastName',
  'phone',
  'address1',
  'city',
  'state',
  'zip',
  'country',
];

qs('[data-register-form]').addEventListener('submit', async (event) => {
  event.preventDefault();
  const form = event.currentTarget;
  const button = event.submitter;
  const formData = new FormData(form);
  const payload = Object.fromEntries(Array.from(formData.entries()).map(([key, value]) => [key, value.trim()]));

  if (requiredFields.some((field) => !payload[field])) {
    showNotice(notice, '请填写所有必填信息', 'error');
    return;
  }

  if (payload.password !== payload.confirmPassword) {
    showNotice(notice, '两次输入的密码不一致', 'error');
    return;
  }

  if (payload.password.length > MAX_PASSWORD_LENGTH) {
    showNotice(notice, `密码不能超过 ${MAX_PASSWORD_LENGTH} 位`, 'error');
    return;
  }

  setLoading(button, true, '注册中...');
  try {
    await register(payload);
    showNotice(notice, '注册成功，请登录', 'success');
    form.reset();
  } catch (error) {
    showNotice(notice, error.message, 'error');
  } finally {
    setLoading(button, false);
  }
});

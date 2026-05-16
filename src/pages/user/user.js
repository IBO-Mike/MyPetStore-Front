import '../../assets/js/layout';
import { renderLayout } from '../../assets/js/layout';
import { api } from '../../assets/js/api';
import { logout, requireAuth, saveUserInfo } from '../../assets/js/auth';
import { qs, showNotice, setLoading } from '../../assets/js/utils';
import './user.css';

renderLayout('个人中心');

if (!requireAuth()) {
  throw new Error('Authentication required');
}

const notice = qs('[data-notice]');
const profileForm = qs('[data-profile-form]');

const profileFields = [
  ['firstName', '名'],
  ['lastName', '姓'],
  ['email', '邮箱'],
  ['phone', '电话'],
  ['address1', '地址 1'],
  ['address2', '地址 2'],
  ['city', '城市'],
  ['state', '州/省'],
  ['zip', '邮编'],
  ['country', '国家'],
  ['languagePreference', '语言偏好'],
  ['favoriteCategory', '偏好分类'],
];

function renderProfile(user) {
  profileForm.innerHTML = profileFields
    .map(
      ([name, label]) => `<label class="form-group">
        <span class="form-label">${label}</span>
        <input class="form-control" name="${name}" value="${user?.[name] || ''}" />
      </label>`,
    )
    .join('');

  profileForm.insertAdjacentHTML(
    'afterbegin',
    `<label class="form-group">
      <span class="form-label">用户名</span>
      <input class="form-control" value="${user.username}" disabled />
    </label>`,
  );
  profileForm.insertAdjacentHTML(
    'beforeend',
    '<div class="form-group form-group--full"><button class="btn btn-primary" type="submit">保存资料</button></div>',
  );
}

profileForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const button = event.submitter;
  const formData = new FormData(event.currentTarget);
  const payload = Object.fromEntries(profileFields.map(([name]) => [name, formData.get(name)?.trim() || '']));

  setLoading(button, true, '保存中...');
  try {
    const updated = await api.put('/account/profile', payload);
    saveUserInfo(updated);
    showNotice(notice, '个人资料已更新', 'success');
  } catch (error) {
    showNotice(notice, error.message, 'error');
  } finally {
    setLoading(button, false);
  }
});

qs('[data-password-form]').addEventListener('submit', async (event) => {
  event.preventDefault();
  const button = event.submitter;
  const formData = new FormData(event.currentTarget);
  const payload = {
    oldPassword: formData.get('oldPassword').trim(),
    newPassword: formData.get('newPassword').trim(),
    confirmPassword: formData.get('confirmPassword').trim(),
  };

  if (payload.newPassword !== payload.confirmPassword) {
    showNotice(notice, '两次输入的新密码不一致', 'error');
    return;
  }

  setLoading(button, true, '保存中...');
  try {
    await api.post('/account/change-password', payload);
    event.currentTarget.reset();
    showNotice(notice, '密码已更新', 'success');
  } catch (error) {
    showNotice(notice, error.message, 'error');
  } finally {
    setLoading(button, false);
  }
});

qs('[data-logout-page]').addEventListener('click', async () => {
  await logout();
  window.location.href = '/login.html';
});

async function init() {
  profileForm.innerHTML = '<div class="empty-state form-group--full">正在加载个人资料...</div>';
  try {
    const profile = await api.get('/account/profile');
    saveUserInfo(profile);
    renderProfile(profile);
  } catch (error) {
    showNotice(notice, error.message, 'error');
  }
}

init();

import { expect, test } from '../../../src/fixtures';
import { LoginPage } from '../../../src/pages/login/LoginPage';
import { SSO_URL } from '../../../src/pages/login/SsoLoginPage';
import { accounts } from '../../../src/data/credentials';

/**
 * Đăng nhập — hai bước, hai origin (app → SSO Keycloak → callback về app).
 *
 * Cả file gắn @guest: đăng nhập phải chạy ở project KHÔNG nạp session sẵn, nếu không
 * mở lên là đã đăng nhập rồi và mọi test ở đây vô nghĩa.
 */
test.describe('Login into system', { tag: '@guest' }, () => {
  const LIVE = '/vi/live';

  test('Login success @smoke', async ({ createPage, page }) => {
    test.skip(!accounts.standard.password, 'USER_PASSWORD chưa có trong .env');
    const login = createPage(LoginPage);
    await login.openWithRedirect(LIVE);

    await login.signIn(accounts.standard);

    await login.expectSignedIn();
    await expect(page).toHaveURL(new RegExp(`${LIVE}$`));
  });
});

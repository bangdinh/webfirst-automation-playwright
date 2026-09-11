import { expect } from '@playwright/test';
import { BasePage } from 'qc-kit/core';

/**
 * Bước 2 của đăng nhập — trang SSO (Keycloak), Ở MỘT ORIGIN KHÁC với app.
 *
 * Ba điều ràng buộc cách viết test ở đây, và cả ba đều lấy từ DOM/URL thật:
 *
 * 1. KHÔNG deep-link được. URL SSO mang `session_code`, `state`, `nonce`,
 *    `code_challenge` — dùng một lần. Mọi kịch bản phải bắt đầu từ `/vi/login` của app
 *    rồi qua bước 1; `open()` ở đây vì thế bị chặn.
 * 2. `baseURL` của project trỏ về app, nên assert URL ở đây phải dùng URL tuyệt đối.
 * 3. Trang này CÓ `data-testid` thật — dùng thẳng, không cần locator TẠM THỜI nào.
 */

/** Realm và client do app chọn theo mã doanh nghiệp; chỉ khớp phần ổn định của URL. */
export const SSO_URL = /\/realms\/[^/]+\/protocol\/openid-connect\/auth/;

export class SsoLoginPage extends BasePage {
  readonly username = this.page.getByTestId('sso-login-username-input');
  readonly password = this.page.getByTestId('sso-login-password-input');
  readonly submitButton = this.page.getByTestId('sso-login-submit-btn');
  readonly passwordToggle = this.page.getByTestId('sso-login-password-toggle-btn');
  readonly forgotPasswordLink = this.page.getByTestId('sso-login-forgot-password-link');
  readonly backLink = this.page.getByTestId('sso-login-back-link');
  readonly demoButton = this.page.getByTestId('sso-login-demo-btn');

  /**
   * Ô lỗi của Keycloak. Tồn tại sẵn và rỗng khi chưa lỗi → assert theo nội dung.
   * TẠM THỜI: `#input-error` là id của theme Keycloak, không phải testid của team.
   * Chờ Dev gắn `data-testid="sso-login-error"`.
   */
  readonly error = this.page.locator('#input-error');

  override async open(): Promise<never> {
    throw new Error(
      'Không mở thẳng trang SSO: URL của nó mang session_code/state/nonce dùng một lần. ' +
        'Đi qua LoginPage.submitCompany() để tới đây.',
    );
  }

  override async waitUntilLoaded(): Promise<void> {
    await expect(this.username).toBeEditable();
  }

  async signIn(username: string, password: string): Promise<void> {
    await this.step(`nhập tài khoản "${username}" trên SSO`, async () => {
      await this.waitUntilLoaded();
      await this.username.fill(username);
      await this.password.fill(password);
      await this.clickWhenReady(this.submitButton);
    });
  }

  async expectLoaded(): Promise<void> {
    await expect(this.page).toHaveURL(SSO_URL);
    await expect(this.username).toBeEditable();
  }

  async expectRejected(): Promise<void> {
    await expect(this.page).toHaveURL(SSO_URL);
    await expect(this.error).not.toBeEmpty();
  }
}

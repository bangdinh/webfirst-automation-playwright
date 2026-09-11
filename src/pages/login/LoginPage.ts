import { expect } from '@playwright/test';
import { STORAGE_STATE } from 'qc-kit/config';
import { BasePage, saveSession, type Authenticator } from 'qc-kit/core';
import { SsoLoginPage } from './SsoLoginPage';

/**
 * Bước 1 của đăng nhập: chọn doanh nghiệp.
 *
 * Đăng nhập ở đây là luồng HAI BƯỚC và hai bước nằm trên HAI ORIGIN khác nhau:
 *
 *   bước 1  app      /vi/login          nhập "Mã doanh nghiệp" → Tiếp tục
 *   bước 2  SSO      staging-sso…       Keycloak realm của doanh nghiệp đó
 *
 * Vì vậy bước 2 là một page object riêng (`SsoLoginPage`), không phải mấy locator nữa
 * nhét thêm vào class này: nó là app khác, DOM khác, và nó đã có `data-testid` thật
 * trong khi màn này thì chưa.
 */

/** Nhãn hiển thị — URL có prefix locale (`/vi/`), nên tên nút đổi theo ngôn ngữ. */
const VI = {
  continue: 'Tiếp tục',
  demo: 'Dùng thử bản demo',
  wrongCompany: 'Mã doanh nghiệp không đúng',
} as const;

export interface LoginCredentials {
  /** Mã doanh nghiệp — quyết định realm SSO nào được dùng. Khác nhau theo môi trường. */
  company: string;
  username: string;
  password: string;
}

export class LoginPage extends BasePage {
  protected override readonly path = '/vi/login';

  // TẠM THỜI: màn này chưa có `data-testid` nào và cũng không có thẻ <form>.
  // Chờ Dev gắn `data-testid="login-company-input"`.
  readonly company = this.page.locator('#company');

  // TẠM THỜI: nút không id, không testid → getByRole + tên hiển thị.
  // Chờ Dev gắn `data-testid="login-company-submit"`.
  readonly continueButton = this.page.getByRole('button', { name: VI.continue });

  // TẠM THỜI: chờ Dev gắn `data-testid="login-demo-btn"`.
  readonly demoButton = this.page.getByRole('button', { name: VI.demo });

  /**
   * Vùng báo lỗi của ô mã doanh nghiệp.
   *
   * KHÔNG dùng `getByRole('alert')`: Next.js chèn sẵn một
   * `<div role="alert" id="__next-route-announcer__">` vào mọi trang, nên role đó khớp
   * hai node và Playwright ném strict mode violation. Đã dính một lần.
   *
   * TẠM THỜI: `#company-error` là id do team đặt (ổn định, không phải id tự sinh).
   * Chờ Dev gắn `data-testid="login-company-error"`.
   */
  readonly alert = this.page.locator('#company-error');

  override async waitUntilLoaded(): Promise<void> {
    await expect(this.company).toBeEditable();
  }

  /**
   * Mở màn đăng nhập kèm `redirect` — app quay lại đúng trang đó sau khi đăng nhập.
   * Spec chỉ nói ý định, không tự nối query string.
   */
  async openWithRedirect(redirectTo: string): Promise<void> {
    await this.step(`mở màn đăng nhập, redirect về "${redirectTo}"`, async () => {
      await this.open(`${this.path}?redirect=${encodeURIComponent(redirectTo)}`);
      await this.waitUntilLoaded();
    });
  }

  /**
   * Bước 1. Trả về page object của bước 2 — mã đúng thì trình duyệt đã rời sang SSO,
   * và người gọi cần đúng cái đó để đi tiếp.
   */
  async submitCompany(company: string): Promise<SsoLoginPage> {
    return this.step(`chọn doanh nghiệp "${company}"`, async () => {
      await this.company.fill(company);
      await this.clickWhenReady(this.continueButton);
      return new SsoLoginPage(this.page);
    });
  }

  /**
   * Cả hai bước, xuyên hai origin.
   *
   * Cố tình KHÔNG tự cache session: với `fullyParallel`, một màn đăng nhập tự cache
   * nghĩa là mọi spec file đăng nhập lại và tranh nhau một file.
   */
  async signIn({ company, username, password }: LoginCredentials): Promise<void> {
    await this.step(`đăng nhập "${username}" ở doanh nghiệp "${company}"`, async () => {
      if (!this.page.url().includes('/login')) await this.open();
      await this.waitUntilLoaded();
      const sso = await this.submitCompany(company);
      await sso.signIn(username, password);
      await this.expectSignedIn();
    });
  }

  /** Adapter giữa "một màn hình có form" và hợp đồng mà qc-kit hiểu. */
  withCredentials(credentials: LoginCredentials): Authenticator {
    return {
      signIn: () => this.signIn(credentials),
      saveSession: (file?: string) => this.saveSession(file),
    };
  }

  /**
   * Session phải lưu SAU khi đã về lại app: cookie của app chỉ được set ở bước callback
   * `/api/auth/callback`. Lưu lúc còn ở SSO thì storage state thiếu đúng cookie cần nhất.
   */
  async saveSession(file: string = STORAGE_STATE): Promise<void> {
    await this.step(`lưu session vào "${file}"`, async () => {
      await saveSession(this.page.context(), file);
    });
  }

  async expectSignedIn(): Promise<void> {
    await expect(this.page).not.toHaveURL(/\/login/);
  }

  async expectWrongCompany(): Promise<void> {
    await expect(this.alert).toHaveText(VI.wrongCompany);
    // Ô nhập cũng phải được đánh dấu sai — thông báo lỗi mà không gắn `aria-invalid`
    // là lỗi accessibility, và người dùng screen reader không biết ô nào hỏng.
    await expect(this.company).toHaveAttribute('aria-invalid', 'true');
  }
}

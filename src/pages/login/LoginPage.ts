import { expect } from '@playwright/test';
import { BasePage } from 'qc-kit/core';
import { STORAGE_STATE, saveSession, type Authenticator } from '../../core';
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
  companyPlaceholder: 'Ví dụ: FPT',
  wrongCompany: 'Mã doanh nghiệp không đúng',
  /**
   * Đã đối chiếu DOM thật. Lưu ý cho ai đọc lại file test case: chuỗi ở đây KHÁC với
   * `expected` của AUTH1.1 ("Nhập Company ID để tiếp tục.") — DOM mới là nguồn đúng, file
   * test case cần sửa theo.
   */
  companyRequired: 'Vui lòng nhập mã doanh nghiệp',
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

  /**
   * Tiêu đề "Tài khoản doanh nghiệp" (AUTH1.0 step 2). Lấy từ DOM thật.
   *
   * TẠM THỜI: `//h1` không nói đây là tiêu đề NÀO — trang có thêm một `<h1>` thứ hai là
   * strict mode violation, và lỗi đó trông không liên quan gì tới nguyên nhân.
   * Chờ Dev gắn `data-testid="login-company-heading"`.
   */
  readonly heading = this.page.locator('//h1');

  /**
   * 3 nút tải app Google Play / Apple Store / Windows (AUTH1.0 step 2). Lấy từ DOM thật.
   *
   * TẠM THỜI: khớp theo TEXT, mà URL của app có prefix locale (`/vi/`) — đổi ngôn ngữ là
   * locator này khớp 0 phần tử và `toHaveCount(3)` đỏ vì lý do không liên quan tới bug.
   * `text()=` cũng là khớp tuyệt đối trên một text node, nên span có markup lồng bên
   * trong sẽ trượt. Chờ Dev gắn `data-testid="login-app-download"`.
   */
  readonly appDownloadButtons = this.page.locator(
    "//span[text()='Google Play' or text()='Apple Store' or text()='Windows']",
  );

  /**
   * Dòng copyright ở footer (AUTH1.0 step 2). Lấy từ DOM thật.
   *
   * TẠM THỜI: cũng khớp theo text như trên. Chờ Dev gắn `data-testid="login-copyright"`.
   */
  readonly copyright = this.page.locator("//span[contains(text(),'Copyright')]");

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
   * Gửi form bước 1 mà KHÔNG hứa hẹn đi tiếp.
   *
   * `submitCompany()` trả về `SsoLoginPage` vì nó phục vụ đường thành công. Case validate
   * (AUTH1.1, AUTH1.2) ở lại đúng màn này, nên trả về một page object của màn sau là nói dối.
   */
  async trySubmitCompany(company: string): Promise<void> {
    await this.step(`gửi mã doanh nghiệp "${company || '(để trống)'}"`, async () => {
      await this.company.fill(company);
      await this.clickWhenReady(this.continueButton);
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

  /** AUTH1.0 — màn vừa mở phải có đủ thành phần. Mọi locator ở đây đã là locator thật. */
  async expectDefaultLayout(): Promise<void> {
    await this.step('màn Mã doanh nghiệp hiển thị đủ thành phần', async () => {
      await expect(this.heading).toBeVisible();
      await expect(this.company).toBeEditable();
      await expect(this.company).toHaveAttribute('placeholder', VI.companyPlaceholder);
      await expect(this.continueButton).toBeVisible();
      await expect(this.demoButton).toBeVisible();
      await expect(this.appDownloadButtons).toHaveCount(3);
      await expect(this.copyright).toBeVisible();
    });
  }

  /**
   * AUTH1.1 — bỏ trống thì chặn ngay ở client.
   *
   * Vế "KHÔNG gọi API" của expected không assert được từ page object: nó là chuyện của
   * network trong một khoảng thời gian, không phải trạng thái của màn hình. Spec đếm
   * request và assert ở đó.
   */
  async expectCompanyRequired(): Promise<void> {
    await this.step('ô Mã doanh nghiệp báo thiếu và được focus lại', async () => {
      await expect(this.alert).toHaveText(VI.companyRequired);
      await expect(this.company).toBeFocused();
    });
  }

  /**
   * Mã sai. Truyền `entered` khi case còn đòi giữ nguyên giá trị đã gõ và focus lại ô
   * (AUTH1.2) — không truyền thì chỉ kiểm thông báo, như những chỗ gọi cũ.
   */
  async expectWrongCompany(entered?: string): Promise<void> {
    await expect(this.alert).toHaveText(VI.wrongCompany);
    // Ô nhập cũng phải được đánh dấu sai — thông báo lỗi mà không gắn `aria-invalid`
    // là lỗi accessibility, và người dùng screen reader không biết ô nào hỏng.
    await expect(this.company).toHaveAttribute('aria-invalid', 'true');
    if (entered === undefined) return;
    await expect(this.company).toHaveValue(entered);
  }
}

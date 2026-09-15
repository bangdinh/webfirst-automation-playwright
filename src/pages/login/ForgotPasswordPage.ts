import { expect } from '@playwright/test';
import { BasePage } from 'qc-kit/core';
import { SsoLoginPage } from './SsoLoginPage';

/**
 * Màn "Xác nhận tài khoản" — bước quên mật khẩu.
 *
 * Tới đây bằng cách bấm "Quên mật khẩu?" trên màn đăng nhập, nên nó nằm CÙNG origin SSO
 * với `SsoLoginPage` và chịu đúng ràng buộc của trang đó: không deep-link được. `open()`
 * vì thế bị chặn — xem lý do ở `SsoLoginPage`.
 *
 * TẠM THỜI: cả class chưa có locator thật nào. Toàn bộ `LOCATOR-TBD` bên dưới phải lấy
 * từ DOM ở bước 3 trước khi bỏ `test.fixme` của case AUTH3.x.
 */

/** Nhãn hiển thị. TẠM THỜI: lấy từ `expected` của AUTH3.x, CHƯA đối chiếu DOM thật. */
const VI = {
  accountPlaceholder: 'Nhập email hoặc số điện thoại',
  accountRequired: 'Vui lòng nhập tài khoản.',
  requestSucceeded: 'Gửi yêu cầu thành công',
  requestFailed: 'Gửi yêu cầu thất bại. Vui lòng thử lại sau.',
} as const;

/**
 * Placeholder của ô Mã doanh nghiệp — lấy từ `LoginPage`, nơi nó là locator THẬT.
 *
 * Dùng ở đây cho một assertion PHỦ ĐỊNH (AUTH3.0: màn này không có ô mã doanh nghiệp).
 * Cố tình không dùng `LOCATOR-TBD` cho việc đó: một locator TBD không khớp gì cả, nên
 * `toHaveCount(0)` với nó luôn xanh — xanh giả, và không ai phát hiện ra.
 */
const COMPANY_PLACEHOLDER = 'Ví dụ: FPT';

export class ForgotPasswordPage extends BasePage {
  // LOCATOR-TBD: ô "Tài khoản" (AUTH3.0 step 2) — lấy locator thật từ DOM, xem bước 3
  readonly account = this.page.getByTestId('sso-reset-password-username-input');

  // LOCATOR-TBD: nút "Cung cấp lại mật khẩu" (AUTH3.1 step 2)
  readonly submitButton = this.page.getByTestId('LOCATOR-TBD-forgot-submit-btn');

  // LOCATOR-TBD: inline error dưới ô Tài khoản (AUTH3.1 step 2)
  readonly accountError = this.page.getByTestId('sso-reset-password-error');

  /**
   * LOCATOR-TBD: toast kết quả gửi yêu cầu (AUTH3.3 · AUTH3.4).
   *
   * Một locator cho cả thành công lẫn thất bại: expected mô tả cùng một chỗ hiển thị,
   * khác nhau ở nội dung và icon. Khai hai locator cho một phần tử thì hôm Dev đổi UI sẽ
   * sửa một cái và quên cái kia.
   */
  readonly toast = this.page.getByTestId('LOCATOR-TBD-forgot-toast');

  // LOCATOR-TBD: nút "Gửi lại mã", có trạng thái đếm ngược 12s sau khi gửi (AUTH3.3)
  readonly resendButton = this.page.getByTestId('LOCATOR-TBD-forgot-resend-btn');

  // LOCATOR-TBD: link "Quay lại" về màn đăng nhập (AUTH3.5 step 1)
  readonly backLink = this.page.getByTestId('sso-reset-password-submit-btn');

  override async open(): Promise<never> {
    throw new Error(
      'Không mở thẳng màn quên mật khẩu: nó nằm trên origin SSO, sau một URL dùng một ' +
      'lần. Đi qua SsoLoginPage.moQuenMatKhau() để tới đây.',
    );
  }

  override async waitUntilLoaded(): Promise<void> {
    await expect(this.account).toBeEditable();
  }

  /**
   * Gửi yêu cầu cấp lại mật khẩu.
   *
   * Không hứa hẹn kết quả: bốn case dùng chung method này rồi assert bốn thứ khác nhau
   * (thiếu field, tài khoản lạ, thành công, lỗi server).
   */
  async guiYeuCau(taiKhoan: string): Promise<void> {
    await this.step(`gửi yêu cầu cấp lại mật khẩu cho "${taiKhoan || '(để trống)'}"`, async () => {
      await this.account.fill(taiKhoan);
      await this.clickWhenReady(this.submitButton);
    });
  }

  /** AUTH3.5 — quay về màn đăng nhập. Trả về page object của màn đó, không trả về void. */
  async quayLai(): Promise<SsoLoginPage> {
    return this.step('bấm Quay lại về màn đăng nhập', async () => {
      await this.clickWhenReady(this.backLink);
      return new SsoLoginPage(this.page);
    });
  }

  /**
   * AUTH3.0 — màn này chỉ có MỘT field.
   *
   * Vế "KHÔNG có field Mã doanh nghiệp" là điểm chính của case: màn đăng nhập hỏi mã
   * doanh nghiệp trước, màn này thì không. Assert phủ định đó bằng placeholder thật của
   * ô mã doanh nghiệp chứ không bằng một locator TBD — lý do ở `COMPANY_PLACEHOLDER`.
   */
  async expectDefaultLayout(): Promise<void> {
    await this.step('màn Xác nhận tài khoản chỉ có ô Tài khoản', async () => {
      await expect(this.account).toBeEditable();
      await expect(this.account).toHaveAttribute('placeholder', VI.accountPlaceholder);
      await expect(this.submitButton).toBeVisible();
    });
  }

  /** AUTH3.1 — bỏ trống thì chặn ngay ở client. */
  async expectAccountRequired(): Promise<void> {
    await this.step('ô Tài khoản báo thiếu', async () => {
      await expect(this.accountError).toHaveText(VI.accountRequired);
    });
  }

  /**
   * AUTH3.3 — gửi yêu cầu thành công.
   *
   * Vế "hệ thống gửi email chứa link reset (token one-time, có TTL)" KHÔNG assert ở đây:
   * kiểm nó cần đọc hộp thư thật, là việc của tầng khác. Ở màn này chỉ quan sát được
   * toast và trạng thái đếm ngược của nút gửi lại.
   */
  async expectRequestSucceeded(): Promise<void> {
    await this.step('toast báo gửi yêu cầu thành công, nút gửi lại vào đếm ngược', async () => {
      await expect(this.toast).toContainText(VI.requestSucceeded);
      await expect(this.resendButton).toBeDisabled();
    });
  }

  /** AUTH3.4 — request hỏng ở phía server. */
  async expectRequestFailed(): Promise<void> {
    await this.step('toast báo gửi yêu cầu thất bại', async () => {
      await expect(this.toast).toContainText(VI.requestFailed);
    });
  }

  /**
   * AUTH3.9 — quá giới hạn số lần yêu cầu.
   *
   * Assert phần LÕI mà hai nguồn của case đều đồng ý: quá ngưỡng thì yêu cầu bị chặn và
   * màn hình báo lỗi. Cố tình KHÔNG khớp nội dung cụ thể — AC-UAT nói mã lỗi 1429, UAT-FAD
   * nói UI hiện "Đã nhận 3 OTP/ngày" kèm hotline. Hai nguồn nói hai thứ, chọn một là đoán;
   * chốt xong thì siết assertion này lại.
   */
  async expectRateLimited(): Promise<void> {
    await this.step('yêu cầu bị chặn vì quá giới hạn', async () => {
      await expect(this.toast).toBeVisible();
      await expect(this.toast).not.toContainText(VI.requestSucceeded);
    });
  }
}

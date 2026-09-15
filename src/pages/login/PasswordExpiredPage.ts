import { expect } from '@playwright/test';
import { BasePage } from 'qc-kit/core';

/**
 * Bước xác thực của flow ĐỔI MẬT KHẨU BẮT BUỘC khi mật khẩu đã hết hạn.
 *
 * Khác `ChangePasswordPage` ở đúng chỗ quyết định: màn này **có** field "Mật khẩu hiện
 * tại" (AUTH7.0 nói rõ), còn màn kia thì không (AUTH5.9 nói rõ). Đó là lý do chúng là hai
 * class, không phải một class dùng chung với vài locator tuỳ chọn.
 *
 * Hai đường tới đây, và cả hai đều nằm ngoài tầm với của một `goto`:
 *
 *   AUTH7.0  từ nút "Thay đổi mật khẩu" trong email thông báo  → cần hộp thư
 *   AUTH7.1  đăng nhập bằng mật khẩu đã hết hạn, app tự đẩy sang → cần tài khoản riêng
 *
 * Flow đầy đủ còn có bước OTP và bước nhập mật khẩu mới — thuộc part 6, chưa sinh ở đây.
 *
 * TẠM THỜI: chưa có locator thật nào — toàn bộ `LOCATOR-TBD` phải lấy từ DOM ở bước 3.
 */

/** Nhãn hiển thị. TẠM THỜI: lấy từ `expected` của AUTH7.1, CHƯA đối chiếu DOM. */
const VI = {
  expired: /hết hạn/i,
} as const;

export class PasswordExpiredPage extends BasePage {
  // LOCATOR-TBD: ô "Tài khoản" của bước xác thực (AUTH7.0 step 2)
  readonly account = this.page.getByTestId('LOCATOR-TBD-pwd-expired-account');

  // LOCATOR-TBD: ô "Mật khẩu hiện tại" — thứ phân biệt màn này với ChangePasswordPage
  readonly currentPassword = this.page.getByTestId('LOCATOR-TBD-pwd-expired-current');

  // LOCATOR-TBD: nút gửi bước xác thực (AUTH7.0 step 2)
  readonly submitButton = this.page.getByTestId('LOCATOR-TBD-pwd-expired-submit-btn');

  /**
   * LOCATOR-TBD: thông báo "mật khẩu đã hết hạn" (AUTH7.1 step 2).
   *
   * Chưa rõ nó hiện ở màn đăng nhập trước khi chuyển, hay ở chính màn này sau khi chuyển.
   * Bước 3 trả lời; tới lúc đó `expectExpiredNotice()` neo vào đây.
   */
  readonly expiredNotice = this.page.getByTestId('LOCATOR-TBD-pwd-expired-notice');

  override async open(): Promise<never> {
    throw new Error(
      'Không mở thẳng flow đổi mật khẩu hết hạn: tới đây bằng link trong email (AUTH7.0) ' +
        'hoặc bằng cách đăng nhập với mật khẩu đã hết hạn (AUTH7.1).',
    );
  }

  override async waitUntilLoaded(): Promise<void> {
    await expect(this.currentPassword).toBeEditable();
  }

  /** Gửi bước xác thực: tài khoản + mật khẩu hiện tại. Không hứa hẹn kết quả. */
  async xacThuc(taiKhoan: string, matKhauHienTai: string): Promise<void> {
    await this.step(`xác thực tài khoản "${taiKhoan}" bằng mật khẩu hiện tại`, async () => {
      await this.account.fill(taiKhoan);
      await this.currentPassword.fill(matKhauHienTai);
      await this.clickWhenReady(this.submitButton);
    });
  }

  /**
   * AUTH7.0 · AUTH7.1 — đã ở bước xác thực của flow bắt buộc.
   *
   * Dấu hiệu nhận biết là ô "Mật khẩu hiện tại": nó chỉ có ở màn này. Assert theo phần tử
   * thay vì theo URL vì đường dẫn của flow chưa biết — và URL cũng chưa chắc khác.
   */
  async expectLoaded(): Promise<void> {
    await this.step('đang ở bước xác thực của flow đổi mật khẩu bắt buộc', async () => {
      await expect(this.account).toBeEditable();
      await expect(this.currentPassword).toBeEditable();
    });
  }

  /** AUTH7.1 — app phải nói ra lý do, không lặng lẽ đẩy người dùng sang màn khác. */
  async expectExpiredNotice(): Promise<void> {
    await this.step('có thông báo mật khẩu đã hết hạn', async () => {
      await expect(this.expiredNotice).toHaveText(VI.expired);
    });
  }
}

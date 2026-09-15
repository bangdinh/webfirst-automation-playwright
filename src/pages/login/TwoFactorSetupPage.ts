import { expect } from '@playwright/test';
import { BasePage } from 'qc-kit/core';

/**
 * Màn Setup 2FA lần đầu — mã QR + 6 ô nhập OTP.
 *
 * Hai điều làm màn này khó tự động hơn mọi màn khác trong luồng đăng nhập, và cả hai đều
 * là chuyện DỮ LIỆU chứ không phải locator:
 *
 * 1. **Trạng thái một-lần.** Nó chỉ hiện với tài khoản CHƯA TỪNG setup 2FA. Chạy xong
 *    một lần là tài khoản đó không còn ở trạng thái này nữa — lần chạy sau vào thẳng màn
 *    nhập OTP. Muốn lặp lại thì cần tài khoản mới mỗi lần, hoặc một bước reset 2FA.
 * 2. **Không deep-link được.** Nó nằm giữa luồng đăng nhập, sau khi credentials đã đúng.
 *
 * TẠM THỜI: chưa có locator thật nào — toàn bộ `LOCATOR-TBD` phải lấy từ DOM ở bước 3.
 */
export class TwoFactorSetupPage extends BasePage {
  // LOCATOR-TBD: ảnh mã QR (AUTH4.0 step 2)
  readonly qrCode = this.page.getByTestId('LOCATOR-TBD-2fa-setup-qr');

  /**
   * LOCATOR-TBD: 3 bước hướng dẫn — "Tải app Authenticator" → "Quét mã QR" → "Nhập mã
   * 6 số" (AUTH4.0 step 2). Là một locator khớp NHIỀU phần tử, assert bằng `toHaveCount`.
   */
  readonly steps = this.page.getByTestId('LOCATOR-TBD-2fa-setup-step');

  // LOCATOR-TBD: 6 ô nhập OTP (AUTH4.0 step 2) — cũng là locator khớp nhiều phần tử
  readonly otpInputs = this.page.getByTestId('LOCATOR-TBD-2fa-setup-otp-input');

  // LOCATOR-TBD: nút "Xác nhận", disabled khi chưa nhập đủ 6 số (AUTH4.0 step 2)
  readonly confirmButton = this.page.getByTestId('LOCATOR-TBD-2fa-setup-confirm-btn');

  override async open(): Promise<never> {
    throw new Error(
      'Không mở thẳng màn setup 2FA: nó nằm giữa luồng đăng nhập, sau khi credentials đã ' +
        'đúng. Đi qua LoginPage/SsoLoginPage để tới đây.',
    );
  }

  override async waitUntilLoaded(): Promise<void> {
    await expect(this.qrCode).toBeVisible();
  }

  /**
   * AUTH4.3 — điền 6 số rồi xác nhận.
   *
   * Step 1 của case là "quét mã QR bằng app Authenticator" — không phải thao tác UI và
   * không tự động được. Bản tự động thay nó bằng: sinh mã từ TOTP secret đã cấp lúc tạo
   * tài khoản. Chưa có secret thì case `skip`, xem mục 2 của `docs/test-data.md`.
   */
  async nhapOtp(ma: string): Promise<void> {
    await this.step(`nhập mã OTP "${ma}" để bật 2FA`, async () => {
      const so = ma.split('');
      for (let i = 0; i < so.length; i += 1) {
        await this.otpInputs.nth(i).fill(so[i]);
      }
      await this.clickWhenReady(this.confirmButton);
    });
  }

  /**
   * AUTH4.0 — màn setup hiển thị đủ thành phần.
   *
   * Nút "Xác nhận" phải disabled khi chưa nhập gì: đó là thứ chặn người dùng gửi một mã
   * dở dang, và cũng là thứ duy nhất ở màn này quan sát được mà không cần app
   * Authenticator thật.
   */
  async expectDefaultLayout(): Promise<void> {
    await this.step('màn Setup 2FA hiển thị QR, 3 bước hướng dẫn, 6 ô OTP', async () => {
      await expect(this.qrCode).toBeVisible();
      await expect(this.steps).toHaveCount(3);
      await expect(this.otpInputs).toHaveCount(6);
      await expect(this.confirmButton).toBeDisabled();
    });
  }
}

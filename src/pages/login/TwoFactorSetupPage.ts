import { expect, type Locator } from '@playwright/test';
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
  readonly qrCode = this.page.getByTestId('LOCATOR-TBD-sso-otp-qr');

  /**
   * LOCATOR-TBD: 3 bước hướng dẫn — "Tải app Authenticator" → "Quét mã QR" → "Nhập mã
   * 6 số" (AUTH4.0 step 2). Là một locator khớp NHIỀU phần tử, assert bằng `toHaveCount`.
   */
  readonly steps = this.page.getByTestId('LOCATOR-TBD-sso-otp-step');

  /**
   * 6 ô nhập OTP. `data-testid` mang index ở cuối — `sso-otp-otp-input-0` … `-5` — đúng
   * quy ước "phần tử lặp luôn có index ở cuối" của docs/data-testid-convention.md.
   *
   * Phải là REGEX: `getByTestId('sso-otp-otp-input')` so khớp CHÍNH XÁC, nên nó khớp 0 phần
   * tử chứ không phải 6. Đây là kiểu lỗi im lặng — `toHaveCount(6)` đỏ nhưng thông báo chỉ
   * nói "expected 6, got 0", không nói vì sao.
   */
  readonly otpInputs = this.page.getByTestId(/^sso-otp-otp-input-\d$/);

  /**
   * Ô OTP thứ `i` (0-based), địa chỉ thẳng bằng chính id của nó.
   *
   * Dùng cái này thay `otpInputs.nth(i)`: `nth` đi theo thứ tự DOM, mà thứ tự DOM chỉ TÌNH
   * CỜ trùng với index trong id. Dev đảo hai ô trong markup là `nth(0)` trỏ sang ô số 2 mà
   * không test nào đỏ.
   */
  otpInput(i: number): Locator {
    return this.page.getByTestId(`sso-otp-otp-input-${i}`);
  }

  // LOCATOR-TBD: nút "Xác nhận", disabled khi chưa nhập đủ 6 số (AUTH4.0 step 2)
  readonly confirmButton = this.page.getByTestId('sso-otp-submit-btn');

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
   * tài khoản. Chưa có secret thì case `skip`, xem mục 2 của `docs/account-provisioning.md`.
   */
  async nhapOtp(ma: string): Promise<void> {
    await this.step(`nhập mã OTP "${ma}" để bật 2FA`, async () => {
      const so = ma.split('');
      for (let i = 0; i < so.length; i += 1) {
        await this.otpInput(i).fill(so[i]);
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
    await this.step('màn Setup 2FA hiển thị đủ 6 ô OTP, nút Xác nhận còn khoá', async () => {
      await expect(this.otpInputs).toHaveCount(6);

      // Đếm được 6 KHÔNG có nghĩa là có đủ ô 0…5: markup đánh số nhảy cóc (0,1,2,3,4,7)
      // vẫn cho ra 6 phần tử và `toHaveCount` vẫn xanh. Index trong testid là hợp đồng với
      // Dev, nên kiểm từng id một — và thông báo lỗi chỉ thẳng ô nào thiếu.
      for (let i = 0; i < 6; i += 1) {
        const o = this.otpInput(i);
        await expect(o, `thiếu ô OTP thứ ${i + 1} (sso-otp-otp-input-${i})`).toBeEditable();
        await expect(o, `ô OTP thứ ${i + 1} phải trống khi màn vừa mở`).toHaveValue('');
      }

      // Nút khoá khi chưa nhập đủ: thứ chặn người dùng gửi một mã dở dang, và cũng là thứ
      // duy nhất ở màn này quan sát được mà không cần app Authenticator thật.
      await expect(this.confirmButton).toBeDisabled();
    });
  }
}

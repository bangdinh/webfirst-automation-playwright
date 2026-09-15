import { expect } from '@playwright/test';
import { BasePage } from 'qc-kit/core';

/**
 * Màn "Xác thực mã" — nhập OTP 6 số, dành cho tài khoản ĐÃ setup 2FA.
 *
 * Khác `TwoFactorSetupPage` ở đúng một điểm mà AUTH4.4 nêu thẳng: màn này **không có** tuỳ
 * chọn gửi mã về email. Đó là lý do nó là class riêng chứ không phải vài locator nhét thêm
 * vào màn setup — hai màn giống nhau ở 6 ô OTP nhưng khác nhau ở thứ người dùng làm được.
 *
 * Không deep-link được: nó nằm giữa luồng đăng nhập, sau khi credentials đã đúng.
 *
 * TẠM THỜI: chưa có locator thật nào — toàn bộ `LOCATOR-TBD` phải lấy từ DOM ở bước 3.
 */

/** Nhãn hiển thị. TẠM THỜI: lấy từ `expected` của AUTH4.4 · AUTH4.5, CHƯA đối chiếu DOM. */
const VI = {
  heading: 'Xác thực mã',
  subtitle: 'Nhập mã 6 chữ số từ ứng dụng xác thực',
  wrongOtp: 'Mã otp không đúng. Vui lòng nhập lại.',
} as const;

export class OtpVerificationPage extends BasePage {
  // LOCATOR-TBD: tiêu đề "Xác thực mã" (AUTH4.4 step 2)
  readonly heading = this.page.getByTestId('LOCATOR-TBD-otp-heading');

  // LOCATOR-TBD: phụ đề "Nhập mã 6 chữ số từ ứng dụng xác thực" (AUTH4.4 step 2)
  readonly subtitle = this.page.getByTestId('LOCATOR-TBD-otp-subtitle');

  /** LOCATOR-TBD: 6 ô nhập OTP (AUTH4.4 step 2) — khớp NHIỀU phần tử, assert bằng count. */
  readonly otpInputs = this.page.getByTestId('LOCATOR-TBD-otp-input');

  // LOCATOR-TBD: nút "Xác nhận", disabled khi chưa đủ 6 số (AUTH4.4 step 2)
  readonly confirmButton = this.page.getByTestId('LOCATOR-TBD-otp-confirm-btn');

  // LOCATOR-TBD: link "Quay lại" (AUTH4.4 step 2)
  readonly backLink = this.page.getByTestId('LOCATOR-TBD-otp-back-link');

  // LOCATOR-TBD: inline error "Mã otp không đúng…" (AUTH4.5 step 2)
  readonly error = this.page.getByTestId('LOCATOR-TBD-otp-error');

  /**
   * LOCATOR-TBD: khối "Hoặc — Gửi về email" của màn Setup QR.
   *
   * Khai ở đây để assert nó **KHÔNG tồn tại** — AUTH4.4 nói rõ màn này khác màn setup ở
   * chỗ đó. Assert phủ định bằng một locator TBD thì luôn xanh, nên case tương ứng chưa
   * bật vế này; xem ghi chú trong `expectDefaultLayout()`.
   */
  readonly sendByEmailOption = this.page.getByTestId('LOCATOR-TBD-otp-send-email');

  override async open(): Promise<never> {
    throw new Error(
      'Không mở thẳng màn Xác thực mã: nó nằm giữa luồng đăng nhập, sau khi credentials ' +
        'đã đúng. Đi qua LoginPage/SsoLoginPage để tới đây.',
    );
  }

  override async waitUntilLoaded(): Promise<void> {
    await expect(this.otpInputs.first()).toBeEditable();
  }

  /** Điền 6 số rồi bấm Xác nhận. Không hứa hẹn kết quả — AUTH4.5 và 4.6 dùng chung. */
  async nhapOtp(ma: string): Promise<void> {
    await this.step(`nhập mã OTP "${ma}"`, async () => {
      const so = ma.split('');
      for (let i = 0; i < so.length; i += 1) {
        await this.otpInputs.nth(i).fill(so[i]);
      }
      // "hoặc auto-submit khi đủ 6 số" theo AUTH4.5 — bấm tay vẫn đúng ở cả hai trường
      // hợp, vì nút đã enable khi đủ số.
      await this.clickWhenReady(this.confirmButton);
    });
  }

  /**
   * AUTH4.4 — màn nhập OTP hiển thị đủ thành phần.
   *
   * Vế "KHÔNG có tuỳ chọn gửi email thay thế" CHƯA assert: `sendByEmailOption` còn là
   * `LOCATOR-TBD`, mà `toHaveCount(0)` với một locator không khớp gì thì LUÔN xanh — một
   * assert phủ định rỗng nghĩa còn tệ hơn không có. Bật nó lên khi có locator thật.
   */
  async expectDefaultLayout(): Promise<void> {
    await this.step('màn Xác thực mã hiển thị đủ thành phần', async () => {
      await expect(this.heading).toHaveText(VI.heading);
      await expect(this.subtitle).toHaveText(VI.subtitle);
      await expect(this.otpInputs).toHaveCount(6);
      await expect(this.otpInputs.first()).toHaveValue('');
      await expect(this.confirmButton).toBeDisabled();
      await expect(this.backLink).toBeVisible();
    });
  }

  /** AUTH4.5 — mã sai. */
  async expectWrongOtp(): Promise<void> {
    await this.step('báo mã OTP không đúng', async () => {
      await expect(this.error).toHaveText(VI.wrongOtp);
      // "Viền đỏ quanh 6 ô" kiểm qua `aria-invalid` — cùng cách LoginPage và SsoLoginPage
      // đang làm. Màu viền là CSS, assert nó vừa giòn vừa không nói lên điều gì.
      await expect(this.otpInputs.first()).toHaveAttribute('aria-invalid', 'true');
    });
  }
}

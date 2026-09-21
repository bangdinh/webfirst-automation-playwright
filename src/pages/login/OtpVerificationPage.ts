import { expect, type Locator } from '@playwright/test';
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
 * Locator đã lấy từ DOM thật, trừ `error` — xem JSDoc của nó.
 */

/**
 * Nhãn hiển thị. `heading` và `subtitle` ĐÃ đối chiếu DOM (snapshot AUTH4.4, 2026-09-18);
 * `wrongOtp` thì chưa — chưa lần chạy nào tới được trạng thái lỗi.
 */
const VI = {
  heading: 'Xác thực mã',
  subtitle: 'Nhập mã 6 chữ số từ ứng dụng xác thực',
  confirm: 'Xác nhận',
  back: 'Quay lại',
  /** ĐÃ đối chiếu DOM (snapshot AUTH4.5). File test case ghi khác — xem summary part 4. */
  wrongOtp: 'Mã xác thực không đúng.',
} as const;

export class OtpVerificationPage extends BasePage {
  // Locator dưới đây lấy từ DOM thật (snapshot lỗi AUTH4.4, 2026-09-18). Trang này là theme
  // Keycloak và KHÔNG có `data-testid` nào — nhưng accessible name thì sạch, nên cả khối
  // đứng ở tầng ① của thang locator, không phụ thuộc testid lẫn cấu trúc DOM.

  /** Tiêu đề "Xác thực mã" — h1 duy nhất của trang. */
  readonly heading = this.page.getByRole('heading', { level: 1 });

  /** Phụ đề. Đoạn văn DUY NHẤT trong `banner`, nên định vị được mà không bám vào chữ. */
  readonly subtitle = this.page.getByRole('banner').getByRole('paragraph');

  /**
   * 6 ô nhập OTP — `sso-otp-otp-input-0` … `-5`.
   *
   * Cùng một component với màn Setup 2FA: `TwoFactorSetupPage` dùng đúng bộ id này. Đổi từ
   * `getByRole('textbox', { name: /^OTP \d$/ })` sang testid vì luật của repo đặt
   * `data-testid` làm đích — accessible name chỉ là tầng dự phòng khi không có testid.
   *
   * Phải là REGEX: `getByTestId` so khớp CHÍNH XÁC, nên một chuỗi không có index sẽ khớp 0
   * phần tử chứ không phải 6.
   */
  readonly otpInputs = this.page.getByTestId(/^sso-otp-otp-input-\d$/);

  /**
   * Ô OTP thứ `i` (0-based), địa chỉ thẳng bằng id của nó.
   *
   * Dùng thay `otpInputs.nth(i)`: `nth` đi theo thứ tự DOM, chỉ TÌNH CỜ trùng index trong
   * id. Dev đảo hai ô trong markup là `nth(0)` trỏ sang ô số 2 mà không test nào đỏ.
   */
  otpInput(i: number): Locator {
    return this.page.getByTestId(`sso-otp-otp-input-${i}`);
  }

  /** Nút "Xác nhận", disabled khi chưa đủ 6 số (snapshot xác nhận `[disabled]`). */
  readonly confirmButton = this.page.getByTestId('sso-otp-submit-btn');

  /**
   * Link "Quay lại".
   *
   * BẪY: trang có HAI link cùng trỏ `/login-actions/restart` — "Đăng nhập lại từ đầu" ở
   * banner và "Quay lại" ở cuối form. Neo theo href là strict mode violation, buộc phải
   * phân biệt bằng tên.
   */
  readonly backLink = this.page.getByRole('link', { name: VI.back });

  /**
   * Dòng lỗi dưới 6 ô OTP (snapshot AUTH4.5: `paragraph: Mã xác thực không đúng.`).
   *
   * Trang có ba `paragraph` không tên: phụ đề, dòng lỗi này, và copyright. Loại hai cái
   * kia ra thay vì neo theo vị trí — `nth(1)` sẽ lệch ngay khi Dev chèn thêm một đoạn văn.
   * Loại theo text của HAI CÁI KIA, không theo text của chính nó: lọc bằng chính chuỗi lỗi
   * thì assert thành vòng tròn, luôn đúng.
   *
   * Cách này cũng đúng khi màn vừa mở và ô lỗi còn rỗng.
   */
  readonly error = this.page
    .getByRole('paragraph')
    .filter({ hasNotText: VI.subtitle })
    .filter({ hasNotText: /Copyright/i });

  /**
   * Tuỳ chọn "gửi mã về email" — thứ màn Setup QR có mà màn này KHÔNG.
   *
   * Snapshot xác nhận trang không có chữ nào về email, nên assert phủ định nay có nghĩa
   * thật: trước đây nó neo vào một testid không tồn tại, mà `toHaveCount(0)` trên một
   * locator không khớp gì thì LUÔN xanh — một phép kiểm rỗng nghĩa.
   */
  readonly sendByEmailOption = this.page.getByText(/g[uử]i.*email/i);

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
        await this.otpInput(i).fill(so[i]);
      }
      // "hoặc auto-submit khi đủ 6 số" theo AUTH4.5 — bấm tay vẫn đúng ở cả hai trường
      // hợp, vì nút đã enable khi đủ số.
      await this.clickWhenReady(this.confirmButton);
    });
  }

  /** AUTH4.4 — màn nhập OTP hiển thị đủ thành phần. */
  async expectDefaultLayout(): Promise<void> {
    await this.step('màn Xác thực mã hiển thị đủ thành phần', async () => {
      await expect(this.heading).toHaveText(VI.heading);
      await expect(this.subtitle).toHaveText(VI.subtitle);
      await expect(this.otpInputs).toHaveCount(6);
      await expect(this.otpInputs.first()).toHaveValue('');
      await expect(this.confirmButton).toBeDisabled();
      await expect(this.backLink).toBeVisible();
      // Vế "KHÔNG có tuỳ chọn gửi email thay thế" của AUTH4.4 — nay assert được thật.
      await expect(this.sendByEmailOption).toHaveCount(0);
    });
  }

  /**
   * AUTH4.5 — mã sai.
   *
   * Vế "viền đỏ quanh 6 ô" KHÔNG assert được: snapshot lúc lỗi cho thấy các ô OTP không hề
   * mang `aria-invalid` — khác hẳn màn đăng nhập, nơi cả hai ô đều được đánh dấu. Viền đỏ
   * ở đây thuần CSS, mà assert màu vừa giòn vừa không nói lên điều gì về hành vi.
   *
   * Quan sát thêm từ cùng snapshot, chưa đưa vào assert vì `expected` của case không nêu:
   * sau khi báo sai, 6 ô bị XOÁ TRẮNG và nút "Xác nhận" quay về disabled.
   */
  async expectWrongOtp(): Promise<void> {
    await this.step('báo mã OTP không đúng', async () => {
      await expect(this.error).toHaveText(VI.wrongOtp);
    });
  }
}

import { expect } from '@playwright/test';
import { BasePage } from 'qc-kit/core';

/**
 * Flow ĐỔI MẬT KHẨU BẮT BUỘC khi mật khẩu đã hết hạn — phần xác thực.
 *
 * Khác `ChangePasswordPage` ở chỗ quyết định: flow này **có** bước mật khẩu hiện tại
 * (AUTH7.0 · AUTH7.4), còn màn kia thì không (AUTH5.9 nói thẳng).
 *
 * **Hai bước rời nhau**, không phải một form hai ô — part 6 mới làm rõ:
 *
 *   bước 1  nhập Tài khoản        → nút "Tiếp theo"   (AUTH7.2)
 *   bước 2  nhập Mật khẩu hiện tại → nút "Xác nhận"    (AUTH7.3 · AUTH7.4)
 *   bước 3  nhập OTP gửi tới kênh đã đăng ký           (part 7)
 *   bước 4  nhập mật khẩu mới                          → `ChangePasswordPage`
 *
 * CHƯA XÁC MINH: hai bước đầu là hai trang riêng, hay hai trạng thái của cùng một trang.
 * Gộp vào một class vì chúng là một flow liên tục và mọi locator còn TBD — tách sau rẻ
 * hơn là dựng sẵn hai class cho một thứ có thể là một.
 *
 * Hai đường vào, cả hai đều ngoài tầm với của `goto`:
 *
 *   AUTH7.0  từ nút "Thay đổi mật khẩu" trong email thông báo  → cần hộp thư
 *   AUTH7.1  đăng nhập bằng mật khẩu đã hết hạn, app tự đẩy sang → cần tài khoản riêng
 *
 * TẠM THỜI: chưa có locator thật nào — toàn bộ `LOCATOR-TBD` phải lấy từ DOM ở bước 3.
 */

/** Nhãn hiển thị. TẠM THỜI: lấy từ `expected` của AUTH7.1 · 7.2 · 7.4, CHƯA đối chiếu DOM. */
const VI = {
  expired: /hết hạn/i,
  /** AUTH7.2 — case chỉ nói "lỗi tài khoản không tồn tại", không cho nguyên văn. */
  accountNotFound: /không tồn tại/i,
  /** AUTH7.4 — case chỉ nói "lỗi xác thực không hợp lệ". */
  authFailed: /không hợp lệ|không đúng/i,
} as const;

export class PasswordExpiredPage extends BasePage {
  // --- bước 1: nhập tài khoản ---
  //
  // Tên testid dưới đây SUY theo docs/data-testid-convention.md, module `pwd-expired`
  // (docs/test-structure.md mục 7). Dev CHƯA gắn — chúng đỏ cho tới lúc đó.
  // Danh sách gửi Dev: docs/testid-requests/pwd-expired.md

  // TESTID-ĐỀ-NGHỊ: ô "Tài khoản" của bước 1 (AUTH7.2 step 1)
  readonly account = this.page.getByTestId('pwd-expired-account-input');

  // TESTID-ĐỀ-NGHỊ: nút "Tiếp theo" của bước 1 (AUTH7.2 step 2)
  readonly nextButton = this.page.getByTestId('pwd-expired-next-btn');

  // TESTID-ĐỀ-NGHỊ: lỗi "tài khoản không tồn tại" (AUTH7.2 step 2)
  readonly accountError = this.page.getByTestId('pwd-expired-account-error');

  // --- bước 2: nhập mật khẩu hiện tại ---

  /**
   * TESTID-ĐỀ-NGHỊ: ô "Mật khẩu hiện tại" (AUTH7.3 step 2).
   *
   * Đây là thứ phân biệt flow này với `ChangePasswordPage` — màn kia cố tình không có ô
   * này, và đó là lý do AUTH5.9 phải để server bắt lỗi trùng mật khẩu.
   */
  readonly currentPassword = this.page.getByTestId('pwd-expired-current-password-input');

  // TESTID-ĐỀ-NGHỊ: nút "Xác nhận" của bước 2 (AUTH7.3 step 3)
  readonly submitButton = this.page.getByTestId('pwd-expired-submit-btn');

  // TESTID-ĐỀ-NGHỊ: lỗi "xác thực không hợp lệ" khi sai mật khẩu hiện tại (AUTH7.4 step 2)
  readonly authError = this.page.getByTestId('pwd-expired-auth-error');

  /**
   * LOCATOR-TBD: thông báo "mật khẩu đã hết hạn" (AUTH7.1 step 2).
   *
   * KHÔNG suy tên: "thông báo" không có trong bảng hậu tố của file quy ước, và chưa rõ nó
   * hiện ở màn đăng nhập trước khi chuyển hay ở chính flow này sau khi chuyển. Chốt được
   * nó là loại phần tử gì thì mới đặt tên.
   */
  readonly expiredNotice = this.page.getByTestId('LOCATOR-TBD-pwd-expired-notice');

  override async open(): Promise<never> {
    throw new Error(
      'Không mở thẳng flow đổi mật khẩu hết hạn: tới đây bằng link trong email (AUTH7.0) ' +
        'hoặc bằng cách đăng nhập với mật khẩu đã hết hạn (AUTH7.1).',
    );
  }

  override async waitUntilLoaded(): Promise<void> {
    await expect(this.account).toBeEditable();
  }

  /** Bước 1 — gửi tài khoản. Không hứa hẹn đi tiếp: AUTH7.2 cố tình bị chặn ở đây. */
  async nhapTaiKhoan(taiKhoan: string): Promise<void> {
    await this.step(`nhập tài khoản "${taiKhoan}" rồi bấm Tiếp theo`, async () => {
      await this.account.fill(taiKhoan);
      await this.clickWhenReady(this.nextButton);
    });
  }

  /** Bước 2 — gửi mật khẩu hiện tại. Không hứa hẹn đi tiếp: AUTH7.4 cố tình sai. */
  async xacThucMatKhau(matKhauHienTai: string): Promise<void> {
    await this.step('nhập mật khẩu hiện tại rồi bấm Xác nhận', async () => {
      await this.currentPassword.fill(matKhauHienTai);
      await this.clickWhenReady(this.submitButton);
    });
  }

  /**
   * AUTH7.0 · AUTH7.1 — đã ở bước ĐẦU của flow bắt buộc.
   *
   * Chỉ assert ô Tài khoản: ô Mật khẩu hiện tại thuộc bước 2, chưa chắc đã có mặt trong
   * DOM lúc này. Assert nó ở đây là giả định hai bước cùng một trang — điều chưa ai xác
   * minh.
   */
  async expectLoaded(): Promise<void> {
    await this.step('đang ở bước nhập tài khoản của flow đổi mật khẩu bắt buộc', async () => {
      await expect(this.account).toBeEditable();
    });
  }

  /** Đã qua bước 1, đang ở bước nhập mật khẩu hiện tại. */
  async expectAtPasswordStep(): Promise<void> {
    await this.step('đang ở bước nhập mật khẩu hiện tại', async () => {
      await expect(this.currentPassword).toBeEditable();
    });
  }

  /** AUTH7.1 — app phải nói ra lý do, không lặng lẽ đẩy người dùng sang màn khác. */
  async expectExpiredNotice(): Promise<void> {
    await this.step('có thông báo mật khẩu đã hết hạn', async () => {
      await expect(this.expiredNotice).toHaveText(VI.expired);
    });
  }

  /** AUTH7.2 — tài khoản không tồn tại, flow dừng ngay ở bước 1. */
  async expectAccountNotFound(): Promise<void> {
    await this.step('báo tài khoản không tồn tại, không qua được bước 1', async () => {
      await expect(this.accountError).toHaveText(VI.accountNotFound);
      await expect(this.currentPassword).toBeHidden();
    });
  }

  /** AUTH7.4 — sai mật khẩu hiện tại, flow dừng tại bước xác thực. */
  async expectAuthFailed(): Promise<void> {
    await this.step('báo xác thực không hợp lệ, flow dừng tại bước xác thực', async () => {
      await expect(this.authError).toHaveText(VI.authFailed);
      // "không chuyển sang bước gửi OTP" — vẫn còn ô mật khẩu hiện tại thì chưa đi đâu cả.
      await expect(this.currentPassword).toBeEditable();
    });
  }
}

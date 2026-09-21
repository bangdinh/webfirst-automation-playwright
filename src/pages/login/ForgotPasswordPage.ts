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
 * TẠM THỜI: mới `submitButton` được đối chiếu DOM thật. Mọi `LOCATOR-TBD` còn lại bên dưới
 * phải lấy từ DOM ở bước 3 trước khi bỏ `test.fixme` của case AUTH3.x.
 */

/** Nhãn hiển thị. TẠM THỜI: lấy từ `expected` của AUTH3.x, CHƯA đối chiếu DOM thật. */
const VI = {
  accountPlaceholder: 'Nhập email hoặc số điện thoại',
  accountRequired: 'Vui lòng nhập tài khoản.',
  /**
   * ĐÃ đối chiếu DOM (snapshot AUTH3.3, 2026-09-18). File test case ghi 'Gửi yêu cầu
   * thành công' — sản phẩm nói khác hẳn, và theo luật của repo thì DOM thắng.
   */
  requestSucceeded: 'Bạn sẽ sớm nhận được email kèm hướng dẫn khôi phục mật khẩu.',
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

  /**
   * Nút "Cung cấp lại mật khẩu" (AUTH3.1 step 2). Đã đối chiếu DOM thật — không còn TBD.
   *
   * `<button type="submit" name="login">`, tức form này submit kiểu native. Nhãn hiển thị
   * nằm trong `<span data-kc-msg="vmResetSubmit">` do message bundle Keycloak bơm vào, nên
   * KHÔNG neo locator vào chữ "Tiếp theo": đổi bản dịch là gãy.
   */
  readonly submitButton = this.page.getByTestId('sso-reset-password-submit-btn');

  // LOCATOR-TBD: inline error dưới ô Tài khoản (AUTH3.1 step 2)
  readonly accountError = this.page.getByTestId('sso-reset-password-error');

  /**
   * LOCATOR-TBD: toast kết quả gửi yêu cầu (AUTH3.3 · AUTH3.4).
   *
   * Một locator cho cả thành công lẫn thất bại: expected mô tả cùng một chỗ hiển thị,
   * khác nhau ở nội dung và icon. Khai hai locator cho một phần tử thì hôm Dev đổi UI sẽ
   * sửa một cái và quên cái kia.
   */
  /**
   * Dải thông báo kết quả gửi yêu cầu — `role=status`, tầng ① của thang locator.
   *
   * Lấy từ DOM thật (snapshot AUTH3.3):
   *
   *   - status:
   *     - paragraph: Bạn sẽ sớm nhận được email kèm hướng dẫn khôi phục mật khẩu.
   *     - button "Đóng thông báo"
   *
   * Khác `SsoLoginPage.alertBanner` (`role=alert`): `status` là thông báo không khẩn,
   * `alert` là lỗi cần chú ý ngay. Hai vai trò khác nhau nên không đụng nhau.
   *
   * LƯU Ý VỀ VỊ TRÍ: sau khi bấm gửi, app quay VỀ MÀN ĐĂNG NHẬP và hiện dải này ở đó,
   * chứ không ở lại màn Xác nhận tài khoản. Locator neo vào `page` nên vẫn đúng.
   */
  readonly toast = this.page.getByRole('status');

  /**
   * LOCATOR-TBD: nút "Gửi lại mã" với đếm ngược 12s mà AUTH3.3 và AUTH3.6 mô tả.
   *
   * **Chưa quan sát thấy nó tồn tại.** Snapshot sau khi gửi thành công cho thấy app quay
   * về màn đăng nhập với một dải `role=status`, không có nút gửi lại nào. Hoặc sản phẩm
   * không có tính năng này, hoặc nó nằm ở một màn khác chưa ai tới. Câu hỏi cho BA.
   */
  readonly resendButton = this.page.getByTestId('LOCATOR-TBD-sso-reset-password-resend-btn');

  /**
   * TESTID-ĐỀ-NGHỊ: link "Quay lại" về màn đăng nhập (AUTH3.5 step 1).
   *
   * Trước đây field này trỏ nhầm vào `sso-reset-password-submit-btn` — TRÙNG `submitButton`.
   * Lượt chạy thật bắt được: AUTH3.5 bấm "Quay lại" và landed ở
   * `/login-actions/reset-credentials`, tức nó đã GỬI một yêu cầu cấp lại mật khẩu thật
   * rồi mới đỏ. Một locator sai không chỉ làm test đỏ, nó còn làm thay đổi hệ thống.
   *
   * Tên đề nghị suy theo công thức (link → `-link`) và có chỗ dựa chắc: màn anh em
   * `SsoLoginPage` đã được Dev gắn đúng `sso-login-back-link` cho cùng phần tử này.
   */
  readonly backLink = this.page.getByTestId('sso-reset-password-back-link');

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

  /**
   * AUTH3.1 — bỏ trống Tài khoản thì yêu cầu KHÔNG đi, màn hình đứng yên.
   *
   * Nhận URL chụp TRƯỚC khi bấm chứ không tự đọc `page.url()` ở đây: đọc sau khi bấm thì
   * URL mới đã là URL hiện tại, và assertion tự khớp với chính nó — xanh trong mọi trường
   * hợp. Chụp trước là thứ duy nhất biến "vẫn ở lại" thành một điều kiểm được.
   *
   * GIỚI HẠN đã biết: cả ba assertion dưới đây đều đúng NGAY ở lần kiểm đầu, nên nếu app
   * điều hướng trễ (chờ response rồi mới chuyển màn) thì test đã xanh xong trước lúc đó.
   * Muốn loại hẳn khả năng ấy phải neo vào một tín hiệu KHẲNG ĐỊNH rằng form bị chặn —
   * cách `SsoLoginPage.expectBrowserBlocked()` dùng `validity.valueMissing` cho AUTH2.1.
   * Chưa dùng ở đây vì chưa biết ô Tài khoản của màn này có `required` trên DOM hay không;
   * xác minh xong thì siết lại.
   */
  async expectStillOnPage(urlTruocKhiGui: string): Promise<void> {
    await this.step('vẫn ở lại màn Xác nhận tài khoản', async () => {
      await expect(this.page).toHaveURL(urlTruocKhiGui);
      await expect(this.account).toBeEditable();
      await expect(this.submitButton).toBeVisible();
    });
  }

  /**
   * Inline error "Vui lòng nhập tài khoản." mà `expected` của AUTH3.1 đòi.
   *
   * KHÔNG còn được gọi: script của AUTH3.1 nay kiểm "vẫn ở lại màn hình" (xem
   * `expectStillOnPage()`). Giữ lại vì nó là bản ghi của chỗ lệch giữa file test case và
   * thứ đang được kiểm — chốt được màn hình thật có vẽ inline error này hay không thì một
   * là gọi lại nó, hai là xoá nó cùng `accountError` và sửa `expected` ở file nguồn.
   */
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
    await this.step('báo đã gửi email khôi phục', async () => {
      await expect(this.toast).toContainText(VI.requestSucceeded);
      // Vế "nút Gửi lại mã vào đếm ngược 12s" KHÔNG assert: lượt chạy thật cho thấy app quay
      // về màn đăng nhập và không có nút gửi lại nào. Xem JSDoc của `resendButton`.
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

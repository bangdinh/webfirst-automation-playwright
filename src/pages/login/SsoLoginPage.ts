import { expect, type Locator } from '@playwright/test';
import { BasePage } from 'qc-kit/core';
import { ForgotPasswordPage } from './ForgotPasswordPage';

/**
 * Bước 2 của đăng nhập — trang SSO (Keycloak), Ở MỘT ORIGIN KHÁC với app.
 *
 * Ba điều ràng buộc cách viết test ở đây, và cả ba đều lấy từ DOM/URL thật:
 *
 * 1. KHÔNG deep-link được. URL SSO mang `session_code`, `state`, `nonce`,
 *    `code_challenge` — dùng một lần. Mọi kịch bản phải bắt đầu từ `/vi/login` của app
 *    rồi qua bước 1; `open()` ở đây vì thế bị chặn.
 * 2. `baseURL` của project trỏ về app, nên assert URL ở đây phải dùng URL tuyệt đối.
 * 3. Phần lớn phần tử ở đây CÓ `data-testid` thật — dùng thẳng. Hai ngoại lệ là
 *    `#input-error` và `.kc-title`: chúng thuộc theme Keycloak, không phải testid do team
 *    đặt, nên nâng cấp theme là có thể mất.
 */

/** Realm và client do app chọn theo mã doanh nghiệp; chỉ khớp phần ổn định của URL. */
export const SSO_URL = /\/realms\/[^/]+\/protocol\/openid-connect\/auth/;

/**
 * Nhãn hiển thị.
 *
 * Hai placeholder đã đối chiếu DOM thật — và `usernamePlaceholder` hoá ra là "Nhập email
 * hoặc số điện thoại", khác với "Nhập email" mà AUTH2.0 ghi trong file test case.
 *
 * TẠM THỜI: ba chuỗi còn lại vẫn lấy từ `expected` của case, CHƯA đối chiếu DOM. Theme
 * Keycloak có bản dịch riêng, rất dễ lệch một dấu chấm.
 */
const VI = {
  usernamePlaceholder: 'Nhập email hoặc số điện thoại',
  passwordPlaceholder: 'Nhập mật khẩu',
  invalidCredentials: 'Tài khoản hoặc mật khẩu không đúng',
  usernameLocked: 'Tài khoản đã bị khóa',
  passwordLocked: 'Mật khẩu đã bị khóa',
} as const;

/**
 * Nội dung banner khớp bằng REGEX, không khớp cả câu: câu mang số thay đổi theo lần chạy
 * và theo tenant (số lần còn lại, ngưỡng khoá, số phút, tên tài khoản). Chính file test
 * case cũng viết "khoá" ở case này rồi "khóa" ở case kia — khớp cả câu là đỏ vì dấu.
 */
const BANNER = {
  attemptsLeft: /Bạn còn\s+\d+\s+lần thử/i,
  locked: /bị kh[oó]a do đăng nhập sai quá\s+\d+\s+lần/i,
  expired: /đã hết hạn/i,
} as const;

export class SsoLoginPage extends BasePage {
  readonly username = this.page.getByTestId('sso-login-username-input');
  readonly password = this.page.getByTestId('sso-login-password-input');
  readonly submitButton = this.page.getByTestId('sso-login-submit-btn');
  readonly passwordToggle = this.page.getByTestId('sso-login-password-toggle-btn');
  readonly forgotPasswordLink = this.page.getByTestId('sso-login-forgot-password-link');
  readonly backLink = this.page.getByTestId('sso-login-back-link');
  readonly demoButton = this.page.getByTestId('sso-login-demo-btn');

  /**
   * Ô lỗi của Keycloak. Tồn tại sẵn và rỗng khi chưa lỗi → assert theo nội dung.
   * TẠM THỜI: `#input-error` là id của theme Keycloak, không phải testid của team.
   * Chờ Dev gắn `data-testid="sso-login-error"`.
   */
  readonly error = this.page.locator('#input-error');

  /**
   * Tiêu đề "Đăng nhập FPTVMSmart" (AUTH2.0 step 2). Lấy từ DOM thật.
   *
   * TẠM THỜI: `.kc-title` là class của theme Keycloak, không phải testid của team — cùng
   * loại rủi ro với `#input-error` bên trên. Chờ Dev gắn `data-testid="sso-login-heading"`.
   */
  readonly heading = this.page.locator('.kc-title');

  // Phụ đề "Chào mừng bạn tới <tên doanh nghiệp>" (AUTH2.0 step 2)
  readonly subtitle = this.page.getByTestId('sso-login-subheading');

  /**
   * Nút phụ "Đăng nhập bằng SSO" (AUTH2.0 step 2).
   *
   * Câu hỏi treo từ lúc sinh draft — "nút này có thuộc màn SSO không?" — nay đã trả lời:
   * có, và testid gọi nó là `social-sso-link`, tức đúng là link IdP liên kết của Keycloak.
   * Nó KHÁC `demoButton`, nên hai field ở đây là hai phần tử thật sự khác nhau.
   */
  readonly ssoButton = this.page.getByTestId('sso-login-social-sso-link');

  /**
   * Lỗi trả về SAU KHI form đã gửi — sai tài khoản/mật khẩu, tài khoản bị khoá, hết hạn.
   *
   * KHÔNG dùng hai field này cho case "bỏ trống field bắt buộc" (AUTH2.1 · AUTH2.2 ·
   * AUTH2.3). Màn này không tự vẽ inline error cho trường rỗng — nó để `required` cho
   * trình duyệt lo, và bong bóng của trình duyệt không nằm trong DOM. Xem
   * `expectBrowserBlocked()`.
   *
   * `credentialError` giữ đúng tên mà testid đặt (`credential-error`, không phải
   * `password-error`): nó là lỗi của CẶP tài khoản/mật khẩu, chỉ tình cờ hiển thị dưới ô
   * mật khẩu. Đặt tên nó là `passwordError` sẽ khiến người sau tưởng có một lỗi riêng cho
   * ô mật khẩu — và đi viết assertion cho một thứ không tồn tại.
   */
  readonly usernameError = this.page.getByTestId('sso-login-username-error');
  readonly credentialError = this.page.getByTestId('sso-login-credential-error');

  /**
   * LOCATOR-TBD: alert banner của form (AUTH2.7 · AUTH2.9 · AUTH2.13).
   *
   * Khác `error` và khác hai inline error trên: đây là dải thông báo ở đầu form, mang
   * trạng thái của TÀI KHOẢN (còn mấy lần thử, đang bị khoá, đã hết hạn) chứ không phải
   * lỗi của một field.
   */
  readonly alertBanner = this.page.getByTestId('LOCATOR-TBD-sso-login-alert-banner');

  // LOCATOR-TBD: nút "Liên hệ hỗ trợ" nằm TRONG banner (AUTH2.13 step 2)
  readonly supportButton = this.page.getByTestId('LOCATOR-TBD-sso-login-support-btn');

  override async open(): Promise<never> {
    throw new Error(
      'Không mở thẳng trang SSO: URL của nó mang session_code/state/nonce dùng một lần. ' +
      'Đi qua LoginPage.submitCompany() để tới đây.',
    );
  }

  override async waitUntilLoaded(): Promise<void> {
    await expect(this.username).toBeEditable();
  }

  async signIn(username: string, password: string): Promise<void> {
    await this.step(`nhập tài khoản "${username}" trên SSO`, async () => {
      await this.trySignIn(username, password);
    });
  }

  /**
   * Điền và bấm Đăng nhập mà KHÔNG giả định là sẽ vào được.
   *
   * Cùng thao tác với `signIn()` nhưng khác lời hứa: case validate (AUTH2.1 → AUTH2.3)
   * và case sai credentials (AUTH2.7 → AUTH2.15) cố tình ở lại đúng màn này.
   */
  async trySignIn(username: string, password: string): Promise<void> {
    await this.step(
      `gửi form đăng nhập (tài khoản: "${username || '(để trống)'}")`,
      async () => {
        await this.waitUntilLoaded();
        await this.username.fill(username);
        await this.password.fill(password);
        await this.clickWhenReady(this.submitButton);
      },
    );
  }

  /**
   * AUTH3.0 — sang màn quên mật khẩu.
   *
   * Trả về page object của màn sau, cùng khuôn với `LoginPage.submitCompany()`: người gọi
   * cần đúng cái đó để đi tiếp, và trả về `void` thì spec phải tự `new` một class mà nó
   * chưa chắc đã tới được.
   */
  async moQuenMatKhau(): Promise<ForgotPasswordPage> {
    return this.step('bấm "Quên mật khẩu?"', async () => {
      await this.clickWhenReady(this.forgotPasswordLink);
      return new ForgotPasswordPage(this.page);
    });
  }

  async expectLoaded(): Promise<void> {
    await expect(this.page).toHaveURL(SSO_URL);
    await expect(this.username).toBeEditable();
  }

  /** AUTH2.0 — màn đăng nhập hiển thị đủ thành phần. */
  async expectDefaultLayout(): Promise<void> {
    await this.step('màn Tài khoản & Mật khẩu hiển thị đủ thành phần', async () => {
      await this.expectLoaded();
      await expect(this.heading).toBeVisible();
      await expect(this.subtitle).toBeVisible();
      await expect(this.username).toHaveAttribute('placeholder', VI.usernamePlaceholder);
      await expect(this.password).toHaveAttribute('placeholder', VI.passwordPlaceholder);
      await expect(this.passwordToggle).toBeVisible();
      await expect(this.forgotPasswordLink).toBeVisible();
      await expect(this.submitButton).toBeVisible();
      await expect(this.backLink).toBeVisible();
    });
  }

  /**
   * Ô rỗng có bị TRÌNH DUYỆT chặn không (HTML5 constraint validation).
   *
   * Màn này KHÔNG tự vẽ inline error cho trường bắt buộc — nó để `required` cho trình
   * duyệt lo. Bong bóng "Please fill out this field." vì thế **không nằm trong DOM**:
   * Chrome vẽ nó ở lớp chrome, ngoài tầm với của mọi locator. Đi tìm nó bằng
   * `getByTestId` thì không bao giờ thấy.
   *
   * Thứ kiểm được là `validity` của chính `<input>`. Dùng `valueMissing` chứ KHÔNG dùng
   * `validationMessage`: câu chữ của bong bóng do **ngôn ngữ của trình duyệt** quyết định
   * (máy dev tiếng Anh, CI có thể khác), còn `valueMissing` là boolean, không dính locale.
   */
  private async expectBrowserBlocked(field: Locator, ten: string): Promise<void> {
    await expect
      .poll(() => field.evaluate((el) => (el as HTMLInputElement).validity.valueMissing), {
        message: `trình duyệt phải chặn form vì ô ${ten} bỏ trống`,
      })
      .toBe(true);
  }

  /** AUTH2.1 — thiếu Tài khoản. */
  async expectUsernameRequired(): Promise<void> {
    await this.step('trình duyệt chặn vì ô Tài khoản bỏ trống', async () => {
      await this.expectBrowserBlocked(this.username, 'Tài khoản');
    });
  }

  /** AUTH2.2 — thiếu Mật khẩu. */
  async expectPasswordRequired(): Promise<void> {
    await this.step('trình duyệt chặn vì ô Mật khẩu bỏ trống', async () => {
      await this.expectBrowserBlocked(this.password, 'Mật khẩu');
    });
  }

  /**
   * AUTH2.3 — thiếu cả hai.
   *
   * `expected` đòi "cả 2 inline error hiển thị ĐỒNG THỜI". Với validation native thì điều
   * đó KHÔNG xảy ra được: trình duyệt chỉ vẽ MỘT bong bóng, ở ô không hợp lệ đầu tiên.
   *
   * Nên assert đúng thứ vẫn giữ được ý của case và kiểm được thật: **cả hai ô đều ở trạng
   * thái thiếu giá trị**, và trình duyệt focus ô đầu tiên. Nếu sản phẩm thật sự phải hiện
   * hai inline error cùng lúc thì đó là thiếu sót của màn hình, không phải của test —
   * xem summary part 1.
   */
  async expectBothRequired(): Promise<void> {
    await this.step('cả hai ô đều thiếu giá trị, trình duyệt focus ô đầu tiên', async () => {
      await this.expectBrowserBlocked(this.username, 'Tài khoản');
      await this.expectBrowserBlocked(this.password, 'Mật khẩu');
      await expect(this.username).toBeFocused();
    });
  }

  /**
   * AUTH2.7 · AUTH2.15 — sai thông tin đăng nhập.
   *
   * Thông báo phải GIỐNG NHAU dưới cả hai field, và giống hệt case "username thuộc tenant
   * khác": lộ ra field nào sai, hay lộ ra username có tồn tại hay không, đều là kênh
   * enumeration. Vì vậy hai case khác nhau dùng chung đúng một assertion này.
   *
   * TẠM THỜI: "viền đỏ" trong expected được kiểm qua `aria-invalid` — cùng cách
   * `LoginPage.expectWrongCompany()` đang làm. Màu viền là CSS, assert nó vừa giòn vừa
   * không nói lên điều gì; `aria-invalid` mới vừa kiểm được vừa đúng nghĩa.
   */
  async expectInvalidCredentials(): Promise<void> {
    await this.step('cả hai field báo sai thông tin đăng nhập', async () => {
      await expect(this.usernameError).toHaveText(VI.invalidCredentials);
      await expect(this.credentialError).toHaveText(VI.invalidCredentials);
      await expect(this.username).toHaveAttribute('aria-invalid', 'true');
      await expect(this.password).toHaveAttribute('aria-invalid', 'true');
    });
  }

  /**
   * AUTH2.7 · AUTH2.8 — banner đếm ngược số lần thử còn lại.
   *
   * Để trống `conLai` thì chỉ kiểm banner đúng hình dạng — AUTH2.7 không biết ngưỡng của
   * tenant. Truyền số vào thì kiểm đúng con số đó, và đó chính là thứ AUTH2.8 đòi: N
   * giảm dần theo từng lần sai.
   */
  async expectAttemptsRemaining(conLai?: number): Promise<void> {
    const mau =
      conLai === undefined
        ? BANNER.attemptsLeft
        : new RegExp(`Bạn còn\\s+${conLai}\\s+lần thử`, 'i');

    await this.step(
      conLai === undefined ? 'banner báo còn N lần thử' : `banner báo còn ${conLai} lần thử`,
      async () => {
        await expect(this.alertBanner).toHaveText(mau);
        await this.expectInvalidCredentials();
      },
    );
  }

  /**
   * AUTH2.9 — tài khoản đã bị khoá.
   *
   * Vế "tự Unlock khi hết thời gian đếm ngược" của expected KHÔNG assert ở đây: nó đòi
   * chờ hết vài phút thật, mà `waitForTimeout` thì bị cấm và một test ngồi nhìn đồng hồ
   * không còn là test UI. Đó là việc của tầng API, hoặc một lần chạy có kiểm soát riêng.
   */
  async expectLocked(): Promise<void> {
    await this.step('tài khoản đang bị khoá, form không gửi được', async () => {
      await expect(this.alertBanner).toHaveText(BANNER.locked);
      await expect(this.usernameError).toHaveText(VI.usernameLocked);
      await expect(this.credentialError).toHaveText(VI.passwordLocked);
      // TẠM THỜI: "nút Đăng nhập bị chặn submit" đang hiểu là nút disabled. Cũng có thể
      // app chặn ở handler mà nút vẫn bấm được — bước 3 xác minh trên DOM thật.
      await expect(this.submitButton).toBeDisabled();
    });
  }

  /** AUTH2.13 — tài khoản hết hạn, banner kèm lối thoát cho người dùng. */
  async expectAccountExpired(): Promise<void> {
    await this.step('banner báo tài khoản hết hạn, có nút liên hệ hỗ trợ', async () => {
      await expect(this.alertBanner).toHaveText(BANNER.expired);
      await expect(this.supportButton).toBeVisible();
    });
  }

  async expectRejected(): Promise<void> {
    await expect(this.page).toHaveURL(SSO_URL);
    await expect(this.error).not.toBeEmpty();
  }
}

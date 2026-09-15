/**
 * AUTH — luồng đăng nhập. Sinh từ `testcase/Testcase_Authentication_v1.0.0_part1.json`
 * (8 case, priority High) bằng skill `gen-script`.
 *
 * File có HAI describe gốc, và chúng chạy ở hai project khác nhau:
 *
 *   "AUTH — Đăng nhập"        `@guest`      → project `chromium-guest`, KHÔNG nạp session
 *   "AUTH — Sau khi đăng nhập" không tag     → project `chromium`, có session từ `setup`
 *
 * Gần hết case ở đây kiểm luồng đăng nhập nên phải bắt đầu ở trạng thái chưa đăng nhập:
 * mở lên mà đã đăng nhập rồi thì app đá về trang chủ và test đỏ vì lý do không liên quan.
 * Nhóm đăng xuất (AUTH6) thì ngược lại — nó cần một phiên đang sống. Tag là thứ duy nhất
 * quyết định điều đó, và tag cộng dồn từ describe cha nên AUTH6 buộc phải nằm ngoài.
 *
 * Một file chứ không tách: theo mục 3 của `docs/test-structure.md`, mỗi nhóm
 * `test_case_id` cùng tiền tố là một file — `AUTH*` là một nhóm, dù chạy ở hai project.
 */
import type { Page } from '@playwright/test';
import type { PageFixtures } from 'qc-kit/fixtures';
import { randomString } from 'qc-kit/utils';
import { expect, test } from '../../../src/fixtures';
import {
  accounts,
  authPolicy,
  specialAccounts,
  throwawayAccounts,
} from '../../../src/data/credentials';
import { ForgotPasswordPage } from '../../../src/pages/login/ForgotPasswordPage';
import { LoginPage } from '../../../src/pages/login/LoginPage';
import { SSO_URL, type SsoLoginPage } from '../../../src/pages/login/SsoLoginPage';
import { OtpVerificationPage } from '../../../src/pages/login/OtpVerificationPage';
import { ChangePasswordPage } from '../../../src/pages/login/ChangePasswordPage';
import { PasswordExpiredPage } from '../../../src/pages/login/PasswordExpiredPage';
import { Header } from '../../../src/pages/header/Header';
import { LogoutConfirmDialog } from '../../../src/components/LogoutConfirmDialog';
import { TwoFactorSetupPage } from '../../../src/pages/login/TwoFactorSetupPage';

/** Endpoint tầng auth — suy từ expected của AUTH1.4. CHƯA đối chiếu network thật. */
const AUTH_API = /\/api\/auth\//;

/**
 * ENDPOINT-TBD: đường dẫn API của "Cung cấp lại mật khẩu" (AUTH3.4).
 *
 * Chưa biết — bước 3 lấy từ tab Network. Đây là marker cùng loại với `LOCATOR-TBD` và
 * nguy hiểm hơn một chút: chặn sai đường dẫn thì `page.route` không khớp, request đi
 * bình thường, và case xanh giả vì toast thành công cũng làm `toast` hiện ra.
 */
const FORGOT_API = '**/ENDPOINT-TBD-forgot-password';

/**
 * Mật khẩu đạt đủ 4 rule của AUTH5.2: ≥ 12 ký tự · 1 chữ số · 1 chữ in hoa · 1 ký tự đặc biệt.
 *
 * Sinh mới mỗi lần thay vì dùng hằng số: AUTH5.6 và AUTH5.7 đổi mật khẩu THẬT, nên một
 * giá trị cố định sẽ trùng chính mật khẩu vừa đặt ở lần chạy trước và trượt rule
 * "phải khác mật khẩu hiện tại".
 */
function matKhauHopLe(): string {
  return `Qc${randomString(10)}!1`;
}

/** Ngưỡng rate limit của AUTH3.9 — cả hai nguồn dẫn trong case đều nói 3. */
const GIOI_HAN_YEU_CAU = 3;

/**
 * Gom mọi request tới tầng auth kể từ lúc gọi, trả về mảng lớn dần.
 *
 * Gắn TRƯỚC hành động cần kiểm — gắn sau thì không còn gì để nghe. Dùng cho vế
 * "KHÔNG gọi API" của AUTH1.1, AUTH2.1 và AUTH2.2.
 */
function demRequestAuth(page: Page): string[] {
  const calls: string[] = [];
  page.on('request', (r) => {
    if (AUTH_API.test(r.url())) calls.push(r.url());
  });
  return calls;
}

test.describe('AUTH — Đăng nhập', { tag: '@guest' }, () => {
  /**
   * Mọi màn sau bước 1 đều tới bằng đường này: không deep-link thẳng vào trang SSO được,
   * và màn quên mật khẩu lẫn màn 2FA đều nằm phía sau nó.
   */
  async function moManDangNhap(login: LoginPage): Promise<SsoLoginPage> {
    await login.open();
    await login.waitUntilLoaded();
    return login.submitCompany(accounts.standard.company);
  }

  test.describe('AUTH1 — Màn Mã doanh nghiệp', () => {
    test('AUTH1.0 hiển thị đủ thành phần mặc định @high', async ({ createPage }) => {
      const login = createPage(LoginPage);

      // step 1 — "Truy cập URL đăng nhập hệ thống."
      await login.open();
      await login.waitUntilLoaded();

      // step 2 — "Quan sát màn hình đầu tiên hiển thị."
      await login.expectDefaultLayout();
    });

    test('AUTH1.1 bỏ trống mã doanh nghiệp thì chặn ngay, không gọi API @high', async ({
      createPage,
      page,
    }) => {
      const login = createPage(LoginPage);
      await login.open();
      await login.waitUntilLoaded();

      // Vế "KHÔNG gọi API" của expected là chuyện của network, không phải của màn hình.
      const authCalls = demRequestAuth(page);

      // step 1 — "Để trống field Mã doanh nghiệp."
      // step 2 — "Bấm \"Tiếp tục\"."
      await login.trySubmitCompany('');

      await login.expectCompanyRequired();
      expect(authCalls, 'validation phía client phải chặn trước khi gọi API').toEqual([]);
    });

    test('AUTH1.2 mã doanh nghiệp không tồn tại thì báo lỗi, giữ nguyên giá trị @high', async ({
      createPage,
    }) => {
      const login = createPage(LoginPage);
      // Đúng định dạng nhưng chắc chắn không có trong hệ thống. Sinh ngẫu nhiên thay vì
      // hằng số: một mã cố định hôm nào đó có thể trở thành mã thật.
      const maKhongTonTai = randomString(8).toUpperCase();

      await login.open();
      await login.waitUntilLoaded();

      // step 1 — "Nhập mã doanh nghiệp bất kỳ không tồn tại trong hệ thống."
      // step 2 — "Bấm \"Tiếp tục\"."
      await login.trySubmitCompany(maKhongTonTai);

      await login.expectWrongCompany(maKhongTonTai);
    });

    test('AUTH1.3 mã doanh nghiệp hợp lệ thì sang màn đăng nhập @high', async ({ createPage }) => {
      test.skip(!accounts.standard.company, 'COMPANY_CODE chưa có trong .env');
      const login = createPage(LoginPage);

      await login.open();
      await login.waitUntilLoaded();

      // step 1 — "Nhập mã doanh nghiệp hợp lệ, đang hoạt động."
      // step 2 — "Bấm \"Tiếp tục\"."
      const sso = await login.submitCompany(accounts.standard.company);

      await sso.expectLoaded();
      // Vế "Lưu companyId vào session/state" chưa assert: chưa biết key nào trong storage,
      // và đoán tên key thì sai y hệt như đoán locator. Xem báo cáo của lần sinh này.
    });
  });

  test.describe('AUTH2 — Màn Tài khoản & Mật khẩu', () => {
    test('AUTH2.0 hiển thị đủ thành phần mặc định @high', async ({ createPage }) => {
      test.skip(!accounts.standard.company, 'COMPANY_CODE chưa có trong .env');
      const login = createPage(LoginPage);

      // step 1 — "Từ màn Company ID, nhập mã hợp lệ và tiếp tục."
      const sso = await moManDangNhap(login);

      // step 2 — "Quan sát màn Login."
      await sso.expectDefaultLayout();
    });

    /**
     * AUTH2.1 → AUTH2.3 — ô bắt buộc bỏ trống.
     *
     * Màn này KHÔNG tự vẽ inline error cho ô rỗng: nó để `required` cho trình duyệt lo.
     * Bong bóng "Please fill out this field." do Chrome vẽ ở lớp chrome, **không nằm trong
     * DOM** — nên `expectUsernameRequired()` kiểm `validity.valueMissing` của chính input
     * chứ không đi tìm một element không tồn tại.
     *
     * Hệ quả tốt: vế "không gọi API" của `expected` nay kiểm được thật, vì form bị chặn
     * trước cả khi submit.
     *
     * Cả ba case assert theo cùng một thứ tự: **kết quả quan sát được trước** (vẫn ở
     * nguyên màn đăng nhập — `expectLoaded()`), **cơ chế sau** (ô nào bị chặn, request
     * nào không đi). Một ngày app đổi sang tự vẽ inline error thay vì để `required` cho
     * trình duyệt, dòng cơ chế sẽ đỏ trong khi dòng kết quả vẫn xanh — đọc report là biết
     * ngay hành vi đổi, chứ không phải test hỏng.
     */
    test('AUTH2.1 bỏ trống Tài khoản thì không submit, vẫn ở màn đăng nhập @high', async ({
      createPage,
      page,
    }) => {
      test.skip(!accounts.standard.company, 'COMPANY_CODE chưa có trong .env');
      const login = createPage(LoginPage);
      const sso = await moManDangNhap(login);

      const authCalls = demRequestAuth(page);

      // precondition — "Bỏ trống Tài khoản"
      // step 1 — "Để trống 1 hoặc cả 2 field."
      // step 2 — "Bấm \"Đăng nhập\"."
      await sso.trySignIn('', accounts.standard.password);

      // Kết quả quan sát được: bấm xong VẪN Ở NGUYÊN màn này — form không gửi đi đâu cả.
      // Dùng lại `expectLoaded()` vì nó đã đúng nghĩa: URL vẫn là URL SSO và form còn đó.
      await sso.expectLoaded();

      // Hai assert dưới là CƠ CHẾ đứng sau kết quả trên, giữ lại để khi đỏ thì biết đỏ ở
      // đâu: trình duyệt chặn vì ô bắt buộc rỗng, nên không request nào kịp đi.
      await sso.expectUsernameRequired();
      expect(authCalls, 'form bị trình duyệt chặn thì không request nào được đi').toEqual([]);
    });

    test('AUTH2.2 bỏ trống Mật khẩu thì không submit, vẫn ở màn đăng nhập @high', async ({
      createPage,
      page,
    }) => {
      test.skip(!accounts.standard.company, 'COMPANY_CODE chưa có trong .env');
      const login = createPage(LoginPage);
      const sso = await moManDangNhap(login);

      const authCalls = demRequestAuth(page);

      // precondition — "Bỏ trống Mật khẩu"
      // step 1 — "Để trống 1 hoặc cả 2 field."
      // step 2 — "Bấm \"Đăng nhập\"."
      await sso.trySignIn(accounts.standard.username, '');

      // Kết quả quan sát được: vẫn ở nguyên màn này.
      await sso.expectLoaded();

      // Cơ chế đứng sau.
      await sso.expectPasswordRequired();
      expect(authCalls, 'form bị trình duyệt chặn thì không request nào được đi').toEqual([]);
    });

    test('AUTH2.3 bỏ trống cả hai thì không submit, cả hai ô đều bị chặn @high', async ({
      createPage,
    }) => {
      test.skip(!accounts.standard.company, 'COMPANY_CODE chưa có trong .env');
      const login = createPage(LoginPage);
      const sso = await moManDangNhap(login);

      // precondition — "Bỏ trống cả 2 field"
      // step 1 — "Để trống 1 hoặc cả 2 field."
      // step 2 — "Bấm \"Đăng nhập\"."
      await sso.trySignIn('', '');

      // Kết quả quan sát được: vẫn ở nguyên màn này.
      await sso.expectLoaded();

      // `expected` đòi hai inline error hiện đồng thời — validation native không làm được
      // thế, nó chỉ vẽ một bong bóng ở ô đầu tiên. Xem `expectBothRequired()`.
      await sso.expectBothRequired();
    });

    /**
     * AUTH2.7 → AUTH2.9 — chính sách khoá tài khoản.
     *
     * `serial`: cả ba case cùng tiêu thụ bộ đếm số lần sai của MỘT tài khoản. Chạy song
     * song thì chúng đếm chồng lên nhau và không case nào còn đúng.
     *
     * Và chúng dùng `throwawayAccounts.lockout`, không dùng `accounts.standard`: đây là
     * nhóm case cố tình khoá tài khoản, mà tài khoản chuẩn là thứ project `setup` dùng
     * để đăng nhập cho cả suite.
     */
    test.describe('AUTH2.7–2.9 — Chính sách khoá tài khoản', () => {
      test.describe.configure({ mode: 'serial' });

      /** Mật khẩu chắc chắn sai, khác nhau mỗi lần để không trúng cache nào. */
      const matKhauSai = () => `sai-${randomString(10)}`;

      test('AUTH2.7 sai lần đầu thì banner báo còn N lần thử @high', async ({
        createPage,
      }) => {
        // ĐỎ TỚI KHI CÓ LOCATOR: `alertBanner` còn là LOCATOR-TBD — thông báo lỗi tự nói ra.
        test.skip(!throwawayAccounts.lockout.username, 'LOCKOUT_USERNAME chưa có trong .env');
        const login = createPage(LoginPage);
        const sso = await moManDangNhap(login);

        // precondition — "Lần sai đầu tiên"
        // step 1 — "Nhập tài khoản đúng + mật khẩu sai (hoặc ngược lại)."
        // step 2 — "Bấm \"Đăng nhập\"."
        await sso.trySignIn(throwawayAccounts.lockout.username, matKhauSai());

        // Không truyền số: AUTH2.7 không biết ngưỡng của tenant, chỉ đòi banner đúng dạng.
        await sso.expectAttemptsRemaining();
      });

      test('AUTH2.8 sai liên tiếp thì N giảm dần tới khi khoá @high', async ({
        createPage,
      }) => {
        // ĐỎ TỚI KHI CÓ LOCATOR: cùng `alertBanner` như AUTH2.7.
        test.skip(!throwawayAccounts.lockout.username, 'LOCKOUT_USERNAME chưa có trong .env');
        test.skip(authPolicy.maxLoginAttempts < 1, 'LOCKOUT_MAX_ATTEMPTS chưa có trong .env');
        const login = createPage(LoginPage);
        const sso = await moManDangNhap(login);
        const nguong = authPolicy.maxLoginAttempts;

        // step 1 — "Lặp lại đăng nhập sai liên tiếp nhiều lần."
        // "nhiều lần" ở đây = đúng ngưỡng của tenant. Con số đó là cấu hình chứ không
        // phải hằng số của sản phẩm, nên nó tới từ .env chứ không nằm trong code.
        for (let lan = 1; lan < nguong; lan += 1) {
          await sso.trySignIn(throwawayAccounts.lockout.username, matKhauSai());
          await sso.expectAttemptsRemaining(nguong - lan);
        }

        await sso.trySignIn(throwawayAccounts.lockout.username, matKhauSai());
        await sso.expectLocked();
      });

      test('AUTH2.9 sai đủ ngưỡng thì tài khoản bị khoá @high', async ({ createPage }) => {
        // ĐỎ TỚI KHI CÓ LOCATOR: cùng `alertBanner` như AUTH2.7.
        test.skip(!throwawayAccounts.lockout.username, 'LOCKOUT_USERNAME chưa có trong .env');
        test.skip(authPolicy.maxLoginAttempts < 1, 'LOCKOUT_MAX_ATTEMPTS chưa có trong .env');
        const login = createPage(LoginPage);
        const sso = await moManDangNhap(login);

        // step 1 — "Đăng nhập sai đủ số lần tối đa cấu hình (Số lần đăng nhập sai tối đa)."
        for (let lan = 0; lan < authPolicy.maxLoginAttempts; lan += 1) {
          await sso.trySignIn(throwawayAccounts.lockout.username, matKhauSai());
        }

        // step 2 — "Quan sát màn hình."
        await sso.expectLocked();
      });
    });

    test('AUTH2.13 tài khoản hết hạn thì báo và mở lối liên hệ @high', async ({
      createPage,
    }) => {
      // ĐỎ TỚI KHI CÓ LOCATOR: `alertBanner` và `supportButton`.
      test.skip(!specialAccounts.expired.username, 'EXPIRED_USERNAME chưa có trong .env');
      const login = createPage(LoginPage);
      const sso = await moManDangNhap(login);

      // step 1 — "Đăng nhập với tài khoản Account Status = Expired."
      await sso.trySignIn(specialAccounts.expired.username, specialAccounts.expired.password);

      // step 2 — "Quan sát alert."
      await sso.expectAccountExpired();
    });

    test('AUTH2.15 username thuộc tenant khác thì báo chung, không tiết lộ @high', async ({
      createPage,
    }) => {
      test.skip(
        !specialAccounts.otherTenant.username,
        'OTHER_TENANT_USERNAME chưa có trong .env',
      );
      const login = createPage(LoginPage);

      // step 1 — "Nhập company ID tenant A hợp lệ."
      const sso = await moManDangNhap(login);

      // step 2 — "Nhập username thuộc tenant B (không thuộc tenant A) + mật khẩu bất kỳ."
      // step 3 — "Bấm Đăng nhập."
      await sso.trySignIn(
        specialAccounts.otherTenant.username,
        specialAccounts.otherTenant.password || randomString(12),
      );

      // Đúng thông báo của case sai credentials thường — đó chính là điều case này kiểm:
      // hệ thống không được để lộ username có tồn tại ở tenant khác hay không.
      await sso.expectInvalidCredentials();
    });

    test('AUTH2.16 đăng nhập đúng, không 2FA thì vào thẳng app @high', async ({
      createPage,
      page,
    }) => {
      test.skip(
        !accounts.standard.company || !accounts.standard.password,
        'COMPANY_CODE / USER_PASSWORD chưa có trong .env',
      );
      const login = createPage(LoginPage);

      // step 1 — "Nhập đúng Tài khoản + Mật khẩu."
      // step 2 — "Bấm Đăng nhập."
      await login.signIn(accounts.standard);

      await login.expectSignedIn();
      // "không qua bước xác thực nào khác": đã rời hẳn origin SSO, không dừng ở màn OTP.
      await expect(page).not.toHaveURL(SSO_URL);
      // Vế "vào Dashboard" chưa assert: màn Dashboard không có trong bảng ánh xạ mục 4 của
      // docs/test-structure.md, và đoán nó là màn nào thì sai hệt như đoán locator.
    });
  });

  test.describe('AUTH3 — Màn Xác nhận tài khoản (quên mật khẩu)', () => {
    /** Màn này nằm sau màn đăng nhập, sau một cú bấm "Quên mật khẩu?". */
    async function moManQuenMatKhau(login: LoginPage): Promise<ForgotPasswordPage> {
      const sso = await moManDangNhap(login);
      return sso.moQuenMatKhau();
    }

    test('AUTH3.0 chỉ có một field, không hỏi mã doanh nghiệp @high', async ({
      createPage,
    }) => {
      // ĐỎ TỚI KHI CÓ LOCATOR: cả class ForgotPasswordPage chưa có locator thật nào.
      test.skip(!accounts.standard.company, 'COMPANY_CODE chưa có trong .env');
      const login = createPage(LoginPage);

      // step 1 — "Từ màn Login, bấm \"Quên mật khẩu?\"."
      const forgot = await moManQuenMatKhau(login);

      // step 2 — "Quan sát form hiển thị."
      await forgot.expectDefaultLayout();
    });

    test('AUTH3.1 bỏ trống Tài khoản thì báo lỗi @high', async ({ createPage }) => {
      // ĐỎ TỚI KHI CÓ LOCATOR: cùng lý do AUTH3.0.
      test.skip(!accounts.standard.company, 'COMPANY_CODE chưa có trong .env');
      const login = createPage(LoginPage);
      const forgot = await moManQuenMatKhau(login);

      // step 1 — "Để trống field Tài khoản."
      // step 2 — "Bấm \"Cung cấp lại mật khẩu\"."
      await forgot.guiYeuCau('');

      await forgot.expectAccountRequired();
    });

    test('AUTH3.3 gửi yêu cầu hợp lệ thì báo thành công @high', async ({ createPage }) => {
      // ĐỎ TỚI KHI CÓ LOCATOR: cùng lý do AUTH3.0.
      test.skip(!throwawayAccounts.forgotPassword.username, 'FORGOT_USERNAME chưa có trong .env');
      const login = createPage(LoginPage);
      const forgot = await moManQuenMatKhau(login);

      // step 1 — "Nhập tài khoản hợp lệ."
      // step 2 — "Bấm \"Cung cấp lại mật khẩu\"."
      await forgot.guiYeuCau(throwawayAccounts.forgotPassword.username);

      await forgot.expectRequestSucceeded();
      // Vế "gửi email chứa link reset (token one-time, có TTL)" không assert ở đây: kiểm
      // nó phải đọc hộp thư thật, là việc của tầng khác.
    });

    test.fixme('AUTH3.4 server lỗi thì báo gửi thất bại @high', async ({ createPage, page }) => {
      // GIỮ `fixme` — ngoại lệ duy nhất của file này.
      //
      // Case khác thiếu locator thì để đỏ, đỏ là thông tin. Case này thiếu ĐƯỜNG DẪN API:
      // `page.route` không khớp thì request đi bình thường, app chạy đường thành công, và
      // `expectRequestFailed()` có thể XANH cho một case chưa từng được kiểm. Bật nó lên
      // là tự cấp cho mình một dấu tích xanh giả — tệ hơn không có test.
      test.skip(!throwawayAccounts.forgotPassword.username, 'FORGOT_USERNAME chưa có trong .env');
      const login = createPage(LoginPage);
      const forgot = await moManQuenMatKhau(login);

      // precondition — "Request thất bại (lỗi server/mạng)": ép nó hỏng bằng route, không
      // ngồi chờ server thật hỏng.
      await page.route(FORGOT_API, (route) =>
        route.fulfill({ status: 500, contentType: 'application/json', body: '{}' }),
      );

      // step 1 — "Nhập tài khoản hợp lệ."
      // step 2 — "Bấm \"Cung cấp lại mật khẩu\"."
      await forgot.guiYeuCau(throwawayAccounts.forgotPassword.username);

      await forgot.expectRequestFailed();
    });

    test('AUTH3.5 bấm Quay lại thì về màn đăng nhập @high', async ({ createPage }) => {
      // ĐỎ TỚI KHI CÓ LOCATOR: cùng lý do AUTH3.0.
      test.skip(!accounts.standard.company, 'COMPANY_CODE chưa có trong .env');
      const login = createPage(LoginPage);
      const forgot = await moManQuenMatKhau(login);

      // step 1 — "Từ màn Forgot Password, bấm \"Quay lại\"."
      const sso = await forgot.quayLai();

      await sso.expectLoaded();
      // "không lưu dữ liệu đã nhập": quay lại rồi vào lại thì ô Tài khoản phải trống.
      const lai = await sso.moQuenMatKhau();
      await expect(lai.account).toHaveValue('');
    });

    test('AUTH3.9 quá 3 lần yêu cầu thì bị chặn @high', async ({ createPage }) => {
      // ĐỎ TỚI KHI CÓ LOCATOR: cùng lý do AUTH3.0; nội dung thông báo cũng chưa chốt.
      test.skip(!throwawayAccounts.forgotPassword.username, 'FORGOT_USERNAME chưa có trong .env');
      const login = createPage(LoginPage);
      const forgot = await moManQuenMatKhau(login);

      // step 1 — "Bấm nút yêu cầu gửi lại mã/link quên mật khẩu lặp lại nhiều lần."
      // "nhiều lần" = quá 3, theo chính expected của case (cả hai nguồn đều nói 3).
      for (let lan = 0; lan <= GIOI_HAN_YEU_CAU; lan += 1) {
        await forgot.guiYeuCau(throwawayAccounts.forgotPassword.username);
      }

      // step 2 — "Quan sát khi vượt quá giới hạn cho phép."
      await forgot.expectRateLimited();
    });
  });

  test.describe('AUTH4 — Màn Setup QR (2FA)', () => {
    test('AUTH4.0 màn Setup QR hiển thị đủ thành phần @high', async ({ createPage }) => {
      // ĐỎ TỚI KHI CÓ LOCATOR: cả class TwoFactorSetupPage chưa có locator thật nào. Thêm
      // nữa tài khoản "chưa từng setup 2FA" dùng một lần — chạy xong phải cấp tài khoản mới.
      test.skip(
        !throwawayAccounts.firstLogin.username,
        'FIRST_LOGIN_USERNAME chưa có trong .env',
      );
      const login = createPage(LoginPage);
      const sso = await moManDangNhap(login);

      // step 1 — "Đăng nhập lần đầu / bật 2FA lần đầu (chưa từng setup)."
      await sso.trySignIn(
        throwawayAccounts.firstLogin.username,
        throwawayAccounts.firstLogin.password,
      );

      // step 2 — "Quan sát màn hình."
      const setup = createPage(TwoFactorSetupPage);
      await setup.expectDefaultLayout();
    });

    test('AUTH4.3 nhập đúng mã QR thì bật 2FA và đăng xuất mọi phiên @high', async ({
      createPage,
      page,
    }) => {
      test.skip(
        true,
        'DATA-TBD: cần sinh mã TOTP từ secret — mục 2 của docs/test-data.md khai kênh này ' +
          'nhưng chưa có secret lẫn thư viện sinh mã',
      );
      const login = createPage(LoginPage);
      const sso = await moManDangNhap(login);
      await sso.trySignIn(
        throwawayAccounts.firstLogin.username,
        throwawayAccounts.firstLogin.password,
      );
      const setup = createPage(TwoFactorSetupPage);

      // step 1 — "Quét mã QR bằng app Authenticator."
      // Không phải thao tác UI. Bản tự động sinh mã từ `TWO_FA_TOTP_SECRET` thay cho việc
      // quét — xem `TwoFactorSetupPage.nhapOtp()`.
      // step 2 — "Nhập đúng mã 6 số hiện trên app."
      // step 3 — "Bấm \"Xác nhận\"."
      await setup.nhapOtp('DATA-TBD');

      // "auto logout toàn bộ session hiện có, chuyển về màn Company ID / Default"
      await expect(page).toHaveURL(/\/login/);
    });
  });

  test.describe('AUTH4 — Màn Xác thực mã (nhập OTP)', () => {
    /** Màn này hiện ra sau khi credentials đúng, với tài khoản ĐÃ bật 2FA. */
    async function moManNhapOtp(createPage: PageFixtures['createPage']): Promise<void> {
      const login = createPage(LoginPage);
      const sso = await moManDangNhap(login);
      await sso.trySignIn(
        throwawayAccounts.twoFactor.username,
        throwawayAccounts.twoFactor.password,
      );
    }

    test('AUTH4.4 màn nhập OTP hiển thị đủ thành phần @high', async ({ createPage }) => {
      // ĐỎ TỚI KHI CÓ LOCATOR: cả class OtpVerificationPage chưa có locator thật nào.
      test.skip(!throwawayAccounts.twoFactor.username, 'TWO_FA_USERNAME chưa có trong .env');

      // step 1 — "Đăng nhập đúng Tài khoản/Mật khẩu với tài khoản đã bật 2FA."
      await moManNhapOtp(createPage);

      // step 2 — "Quan sát màn \"Xác thực mã\"."
      const otp = createPage(OtpVerificationPage);
      await otp.expectDefaultLayout();
      // Vế "KHÔNG có tuỳ chọn gửi email thay thế" chưa assert — xem `expectDefaultLayout()`:
      // assert phủ định bằng một locator TBD thì luôn xanh, tức là rỗng nghĩa.
    });

    test('AUTH4.5 nhập sai mã OTP thì báo lỗi @high', async ({ createPage }) => {
      // ĐỎ TỚI KHI CÓ LOCATOR: cùng lý do AUTH4.4.
      test.skip(!throwawayAccounts.twoFactor.username, 'TWO_FA_USERNAME chưa có trong .env');
      await moManNhapOtp(createPage);
      const otp = createPage(OtpVerificationPage);

      // step 1 — "Nhập 6 số OTP sai."
      // step 2 — "Bấm \"Xác nhận\" (hoặc auto-submit khi đủ 6 số)."
      // Sáu số chắc chắn sai: mã thật đổi mỗi 30 giây, một hằng số cố định vẫn có xác suất
      // trùng — nhưng sinh ngẫu nhiên cũng vậy. Dùng "000000" và chấp nhận rủi ro 1/10^6.
      await otp.nhapOtp('000000');

      await otp.expectWrongOtp();
    });

    test('AUTH4.6 nhập đúng mã OTP thì vào được app @high', async ({ createPage, page }) => {
      test.skip(
        true,
        'DATA-TBD: cần sinh mã TOTP từ secret — mục 2 của docs/test-data.md khai kênh này ' +
          'nhưng chưa có secret lẫn thư viện sinh mã',
      );
      await moManNhapOtp(createPage);
      const otp = createPage(OtpVerificationPage);

      // step 1 — "Nhập đúng 6 số OTP từ app Authenticator."
      // step 2 — "Bấm \"Xác nhận\"."
      await otp.nhapOtp('DATA-TBD');

      // "Verify thành công, chuyển vào Dashboard" — màn Dashboard chưa có trong bảng ánh
      // xạ mục 4, nên chỉ assert được là đã rời màn đăng nhập.
      await expect(page).not.toHaveURL(/\/login/);
    });
  });

  test.describe('AUTH5 — Màn Đổi mật khẩu', () => {
    /**
     * Cả ba case `skip` vì cùng một lý do: **chưa chốt đường vào màn này**.
     *
     * Màn không có field "Mật khẩu hiện tại" (AUTH5.9 nói thẳng), nên nhiều khả năng nó đi
     * từ link trong email — mà hộp thư thì mục 2 của `docs/test-data.md` còn ghi "chưa chốt
     * công cụ". Chốt xong thì bỏ `test.skip` và thêm bước điều hướng vào chỗ đánh dấu.
     */
    const LY_DO = 'DATA-TBD: chưa chốt đường vào màn Đổi mật khẩu — xem docs/test-data.md mục 2';

    test('AUTH5.2 focus ô Mật khẩu mới thì hiện checklist 4 rule @high', async ({
      createPage,
    }) => {
      test.skip(true, LY_DO);
      const doiMatKhau = createPage(ChangePasswordPage);
      // DATA-TBD: chỗ này thiếu bước đi tới màn Đổi mật khẩu.

      // step 1 — "Bấm/focus vào field \"Mật khẩu mới\"."
      await doiMatKhau.focusMatKhauMoi();

      // step 2 — "Quan sát checklist rules hiện ra."
      await doiMatKhau.expectRuleChecklist();
    });

    test('AUTH5.3 mật khẩu chưa đạt đủ rule thì nút Xác nhận còn khoá @high', async ({
      createPage,
    }) => {
      test.skip(true, LY_DO);
      const doiMatKhau = createPage(ChangePasswordPage);

      // step 1 — "Nhập giá trị chỉ đạt 1-2/4 rule hiển thị."
      // "abc123" đạt rule chữ số, trượt độ dài 12, chữ hoa và ký tự đặc biệt.
      await doiMatKhau.nhapMatKhauMoi('abc123');

      await doiMatKhau.expectSubmitDisabled();
      // Vế "rule đạt chuyển xanh, chưa đạt giữ dot xám" chưa assert: chưa biết trạng thái
      // đó thể hiện bằng gì trong DOM. Đó là vế CHÍNH của case — bước 3 phải trả lời trước.
    });

    test('AUTH5.4 nhập lại mật khẩu không khớp thì báo lỗi @high', async ({ createPage }) => {
      test.skip(true, LY_DO);
      const doiMatKhau = createPage(ChangePasswordPage);

      // step 1 — "Nhập \"Mật khẩu mới\" hợp lệ."
      await doiMatKhau.nhapMatKhauMoi(`Qc${randomString(10)}!1`);

      // step 2 — "Nhập \"Nhập lại mật khẩu\" khác với giá trị vừa nhập."
      await doiMatKhau.nhapLaiMatKhau(`Khac${randomString(8)}!2`);

      await doiMatKhau.expectConfirmNotMatched();
    });

    test('AUTH5.5 hai field hợp lệ và khớp nhau thì nút Xác nhận mở khoá @high', async ({
      createPage,
    }) => {
      test.skip(true, LY_DO);
      const doiMatKhau = createPage(ChangePasswordPage);
      const matKhau = matKhauHopLe();

      // step 1 — "Nhập \"Mật khẩu mới\" đạt đủ 4 rule."
      await doiMatKhau.nhapMatKhauMoi(matKhau);

      // step 2 — "Nhập \"Nhập lại mật khẩu\" giống hệt."
      await doiMatKhau.nhapLaiMatKhau(matKhau);

      await doiMatKhau.expectSubmitEnabled();
    });

    /**
     * AUTH5.6 · AUTH5.7 — hai case này ĐỔI MẬT KHẨU THẬT.
     *
     * `serial` vì chúng dùng hai tài khoản khác nhau nhưng cùng một kiểu phá huỷ, và vì
     * AUTH5.6 còn "auto logout toàn bộ session" — chạy song song với case khác đang dùng
     * cùng tài khoản là đá nhau.
     *
     * Reset sau mỗi lần chạy: đặt lại mật khẩu về giá trị trong `.env`
     * (`CHANGE_PWD_PASSWORD`, `TWO_FA_PASSWORD`). Xem `docs/test-data.md` mục 1.
     */
    test.describe('AUTH5.6–5.7 — submit đổi mật khẩu thật', () => {
      test.describe.configure({ mode: 'serial' });

      test('AUTH5.6 đổi thành công khi 2FA TẮT thì về màn Company ID @high', async ({
        createPage,
        page,
      }) => {
        test.skip(true, LY_DO);
        const doiMatKhau = createPage(ChangePasswordPage);
        const matKhau = matKhauHopLe();

        // precondition — "Tài khoản chưa bật 2FA" → profile `changePassword`
        // step 1 — "Điền hợp lệ 2 field."
        await doiMatKhau.nhapMatKhauMoi(matKhau);
        await doiMatKhau.nhapLaiMatKhau(matKhau);

        // step 2 — "Bấm \"Xác nhận\"."
        await doiMatKhau.xacNhan();

        await doiMatKhau.expectChangeSucceeded();
        // "auto logout toàn bộ session, chuyển về màn Company ID / Default"
        await expect(page).toHaveURL(/\/login/);
      });

      test('AUTH5.7 đổi thành công khi 2FA BẬT thì sang màn 2FA @high', async ({
        createPage,
        page,
      }) => {
        test.skip(true, LY_DO);
        const doiMatKhau = createPage(ChangePasswordPage);
        const matKhau = matKhauHopLe();

        // precondition — "Tài khoản đã bật 2FA" → profile `twoFactor`
        // step 1 — "Điền hợp lệ 2 field."
        await doiMatKhau.nhapMatKhauMoi(matKhau);
        await doiMatKhau.nhapLaiMatKhau(matKhau);

        // step 2 — "Bấm \"Xác nhận\"."
        await doiMatKhau.xacNhan();

        await doiMatKhau.expectChangeSucceeded();
        // Khác AUTH5.6 đúng ở chỗ này: không về màn Company ID mà sang màn 2FA / Setup QR.
        // Chưa assert được là màn nào trong hai — `expected` viết "2FA / Setup QR", và hai
        // màn đó là hai class khác nhau. Cần chốt trước khi siết assertion.
        await expect(page).not.toHaveURL(/\/login$/);
      });
    });

    test('AUTH5.9 mật khẩu mới trùng mật khẩu hiện tại thì server chặn @high', async ({
      createPage,
    }) => {
      test.skip(true, LY_DO);
      const doiMatKhau = createPage(ChangePasswordPage);
      // Dùng đúng mật khẩu hiện tại của profile `changePassword` — đó là điều kiện của case.
      const hienTai = throwawayAccounts.changePassword.password;

      // step 1 — "Nhập mật khẩu mới giống hệt mật khẩu hiện tại (server-side check)."
      await doiMatKhau.nhapMatKhauMoi(hienTai);
      await doiMatKhau.nhapLaiMatKhau(hienTai);

      // step 2 — "Bấm Xác nhận."
      await doiMatKhau.xacNhan();

      await doiMatKhau.expectMustDifferFromCurrent();
    });
  });

  test.describe('AUTH7 — Flow đổi mật khẩu khi hết hạn', () => {
    test('AUTH7.0 vào từ email thông báo thì tới bước xác thực @high', async ({ createPage }) => {
      test.skip(
        true,
        'DATA-TBD: cần đọc email thông báo để bấm nút "Thay đổi mật khẩu" — mục 2 của ' +
          'docs/test-data.md chưa chốt công cụ hộp thư',
      );
      const hetHan = createPage(PasswordExpiredPage);

      // step 1 — "Mở email thông báo mật khẩu hết hạn/sắp hết hạn."
      // step 2 — "Nhấn nút \"Thay đổi mật khẩu\"."
      // DATA-TBD: hai bước trên cần hộp thư có API.

      await hetHan.expectLoaded();
    });

    test('AUTH7.1 đăng nhập bằng mật khẩu hết hạn thì bị đẩy sang flow đổi @high', async ({
      createPage,
    }) => {
      // ĐỎ TỚI KHI CÓ LOCATOR: cả class PasswordExpiredPage chưa có locator thật nào.
      test.skip(
        !throwawayAccounts.passwordExpired.username,
        'PWD_EXPIRED_USERNAME chưa có trong .env',
      );
      const login = createPage(LoginPage);
      const sso = await moManDangNhap(login);

      // step 1 — "Nhập tài khoản và mật khẩu hiện tại (đã hết hạn quá 90 ngày…)."
      // step 2 — "Nhấn \"Đăng nhập\"."
      await sso.trySignIn(
        throwawayAccounts.passwordExpired.username,
        throwawayAccounts.passwordExpired.password,
      );

      const hetHan = createPage(PasswordExpiredPage);
      await hetHan.expectExpiredNotice();
      await hetHan.expectLoaded();
    });
  });
});

/**
 * AUTH6 — Đăng xuất. **KHÔNG gắn `@guest`**, và đó là điểm mấu chốt.
 *
 * Mọi case AUTH khác kiểm luồng đăng nhập nên phải bắt đầu ở trạng thái chưa đăng nhập.
 * Hai case này ngược lại: chúng cần một phiên ĐANG đăng nhập. Nằm trong describe `@guest`
 * thì Playwright xếp chúng vào project `chromium-guest` — project không nạp session — và
 * chúng sẽ fail vì không có gì để đăng xuất.
 *
 * Để ngoài như thế này, chúng chạy ở project `chromium`: có `storageState`, phụ thuộc
 * project `setup`. Xem mục 6 của `docs/test-data.md`.
 */
test.describe('AUTH — Sau khi đăng nhập', () => {
  test('AUTH6.0 xác nhận đăng xuất thì về trang Đăng nhập @high', async ({ page }) => {
    // ĐỎ TỚI KHI CÓ LOCATOR: avatar và dòng "Đăng xuất" ở Header, cùng cả LogoutConfirmDialog.
    const header = new Header(page);
    const dialog = new LogoutConfirmDialog(page);

    // precondition — "Đã đăng nhập, đang ở bất kỳ màn hình nào trong ứng dụng"
    await page.goto('/');

    // step 1 — "Nhấn vào tên tài khoản/avatar ở góc trên bên phải."
    // step 2 — "Chọn \"Đăng xuất\"."
    await header.chonDangXuat();

    // step 3 — "Hộp thoại xác nhận hiển thị → nhấn \"Đồng ý\"."
    await dialog.expectVisible();
    await dialog.xacNhanDangXuat();

    await expect(page).toHaveURL(/\/login/);
  });

  test('AUTH6.1 huỷ đăng xuất thì ở lại, phiên không bị ảnh hưởng @high', async ({ page }) => {
    // ĐỎ TỚI KHI CÓ LOCATOR: cùng lý do AUTH6.0.
    const header = new Header(page);
    const dialog = new LogoutConfirmDialog(page);

    await page.goto('/');
    const urlTruocKhiHuy = page.url();

    // step 1 — "Nhấn vào tên tài khoản/avatar."
    // step 2 — "Chọn \"Đăng xuất\"."
    await header.chonDangXuat();

    // step 3 — "Hộp thoại xác nhận hiển thị → nhấn \"Huỷ\"."
    await dialog.expectVisible();
    await dialog.huyDangXuat();

    await dialog.expectHidden();
    // "ở lại màn hình hiện tại, phiên làm việc không bị ảnh hưởng"
    expect(page.url(), 'huỷ đăng xuất thì không được điều hướng đi đâu').toBe(urlTruocKhiHuy);
    await expect(page).not.toHaveURL(/\/login/);
  });
});

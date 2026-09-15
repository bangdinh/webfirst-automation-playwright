import { envNumber, envVar } from 'qc-kit/config';

/**
 * Tài khoản phải có sẵn trong môi trường đích. Giá trị lấy từ .env (hoặc secret CI) nên
 * không mật khẩu nào bị commit.
 *
 * `company` không phải secret, nhưng vẫn ở .env: mỗi môi trường một mã doanh nghiệp, và
 * mã đó quyết định realm SSO nào được dùng — hardcode là khoá suite vào một tenant.
 *
 * Ba nhóm, chia theo thứ HỎNG được chứ không theo màn hình:
 *
 *   accounts          dùng chung, không case nào làm đổi trạng thái
 *   specialAccounts   trạng thái cố định (Disabled, Expired…) — test đọc, không đổi
 *   throwawayAccounts test LÀM ĐỔI trạng thái → phải reset trước lần chạy sau
 *
 * Danh sách đầy đủ case nào cần gì: `docs/test-data.md`.
 */
export const accounts = {
  get standard() {
    return {
      company: envVar('COMPANY_CODE', ''),
      username: envVar('USER_USERNAME', ''),
      password: envVar('USER_PASSWORD', ''),
    };
  },
  get admin() {
    return {
      company: envVar('COMPANY_CODE', ''),
      username: envVar('ADMIN_USERNAME', ''),
      password: envVar('ADMIN_PASSWORD', ''),
    };
  },
} as const;

/**
 * Tài khoản ở một trạng thái CỐ ĐỊNH mà test chỉ đọc, không làm đổi.
 *
 * Cấp một lần rồi dùng mãi: đăng nhập vào một tài khoản Disabled không làm nó hết
 * Disabled. Vì thế chúng không cần bước reset nào giữa các lần chạy.
 */
export const specialAccounts = {
  /** Account Status = Expired. AUTH2.13 */
  get expired() {
    return {
      company: envVar('COMPANY_CODE', ''),
      username: envVar('EXPIRED_USERNAME', ''),
      password: envVar('EXPIRED_PASSWORD', ''),
    };
  },
  /** Tài khoản bị vô hiệu hoá — chỉ Owner/Admin mở lại được. AUTH2.12 */
  get disabled() {
    return {
      company: envVar('COMPANY_CODE', ''),
      username: envVar('DISABLED_USERNAME', ''),
      password: envVar('DISABLED_PASSWORD', ''),
    };
  },
  /**
   * Còn hoạt động, đăng nhập được, nhưng CHƯA được cấp quyền truy cập chức năng nào.
   * AUTH2.18 — app vẫn cho vào, rồi hiện màn trống.
   */
  get noPermission() {
    return {
      company: envVar('COMPANY_CODE', ''),
      username: envVar('NO_PERMISSION_USERNAME', ''),
      password: envVar('NO_PERMISSION_PASSWORD', ''),
    };
  },
  /** Username có thật nhưng thuộc tenant KHÁC với COMPANY_CODE. AUTH2.15 */
  get otherTenant() {
    return {
      username: envVar('OTHER_TENANT_USERNAME', ''),
      password: envVar('OTHER_TENANT_PASSWORD', ''),
    };
  },
  /** Đã tồn tại ở cả IdP lẫn app — đăng nhập SSO phải vào thẳng. AUTH2.4 */
  get ssoExisting() {
    return {
      username: envVar('SSO_EXISTING_USERNAME', ''),
      password: envVar('SSO_EXISTING_PASSWORD', ''),
    };
  },
} as const;

/**
 * Tài khoản mà test LÀM ĐỔI trạng thái. Chạy lần hai mà không reset thì đỏ — và đỏ vì môi
 * trường, không vì sản phẩm.
 *
 * Tách khỏi `accounts.standard` không phải cho gọn: case khoá tài khoản (AUTH2.7 → 2.9)
 * cố tình đăng nhập sai tới ngưỡng. Chạy nó trên tài khoản chuẩn là khoá đúng tài khoản
 * mà project `setup` dùng để đăng nhập — cả suite đỏ, và đỏ muộn, sau khi session cache
 * hết hạn.
 *
 * Mỗi getter ghi rõ nó phá cái gì và cần gì để chạy lại.
 */
export const throwawayAccounts = {
  /**
   * Được phép bị khoá. AUTH2.7 · AUTH2.8 · AUTH2.9 · AUTH2.19 · AUTH2.20 · AUTH2.21
   *
   * PHÁ: tài khoản bị khoá. CHẠY LẠI: chờ hết lockout duration, hoặc nhờ Admin mở.
   */
  get lockout() {
    return {
      company: envVar('COMPANY_CODE', ''),
      username: envVar('LOCKOUT_USERNAME', ''),
      password: envVar('LOCKOUT_PASSWORD', ''),
    };
  },
  /**
   * Dùng cho luồng quên mật khẩu. AUTH3.3 · AUTH3.6 → AUTH3.10
   *
   * PHÁ: hệ thống GỬI EMAIL THẬT, và AUTH3.9 đốt hạn mức 3 lần/ngày.
   * CHẠY LẠI: hạn mức reset theo NGÀY — chạy CI hai lượt trong ngày là đụng trần.
   */
  get forgotPassword() {
    return { username: envVar('FORGOT_USERNAME', '') };
  },
  /**
   * CHƯA TỪNG setup 2FA. AUTH4.0 · AUTH4.3
   *
   * PHÁ: setup xong là rời khỏi trạng thái này, một chiều.
   * CHẠY LẠI: cấp tài khoản mới, hoặc reset 2FA cho nó.
   */
  get firstLogin() {
    return {
      username: envVar('FIRST_LOGIN_USERNAME', ''),
      password: envVar('FIRST_LOGIN_PASSWORD', ''),
    };
  },
  /**
   * ĐÃ bật 2FA, returning user. AUTH2.17 · AUTH4.4 → AUTH4.11 · AUTH5.7
   *
   * `totpSecret` là thứ phải XIN LÚC TẠO tài khoản — sau đó không lấy lại được, và không
   * có nó thì mọi case "nhập đúng mã 6 số" không tự động được (AUTH4.3 · 4.6 · 7.13).
   * `backupCodes` ngăn cách bằng dấu phẩy, phục vụ AUTH4.10.
   *
   * PHÁ: AUTH4.9 khoá theo OTP sai, AUTH4.11 tắt 2FA.
   * CHẠY LẠI: bật lại 2FA và cấp secret mới.
   */
  get twoFactor() {
    return {
      company: envVar('COMPANY_CODE', ''),
      username: envVar('TWO_FA_USERNAME', ''),
      password: envVar('TWO_FA_PASSWORD', ''),
      totpSecret: envVar('TWO_FA_TOTP_SECRET', ''),
      backupCodes: envVar('TWO_FA_BACKUP_CODES', '')
        .split(',')
        .map((code) => code.trim())
        .filter(Boolean),
    };
  },
  /**
   * Mật khẩu ĐÃ hết hạn. AUTH2.11 · toàn bộ AUTH7 (15 case)
   *
   * PHÁ: AUTH7.8 đổi mật khẩu thật, và hạn mới tính lại 90 ngày.
   * CHẠY LẠI: đặt lại mật khẩu về giá trị trong .env và ép nó hết hạn lại.
   */
  get passwordExpired() {
    return {
      company: envVar('COMPANY_CODE', ''),
      username: envVar('PWD_EXPIRED_USERNAME', ''),
      password: envVar('PWD_EXPIRED_PASSWORD', ''),
    };
  },
  /**
   * Dùng cho form Đổi mật khẩu. AUTH5.5 · AUTH5.6 · AUTH5.9
   *
   * PHÁ: mật khẩu đổi thật, và AUTH5.6 còn auto logout mọi session.
   * CHẠY LẠI: đặt lại mật khẩu về giá trị trong .env.
   */
  get changePassword() {
    return {
      company: envVar('COMPANY_CODE', ''),
      username: envVar('CHANGE_PWD_USERNAME', ''),
      password: envVar('CHANGE_PWD_PASSWORD', ''),
    };
  },
  /**
   * CHƯA tồn tại ở app, chỉ có ở IdP — để app tự tạo lúc đăng nhập. AUTH2.5
   *
   * PHÁ: sau lần chạy đầu nó không còn "mới" nữa.
   * CHẠY LẠI: xoá user khỏi app sau mỗi lần chạy.
   */
  get ssoNew() {
    return {
      username: envVar('SSO_NEW_USERNAME', ''),
      password: envVar('SSO_NEW_PASSWORD', ''),
    };
  },
} as const;

/**
 * Cấu hình của TENANT, không phải hằng số của sản phẩm — nên ở .env chứ không hardcode:
 * mỗi môi trường một giá trị, và case đếm ngược đúng theo giá trị đó.
 *
 * `0` nghĩa là chưa điền — case đọc nó sẽ tự skip thay vì đỏ.
 */
export const authPolicy = {
  /** Số lần đăng nhập sai tối đa trước khi khoá. AUTH2.8 · AUTH2.9 */
  get maxLoginAttempts() {
    return envNumber('LOCKOUT_MAX_ATTEMPTS', 0);
  },
  /** Tài khoản bị khoá trong bao nhiêu phút. AUTH2.21 */
  get lockoutDurationMinutes() {
    return envNumber('LOCKOUT_DURATION_MINUTES', 0);
  },
} as const;

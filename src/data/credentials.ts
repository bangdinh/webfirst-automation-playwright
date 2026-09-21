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
/**
 * Giá trị đánh dấu "đã biết là cần, đang chờ người cấp" — khác hẳn để trống, vốn có
 * nghĩa "chưa ai xét tới". Danh sách và thứ tự cấp: `docs/account-provisioning.md`.
 *
 * `taiKhoanVar` coi nó là CHƯA CÓ, y hệt chuỗi rỗng. Đó là điểm mấu chốt: nếu để
 * nguyên chuỗi này lọt vào form đăng nhập thì hơn chục case sẽ đỏ với "Tài khoản hoặc
 * mật khẩu không đúng" — một thông báo không hề nói ra rằng thứ còn thiếu là tài khoản.
 * Đọc nó thành rỗng thì `test.skip(!...username)` vẫn chặn đúng, và người đọc `.env`
 * vẫn thấy ngay cái nào đang chờ.
 */
export const CHO_CAP = 'WAITING_ACCOUNT';

const taiKhoanVar = (key: string): string => {
  const giaTri = envVar(key, '');
  return giaTri === CHO_CAP ? '' : giaTri;
};
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
      username: taiKhoanVar('EXPIRED_USERNAME'),
      password: taiKhoanVar('EXPIRED_PASSWORD'),
    };
  },
  /** Tài khoản bị vô hiệu hoá — chỉ Owner/Admin mở lại được. AUTH2.12 */
  get disabled() {
    return {
      company: envVar('COMPANY_CODE', ''),
      username: taiKhoanVar('DISABLED_USERNAME'),
      password: taiKhoanVar('DISABLED_PASSWORD'),
    };
  },
  /**
   * Còn hoạt động, đăng nhập được, nhưng CHƯA được cấp quyền truy cập chức năng nào.
   * AUTH2.18 — app vẫn cho vào, rồi hiện màn trống.
   */
  get noPermission() {
    return {
      company: envVar('COMPANY_CODE', ''),
      username: taiKhoanVar('NO_PERMISSION_USERNAME'),
      password: taiKhoanVar('NO_PERMISSION_PASSWORD'),
    };
  },
  /** Username có thật nhưng thuộc tenant KHÁC với COMPANY_CODE. AUTH2.15 */
  get otherTenant() {
    return {
      username: taiKhoanVar('OTHER_TENANT_USERNAME'),
      password: taiKhoanVar('OTHER_TENANT_PASSWORD'),
    };
  },
  /** Đã tồn tại ở cả IdP lẫn app — đăng nhập SSO phải vào thẳng. AUTH2.4 */
  get ssoExisting() {
    return {
      username: taiKhoanVar('SSO_EXISTING_USERNAME'),
      password: taiKhoanVar('SSO_EXISTING_PASSWORD'),
    };
  },
  /**
   * Tài khoản RIÊNG cho mọi case phải nhập OTP khi đăng nhập.
   * AUTH2.17 · AUTH4.4 · AUTH4.5 · AUTH4.6 · AUTH5.7
   *
   * **OTP do ADMIN bật, không phải test bật.** Đó là lý do nó nằm ở nhóm trạng thái cố
   * định chứ không phải nhóm phá huỷ: suite chỉ đăng nhập và nhập mã, không bao giờ tự
   * bật/tắt 2FA cho nó. Trạng thái của nó là hợp đồng với người quản trị môi trường.
   *
   * Vì thế **case nào làm đổi trạng thái 2FA thì KHÔNG được dùng tài khoản này**:
   *
   *   AUTH4.0 · AUTH4.3   setup 2FA lần đầu   → `throwawayAccounts.firstLogin`
   *   AUTH4.9             khoá do sai OTP     → cần tài khoản riêng, chưa cấp (part 10)
   *   AUTH4.11            tắt 2FA             → cần tài khoản riêng, chưa cấp (part 10)
   *
   * Dùng nhầm là hỏng đúng thứ admin vừa dựng, và lần chạy sau phải đi nhờ dựng lại.
   *
   * `totpSecret` phải XIN LÚC ADMIN BẬT OTP — sau đó không lấy lại được, và không có nó
   * thì mọi case "nhập đúng mã 6 số" (AUTH4.6 · AUTH7.13) không tự động được.
   * `backupCodes` ngăn cách bằng dấu phẩy, phục vụ AUTH4.10.
   */
  get otpEnabled() {
    return {
      company: envVar('COMPANY_CODE', ''),
      username: taiKhoanVar('OTP_USERNAME'),
      password: taiKhoanVar('OTP_PASSWORD'),
      totpSecret: taiKhoanVar('OTP_TOTP_SECRET'),
      backupCodes: taiKhoanVar('OTP_BACKUP_CODES')
        .split(',')
        .map((code) => code.trim())
        .filter(Boolean),
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
      username: taiKhoanVar('LOCKOUT_USERNAME'),
      password: taiKhoanVar('LOCKOUT_PASSWORD'),
    };
  },
  /**
   * Dùng cho luồng quên mật khẩu. AUTH3.3 · AUTH3.6 → AUTH3.10
   *
   * PHÁ: hệ thống GỬI EMAIL THẬT, và AUTH3.9 đốt hạn mức 3 lần/ngày.
   * CHẠY LẠI: hạn mức reset theo NGÀY — chạy CI hai lượt trong ngày là đụng trần.
   */
  get forgotPassword() {
    return { username: taiKhoanVar('FORGOT_USERNAME') };
  },
  /**
   * CHƯA TỪNG setup 2FA. AUTH4.0 · AUTH4.3
   *
   * PHÁ: setup xong là rời khỏi trạng thái này, một chiều.
   * CHẠY LẠI: cấp tài khoản mới, hoặc reset 2FA cho nó.
   */
  get firstLogin() {
    return {
      username: taiKhoanVar('FIRST_LOGIN_USERNAME'),
      password: taiKhoanVar('FIRST_LOGIN_PASSWORD'),
    };
  },
  /**
   * Mật khẩu ĐÃ hết hạn — dùng cho các bước ĐẦU của flow bắt buộc, chưa đi tới đích.
   * AUTH2.11 · AUTH7.0 · AUTH7.1 · AUTH7.2 · AUTH7.3 · AUTH7.4
   *
   * Những case này không hoàn tất việc đổi mật khẩu: chúng dừng ở bước nhập sai tài khoản,
   * sai mật khẩu hiện tại, hoặc vừa tới màn OTP. Tài khoản vì thế còn nguyên trạng thái.
   *
   * PHÁ: trên lý thuyết không, nhưng đăng nhập sai nhiều lần vẫn có thể chạm ngưỡng khoá.
   * CHẠY LẠI: bình thường không cần làm gì.
   */
  get passwordExpired() {
    return {
      company: envVar('COMPANY_CODE', ''),
      username: taiKhoanVar('PWD_EXPIRED_USERNAME'),
      password: taiKhoanVar('PWD_EXPIRED_PASSWORD'),
    };
  },
  /**
   * Mật khẩu ĐÃ hết hạn, dùng RIÊNG cho các case đi hết flow. AUTH7.5 → AUTH7.9
   *
   * Tách khỏi `passwordExpired` vì hai lý do, và lý do thứ hai mới là lý do bắt buộc:
   *
   * 1. Nhóm này phải qua được bước OTP, tức cần một kênh nhận mã đọc được — `otpChannel`
   *    ghi địa chỉ email hoặc số điện thoại mà hệ thống gửi mã tới.
   * 2. **AUTH7.8 đổi mật khẩu THẬT.** Dùng chung tài khoản với AUTH7.2 → 7.4 thì sau lượt
   *    đầu, mật khẩu trong `.env` không còn đúng và ba case kia đỏ — đỏ vì môi trường,
   *    không vì sản phẩm.
   *
   * PHÁ: mật khẩu đổi thật, và hạn mới tính lại 90 ngày kể từ lúc đổi.
   * CHẠY LẠI: đặt lại mật khẩu về giá trị trong .env, rồi ép nó hết hạn lại.
   */
  get passwordExpiredOtp() {
    return {
      company: envVar('COMPANY_CODE', ''),
      username: taiKhoanVar('PWD_EXPIRED_OTP_USERNAME'),
      password: taiKhoanVar('PWD_EXPIRED_OTP_PASSWORD'),
      /** Email hoặc SĐT nhận mã OTP của flow — nơi sẽ phải đọc mã khi chốt được kênh. */
      otpChannel: taiKhoanVar('PWD_EXPIRED_OTP_CHANNEL'),
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
      username: taiKhoanVar('CHANGE_PWD_USERNAME'),
      password: taiKhoanVar('CHANGE_PWD_PASSWORD'),
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
      username: taiKhoanVar('SSO_NEW_USERNAME'),
      password: taiKhoanVar('SSO_NEW_PASSWORD'),
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

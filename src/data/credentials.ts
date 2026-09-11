import { envVar } from 'qc-kit/config';

/**
 * Tài khoản phải có sẵn trong môi trường đích. Giá trị lấy từ .env (hoặc secret CI) nên
 * không mật khẩu nào bị commit.
 *
 * `company` không phải secret, nhưng vẫn ở .env: mỗi môi trường một mã doanh nghiệp, và
 * mã đó quyết định realm SSO nào được dùng — hardcode là khoá suite vào một tenant.
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

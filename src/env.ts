import { defineEnvironments } from 'qc-kit/config';

/**
 * Bảng môi trường của dự án — file duy nhất biết một URL.
 *
 * Secret thì để trong .env, không bao giờ ở đây. Cách bảng này được đọc (thứ tự ưu tiên
 * process env → .env → bảng) là việc của kit.
 *
 * Trang SSO nằm ở origin khác (`staging-sso.fcam.vn`) và cố tình KHÔNG có mặt ở đây:
 * không kịch bản nào mở thẳng nó, ta chỉ tới đó qua bước 1 của app.
 */
export const environments = defineEnvironments(
  {
    beta: {
      baseURL: 'https://beta-vmsmart-next.fcam.vn',
      timeouts: { action: 20_000, navigation: 45_000, expect: 15_000, test: 90_000 },
    },
  },
  { fallback: 'beta' },
);

/** Cấu hình đã phân giải cho lần chạy này. */
export const config = environments.resolve();

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
      // apiURL KHÔNG khai ở đây — nó đến từ `API_URL` trong .env, xem .env.example.
      //
      // Nếu quên khai: kit lùi `apiURL` về `baseURL`, tức mọi lời gọi API bắn vào host
      // của app. Next.js trả HTML kèm status 200, nên test KHÔNG đỏ — nó đọc được "response",
      // chỉ là response đó là một trang web. Đây là cách hỏng đã tốn của dự án một buổi.
      timeouts: { action: 20_000, navigation: 45_000, expect: 15_000, test: 90_000 },
    },
  },
  { fallback: 'beta' },
);

/** Cấu hình đã phân giải cho lần chạy này. */
export const config = environments.resolve();

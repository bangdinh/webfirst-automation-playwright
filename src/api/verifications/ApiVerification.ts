import { expect } from '@playwright/test';
import { step } from 'qc-kit/core';
import type { ApiResult } from '../ApiResource';

/**
 * Assert lớp vỏ chung của gateway — dùng cho mọi tài nguyên.
 *
 * `code` là tuỳ chọn ở cả hai method, và hai chiều dùng nó khác nhau:
 *
 * - **Lỗi: nên ghim.** `140001` và `140903` phân biệt được hai loại hỏng mà HTTP status gộp
 *   làm một, nên ghim mã là cách duy nhất để test âm kiểm đúng thứ nó định kiểm.
 * - **Thành công: đừng ghim.** `1200` là lỗi phía Dev, đã xác nhận, và sẽ đổi — ghim nó thì
 *   hôm Dev sửa cả loạt test đỏ vì bộ test bám một giá trị ai cũng biết là sai.
 */
export class ApiVerification {
  /**
   * Khẳng định lời gọi thành công VÀ có ruột để đọc tiếp.
   *
   * Gọi nó trước khi chạm vào `result.data`: `data` khai kiểu `T` nhưng response lỗi không
   * có trường đó. Đọc thẳng `.data.name` là nhận "reading name of undefined", che mất mã lỗi
   * thật — thứ duy nhất nói được vì sao hỏng.
   */
  static expectSuccess<T>(
    result: ApiResult<T>,
    expected: { status?: number; code?: number } = {},
  ): Promise<void> {
    return step(`API: thành công${expected.code ? ` code ${expected.code}` : ''}`, async () => {
      const dump = JSON.stringify(result.body);

      if (expected.status) expect(result.status, dump).toBe(expected.status);
      else expect(result.status, dump).toBeLessThan(300);

      if (expected.code) expect(result.code, dump).toBe(expected.code);

      expect(result.data, `response không có "data": ${dump}`).toBeTruthy();
    });
  }

  /**
   * Khẳng định lời gọi hỏng ĐÚNG KIỂU mình mong đợi.
   *
   * Vì sao không assert `status >= 400` cho xong: khoảng 4xx gộp hai chuyện khác hẳn nhau.
   * Một test âm "thiếu trường bắt buộc" mà nhận 403 vì tài khoản thiếu quyền thì vẫn XANH —
   * nó chưa bao giờ chạm tới lớp validate, nhưng report nói đã kiểm xong.
   */
  static expectError(
    result: ApiResult<unknown>,
    expected: { status: number; code?: number; error?: string },
  ): Promise<void> {
    return step(`API: lỗi ${expected.status}${expected.error ? ` ${expected.error}` : ''}`, async () => {
      const dump = JSON.stringify(result.body);

      expect(result.status, dump).toBe(expected.status);
      if (expected.code) expect(result.code, dump).toBe(expected.code);
      if (expected.error) expect(result.message, dump).toBe(expected.error);
    });
  }
}

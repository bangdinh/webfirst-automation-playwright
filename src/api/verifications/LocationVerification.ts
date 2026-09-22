import { expect } from '@playwright/test';
import { step } from 'qc-kit/core';
import type {
  CreateLocationRequest,
  DeleteLocationResponse,
  LocationResponse,
  UpdateLocationRequest,
} from '../models';

/**
 * Assert thuộc về TÀI NGUYÊN — "một địa điểm hợp lệ trông thế nào", thứ mọi test đều cần.
 * Assert của một kịch bản cụ thể thì ở lại spec.
 */
export class LocationVerification {
  static isValidRecord(actual: LocationResponse): Promise<void> {
    return step('Location: bản ghi hợp lệ', async () => {
      expect(actual?.id, 'server phải sinh id').toBeTruthy();
      expect(actual?.name, 'name không được rỗng').not.toBe('');
    });
  }

  /**
   * Nhận payload của CẢ tạo lẫn sửa: cùng một câu hỏi "server có ghi đúng thứ mình gửi
   * không", nên một assert phục vụ cả hai.
   *
   * CHỈ assert `name`: response thật không trả `description` dù request có gửi.
   * Assert một trường server không trả là assert `undefined === "..."` — luôn đỏ, và đỏ vì
   * test hiểu sai hợp đồng chứ không vì sản phẩm sai.
   */
  static matchesRequest(
    actual: LocationResponse,
    request: CreateLocationRequest | UpdateLocationRequest,
  ): Promise<void> {
    return step(`Location: khớp request "${request.name}"`, async () => {
      expect(actual.name).toBe(request.name);
    });
  }

  /**
   * Biên lai xoá phải trỏ ĐÚNG bản ghi mình vừa xoá.
   *
   * Vì sao không dừng ở `status === 200`: response của `DELETE` mang lại chính `id` vừa xoá,
   * nên đối chiếu được. Chỉ assert status thì một lần truyền nhầm `id` sang bản ghi khác vẫn
   * xanh — test báo xoá thành công trong khi nó vừa xoá nhầm thứ khác.
   *
   * Đây vẫn là bằng chứng của SERVER TỰ KHAI, không phải bằng chứng bản ghi đã biến mất.
   * Kiểm mất thật thì phải đọc lại danh sách — `GET /groups`, một endpoint khác, chưa làm.
   */
  static isDeleted(actual: DeleteLocationResponse, expectedId: string): Promise<void> {
    return step(`Location: đã xoá "${expectedId}"`, async () => {
      expect(actual?.deleted, 'biên lai phải trỏ đúng bản ghi vừa xoá').toBe(expectedId);
    });
  }
}

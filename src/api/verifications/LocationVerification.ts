import { expect } from '@playwright/test';
import { step } from 'qc-kit/core';
import type { CreateLocation, Location } from '../models';

/**
 * Assert thuộc về TÀI NGUYÊN — "một địa điểm hợp lệ trông thế nào", thứ mọi test đều cần.
 * Assert của một kịch bản cụ thể thì ở lại spec.
 */
export class LocationVerification {
  static isValidRecord(actual: Location): Promise<void> {
    return step('Location: bản ghi hợp lệ', async () => {
      expect(actual?.id, 'server phải sinh id').toBeTruthy();
      expect(actual?.name, 'name không được rỗng').not.toBe('');
    });
  }

  /**
   * CHỈ assert `name`: response thật không trả `description` dù request có gửi.
   * Assert một trường server không trả là assert `undefined === "..."` — luôn đỏ, và đỏ vì
   * test hiểu sai hợp đồng chứ không vì sản phẩm sai.
   */
  static matchesRequest(actual: Location, request: CreateLocation): Promise<void> {
    return step(`Location: khớp request "${request.name}"`, async () => {
      expect(actual.name).toBe(request.name);
    });
  }
}

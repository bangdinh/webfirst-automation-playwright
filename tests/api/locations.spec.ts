import { test } from '../../src/fixtures';
import {
  ApiVerification,
  LocationRequestHelper,
  LocationsClient,
  LocationVerification,
} from '../../src/api';
import type { Location } from '../../src/api';
import { faker } from '../../src/data/faker';
import { unique } from 'qc-kit/utils';

/**
 * Địa điểm của doanh nghiệp — `brm-v2`.
 *
 * `createClient` cấp context đã mang sẵn `API_URL` làm baseURL và `Authorization: Bearer`
 * lấy từ phiên mà project `setup` đăng nhập bằng UI (xem `src/core/session-token.ts`).
 * Spec không phải biết token ở đâu ra.
 *
 * Gateway bọc mọi response trong lớp vỏ `{ code, message, data }`. `ApiResource` bóc sẵn nên
 * spec đọc thẳng `result.data` — nhưng phải qua `expectSuccess` trước: response lỗi không có
 * `data`, đọc thẳng `.data.name` sẽ nhận "reading name of undefined" và che mất mã lỗi thật.
 */
test.describe('BRM — Địa điểm', () => {
  test('POST tạo địa điểm với dữ liệu hợp lệ @apitest', async ({ createClient }) => {
    const locations = createClient(LocationsClient);
    const payload = LocationRequestHelper.valid({ description: faker.location.streetAddress() });

    const result = await locations.post<Location>(payload);

    await ApiVerification.expectSuccess(result, { status: 200 });
    await LocationVerification.isValidRecord(result.data);
    await LocationVerification.matchesRequest(result.data, payload);
  });

});

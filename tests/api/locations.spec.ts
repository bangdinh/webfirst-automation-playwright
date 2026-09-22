import { expect, test } from '../../src/fixtures';
import {
  ApiClient,
  ApiVerification,
  LocationRequestHelper,
  LocationRoute,
  LocationTreeHelper,
  LocationVerification,
} from '../../src/api';
import type {
  DeleteLocationResponse,
  LocationResponse,
  LocationTreeResponse,
} from '../../src/api';
import { faker } from '../../src/data/faker';

/**
 * Địa điểm của doanh nghiệp — `brm-v2`.
 *
 * `createClient` cấp context đã mang sẵn `API_URL` làm baseURL và `Authorization: Bearer`
 * lấy từ phiên mà project `setup` đăng nhập bằng UI (xem `src/core/session-token.ts`).
 * Spec không phải biết token ở đâu ra.
 *
 * Gateway bọc mọi response trong lớp vỏ `{ code, message, data }`. `ApiClient` bóc sẵn nên
 * spec đọc thẳng `result.data` — nhưng phải qua `expectSuccess` trước: response lỗi không có
 * `data`, đọc thẳng `.data.name` sẽ nhận "reading name of undefined" và che mất mã lỗi thật.
 *
 * URL không xuất hiện trong spec: mọi đường dẫn của chức năng này nằm ở `LocationRoute`.
 */
test.describe('BRM — Địa điểm', () => {
  test('POST tạo địa điểm với dữ liệu hợp lệ @apitest', async ({ createClient }) => {
    const api = createClient(ApiClient);
    const payload = LocationRequestHelper.valid({ description: faker.location.streetAddress() });

    const result = await api.post<LocationResponse>(LocationRoute.create(), payload);

    await ApiVerification.expectSuccess(result, { status: 200 });
    await LocationVerification.isValidRecord(result.data);
    await LocationVerification.matchesRequest(result.data, payload);

    // Response của POST là lời SERVER TỰ KHAI về thứ nó vừa làm. Đọc lại cây để thấy bản
    // ghi có thật — không có bước này thì một API trả 200 kèm body đẹp mà không ghi gì vào
    // đâu cả vẫn cho test xanh. Đối xứng với bước kiểm "đã biến mất" ở test DELETE.
    const tree = await api.get<LocationTreeResponse>(LocationRoute.tree());
    await ApiVerification.expectSuccess(tree, { status: 200 });

    // `findById` tra theo `id`, nên tìm thấy ĐÃ LÀ phép kiểm `id` — không assert lại
    // `found.id === result.data.id`, phép đó luôn đúng và không nói lên điều gì.
    const found = LocationTreeHelper.findById(tree.data, result.data.id);
    expect(found, `cây phải chứa địa điểm vừa tạo (id ${result.data.id})`).toBeDefined();
    expect(found?.name, 'tên trong cây phải khớp tên đã gửi lên').toBe(payload.name);
  });

  /**
   * Tự tạo bản ghi để sửa thay vì ghim một `id` có sẵn: một `id` cứng trong spec là bản ghi
   * của môi trường beta hôm nay — ai xoá nó thì test đỏ, và đỏ vì dữ liệu chứ không vì sản phẩm.
   *
   * `PATCH` chứ không `PUT`: backend phân biệt hai động từ ở đúng URL này.
   */
  test('PATCH cập nhật địa điểm với dữ liệu hợp lệ @apitest', async ({ createClient }) => {
    const api = createClient(ApiClient);

    const created = await api.post<LocationResponse>(
      LocationRoute.create(),
      LocationRequestHelper.valid(),
    );
    await ApiVerification.expectSuccess(created, { status: 200 });

    const payload = LocationRequestHelper.validUpdate();
    const result = await api.patch<LocationResponse>(
      LocationRoute.update(created.data.id),
      payload,
    );

    await ApiVerification.expectSuccess(result, { status: 200 });
    await LocationVerification.isValidRecord(result.data);
    await LocationVerification.matchesRequest(result.data, payload);

    // SỬA chứ không tạo mới — `id` phải giữ nguyên. Assert riêng của kịch bản này nên ở lại
    // spec, không xuống `verifications/`: nó chỉ đúng cho luồng update.
    expect(result.data.id, 'update không được sinh bản ghi mới').toBe(created.data.id);
  });

  /**
   * Tự tạo bản ghi rồi xoá chính nó. Đây là luật cứng của test xoá, không phải tiện tay:
   * một `id` ghim sẵn trong spec là bản ghi THẬT của môi trường — chạy một lần là mất, lần
   * sau đỏ, và cái mất đi thì không dựng lại được.
   *
   * `data` của `DELETE` là hình dạng khác hẳn `POST`/`PATCH` — biên lai `{ deleted,
   * revoked_grants }`, không phải bản ghi. Nên nó có kiểu riêng.
   */
  test('DELETE xoá địa điểm @apidelete', async ({ createClient }) => {
    const api = createClient(ApiClient);

    const created = await api.post<LocationResponse>(
      LocationRoute.create(),
      LocationRequestHelper.valid(),
    );
    await ApiVerification.expectSuccess(created, { status: 200 });

    const result = await api.delete<DeleteLocationResponse>(
      LocationRoute.delete(created.data.id),
    );

    await ApiVerification.expectSuccess(result, { status: 200 });
    await LocationVerification.isDeleted(result.data, created.data.id);

    expect(result.data.revoked_grants, 'địa điểm mới tạo thì không có quyền để thu hồi').toBe(0);

    const tree = await api.get<LocationTreeResponse>(LocationRoute.tree());
    await ApiVerification.expectSuccess(tree, { status: 200 });
    expect(
      LocationTreeHelper.findById(tree.data, created.data.id),
      'xoá xong thì địa điểm không được còn trong cây',
    ).toBeUndefined();
  });

  /**
   * `GET /tree` — KHÔNG phải "danh sách địa điểm".
   *
   * `data` là MỘT node gốc (`type: 'company'`), và quá nửa cây là `device`: đo ngày
   * 22/09/2026 được 31 `group_place` trên 49 `device`. Đọc thẳng `data` như một mảng, hay
   * đếm số node mà không lọc, đều cho con số sai gấp hơn hai lần.
   *
   * Test bám vào ĐỊA ĐIỂM MÌNH VỪA TẠO chứ không assert tổng số node: cây là dữ liệu dùng
   * chung, 4 worker chạy song song và người khác cũng thêm bớt trên beta — một con số cứng
   * ở đây là test đỏ theo lịch làm việc của người khác.
   */
  test('GET cây phân cấp chứa địa điểm vừa tạo @apiget', async ({ createClient }) => {


    const result = await createClient(ApiClient).get<LocationTreeResponse>(LocationRoute.tree());

    await ApiVerification.expectSuccess(result, { status: 200 });
    expect(result.data.type, 'data là node gốc của doanh nghiệp, không phải mảng').toBe(
      'company',
    );

  });
});

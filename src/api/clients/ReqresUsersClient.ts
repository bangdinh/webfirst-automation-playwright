import type { APIResponse } from '@playwright/test';
import { BaseApiClient } from 'qc-kit/api';
import type { CreateReqresUser, ReqresCreated, ReqresSingle, ReqresUser } from '../models';

/**
 * Một tài nguyên API = một client. Method đặt tên theo VIỆC NGHIỆP VỤ nó làm, không theo
 * động từ HTTP — `layNguoiDung(2)` đọc ra ý định, `get('/users/2')` thì không.
 *
 * `BaseApiClient` của kit đã lo: bọc `step()` cho report, gắn `Authorization` khi có token,
 * và ném lỗi kèm status + body khi response không 2xx. Client chỉ khai endpoint và kiểu.
 *
 * Hai kiểu method cho hai mục đích khác nhau:
 *  - `json<T>()` — ném nếu không 2xx, trả thẳng body đã parse. Dùng cho đường hạnh phúc.
 *  - `send(..., { expectOk: false })` — trả `APIResponse` thô, không ném. Dùng cho test âm,
 *    vì ở đó 4xx CHÍNH LÀ kết quả mong đợi.
 *
 * VÍ DỤ CHẠY ĐƯỢC, không phải API sản phẩm. Hai điểm khác biệt cần biết:
 *
 * 1. `basePath` là URL TUYỆT ĐỐI. Client của sản phẩm dùng đường dẫn tương đối (`/users`)
 *    để `baseURL` của project — lấy từ `API_URL` — quyết định môi trường.
 * 2. Spec dựng nó bằng `new` với fixture `request` trần, KHÔNG qua `createClient`.
 *    `createClient` cấp context mang token của sản phẩm; đẩy token đó sang một dịch vụ
 *    bên thứ ba là rò credential.
 */
export class ReqresUsersClient extends BaseApiClient {
  protected override readonly basePath = 'https://reqres.in/api/users';

  layNguoiDung = (id: number) => this.json<ReqresSingle<ReqresUser>>('get', `/${id}`);

  taoNguoiDung = (payload: CreateReqresUser) =>
    this.json<ReqresCreated>('post', '', { data: payload });

  /**
   * Tạo mà KHÔNG ném khi lỗi — dành riêng cho test âm.
   *
   * `unknown` chứ không phải `CreateReqresUser`: test âm cần gửi được payload thiếu trường,
   * sai kiểu, thừa trường. Ép kiểu ở đây thì không viết được test âm nào.
   */
  taoNguoiDungThoiSo = (payload: unknown): Promise<APIResponse> =>
    this.send('post', '', { data: payload, expectOk: false });
}

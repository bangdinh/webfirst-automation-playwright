import { ApiResource } from '../ApiResource';

/**
 * Địa điểm của một doanh nghiệp.
 *
 * **Tên lớp theo UI, đường dẫn theo backend.** Trên giao diện nó là "Địa điểm", còn API
 * gọi là `groups` — hai bên đặt tên khác nhau cho cùng một thứ. Lớp này theo tiếng của
 * sản phẩm vì đó là tiếng người viết test case dùng; `path` giữ nguyên `/groups` vì đó là
 * hợp đồng của backend. Đừng "sửa" `path` cho khớp tên lớp.
 *
 *     POST /brm-v2/api/v1/enterprises/{enterpriseId}/groups
 *
 * Cả class chỉ có một dòng: bốn động từ HTTP nằm ở `ApiResource`, tài nguyên chỉ khai nó
 * sống ở đâu. Thêm một tài nguyên mới = thêm một file ba dòng như thế này.
 *
 * `{enterpriseId}` do `ApiResource` tự điền từ `ENTERPRISE_ID` trong `.env`; muốn gọi sang
 * doanh nghiệp khác thì truyền `{ pathParams: { enterpriseId: '...' } }` ở từng lời gọi.
 */
export class LocationsClient extends ApiResource {
  protected readonly path = '/brm-v2/api/v1/enterprises/{enterpriseId}/groups';
}

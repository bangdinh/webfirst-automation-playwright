/**
 * Mọi URL của chức năng **Địa điểm**. Đây là bản kê endpoint — muốn biết bộ test đang
 * chạm tới những đường dẫn nào của chức năng này thì đọc đúng file này, không phải đi
 * grep khắp spec.
 *
 * **Tên lớp theo UI, đường dẫn theo backend.** Trên giao diện nó là "Địa điểm", còn API
 * gọi là `groups` — hai bên đặt tên khác nhau cho cùng một thứ. Lớp này theo tiếng của
 * sản phẩm vì đó là tiếng người viết test case dùng; chuỗi đường dẫn giữ nguyên `/groups`
 * vì đó là hợp đồng của backend. Đừng "sửa" đường dẫn cho khớp tên lớp.
 *
 * **Hai loại biến trong một URL, hai cơ chế khác nhau — cố ý:**
 *
 * - `{enterpriseId}` để nguyên dạng khuôn. Nó là **cấu hình nền**: giống nhau ở mọi lời
 *   gọi, đọc từ `ENTERPRISE_ID` trong `.env`, và `ApiClient` điền lúc gửi. Bắt spec truyền
 *   nó ở từng lời gọi là bắt mọi test lặp lại một hằng số của môi trường.
 * - `groupId` điền ngay tại đây, đã encode. Nó là **tham số của riêng lời gọi đó**, mỗi
 *   lần một khác, nên nó phải là tham số của hàm.
 */
export class LocationRoute {
  /**
   * Phần gốc dùng chung. `private` nên không ai ghép tay đường dẫn từ bên ngoài được —
   * đó chính là cách prefix này từng bị chép ra nhiều nơi.
   */
  private static readonly ENTERPRISE = '/brm-v2/api/v1/enterprises/{enterpriseId}';

  /**
   * `GET` — cây phân cấp của cả doanh nghiệp.
   *
   * KHÔNG phải "danh sách địa điểm": nó trả một node gốc `type: 'company'` trộn
   * `group_place` lẫn `device`. Lọc bằng `LocationTreeHelper`.
   */
  static tree(): string {
    return `${LocationRoute.ENTERPRISE}/tree`;
  }

  /** `POST` — tạo một địa điểm. */
  static create(): string {
    return `${LocationRoute.ENTERPRISE}/groups`;
  }

  /**
   * `PATCH` — sửa một địa điểm.
   *
   * Trùng chuỗi với `delete()` là CỐ Ý, đừng gộp lại làm một hàm `detail()`. Đổi lại được
   * hai thứ: chỗ gọi đọc ra ý định (`LocationRoute.update(id)` nói nó đang sửa, `detail(id)`
   * thì không), và file này là bản kê đúng một hàm một endpoint. Hôm backend tách đường dẫn
   * sửa khỏi đường dẫn xoá thì chỉ sửa đúng hàm tương ứng.
   *
   * Giá phải trả: hai chuỗi có thể lệch nhau, và **không còn gì chặn ở tầng tĩnh** từ khi
   * bỏ unit test. Sửa một hàm thì đọc lại hàm kia — lệch nhau chỉ lộ ra khi test API đâm
   * vào một URL sai và nhận 404, cách xa nguyên nhân thật.
   */
  static update(groupId: string): string {
    return `${LocationRoute.ENTERPRISE}/groups/${encodeURIComponent(groupId)}`;
  }

  /**
   * `DELETE` — xoá một địa điểm.
   *
   * Hôm nay trùng chuỗi với `update()`; xem JSDoc ở đó để biết vì sao không gộp.
   *
   * Server KHÔNG nhận `GET` ở URL này — header trả về là `allow: PATCH, DELETE, OPTIONS`.
   * Muốn đọc một địa điểm thì đi qua `tree()`.
   */
  static delete(groupId: string): string {
    return `${LocationRoute.ENTERPRISE}/groups/${encodeURIComponent(groupId)}`;
  }
}

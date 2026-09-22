/**
 * Địa điểm (cụm cửa hàng) thuộc một doanh nghiệp — `brm-v2`.
 *
 * Hình dạng lấy từ response THẬT ngày 21/09/2026. Trường nào chưa quan sát được thì CHƯA
 * khai: khai bừa một trường không tồn tại thì `tsc` im lặng cho qua, và test đọc `undefined`
 * mà tưởng server thiếu dữ liệu.
 *
 * **Quy ước tên:** kiểu gửi lên kết thúc bằng `Request`, kiểu nhận về bằng `Response`. Một
 * tài nguyên có hai kiểu gần giống nhau nhưng KHÔNG bằng nhau, nên tên phải nói ngay nó
 * thuộc chiều nào — không thì lúc gọi `post<X>()` chẳng ai biết `X` là payload hay kết quả.
 */

/** Payload lúc tạo. Server sinh `id`, client không gửi lên. */
export interface CreateLocationRequest {
  name: string;
  description: string;
}

/**
 * Bản ghi server trả về trong `data`.
 *
 * Dùng chung cho `POST` và `PATCH`: đã đối chiếu response thật của cả hai (21 và 22/09/2026),
 * `data` giống hệt nhau từng trường. Một kiểu cho cả hai là vì ĐO ĐƯỢC như vậy, không phải
 * vì suy ra từ việc chúng cùng một tài nguyên.
 *
 * CỐ Ý không kế thừa `CreateLocationRequest`: response **không trả `description`** dù
 * request có gửi. Gộp hai kiểu làm một thì `tsc` cho phép đọc `group.description`, nhận
 * `undefined`, và người đọc tưởng server trả về rỗng thay vì hiểu là server không trả
 * trường đó.
 */
export interface LocationResponse {
  id: string;
  name: string;
  parent_group_id: string | null;
}

/**
 * Payload lúc sửa — `PATCH .../groups/{groupId}`.
 *
 * CỐ Ý không alias sang `CreateLocationRequest` dù hôm nay hai kiểu trùng nhau từng trường.
 * Chúng là hợp đồng của hai endpoint khác nhau: ngày backend cho `PATCH` sửa thêm
 * `parent_group_id`, hoặc bỏ `description` khỏi lúc tạo, một alias bắt cả hai đổi theo nhau
 * và endpoint không liên quan đỏ vô cớ.
 *
 * **Cả hai trường đều bắt buộc** dù động từ là `PATCH`. Đó là hình dạng QUAN SÁT ĐƯỢC ngày
 * 22/09/2026 — chưa ai thử gửi payload thiếu trường, nên chưa biết server có nhận không.
 * Khi nào kiểm được thì nới thành optional, đừng nới trước.
 */
export interface UpdateLocationRequest {
  name: string;
  description: string;
}

/**
 * Bản ghi server trả về sau `DELETE .../groups/{groupId}`. Quan sát 22/09/2026.
 *
 * KHÔNG dùng lại `LocationResponse`: `data` của `DELETE` là một hình dạng KHÁC HẲN — không
 * có `id`, `name`, `parent_group_id` nào cả, mà là biên lai của việc xoá. Đây đúng là ca
 * mà quy ước "mỗi endpoint một kiểu" nhắm tới: ba động từ trên cùng một URL, hai hình dạng
 * response.
 */
export interface DeleteLocationResponse {
  /** `id` của bản ghi vừa xoá — server nhắc lại để bên gọi đối chiếu. */
  deleted: string;
  /**
   * Số quyền bị thu hồi kèm theo.
   *
   * Quan sát được `0` trên một địa điểm mới tạo chưa gán cho ai. Chưa đo được ca địa điểm
   * ĐANG có người được phân quyền, nên đừng assert một con số cụ thể ngoài ca đó.
   */
  revoked_grants: number;
}

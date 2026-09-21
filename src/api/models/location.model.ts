/**
 * Địa điểm (cụm cửa hàng) thuộc một doanh nghiệp — `brm-v2`.
 *
 * Hình dạng lấy từ response THẬT ngày 21/09/2026. Trường nào chưa quan sát được thì CHƯA
 * khai: khai bừa một trường không tồn tại thì `tsc` im lặng cho qua, và test đọc `undefined`
 * mà tưởng server thiếu dữ liệu.
 */

/** Payload lúc tạo. Server sinh `id`, client không gửi lên. */
export interface CreateLocation {
  name: string;
  description: string;
}

/**
 * Bản ghi server trả về trong `data`.
 *
 * CỐ Ý không kế thừa `CreateLocation`: response **không trả `description`** dù request có gửi.
 * Gộp hai kiểu làm một thì `tsc` cho phép đọc `group.description`, nhận `undefined`, và
 * người đọc tưởng server trả về rỗng thay vì hiểu là server không trả trường đó.
 */
export interface Location {
  id: string;
  name: string;
  parent_group_id: string | null;
}

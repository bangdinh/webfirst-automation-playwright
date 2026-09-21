/**
 * Kiểu request/response của một tài nguyên.
 *
 * Tách khỏi client vì spec thường cần KIỂU mà không cần client: một helper dựng payload,
 * một verification đọc response. Đây cũng là chỗ duy nhất phải sửa khi API đổi hợp đồng —
 * `tsc` sẽ chỉ ra mọi chỗ vỡ theo.
 *
 * ĐÂY LÀ VÍ DỤ chạy được, dựng trên `reqres.in`. Model của sản phẩm sinh từ collection
 * Bruno — xem `api-collection/README.md`.
 */

/** Bản ghi người dùng mà API trả về. */
export interface ReqresUser {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  avatar: string;
}

/** Response bọc một bản ghi. */
export interface ReqresSingle<T> {
  data: T;
}

/**
 * Payload lúc tạo — CỐ Ý khác `ReqresUser`.
 *
 * Server sinh `id` và `createdAt`, client không được gửi lên. Dùng chung một kiểu cho cả
 * hai chiều là cách bỏ lọt lỗi "gửi thừa trường" mà API im lặng bỏ qua.
 */
export interface CreateReqresUser {
  name: string;
  job: string;
}

/** Response sau khi tạo: echo lại payload kèm hai trường server sinh. */
export interface ReqresCreated extends CreateReqresUser {
  id: string;
  createdAt: string;
}

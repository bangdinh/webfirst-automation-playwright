/**
 * Gateway bọc MỌI response trong một lớp vỏ chung. Quan sát 21/09/2026:
 *
 *     thành công  { "code": 1200,   "message": "OK",               "data": { … } }   HTTP 200
 *     lỗi         { "code": 140001, "error": "VALIDATION_FAILED" }                   HTTP 400
 *     lỗi         { "code": 140303, "error": "RESOURCE_DENIED" }                     HTTP 403
 *     lỗi         { "code": 140903, "error": "NODE_NAME_CONFLICT" }                  HTTP 409
 *
 * Hai hình dạng, một điểm chung là `code`. Nên khai MỘT kiểu phủ cả hai thay vì hai kiểu
 * rời: spec không phải biết trước nó sắp nhận cái nào mới đọc được `code`.
 *
 * **KHÔNG ghim `code` cho response thành công.** `1200` là lỗi phía Dev, đã được xác nhận —
 * nó sẽ đổi. Spec assert `1200` thì hôm Dev sửa, cả loạt test đỏ vì bộ test ghim một giá trị
 * ai cũng biết là sai. Assert HTTP status và sự có mặt của `data` là đủ, và đó là thứ
 * `ApiVerification.expectSuccess` làm mặc định.
 *
 * `code` của response LỖI thì vẫn ghim được: chúng phân biệt được hai loại hỏng mà HTTP
 * status gộp làm một — 403 vì thiếu quyền khác hẳn 403 vì sai doanh nghiệp.
 */
export interface ApiEnvelope<T = unknown> {
  code: number;
  /** Có ở response thành công. */
  message?: string;
  /** Có ở response lỗi — `VALIDATION_FAILED`, `RESOURCE_DENIED`, `NODE_NAME_CONFLICT`… */
  error?: string;
  data?: T;
}

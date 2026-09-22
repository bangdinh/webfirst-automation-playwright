/**
 * Tầng API của dự án, bốn lớp:
 *
 *   routes/         URL của từng chức năng — bản kê endpoint, một class một chức năng
 *   models/         kiểu request/response — hợp đồng với backend
 *   helpers/        dựng payload (kể cả payload SAI) + đọc response có cấu trúc
 *   verifications/  assert thuộc về tài nguyên, bọc `step()` cho report
 *
 * `ApiClient` là phương tiện gửi, dùng chung cho mọi tài nguyên — đường dẫn do `routes/`
 * cấp, nên không có class riêng cho từng tài nguyên nữa.
 *
 * Spec chỉ ghép chúng lại thành kịch bản. Assert riêng của một kịch bản thì ở lại spec;
 * assert "bản ghi hợp lệ trông thế nào" thì xuống `verifications/`.
 */
export * from './ApiClient';
export * from './routes';
export * from './models';
export * from './helpers';
export * from './verifications';

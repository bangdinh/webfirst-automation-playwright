/**
 * Tầng API của dự án, bốn lớp theo đúng khuôn của qc-kit:
 *
 *   models/         kiểu request/response — hợp đồng với backend
 *   clients/        một tài nguyên một class, kế thừa `BaseApiClient`
 *   helpers/        dựng payload, kể cả payload SAI cho test âm
 *   verifications/  assert thuộc về tài nguyên, bọc `step()` cho report
 *
 * Spec chỉ ghép chúng lại thành kịch bản. Assert riêng của một kịch bản thì ở lại spec;
 * assert "bản ghi hợp lệ trông thế nào" thì xuống `verifications/`.
 */
export * from './ApiResource';
export * from './models';
export * from './clients';
export * from './helpers';
export * from './verifications';

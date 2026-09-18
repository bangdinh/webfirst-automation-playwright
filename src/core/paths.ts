import path from 'node:path';

/**
 * Đường dẫn session của dự án.
 *
 * Trước đây nằm trong `qc-kit/config`; đã chuyển về đây vì `playwright/.auth` là quy ước
 * của BỘ TEST NÀY, không phải của kit — dự án khác có thể cache session ở chỗ khác, theo
 * role khác, và kit không nên ép ai vào một cây thư mục.
 */

/** Thư mục chứa session đã cache (đã git-ignore). */
export const AUTH_DIR = path.resolve('playwright/.auth');

/**
 * File session cho một role hoặc một worker. Mỗi người ghi một file riêng để worker chạy
 * song song không tranh nhau một đường dẫn:
 *   storageStatePath()            -> playwright/.auth/user.json
 *   storageStatePath('admin')     -> playwright/.auth/admin.json
 *   storageStatePath('worker-3')  -> playwright/.auth/worker-3.json
 */
export function storageStatePath(role = 'user'): string {
  return path.join(AUTH_DIR, `${role}.json`);
}

/**
 * Session dùng chung. `playwright.config.ts` đưa nó cho mọi project cần đăng nhập và
 * `tests/setup/auth.setup.ts` là thứ DUY NHẤT ghi nó.
 */
export const STORAGE_STATE = storageStatePath('user');

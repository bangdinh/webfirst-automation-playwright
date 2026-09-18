/**
 * Đọc và ghi session trình duyệt đã cache.
 *
 * Đăng nhập qua UI là thứ chậm nhất suite làm, nên nó chạy một lần cho cả lần chạy
 * (`tests/setup/auth.setup.ts`) hoặc, với spec buộc phải tự đăng nhập, một lần mỗi worker
 * (`createAuthFixture`) — không bao giờ một lần mỗi spec file.
 *
 * File này từng ở `qc-kit/core`. Nó về đây cùng với phần còn lại của luồng đăng nhập:
 * cache cookie là chính sách của bộ test, không phải năng lực cắt ngang của kit.
 */
import fs from 'node:fs';
import path from 'node:path';
import type { BrowserContext } from '@playwright/test';
import { envNumber } from 'qc-kit/config';

export type StorageState = Awaited<ReturnType<BrowserContext['storageState']>>;

const EMPTY_STATE: StorageState = { cookies: [], origins: [] };

/** Session đã cache được tin trong bao lâu trước khi đăng nhập lại qua UI. */
export function sessionTtlMs(): number {
  return envNumber('SESSION_TTL_MINUTES', 30) * 60_000;
}

/**
 * True khi `file` giữ một session dùng được — tồn tại, parse được, có ít nhất một cookie,
 * và trẻ hơn TTL. Mọi trường hợp khác nghĩa là "đăng nhập lại".
 */
export function hasFreshSession(file: string, maxAgeMs = sessionTtlMs()): boolean {
  try {
    if (Date.now() - fs.statSync(file).mtimeMs > maxAgeMs) return false;
    const state = JSON.parse(fs.readFileSync(file, 'utf-8')) as Partial<StorageState>;
    return Array.isArray(state.cookies) && state.cookies.length > 0;
  } catch {
    return false;
  }
}

/**
 * Ghi file session một cách atomic.
 *
 * Worker đọc file này trong lúc một worker khác có thể đang refresh nó; ai đọc trúng file
 * JSON dở là hỏng cả lần chạy. Ghi ra file tạm rồi rename nghĩa là mọi người đọc thấy
 * hoặc session cũ, hoặc session mới, không bao giờ thấy bản đứt đoạn.
 */
export function writeSession(file: string, state: StorageState): void {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const tmp = `${file}.${process.pid}.${Date.now()}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(state, null, 2));
  fs.renameSync(tmp, file);
}

/** Chụp một context đang sống vào `file`, atomic. */
export async function saveSession(context: BrowserContext, file: string): Promise<void> {
  writeSession(file, await context.storageState());
}

/** State rỗng để project phụ thuộc vào file vẫn khởi động được. */
export function writeEmptySession(file: string): void {
  writeSession(file, EMPTY_STATE);
}

/** Bỏ một session đã cache — ví dụ sau khi app từ chối nó vì hết hạn. */
export function clearSession(file: string): void {
  fs.rmSync(file, { force: true });
}

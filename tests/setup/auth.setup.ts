/**
 * Nơi duy nhất suite đăng nhập qua UI.
 *
 * Chạy một lần cho cả lần chạy, trước các project cần đăng nhập, và ghi ra session mà
 * tất cả dùng lại — nên không spec nào phải đăng nhập, dù chạy song song bao nhiêu.
 * Session của lần chạy trước được dùng lại tới khi quá SESSION_TTL_MINUTES.
 */
import { createAuthSetup } from 'qc-kit/core';
import { standardUser } from '../../src/data/authenticators';

createAuthSetup(standardUser, { title: 'đăng nhập tài khoản chuẩn' });

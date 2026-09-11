/**
 * Dây nối của dự án: ai đăng nhập, qua màn hình nào.
 *
 * qc-kit biết hợp đồng `Authenticator` và quyết định KHI NÀO đăng nhập, session cache Ở
 * ĐÂU. Chỉ file này biết đăng nhập nghĩa là lái `LoginPage` rồi sang SSO.
 */
import type { AuthenticatorFactory } from 'qc-kit/core';
import { accounts } from './credentials';
import { LoginPage } from '../pages/login/LoginPage';

/** Tài khoản chuẩn, hoặc `null` khi .env chưa được điền. */
export const standardUser: AuthenticatorFactory = (page) => {
  const { company, username, password } = accounts.standard;
  if (!company || !username || !password) return null;
  return new LoginPage(page).withCredentials({ company, username, password });
};

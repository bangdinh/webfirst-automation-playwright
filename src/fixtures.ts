/**
 * Cửa vào duy nhất của spec — mọi spec import từ đây, không import thẳng
 * `@playwright/test`. Nhờ vậy thêm một fixture không phải sửa spec nào.
 *
 * qc-kit cố tình không export sẵn một `test` đã compose: làm vậy thì kit phải nêu tên
 * bảng môi trường, tài khoản và page object của một sản phẩm.
 */
import { mergeTests, expect } from '@playwright/test';
import {
  createApiFixture,
  createDataFixture,
  logFixture,
  pagesFixture,
} from 'qc-kit/fixtures';
import { config } from './env';
import { createAuthFixture, docSessionToken } from './core';
import { standardUser } from './data/authenticators';

export const test = mergeTests(
  pagesFixture,
  // Token của tầng API lấy từ phiên mà project `setup` đã đăng nhập bằng UI — không xin
  // lại từ Keycloak. Hàm chạy MỖI TEST, nên nó luôn đọc token mới nhất trên đĩa.
  createApiFixture({ apiURL: config.apiURL, token: docSessionToken }),
  createDataFixture({
    // Dữ liệu test của dự án: tài khoản, factory, hằng số nghiệp vụ.
    ten: 'giá trị mẫu',
  }),
  createAuthFixture(standardUser, { baseURL: config.baseURL }),
  logFixture,
);

export { expect };

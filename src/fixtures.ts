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
import { createAuthFixture } from './core';
import { standardUser } from './data/authenticators';

export const test = mergeTests(
  pagesFixture,
  createApiFixture({ apiURL: config.apiURL }),
  createDataFixture({
    // Dữ liệu test của dự án: tài khoản, factory, hằng số nghiệp vụ.
    ten: 'giá trị mẫu',
  }),
  createAuthFixture(standardUser, { baseURL: config.baseURL }),
  logFixture,
);

export { expect };

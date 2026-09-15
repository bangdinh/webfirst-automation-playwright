import { definePlaywrightConfig } from 'qc-kit/config';
import { config } from './src/env';
import { STORAGE_STATE } from './src/core';

/**
 * Bố cục project do preset của qc-kit dựng: đăng nhập một lần ở project `setup`, chạy
 * spec đã đăng nhập ở `chromium`, spec `@guest` ở project không có session, spec API
 * ngoài browser. Muốn chỉnh thì dùng option, đừng fork lại preset.
 *
 * `storageState` do dự án truyền vào: preset nối các project với nhau nhưng KHÔNG còn
 * biết session nằm ở đâu — đường dẫn là của bộ test này, xem `src/core/paths.ts`.
 */
export default definePlaywrightConfig({
  env: config,
  storageState: STORAGE_STATE,
  projects: { auth: true, api: false },
});

import { definePlaywrightConfig } from 'qc-kit/config';
import { config } from './src/env';

/**
 * Bố cục project do preset của qc-kit dựng: đăng nhập một lần ở project `setup`, chạy
 * spec đã đăng nhập ở `chromium`, spec `@guest` ở project không có session, spec API
 * ngoài browser. Muốn chỉnh thì dùng option, đừng fork lại preset.
 */
export default definePlaywrightConfig({
  env: config,
  projects: { auth: true, api: false },
});

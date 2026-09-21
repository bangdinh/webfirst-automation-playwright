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
const cauHinh = definePlaywrightConfig({
  env: config,
  storageState: STORAGE_STATE,
  projects: { auth: true, api: true, unit: true },
});

/**
 * Preset nối `setup → chromium` nhưng KHÔNG nối `setup → api`, và đúng như vậy: không phải
 * bộ test nào cũng lấy token API từ một phiên đăng nhập bằng UI.
 *
 * Bộ test NÀY thì lấy — token của tầng API chính là cookie `session_token` của phiên đó,
 * xem `src/core/session-token.ts`. Nối thêm ở đây chứ không sửa preset: "API dùng token của
 * phiên UI" là chính sách của MỘT bộ test, không phải năng lực cắt ngang của kit.
 */
const api = cauHinh.projects?.find((p) => p.name === 'api');
if (api) api.dependencies = [...(api.dependencies ?? []), 'setup'];

export default cauHinh;

import { test } from '../../../src/fixtures';
import { LivePage } from '../../../src/pages/live/LivePage';
import { DeviceManagementPage } from '../../../src/pages/device/DeviceManagementPage';

/**
 * Điều hướng sang tab Quản lý.
 *
 * Precondition "đã đăng nhập" KHÔNG viết trong file này: project `chromium` nạp sẵn
 * session do project `setup` ghi ra, nên spec mở lên là đã đăng nhập. Đăng nhập trong
 * `beforeEach` sẽ chạy lại ở từng spec file và tranh nhau cùng một file session.
 */
test.describe('Quản lý thiết bị', () => {
  test('kiểm tra switch sang tab Quản Lý thành công @smoke @device-management', async ({ createPage }) => {
    const live = createPage(LivePage);
    const quanLy = createPage(DeviceManagementPage);

    await live.open();
    await live.waitUntilLoaded();

    await live.nav.moQuanLy();

    await quanLy.expectLoaded();
  });

  test('kiểm tra switch sang tab Quản Lý thành công 2 @smoke @device-management', async ({ createPage }) => {
    const live = createPage(LivePage);
    const quanLy = createPage(DeviceManagementPage);

    await live.open();
    await live.waitUntilLoaded();

    await live.nav.moQuanLy();

    await quanLy.expectLoaded();
  });
});

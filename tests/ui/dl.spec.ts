import { test } from '../../src/fixtures';
import { DeviceManagementPage } from '../../src/pages/devicemanagementpage/DeviceManagementPage';

/**
 * Sinh từ `Device_Management_TestCase_v1.0.0.json` — nhóm id `DL` (danh sách & bộ lọc).
 *
 * 6/7 case nhóm DL không sinh được — xem báo cáo cuối lần chạy skill.
 */
test.describe('Danh sách thiết bị', () => {
  // DL1.0 — expected là "Theo design": kiểm thị giác, không phải assertion chức năng.
  test.fixme('DL1.0 Kiểm tra design @low', async ({ createPage }) => {
    const trang = createPage(DeviceManagementPage);

    // step 1 — navigate: "Vào màn Quản lý > Thiết bị > tab Thiết bị"
    await trang.open();

    // step 2 — verify: "Quan sát giao diện tổng thể"  ->  expected "Theo design"
    await trang.waitUntilLoaded();
  });
});

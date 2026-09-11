import { expect, test } from '../../../src/fixtures';
import { DeviceManagementPage } from '../../../src/pages/device/DeviceManagementPage';
import { LivePage } from '../../../src/pages/live/LivePage';

/**
 * Thanh điều hướng chính (`Header`) — component dùng chung, không thuộc màn hình nào.
 *
 * Chiều `Giám sát → Quản lý` đã có ở `tests/ui/device/device-management.spec.ts`; ở đây
 * kiểm chiều ngược lại, vì một thanh nav chỉ đi được một chiều vẫn là nav hỏng.
 */
test.describe('Thanh điều hướng', () => {
  test('từ Quản lý quay lại được Giám sát @smoke @header', async ({ createPage, page }) => {
    const quanLy = createPage(DeviceManagementPage);
    const giamSat = createPage(LivePage);

    await quanLy.open();
    await quanLy.waitUntilLoaded();

    await quanLy.nav.moGiamSat();

    await giamSat.waitUntilLoaded();
    await expect(page).toHaveURL(/\/live/);
  });
});

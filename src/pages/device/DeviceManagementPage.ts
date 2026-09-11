import { expect } from '@playwright/test';
import { BasePage } from 'qc-kit/core';
import { AddDeviceDialog } from '../../components/AddDeviceDialog';
import { Header } from '../header/Header';

/**
 * Màn hình `Quản lý` — danh sách thiết bị, tại `/vi/devices`.
 */
export class DeviceManagementPage extends BasePage {
  protected override readonly path = '/vi/devices';

  readonly nav = new Header(this.page);

  /**
   * TẠM THỜI: bắt theo tên hiển thị — trang chưa có `data-testid` nào.
   * Chờ Dev gắn `data-testid="device-add-btn"`.
   *
   * Nút này là `ant-dropdown-trigger`: bấm vào mở menu chứ không sang trang mới. Test
   * hiện tại chỉ khẳng định nó bấm được, chưa mở menu.
   */
  readonly themThietBi = this.page.getByRole('button', { name: 'Thêm thiết bị' });

  // --- sinh từ JSON test case (TB1.0, DL1.0) -----------------------------
  // `add_device_menu` và `device_list_page` trong JSON đều là màn hình này; không tạo
  // class thứ hai cho cùng một màn hình.

  /**
   * Menu "Chọn phương thức thêm" mở ra sau khi bấm nút thêm.
   *
   * LOCATOR-TBD: expected của TB1.0 step 2 — lấy locator thật từ DOM, xem skill qc-flow.
   * Nút thêm là `ant-dropdown-trigger` nên menu này là dropdown của AntD; cần mở app,
   * bấm nút, rồi đọc DOM của menu đang hiện.
   */
  readonly menuPhuongThucThem = this.page.getByTestId('LOCATOR-TBD-chon-phuong-thuc-them');

  /** Dialog thêm thiết bị — `screen: "add_device_dialog"` trong JSON (TB2.0). */
  readonly dialogThemThietBi = new AddDeviceDialog(this.page);

  override async waitUntilLoaded(): Promise<void> {
    await expect(this.themThietBi).toBeVisible();
  }

  /** TB1.0 step 2 — bấm nút thêm để mở menu chọn phương thức. */
  async moMenuThemThietBi(): Promise<void> {
    await this.step('mở menu chọn phương thức thêm', async () => {
      await this.clickWhenReady(this.themThietBi);
    });
  }

  /**
   * Đã ở đúng màn hình Quản lý và màn hình dùng được.
   *
   * `toBeEnabled()` là cách Playwright diễn đạt "clickable": nút hiện hữu, không
   * `disabled`, và không bị `aria-disabled`. Không có matcher `toBeClickable` — chờ được
   * `toBeEnabled` rồi thì auto-waiting của Playwright lo phần còn lại lúc click thật.
   */
  async expectLoaded(): Promise<void> {
    await expect(this.page).toHaveURL(/\/devices/);
    await expect(this.themThietBi).toBeVisible();
    await expect(this.themThietBi).toBeEnabled();
  }
}

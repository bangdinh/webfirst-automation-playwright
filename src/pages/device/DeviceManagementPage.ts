import { expect } from '@playwright/test';
import { BasePage } from 'qc-kit/core';
import { AddDeviceDialog } from '../../components/AddDeviceDialog';
import { Header } from '../header/Header';

/**
 * Màn hình `Quản lý` — danh sách thiết bị, tại `/vi/devices`.
 *
 * `screen: "add_device_menu"` và `screen: "device_list_page"` trong JSON test case đều là
 * màn hình này; không tạo class thứ hai cho cùng một màn hình.
 *
 * Trang **không có `data-testid` nào** (đã đếm trên DOM thật: 0). Mọi locator dưới đây vì
 * thế ở bậc 3–4 của thang ưu tiên và đều ghi `TẠM THỜI` kèm testid đang chờ Dev.
 */
export class DeviceManagementPage extends BasePage {
  protected override readonly path = '/vi/devices';

  readonly nav = new Header(this.page);

  /**
   * TẠM THỜI: `getByRole` + tên hiển thị. Đã kiểm trên DOM thật — khớp đúng 1 phần tử,
   * nên không có nguy cơ strict mode violation.
   * Chờ Dev gắn `data-testid="device-them-thiet-bi"`.
   *
   * Nút này là `ant-dropdown-trigger`: bấm vào mở menu chứ không sang trang mới.
   */
  readonly themThietBi = this.page.getByRole('button', { name: 'Thêm thiết bị' });

  /**
   * Menu "Chọn phương thức thêm" — dropdown của AntD, render trong portal ở `body` nên
   * KHÔNG nằm trong cây con của màn hình này.
   *
   * Đã kiểm trên DOM thật: `role=menu` đếm 0 khi chưa mở, 1 khi đã mở, 0 sau `Escape` —
   * menu bị tháo hẳn khỏi DOM. Nhờ vậy `toBeVisible()` ở đây là assertion thật, không
   * phải một node rỗng luôn tồn tại.
   *
   * TẠM THỜI: chờ Dev gắn `data-testid="device-chon-phuong-thuc-them-menu"`.
   */
  readonly menuPhuongThucThem = this.page.getByRole('menu');

  /**
   * Hai lựa chọn trong menu. Phần tử thứ nhất của menu là một dòng tiêu đề
   * `aria-disabled="true"` ("Chọn phương thức thêm"), không bấm được — nên "2 lựa chọn"
   * trong test case là hai dòng dưới đây, không phải ba `menuitem`.
   *
   * TẠM THỜI: chờ `data-testid="device-them-thu-cong-btn"` và
   * `data-testid="device-tai-len-excel-btn"`.
   */
  readonly themThuCong = this.page.getByRole('menuitem', { name: 'Thêm thủ công' });
  readonly taiLenExcel = this.page.getByRole('menuitem', {
    name: 'Tải lên tệp Microsoft Excel',
  });

  /** Dialog thêm thiết bị — `screen: "add_device_dialog"` trong JSON (TB2.0). */
  readonly dialogThemThietBi = new AddDeviceDialog(this.page);

  override async waitUntilLoaded(): Promise<void> {
    await expect(this.themThietBi).toBeVisible();
  }

  /**
   * DT1 — bấm nút thêm để mở menu chọn phương thức.
   *
   * Nút render xong **trước khi** React gắn handler, nên một cú click sớm rơi vào hư
   * không và auto-waiting không thấy được: đo trên app thật 4 lần thì chỉ 1 lần mở được.
   * `toPass` bấm lại cho tới khi menu thật sự mở — đo lại 4/4, mất 0,2–1,4s.
   *
   * Đây KHÔNG phải `waitForTimeout` trá hình: nó thoát ngay khi menu mở, và khi hỏng thật
   * thì báo đúng assertion cuối cùng chứ không phải một timeout vô danh.
   */
  async moMenuThemThietBi(): Promise<void> {
    await this.step('mở menu chọn phương thức thêm', async () => {
      await expect(async () => {
        await this.clickWhenReady(this.themThietBi);
        await expect(this.menuPhuongThucThem).toBeVisible({ timeout: 1_000 });
      }).toPass({ timeout: 15_000 });
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

  /** `TB1.3`/`DT2` — chọn "Thêm thủ công" trong menu vừa mở. */
  async chonThemThuCong(): Promise<void> {
    await this.step('chọn Thêm thủ công', async () => {
      await this.clickWhenReady(this.themThuCong);
    });
  }

  /** `TB1.4`/`DT3` — chọn "Tải lên tệp Microsoft Excel" trong menu vừa mở. */
  async chonTaiLenExcel(): Promise<void> {
    await this.step('chọn Tải lên tệp Microsoft Excel', async () => {
      await this.clickWhenReady(this.taiLenExcel);
    });
  }
  /** Expected của DT1: menu hiện ra, gồm đúng hai lựa chọn. */
  async expectMenuPhuongThucThem(): Promise<void> {
    await expect(this.menuPhuongThucThem).toBeVisible();
    await expect(this.themThuCong).toBeVisible();
    await expect(this.taiLenExcel).toBeVisible();
  }
}

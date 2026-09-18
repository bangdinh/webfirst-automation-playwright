import { type Locator, type Page } from '@playwright/test';
import { BaseComponent } from 'qc-kit/core';

/**
 * Panel điều hướng trái — xuất hiện trên mọi màn trong khu vực `Quản lý`.
 *
 * Là component vì nó không thuộc riêng màn hình nào: đứng ở `Nhóm & Nhân viên` cũng bấm
 * được sang `Vai trò` và ngược lại. Khai nó một lần ở đây thay vì lặp locator trong từng
 * page object — cùng một phần tử khai hai chỗ thì hôm Dev đổi UI sẽ sửa một chỗ và quên
 * chỗ kia.
 *
 * Root là `role=navigation`. **Bắt buộc thu hẹp qua root này**: banner cũng có một link
 * tên "Quản lý" (`Header.quanLy`), không thu hẹp thì khớp 2 phần tử và Playwright ném
 * strict mode violation. Trùng tên không phải trùng phần tử.
 *
 * Trang không có `data-testid` nào (đã đếm trên DOM thật: 0) nên mọi locator ở bậc 4 của
 * thang ưu tiên, đều `TẠM THỜI`.
 */
export class SidePanel extends BaseComponent {
  constructor(page: Page, root: Locator = page.getByRole('navigation')) {
    super(page, root);
  }

  /** TẠM THỜI: chờ Dev gắn `data-testid="side-panel-quan-ly"`. */
  readonly quanLy = this.root.getByRole('link', { name: 'Quản lý', exact: true });

  /** TẠM THỜI: chờ Dev gắn `data-testid="side-panel-nhom-va-nhan-vien"`. */
  readonly nhomVaNhanVien = this.root.getByRole('link', {
    name: 'Nhóm & Nhân viên',
    exact: true,
  });

  /** TẠM THỜI: chờ Dev gắn `data-testid="side-panel-vai-tro"`. */
  readonly vaiTro = this.root.getByRole('link', { name: 'Vai trò', exact: true });

  /** Vào khu vực Quản lý. App đưa thẳng tới `/vi/authz/groups/accounts`. */
  async moQuanLy(): Promise<void> {
    await this.step('mở menu Quản lý ở panel trái', async () => {
      await this.clickWhenReady(this.quanLy);
    });
  }

  async moNhomVaNhanVien(): Promise<void> {
    await this.step('mở Nhóm & Nhân viên', async () => {
      await this.clickWhenReady(this.nhomVaNhanVien);
    });
  }

  async moVaiTro(): Promise<void> {
    await this.step('mở Vai trò', async () => {
      await this.clickWhenReady(this.vaiTro);
    });
  }
}

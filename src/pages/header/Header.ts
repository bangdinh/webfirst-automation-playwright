import { type Locator, type Page } from '@playwright/test';
import { BaseComponent } from 'qc-kit/core';

/**
 * Thanh điều hướng chính ở đầu trang — xuất hiện trên mọi màn hình sau khi đăng nhập.
 *
 * Là component chứ không phải page object vì nó không thuộc riêng màn hình nào: đứng ở
 * `Giám sát` cũng bấm được sang `Quản lý` và ngược lại.
 *
 * Root là `role=banner` (thẻ `<header>`) — đã kiểm trên app thật: khớp đúng 1 phần tử, và
 * chứa hai link `Giám sát`, `Quản lý`. Trang có 3 thẻ `<header>` nên KHÔNG được dùng
 * `page.locator('header')`, sẽ dính strict mode violation.
 */
export class Header extends BaseComponent {
  constructor(page: Page, root: Locator = page.getByRole('banner')) {
    super(page, root);
  }

  /**
   * TẠM THỜI: bắt theo tên hiển thị vì trang chưa có `data-testid` nào (đếm được 0).
   * Chờ Dev gắn `data-testid="nav-monitoring"` / `"nav-management"` rồi đổi lại — spec
   * không phải sửa, vì nó chỉ gọi method của component.
   */
  readonly giamSat = this.root.getByRole('link', { name: 'Giám sát', exact: true });
  readonly quanLy = this.root.getByRole('link', { name: 'Quản lý', exact: true });

  /** Sang tab Quản lý. App điều hướng tới `/vi/devices`. */
  async moQuanLy(): Promise<void> {
    await this.step('sang tab Quản lý', async () => {
      await this.clickWhenReady(this.quanLy);
    });
  }

  async moGiamSat(): Promise<void> {
    await this.step('sang tab Giám sát', async () => {
      await this.clickWhenReady(this.giamSat);
    });
  }
}

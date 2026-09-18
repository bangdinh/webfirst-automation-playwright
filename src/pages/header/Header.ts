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

  // LOCATOR-TBD: tên tài khoản / avatar ở góc trên bên phải (AUTH6.0 step 1)
  readonly taiKhoan = this.root.locator('//span[@aria-label="taipm7@fpt.com"]');

  // LOCATOR-TBD: dòng "Đăng xuất" trong menu tài khoản (AUTH6.0 step 2).
  // Menu mở ra có thể nằm NGOÀI `root` (portal), nên locator này neo vào `page` chứ không
  // vào `root` — bước 3 xác minh lại.
  readonly dangXuat = this.page.getByTestId('shell-logout-link');

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

  /**
   * AUTH6.0 · AUTH6.1 — mở menu tài khoản rồi chọn "Đăng xuất".
   *
   * Hai step của case gộp thành MỘT method vì chúng là một ý định duy nhất: người dùng
   * không "bấm avatar" như một mục tiêu riêng, họ bấm để tới được dòng Đăng xuất. Tách
   * làm hai lời gọi trần trong spec thì mỗi spec lại phải nhớ thứ tự.
   *
   * Không tự bấm "Đồng ý": xác nhận là hộp thoại riêng, và chính nó mới là chỗ hai case
   * rẽ nhánh. Xem `LogoutConfirmDialog`.
   */
  async chonDangXuat(): Promise<void> {
    await this.step('mở menu tài khoản và chọn Đăng xuất', async () => {
      await this.clickWhenReady(this.taiKhoan);
      await this.clickWhenReady(this.dangXuat);
    });
  }
}

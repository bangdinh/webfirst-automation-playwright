import { type Locator, type Page } from '@playwright/test';
import { BaseComponent } from 'qc-kit/core';

/**
 * Hộp thoại xác nhận đăng xuất — hiện sau khi chọn "Đăng xuất" trong menu tài khoản.
 *
 * Là `BaseComponent` chứ không phải `BasePage`: nó mở đè lên màn hình đang đứng và không
 * có URL riêng. `BasePage` bắt phải khai `path`, mà một `path` bịa còn tệ hơn locator bịa.
 *
 * Hai lối ra của hộp thoại là HAI case khác nhau (AUTH6.0 đồng ý, AUTH6.1 huỷ) nên cả hai
 * nút đều là locator riêng, không gộp.
 *
 * TẠM THỜI: chưa có locator thật nào — toàn bộ `LOCATOR-TBD` phải lấy từ DOM ở bước 3.
 */
export class LogoutConfirmDialog extends BaseComponent {
  constructor(page: Page, root: Locator = page.getByTestId('LOCATOR-TBD-logout-dialog')) {
    super(page, root);
  }

  // LOCATOR-TBD: nút "Đồng ý" trong hộp thoại (AUTH6.0 step 3)
  readonly dongY = this.root.getByTestId('LOCATOR-TBD-logout-confirm-btn');

  // LOCATOR-TBD: nút "Huỷ" trong hộp thoại (AUTH6.1 step 3)
  readonly huy = this.root.getByTestId('LOCATOR-TBD-logout-cancel-btn');

  async xacNhanDangXuat(): Promise<void> {
    await this.step('xác nhận đăng xuất', async () => {
      await this.clickWhenReady(this.dongY);
    });
  }

  async huyDangXuat(): Promise<void> {
    await this.step('huỷ đăng xuất', async () => {
      await this.clickWhenReady(this.huy);
    });
  }

  /*
   * `expectVisible()` và `expectHidden()` KHÔNG khai ở đây: `BaseComponent` của kit đã có
   * cả hai, làm đúng việc cần làm. Viết lại chúng là dựng lại thứ đã có — và là hai chỗ
   * phải sửa khi kit đổi.
   */
}

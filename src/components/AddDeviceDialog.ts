import { type Locator, type Page } from '@playwright/test';
import { BaseComponent } from 'qc-kit/core';

/**
 * Dialog "Thêm thiết bị" — sinh từ `screen: "add_device_dialog"` (case TB2.0).
 *
 * Là component chứ không phải page object, dù JSON gọi nó là `screen`: dialog mở đè lên
 * màn danh sách và **không có URL riêng**. Dựng nó thành `BasePage` thì phải bịa ra một
 * `path`, mà `path` bịa còn tệ hơn locator bịa — nó khiến `open()` điều hướng đi đâu đó.
 *
 * Toàn bộ locator dưới đây chưa có. Lấy locator thật theo skill `qc-flow` rồi xoá marker.
 */
export class AddDeviceDialog extends BaseComponent {
  constructor(page: Page, root: Locator = page.getByTestId('LOCATOR-TBD-add-device-dialog')) {
    // LOCATOR-TBD: root của dialog (TB2.0 step 1) — lấy locator thật từ DOM, xem skill qc-flow
    super(page, root);
  }
}

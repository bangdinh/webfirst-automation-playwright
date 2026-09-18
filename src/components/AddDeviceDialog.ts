import { expect } from '@playwright/test';
import { type Locator, type Page } from '@playwright/test';
import { BaseComponent } from 'qc-kit/core';

/**
 * Dialog "Thêm thiết bị" — `TB1.3`/`TB1.4` và `DT2`/`DT3`.
 *
 * Là component chứ không phải page object: dialog mở đè lên màn danh sách và **không có
 * URL riêng**.
 *
 * **Hai biến thể dùng CHUNG một tiêu đề** "Thêm thiết bị" (`.ant-modal-title`), nên tiêu
 * đề không phân biệt được chúng. Đã đo trên DOM thật:
 *
 * | | Thêm thủ công | Tải lên Excel |
 * |---|---|---|
 * | `input[type=file]` | 0 | 1 |
 * | textbox | 1 | 0 |
 * | nút riêng | "Xác nhận và thêm" | "Kéo thả hoặc chọn tệp .xlsx" |
 *
 * Vì vậy hai `expect…` bên dưới assert đúng cái dấu hiệu riêng của từng biến thể, không
 * chỉ assert "có một dialog".
 */
export class AddDeviceDialog extends BaseComponent {
  constructor(page: Page, root: Locator = page.getByRole('dialog')) {
    super(page, root);
  }

  /**
   * TẠM THỜI: `.ant-modal-title` là class của AntD, không phải class team tự đặt — dùng vì
   * dialog không có `heading` nào. Chờ Dev gắn `data-testid="add-device-dialog-title"`.
   */
  readonly tieuDe = this.root.locator('.ant-modal-title');

  /** Dấu hiệu riêng của biến thể nhập tay. TẠM THỜI: chờ `data-testid="add-device-manual-submit"`. */
  readonly xacNhanVaThem = this.root.getByRole('button', {
    name: 'Xác nhận và thêm',
    exact: true,
  });

  /** Dấu hiệu riêng của biến thể tải tệp. TẠM THỜI: chờ `data-testid="add-device-upload-zone"`. */
  readonly khuVucTaiTep = this.root.getByRole('button', {
    name: 'Kéo thả hoặc chọn tệp .xlsx',
    exact: true,
  });

  /** Input file thật nằm sau khu vực kéo thả — dùng `setInputFiles()` khi cần tải tệp. */
  readonly inputTep = this.root.locator('input[type="file"]');

  /** Chú ý chính tả: dialog này dùng "Huỷ", khác "Hủy" của popup Thêm vai trò. */
  readonly huy = this.root.getByRole('button', { name: 'Huỷ', exact: true });

  readonly xacNhan = this.root.getByRole('button', { name: 'Xác nhận', exact: true });

  /** Dialog hiện ra, ở biến thể **nhập thủ công**. */
  async expectFormThuCong(): Promise<void> {
    await expect(this.root).toBeVisible();
    await expect(this.tieuDe).toHaveText('Thêm thiết bị');
    await expect(this.xacNhanVaThem).toBeVisible();
    await expect(this.inputTep).toHaveCount(0);
  }

  /** Dialog hiện ra, ở biến thể **tải tệp Excel**. */
  async expectKhuVucTaiTep(): Promise<void> {
    await expect(this.root).toBeVisible();
    await expect(this.tieuDe).toHaveText('Thêm thiết bị');
    await expect(this.khuVucTaiTep).toBeVisible();
    await expect(this.inputTep).toHaveCount(1);
  }

  async huyBo(): Promise<void> {
    await this.step('bấm Huỷ trên dialog Thêm thiết bị', async () => {
      await this.clickWhenReady(this.huy);
    });
  }
}

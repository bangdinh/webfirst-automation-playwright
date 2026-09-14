import { expect } from '@playwright/test';
import { type Locator, type Page } from '@playwright/test';
import { BaseComponent } from 'qc-kit/core';

/**
 * Popup "Thêm vai trò" — `Manage_TC_002` step 6–8.
 *
 * Là component chứ không phải page object: nó mở đè lên màn Vai trò và **không có URL
 * riêng** (URL giữ nguyên `/vi/authz/roles` khi popup mở).
 *
 * Đã kiểm trên DOM thật: `role=dialog` đếm 0 khi chưa mở, 1 khi mở, và **0 sau khi bấm
 * Hủy** — dialog bị tháo hẳn khỏi DOM. Nhờ vậy `toBeVisible()` và `toHaveCount(0)` ở đây
 * là assertion thật, không phải một node rỗng luôn tồn tại.
 */
export class AddRoleDialog extends BaseComponent {
  constructor(page: Page, root: Locator = page.getByRole('dialog')) {
    super(page, root);
  }

  /**
   * TẠM THỜI: `.ant-modal-title` là class của AntD, không phải class team tự đặt — bậc
   * thấp của thang ưu tiên, dùng vì dialog không có `heading` nào.
   * Chờ Dev gắn `data-testid="add-role-dialog-title"`.
   */
  readonly tieuDe = this.root.locator('.ant-modal-title');

  /** TẠM THỜI: chờ Dev gắn `data-testid="add-role-dialog-cancel-btn"`. */
  readonly huy = this.root.getByRole('button', { name: 'Hủy', exact: true });

  /** TẠM THỜI: chờ Dev gắn `data-testid="add-role-dialog-confirm-btn"`. */
  readonly xacNhan = this.root.getByRole('button', { name: 'Xác nhận', exact: true });

  /** Step 7: popup hiện ra, và đúng là popup Thêm vai trò chứ không phải dialog nào khác. */
  async expectDangHien(): Promise<void> {
    await expect(this.root).toBeVisible();
    await expect(this.tieuDe).toHaveText('Thêm vai trò');
  }

  /** Step 8: bấm Hủy. */
  async huyBo(): Promise<void> {
    await this.step('bấm Hủy trên popup Thêm vai trò', async () => {
      await this.clickWhenReady(this.huy);
    });
  }

  /** Expected của step 8: popup không còn hiển thị — nó bị tháo khỏi DOM. */
  async expectDaDong(): Promise<void> {
    await expect(this.root).toHaveCount(0);
  }
}

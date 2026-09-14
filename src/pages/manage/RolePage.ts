import { expect } from '@playwright/test';
import { BasePage } from 'qc-kit/core';
import { AddRoleDialog } from '../../components/AddRoleDialog';
import { SidePanel } from '../../components/SidePanel';
import { Header } from '../header/Header';

/**
 * Màn `Quản lý > Phân quyền > Vai trò`, tại `/vi/authz/roles`.
 *
 * Sinh từ `testcase/Manage_TestCase_v1.0.0.json` (`Manage_TC_002`).
 *
 * Class riêng chứ không gộp vào `ManagePage`: hai màn nằm ở **hai route khác nhau**
 * (`/vi/authz/roles` với `/vi/authz/groups/accounts`), gộp thì một `path` sẽ trỏ sai một
 * trong hai.
 *
 * Trang không có `data-testid` nào (đã đếm trên DOM thật: 0).
 */
export class RolePage extends BasePage {
  protected override readonly path = '/vi/authz/roles';

  readonly nav = new Header(this.page);
  readonly panel = new SidePanel(this.page);

  /**
   * "Phân quyền" — nút gập/mở accordion của panel trái, đã mở sẵn (`aria-expanded="true"`).
   * Bấm vào sẽ ĐÓNG section và làm mất luôn link "Vai trò".
   *
   * TẠM THỜI: chờ Dev gắn `data-testid="manage-phan-quyen-toggle"`.
   */
  readonly phanQuyen = this.page.getByRole('button', { name: 'Phân quyền', exact: true });

  /** TẠM THỜI: chờ Dev gắn `data-testid="role-them-vai-tro-btn"`. */
  readonly themVaiTro = this.page.getByRole('button', { name: 'Thêm vai trò', exact: true });

  readonly dialogThemVaiTro = new AddRoleDialog(this.page);

  override async waitUntilLoaded(): Promise<void> {
    await expect(this.themVaiTro).toBeVisible();
  }

  /** Step 3: section "Phân quyền" đang mở sẵn — trạng thái, không phải thao tác. */
  async expectPhanQuyenDangMo(): Promise<void> {
    await expect(this.phanQuyen).toHaveAttribute('aria-expanded', 'true');
    await expect(this.panel.vaiTro).toBeVisible();
  }

  /** Expected của step 5: "Button Thêm vai trò clickable" — assertion, KHÔNG bấm. */
  async expectThemVaiTroClickable(): Promise<void> {
    await expect(this.themVaiTro).toBeVisible();
    await expect(this.themVaiTro).toBeEnabled();
  }

  /** Step 6: bấm nút để mở popup. */
  async moPopupThemVaiTro(): Promise<void> {
    await this.step('mở popup Thêm vai trò', async () => {
      await this.clickWhenReady(this.themVaiTro);
    });
  }
}

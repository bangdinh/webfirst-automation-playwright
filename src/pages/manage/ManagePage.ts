import { expect } from '@playwright/test';
import { BasePage } from 'qc-kit/core';
import { SidePanel } from '../../components/SidePanel';
import { Header } from '../header/Header';

/**
 * Màn `Quản lý > Phân quyền > Nhóm & Nhân viên`, tại `/vi/authz/groups/accounts`.
 *
 * Sinh từ `testcase/Manage_TestCase_v1.0.0.json` (`Manage_TC_001`). Vị trí file theo
 * `docs/test-structure.md` mục 4.
 *
 * Trang **không có `data-testid` nào** (đã đếm trên DOM thật: 0), nên mọi locator ở bậc 4
 * của thang ưu tiên và đều ghi `TẠM THỜI` kèm testid đang chờ Dev.
 */
export class ManagePage extends BasePage {
  /**
   * Đã xác minh trên app thật. **Không phải `/vi/groups`** — đường đó trả 404; nó là
   * `href` của link panel trái, còn route thật sau khi điều hướng là đường này.
   */
  protected override readonly path = '/vi/authz/groups/accounts';

  readonly nav = new Header(this.page);

  /**
   * Panel trái là component dùng chung với `RolePage` — khai một lần ở `SidePanel`, không
   * lặp locator ở từng page object.
   */
  readonly panel = new SidePanel(this.page);

  /**
   * "Phân quyền" (step 3) — **nút gập/mở accordion**, không phải bước điều hướng.
   *
   * Đã đo trên app thật: sau step 2 nó đã ở trạng thái `aria-expanded="true"`. Bấm vào nó
   * sẽ **đóng** section — panel trái rụng từ 8 mục xuống 5 và "Nhóm & Nhân viên" biến mất.
   * Vì vậy step 3 được kiểm bằng `expectPhanQuyenDangMo()`, không phải một cú bấm.
   *
   * TẠM THỜI: chờ Dev gắn `data-testid="manage-phan-quyen-toggle"`.
   */
  readonly phanQuyen = this.page.getByRole('button', { name: 'Phân quyền', exact: true });

  /**
   * "Thêm nhân viên" (step 5).
   * TẠM THỜI: chờ Dev gắn `data-testid="manage-them-nhan-vien-btn"`.
   */
  readonly themNhanVien = this.page.getByRole('button', { name: 'Thêm nhân viên', exact: true });

  override async waitUntilLoaded(): Promise<void> {
    await expect(this.themNhanVien).toBeVisible();
  }

  /**
   * Step 2 và 4: từ màn Quản lý > Thiết bị đi tới Nhóm & Nhân viên.
   *
   * Hai cú bấm, **không bấm "Phân quyền" xen giữa** — lý do ở docblock của `phanQuyen`.
   */
  async moNhomVaNhanVien(): Promise<void> {
    await this.step('mở Quản lý > Nhóm & Nhân viên', async () => {
      await this.panel.moQuanLy();
      await this.panel.moNhomVaNhanVien();
    });
  }

  /** Step 3: section "Phân quyền" đang mở sẵn — trạng thái, không phải thao tác. */
  async expectPhanQuyenDangMo(): Promise<void> {
    await expect(this.phanQuyen).toHaveAttribute('aria-expanded', 'true');
    await expect(this.panel.nhomVaNhanVien).toBeVisible();
  }

  /**
   * Expected của step 5: "Button Thêm Nhân viên clickable".
   *
   * Là assertion, KHÔNG bấm — bấm vào chính là làm hỏng thứ đang muốn kiểm.
   */
  async expectThemNhanVienClickable(): Promise<void> {
    await expect(this.themNhanVien).toBeVisible();
    await expect(this.themNhanVien).toBeEnabled();
  }
}

import { expect } from '@playwright/test';
import { BasePage } from 'qc-kit/core';
import { Header } from '../header/Header';

/**
 * Màn `Quản lý > Phân quyền > Nhóm & Nhân viên`.
 *
 * Sinh từ `testcase/Manage_TestCase_v1.0.0.json` (`Manage_TC_001`). JSON không nói màn
 * hình nào — hợp đồng không còn field `screen` — nên màn hình được suy từ chuỗi bốn step
 * điều hướng đầu case. Đó là một phán đoán, ghi ra đây để người review bác được.
 *
 * **Chưa đối chiếu DOM thật.** Bước 3a đã soát lại toàn bộ `src/pages` và `src/components`:
 * chỉ tái dùng được `Header.moQuanLy()` cho step 1. Bốn phần tử còn lại chưa ai lấy, nên
 * chúng ở trạng thái `LOCATOR-TBD` chờ bước 3b.
 */
export class ManagePage extends BasePage {
  /**
   * TẠM THỜI: `/vi/groups` lấy từ link "Quản lý" ở panel điều hướng trái — quan sát được
   * khi dump DOM trang `/vi/devices` trong phiên này, **không phải** bịa.
   *
   * Chỉ dùng làm lối tắt khi một case khác cần vào thẳng màn này. `Manage_TC_001` KHÔNG
   * dùng nó: case đó đi theo đúng đường người dùng thật đi, bằng các cú bấm.
   */
  protected override readonly path = '/vi/groups';

  readonly nav = new Header(this.page);

  /**
   * LOCATOR-TBD: "menu Quản lý ở panel trái" (Manage_TC_001 step 2).
   * Chưa xác minh là link, tab hay dòng menu — ba loại đó ra ba lời gọi khác nhau.
   */
  readonly menuQuanLy = this.page.getByTestId('LOCATOR-TBD-menu-quan-ly');

  /**
   * LOCATOR-TBD: "Phân quyền" (Manage_TC_001 step 3). Loại phần tử chưa xác minh.
   */
  readonly phanQuyen = this.page.getByTestId('LOCATOR-TBD-phan-quyen');

  /**
   * LOCATOR-TBD: "Nhóm & Nhân viên" (Manage_TC_001 step 4). Loại phần tử chưa xác minh.
   */
  readonly nhomVaNhanVien = this.page.getByTestId('LOCATOR-TBD-nhom-va-nhan-vien');

  /**
   * LOCATOR-TBD: "Thêm nhân viên" (Manage_TC_001 step 5). Loại phần tử chưa xác minh.
   */
  readonly themNhanVien = this.page.getByTestId('LOCATOR-TBD-them-nhan-vien');

  override async waitUntilLoaded(): Promise<void> {
    await expect(this.menuQuanLy).toBeVisible();
  }

  /**
   * Step 2–4 gộp thành một ý định: đi tới tab Nhóm & Nhân viên.
   *
   * Ba cú bấm, không phải một — theo luật "một câu, một hành động" của skill. Gộp vào một
   * method vì spec chỉ quan tâm "đã tới được màn đó", không quan tâm đi qua mấy lớp menu.
   */
  async moNhomVaNhanVien(): Promise<void> {
    await this.step('mở Quản lý > Phân quyền > Nhóm & Nhân viên', async () => {
      await this.clickWhenReady(this.menuQuanLy);
      await this.clickWhenReady(this.phanQuyen);
      await this.clickWhenReady(this.nhomVaNhanVien);
    });
  }

  /**
   * Expected của step 5: "Button Thêm Nhân viên clickable".
   *
   * Là assertion, KHÔNG bấm — bấm vào chính là làm hỏng thứ đang muốn kiểm.
   * `toBeEnabled()` là cách Playwright diễn đạt "clickable": hiện hữu, không `disabled`,
   * không `aria-disabled`. Không có matcher `toBeClickable`.
   */
  async expectThemNhanVienClickable(): Promise<void> {
    await expect(this.themNhanVien).toBeVisible();
    await expect(this.themNhanVien).toBeEnabled();
  }
}

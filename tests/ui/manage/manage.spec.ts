import { test } from '../../../src/fixtures';
import { LivePage } from '../../../src/pages/live/LivePage';
import { ManagePage } from '../../../src/pages/manage/ManagePage';
import { RolePage } from '../../../src/pages/manage/RolePage';

/**
 * Sinh từ `testcase/Manage_TestCase_v1.0.0.json` — nhóm id `Manage_TC`.
 *
 * Đường dẫn file theo `docs/test-structure.md` mục 3 và mục 4.
 *
 * Precondition "đã login" KHÔNG viết ở đây: project `chromium` nạp sẵn session do project
 * `setup` ghi ra.
 *
 * Case đi theo **đúng đường người dùng thật đi** — mở màn hạ cánh sau đăng nhập rồi bấm
 * qua từng lớp menu. Không `goto` thẳng route đích.
 */
test.describe('Nhóm & Nhân viên', () => {
  test('Manage_TC_001 Kiểm tra click nút "+ Thêm nhân viên" @smoke @regression @role-permission', async ({
    createPage,
  }) => {
    const live = createPage(LivePage);
    const quanLy = createPage(ManagePage);

    await live.open();
    await live.waitUntilLoaded();

    // step 1 — "Chọn tab Quản lý"   (tái dùng Header.moQuanLy)
    await live.nav.moQuanLy();

    // step 2 — "chọn menu Quản lý ở panel trái"
    // step 4 — "Chọn Nhóm & Nhân viên"
    await quanLy.moNhomVaNhanVien();

    // step 3 — "Chọn Phân quyền": section này đã mở sẵn. Bấm vào nút đó sẽ ĐÓNG nó lại và
    // làm mất luôn "Nhóm & Nhân viên", nên step này được kiểm như một trạng thái.
    await quanLy.expectPhanQuyenDangMo();

    // step 5 — "Kiểm tra button Thêm nhân viên"
    // expected: "Button Thêm Nhân viên clickable"  → assertion, không bấm
    await quanLy.expectThemNhanVienClickable();
  });
});

test.describe('Vai trò', () => {
  test('Manage_TC_002 Kiểm tra popup Thêm vai trò @smoke @regression @vaitro', async ({
    createPage,
  }) => {
    const live = createPage(LivePage);
    const vaiTro = createPage(RolePage);

    await live.open();
    await live.waitUntilLoaded();

    // step 1 — "Chọn tab Quản lý"
    await live.nav.moQuanLy();

    // step 2 — "chọn menu Quản lý ở panel trái"
    await vaiTro.panel.moQuanLy();

    // step 3 — "Chọn Phân quyền": section đã mở sẵn, bấm vào sẽ ĐÓNG nó lại.
    await vaiTro.expectPhanQuyenDangMo();

    // step 4 — "Chọn vai trò"
    await vaiTro.panel.moVaiTro();
    await vaiTro.waitUntilLoaded();

    // step 5 — "Kiểm tra button Thêm vai trò"
    // expected: "Button Thêm vai trò clickable"  → assertion, không bấm
    await vaiTro.expectThemVaiTroClickable();

    // step 6 — "Click vào button Thêm vai trò"
    await vaiTro.moPopupThemVaiTro();

    // step 7 — "Kiểm tra dialog (popup) Thêm vai trò"
    // expected: "Dialog (popup) Thêm vai trò có hiển thị"
    await vaiTro.dialogThemVaiTro.expectDangHien();

    // step 8 — "Click button Hủy trên popup Thêm vai trò"
    // expected: "Popup Thêm vai trò không còn hiển thị"
    await vaiTro.dialogThemVaiTro.huyBo();
    await vaiTro.dialogThemVaiTro.expectDaDong();
  });
});

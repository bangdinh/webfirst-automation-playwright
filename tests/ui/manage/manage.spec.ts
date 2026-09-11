import { test } from '../../../src/fixtures';
import { LivePage } from '../../../src/pages/live/LivePage';
import { ManagePage } from '../../../src/pages/manage/ManagePage';

/**
 * Sinh từ `testcase/Manage_TestCase_v1.0.0.json` — nhóm id `Manage_TC`.
 *
 * Precondition "đã login" KHÔNG viết ở đây: project `chromium` nạp sẵn session do project
 * `setup` ghi ra.
 *
 * Case đi theo **đúng đường người dùng thật đi**: mở màn hạ cánh sau đăng nhập rồi bấm
 * qua từng lớp menu, chứ không `goto` thẳng `/vi/groups`. Nhảy URL sẽ cho test xanh trên
 * một màn hình mà người dùng có thể không tới được theo đường đó.
 */
test.describe('Nhóm & Nhân viên', () => {
  // Còn 4 LOCATOR-TBD (step 2–5) — chưa chạy được, xem báo cáo của lần sinh.
  test.fixme('Manage_TC_001 Kiểm tra click nút "+ Thêm nhân viên" @smoke @regression @role-permission', async ({
    createPage,
  }) => {
    const live = createPage(LivePage);
    const quanLy = createPage(ManagePage);

    await live.open();
    await live.waitUntilLoaded();

    // step 1 — "Chọn tab Quản lý"   (tái dùng Header.moQuanLy, locator đã xác minh)
    await live.nav.moQuanLy();

    // step 2 — "chọn menu Quản lý ở panel trái"
    // step 3 — "Chọn Phân quyền"
    // step 4 — "Chọn Nhóm & Nhân viên"
    await quanLy.moNhomVaNhanVien();

    // step 5 — "Kiểm tra button Thêm nhân viên"
    // expected: "Button Thêm Nhân viên clickable"  → assertion, không bấm
    await quanLy.expectThemNhanVienClickable();
  });
});

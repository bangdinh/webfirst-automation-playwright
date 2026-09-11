import { expect, test } from '../../src/fixtures';
import { DeviceManagementPage } from '../../src/pages/devicemanagementpage/DeviceManagementPage';

/**
 * Sinh từ `Device_Management_TestCase_v1.0.0.json` — nhóm id `TB`.
 *
 * Mỗi test giữ `test_case_id` trong tiêu đề để truy ngược về file Excel gốc.
 * Case còn `LOCATOR-TBD` để `test.fixme`: nhìn thấy được trong report mà không nhuộm đỏ
 * suite. Thay locator thật xong thì bỏ `fixme` và chạy.
 *
 * 7/9 case nhóm TB không sinh được — xem báo cáo cuối lần chạy skill.
 */
test.describe('Thêm thiết bị', () => {
  // TB1.0 — còn 1 LOCATOR-TBD (menu chọn phương thức thêm)
  test.fixme('TB1.0 Kiểm tra click nút "+ Thêm thiết bị" @high', async ({ createPage }) => {
    const trang = createPage(DeviceManagementPage);

    // step 1 — navigate: "Vào màn Quản lý > Thiết bị > tab Thiết bị"
    await trang.open();
    await trang.waitUntilLoaded();

    // step 2 — tap: "Click nút + Thêm thiết bị ở góc trên bên phải"
    await trang.moMenuThemThietBi();

    // expected: Hiển thị menu "Chọn phương thức thêm" gồm 2 lựa chọn
    await expect(trang.menuPhuongThucThem).toBeVisible();
  });

  // TB2.0 — expected là "Theo design": kiểm thị giác, không phải assertion chức năng.
  // Cần người quyết định kiểm gì cụ thể, hoặc chuyển sang so sánh ảnh.
  test.fixme('TB2.0 Kiểm tra design @low', async ({ createPage }) => {
    const trang = createPage(DeviceManagementPage);

    // step 1 — navigate: "Mở dialog Thêm thiết bị bằng 1 trong 2 phương thức"
    await trang.open();
    await trang.moMenuThemThietBi();

    // step 2 — verify: "Quan sát giao diện tổng thể dialog"  ->  expected "Theo design"
    await trang.dialogThemThietBi.expectVisible();
  });
});

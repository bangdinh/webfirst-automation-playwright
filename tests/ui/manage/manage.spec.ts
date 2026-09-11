import { test } from '../../../src/fixtures';

/**
 * ManagePage — CHƯA CÓ CASE NÀO.
 *
 * `src/pages/manage/ManagePage.ts` hiện là file rỗng: chưa có locator, chưa có method, nên
 * chưa spec nào gọi được gì. Thứ tự làm nằm ở skill `qc-flow`: quan sát app thật lấy
 * locator → viết page object → mới viết spec. Tên màn hình trong report cũng để nguyên
 * tên class, tránh đặt nhãn tiếng Việt chưa đối chiếu với UI thật.
 *
 * Giữ một `fixme` thay vì để file rỗng: report còn nhìn thấy chỗ đang thiếu.
 */
test.describe('ManagePage', () => {
  test.fixme('chờ page object và test case @manage', () => {});
});

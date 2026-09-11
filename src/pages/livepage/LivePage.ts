import { BasePage } from 'qc-kit/core';
import { MainNav } from '../../components/MainNav';

/**
 * Màn hình `Giám sát / Trực tiếp` — nơi app đưa người dùng tới ngay sau khi đăng nhập.
 *
 * Ở đây mới chỉ khai đủ để làm điểm xuất phát cho các luồng điều hướng. Thêm locator của
 * chính màn hình này (danh sách camera, bộ lọc…) khi có test cần tới.
 */
export class LivePage extends BasePage {
  protected override readonly path = '/vi/live';

  readonly nav = new MainNav(this.page);

  override async waitUntilLoaded(): Promise<void> {
    // Thanh điều hướng chỉ dựng xong khi app đã nhận session — chờ nó là chờ đúng thời
    // điểm màn hình dùng được, chắc hơn chờ `domcontentloaded`.
    await this.nav.expectVisible();
  }
}

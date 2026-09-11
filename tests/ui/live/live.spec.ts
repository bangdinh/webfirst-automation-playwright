import { expect, test } from '../../../src/fixtures';
import { LivePage } from '../../../src/pages/live/LivePage';

/**
 * Màn `Giám sát / Trực tiếp` — điểm hạ cánh sau khi đăng nhập.
 *
 * Precondition "đã đăng nhập" KHÔNG viết ở đây: project `chromium` nạp sẵn session do
 * project `setup` ghi ra.
 */
test.describe('Giám sát', () => {
  test('mở được màn Giám sát @smoke @live', async ({ createPage, page }) => {
    const live = createPage(LivePage);

    await live.open();

    // `waitUntilLoaded` chờ thanh điều hướng dựng xong — tức app đã nhận session.
    await live.waitUntilLoaded();
    await expect(page).toHaveURL(/\/live/);
  });
});

import { expect, test } from '../../src/fixtures';
import { ExamplePage } from '../../src/pages/ExamplePage';

test('mở được trang chủ @smoke', async ({ createPage }) => {
  const trang = createPage(ExamplePage);
  await trang.open();
  await trang.expectLoaded();
});

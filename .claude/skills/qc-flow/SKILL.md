---
name: qc-flow
description: Cach them mot man hinh, mot luong nghiep vu hoac mot spec vao bo test nay - thu tu lam, locator lay o dau, dat file vao dau, va cai gi KHONG thuoc repo nay ma thuoc qc-kit. Kich hoat khi them page object, component, API client, spec moi, khi hoi "them man hinh nay the nao", hoac khi khong chac mot doan code nen nam o day hay o kit.
---

# Thêm một màn hình / một luồng vào `web-automation`

Skill này do **qc-kit** phát hành. Đừng sửa tại chỗ — nó bị ghi đè ở lần
`npx qc-kit sync` tiếp theo. Thấy sai thì sửa ở kit rồi nâng version.

## Thứ tự — không đảo, không bỏ bước

**1. Quan sát app thật trước khi viết dòng nào.**
Mở màn hình đó (`npx playwright codegen <url>`), đọc DOM thật, ghi lại locator thật. Không
bịa `data-testid` rồi hy vọng Dev đã gắn.

**2. Page object** — `src/pages/<TênMànHình>.ts`, kế thừa `BasePage` của kit.

```ts
import { expect } from '@playwright/test';
import { BasePage } from 'qc-kit/core';

export class StockPage extends BasePage {
  protected override readonly path = '/stock';

  readonly heading = this.page.getByTestId('stock-page-heading');
  readonly search = this.page.getByTestId('stock-search-input');

  override async waitUntilLoaded(): Promise<void> {
    await expect(this.heading).toBeVisible();
  }

  async timKiem(ma: string): Promise<void> {
    await this.step(`tìm mã hàng "${ma}"`, async () => {
      await this.search.fill(ma);
    });
  }
}
```

- Locator là **field readonly**, khai ở đầu class.
- Method mô tả **ý định** (`timKiem`), không phải thao tác (`clickNutTim`).
- **Mọi method public bọc trong `this.step(...)`.** Đây là thứ giữ cho một lần fail còn
  đọc được khi suite đã lớn — report hiện `StockPage: tìm mã hàng "SKU-001"` thay vì một
  cú click vô danh.
- Assertion **thuộc về màn hình** thì để ở đây dưới dạng `expectX()`; assertion riêng của
  một kịch bản thì ở lại trong spec. Đó là thứ cho phép một page object phục vụ hai mươi
  test.

**3. Fixture** (nếu màn hình dùng thường xuyên) — thêm vào `src/fixtures.ts`. Dùng một hai
lần thì `createPage(StockPage)` là đủ, đừng đẻ fixture.

**4. Spec** — `tests/ui/<module>.spec.ts`, import từ `../../src/fixtures`, **không** import
thẳng `@playwright/test`.

```ts
import { expect, test } from '../../src/fixtures';
import { StockPage } from '../../src/pages/StockPage';

test('tìm được mã hàng @smoke', async ({ createPage }) => {
  const stock = createPage(StockPage);
  await stock.open();
  await stock.timKiem('SKU-001');
  await expect(stock.search).toHaveValue('SKU-001');
});
```

## Locator — thứ tự ưu tiên

1. **`data-testid`** — luôn dùng nếu đã có.
2. **`id`** / `name` — nếu ổn định (không phải id tự sinh kiểu `r3xk9`).
3. **class team tự đặt** — không dùng class của UI framework (`ant-btn`…), nó đổi khi
   upgrade thư viện.
4. **`getByRole` + tên hiển thị** — nếu tên đổi theo ngôn ngữ thì lấy từ từ điển locale,
   không hardcode.
5. **CSS kết hợp** — cuối cùng. **Không XPath.**

Dùng bất kỳ mức nào từ 2–5: ghi comment `TẠM THỜI` ngay tại chỗ, nêu `data-testid` nào
đang chờ Dev. Đổi lại sau không phải sửa spec, vì spec chỉ gọi method của page object.

## Không thuộc repo này

| Thấy mình sắp viết… | Nó thuộc về |
|---|---|
| Base class, fixture, helper dùng được cho **mọi** sản phẩm | **qc-kit** — đề xuất ở đó, nâng version |
| Cách sinh ra một loại test case mới | `platform-qc-agent` |
| Sửa `.claude/skills/*` | **qc-kit** — bản ở đây là bản sao |

## Cấm

- **`page.waitForTimeout`** trong code đã commit. Dựa vào auto-waiting và web-first
  assertion.
- **Đăng nhập trong `beforeEach`.** Session do project `setup` lo, một lần cho cả lần chạy.
  Cần đăng nhập riêng thì dùng `authenticatedTest` (một lần mỗi worker).
- **Hardcode đường dẫn screenshot.** Dùng `screenshot(name)` của page/component — worker
  song song sẽ ghi đè nhau.
- **Test phụ thuộc thứ tự chạy.** Mỗi test tự tạo dữ liệu nó cần, tên sinh duy nhất.

## Xong thì kiểm

```bash
npm run typecheck
npx playwright test tests/ui/<module>.spec.ts
```

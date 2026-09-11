---
name: gen-script
description: Sinh test script Playwright cho bo test nay - tu JSON test case ra draft script, tim locator that tu DOM, cap nhat vao script, roi chay verify. Gom ca chuan viet page object va spec, thu tu uu tien locator, va cai gi KHONG thuoc repo nay ma thuoc qc-kit. Kich hoat khi user go "Tao script", "Gen script", "/gen-script", khi co file JSON test case can chuyen thanh code, khi them page object hoac spec moi, khi hoi "them man hinh nay the nao" hoac "case nay viet thanh code the nao".
---

# Sinh test script — `__NAME__`

Skill này do **qc-kit** phát hành. Đừng sửa tại chỗ — nó bị ghi đè ở lần
`npx qc-kit sync` tiếp theo. Thấy sai thì sửa ở kit rồi nâng version.

## Đường ống — năm bước, không đảo

| | Bước | Trạng thái |
|---|---|---|
| 1 | JSON test case → đọc, đếm case | tự động |
| 2 | → **draft script** (page object + spec, lỗ locator đánh dấu) | tự động |
| 3 | → **tìm locator thật**: page object có sẵn trước, DOM sau | 3a tự động · 3b **làm tay** |
| 4 | → cập nhật locator vào script, bỏ `fixme` | tự động |
| 5 | → chạy verify | tự động |

Bước **3b** là chỗ duy nhất bắt buộc có người — và chỉ khi 3a không tìm thấy sẵn. Đừng cố
nhảy qua nó bằng cách đoán; lý do ở mục dưới.

---

## Bước 1 — Đọc JSON

Đầu vào là file do `convertExcelToTestCases()` của kit sinh ra:

```json
{
  "summary": { "total": 21 },
  "test_cases": [
    {
      "test_case_id": "TB1.0",
      "title": "Kiểm tra click nút \"+ Thêm thiết bị\"",
      "preconditions": [],
      "steps": [
        { "no": 1, "description": "Click nút \"+ Thêm thiết bị\"",
          "expected": "Hiển thị menu Chọn phương thức thêm" }
      ],
      "test_data": {}, "priority": "High", "tags": ["@high"], "source": "requirement"
    }
  ]
}
```

**Đọc thẳng, KHÔNG validate.** File này là đầu ra của một hàm convert, không phải thứ
người gõ tay — hình dạng của nó là việc của hàm đó, và logic convert còn đổi. Dựng một
cổng schema ở đây chỉ tạo ra chỗ thứ hai phải sửa mỗi lần đầu vào đổi, và nó sẽ chặn cả
những file hoàn toàn dùng được.

Việc của bước này đúng hai dòng: đọc file, và **báo có bao nhiêu test case**.

```
Đọc testcase/Device_Management_TestCase_v1.0.0.json — 21 test case
```

Nếu file không đọc/parse được (sai cú pháp JSON, không thấy đường dẫn) thì dừng và nói rõ
lỗi. Đó là hỏng thật, không phải chuyện schema.

Rồi **gom case theo màn hình**. Hợp đồng không còn field `screen`, nên việc gom dựa vào
`title`, `preconditions` và câu chữ của step — tức là một **phán đoán**, không phải một
khoá có sẵn. Gom sai thì sinh ra hai class cho cùng một màn hình.

Vì vậy: gom xong thì **nói ra cách gom** trước khi sinh, và màn hình nào không chắc thì
hỏi người thay vì tự tạo class mới.

Field nào thiếu hay trống thì xử lý ở bước 2 theo bảng **Khi nào KHÔNG sinh** — bỏ đúng
case đó và báo lại, thay vì để cả file trượt vì một case hỏng.

## Bước 2 — Sinh draft script

### Luật số một: JSON KHÔNG nói phần tử nào

Một step chỉ có **một câu `description`**. Hợp đồng không có field cho hành động, cho màn
hình, cho phần tử — xem `ADR-0002` và `ADR-0003` của kit. Tất cả những gì bạn có là câu
tiếng Việt do người viết case gõ ra.

Vì vậy: **không bao giờ suy ra locator từ JSON.** Không `getByTestId('them-thiet-bi')`,
không `getByText('Thêm thiết bị')`, không đoán theo nghĩa của từ trong `description`. Một
locator bịa trông y hệt locator thật cho tới lúc chạy — và lúc đó người đọc lỗi không biết
nó bịa.

Đặt **tên field** theo `description` thì được — đó là đặt tên, không phải định vị. Còn giá
trị của locator thì để trống có đánh dấu:

```ts
// LOCATOR-TBD: "+ Thêm thiết bị" (TB1.0 step 1) — lấy locator thật từ DOM, xem bước 3
readonly themThietBi = this.page.getByTestId('LOCATOR-TBD-them-thiet-bi');
```

Ba tính chất của marker, cả ba đều cố ý:

| | |
|---|---|
| **Grep được** | `grep -rn "LOCATOR-TBD" src/ tests/` ra đúng danh sách việc còn lại |
| **Fail to** | selector không khớp gì; test đỏ với thông báo chứa `LOCATOR-TBD`, không đỏ mơ hồ |
| **Truy được nguồn** | comment ghi rõ case nào, step nào cần nó |

### Page object

Một màn hình một class dưới `src/pages/`, kế thừa `BasePage` của kit. Dự án chia
`src/pages/` theo khu vực thì **giữ đúng cách chia đang có**, đừng dựng cách đặt tên mới.

Trước khi tạo class: **kiểm `src/pages/` xem màn hình đó đã có class chưa.** Có rồi thì
thêm vào class đó, đừng tạo class thứ hai cho cùng một màn hình.

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

- Locator là **field readonly**, khai ở đầu class. Mỗi phần tử distinct một locator.
- Method mô tả **ý định** (`timKiem`), không phải thao tác (`clickNutTim`).
- **Mọi method public bọc trong `this.step(...)`.** Đây là thứ giữ cho một lần fail còn
  đọc được khi suite đã lớn — report hiện `StockPage: tìm mã hàng "SKU-001"` thay vì một
  cú click vô danh.
- Assertion **thuộc về màn hình** thì để ở đây dưới dạng `expectX()`; assertion riêng của
  một kịch bản thì ở lại trong spec. Đó là thứ cho phép một page object phục vụ hai mươi
  test.
- Dialog/menu mở đè lên màn khác và **không có URL riêng** thì là `BaseComponent`, không
  phải `BasePage` — `BasePage` bắt phải có `path`, mà `path` bịa còn tệ hơn locator bịa.

### Spec

Một file cho mỗi nhóm `test_case_id` cùng tiền tố (`TB1.0`, `TB1.1` → `tb.spec.ts`), đặt
dưới `tests/ui/` theo đúng cách dự án đang chia. Import từ `src/fixtures`, **không** import
thẳng `@playwright/test`. Giữ `test_case_id` trong tiêu đề để truy ngược về Excel gốc.

```ts
import { expect, test } from '../../src/fixtures';
import { StockPage } from '../../src/pages/StockPage';

test.describe('Kho hàng', () => {
  test('TB1.0 tìm được mã hàng @smoke', async ({ createPage }) => {
    const stock = createPage(StockPage);
    await stock.open();

    await stock.timKiem('SKU-001');

    await expect(stock.search).toHaveValue('SKU-001');
  });
});
```

Fixture riêng chỉ thêm vào `src/fixtures.ts` khi màn hình dùng thường xuyên. Một hai lần
thì `createPage(StockPage)` là đủ, đừng đẻ fixture.

### Ánh xạ step sang code

Hành động phải **đọc ra từ `description`**. Hợp đồng không mang verb nữa, nên không có
bảng tra và không có `translateAction()` — chính chỗ này là nơi phán đoán xảy ra, và nó
phải hiện ra cho người đọc chứ không lặng lẽ.

Quy tắc: mỗi step sinh ra **một** lời gọi method của page object, và giữ nguyên văn
`description` trong comment ngay trên nó. Người review đối chiếu được câu gốc với dòng
code mà không phải mở Excel.

```ts
// step 4 — "Click nút \"+ Thêm thiết bị\" ở góc trên bên phải"
await trang.moMenuThemThietBi();
```

Câu nào **không đọc ra được một hành động** (mơ hồ, mô tả trạng thái, hai việc trong một
dòng) thì đừng đoán: bỏ case đó và báo lại, theo bảng dưới.

Cử chỉ như vuốt/cuộn thì Playwright không có lời gọi thẳng. Gặp câu mô tả chúng thì viết
method rỗng kèm `// LOCATOR-TBD` — bịa một cử chỉ sẽ trông đúng và sai ở mọi lần chạy.

#### Động từ **một mình** không quyết được lời gọi — đối tượng mới quyết

"Chọn vào button A" và "Chọn giá trị B trong dropdown" cùng một động từ, nhưng người
dùng thật làm hai việc khác nhau: một cú bấm, so với mở một menu rồi bấm vào một dòng
trong đó. Sinh cùng một `click` cho cả hai là sai ở trường hợp thứ hai.

Đọc **động từ + đối tượng**, rồi hỏi: *người dùng thật sự làm gì bằng chuột và bàn phím?*

| Câu trong `description` | Người dùng làm gì | Playwright |
|---|---|---|
| Chọn / Click / Bấm / Nhấn / Chạm **một button, link, tab, dòng menu** | một cú bấm | `click()` |
| Chọn **một giá trị trong dropdown** | bấm mở trigger → bấm dòng option | hai `click()`, **không** `selectOption()` trừ khi đó là `<select>` thật |
| Tick / Bỏ tick / Chọn **một checkbox hay radio** | bật/tắt một ô | `check()` / `uncheck()` — idempotent, không `click()` |
| Nhập / Điền / Gõ / Dán **vào một ô** | gõ vào ô | `fill()` |
| Chọn / Tải lên **một file** | mở hộp thoại file rồi chọn | `setInputFiles()` |
| Chọn **một ngày** | mở picker → gõ hoặc bấm ô ngày | `fill()` vào input của picker, hoặc `click()` ô ngày |
| Di chuột / Hover **lên một phần tử** | rê chuột, chưa bấm | `hover()` |
| Kiểm tra / Quan sát / Xác nhận / Đảm bảo | **không đụng gì cả**, chỉ nhìn | `expect(...)` |
| Chờ / Đợi | không ngồi đếm giây, mà chờ thấy thứ mình cần | web-first assertion. **Không bao giờ** `waitForTimeout()` |

#### Bốn luật rút từ hành vi thật

**1. Điều hướng trong app là bấm, không phải `goto`.**
Người dùng không gõ URL để sang tab khác — họ bấm vào menu. Chỉ **điểm vào** của case mới
dùng `open()`; mọi bước đi tiếp bên trong app là `click()` qua page object. Dùng `goto`
cho bước giữa chừng sẽ cho test xanh trên một màn hình mà người dùng thật không tới được
theo đường đó.

**2. "Kiểm tra" không được đổi trạng thái.**
Câu "Kiểm tra button X clickable" là một assertion, không phải một cú bấm. Bấm nó là làm
hỏng đúng thứ đang muốn kiểm — và bước sau sẽ chạy trên một màn hình khác.

**3. Một câu, một hành động.**
"Chọn Phân quyền rồi Nhóm & Nhân viên" là **hai** cú bấm. Hoặc tách thành hai lời gọi,
hoặc gộp vào **một** method mô tả ý định (`moNhomVaNhanVien()`) rồi gọi một lần. Đừng nhét
hai `click` trần vào spec.

**4. Đối tượng chưa rõ là loại gì thì để `LOCATOR-TBD`, đừng đoán loại.**
"Chọn Phân quyền" — tab? link? dòng menu? Ba thứ đó ra ba lời gọi khác nhau. Chưa mở app
thì chưa biết, và bước 3 chính là chỗ trả lời. Viết `LOCATOR-TBD` cho locator, chọn
`click()` làm mặc định, và ghi trong comment rằng loại phần tử chưa xác minh.

`expected` của step cuối thành assertion. `expected` rỗng ở step giữa là bình thường —
bước dẫn đường không có kết quả quan sát riêng. Chuỗi step chỉ điều hướng ở đầu case là
**precondition**, không phải hành động — đừng dịch từng câu văn xuôi thành một `await`.

### Case có `LOCATOR-TBD` thì `test.fixme()`

Kèm lý do. Nó hiện ra là "đã bỏ qua" trong report — nhìn thấy được, mà không nhuộm đỏ
suite.

### Khi nào KHÔNG sinh

Bước 1 không validate, nên bảng này là chỗ **duy nhất** chặn case hỏng. Chặn từng case,
không chặn cả file.

| Tình huống trong JSON | Xử lý |
|---|---|
| `source: "inferred"` | Không đưa vào bộ chạy. Giả định chưa ai xác nhận — luật ở `testcase-standard` |
| `description` không đọc ra hành động nào | Mơ hồ, mô tả trạng thái, hoặc hai việc trong một dòng → bỏ case, trích nguyên văn câu đó |
| Không biết case thuộc màn hình nào | **Không tạo page object mới**, hỏi người |
| `steps` rỗng | Không có gì để sinh, bỏ qua và báo lại |
| `expected` của step cuối rỗng | Case không khẳng định điều gì → bỏ qua và báo lại |
| `expected` kiểu "Theo design", "Đúng UI" | Kiểm thị giác, không phải assertion chức năng → `test.fixme` |

### Báo cáo trước khi dừng

Sinh được bao nhiêu case **trên tổng số đọc được ở bước 1**, bao nhiêu `LOCATOR-TBD` và
nằm ở đâu, case nào bị bỏ vì lý do gì trong bảng trên. Hai con số đó phải khớp nhau: mỗi
case không sinh đều có một dòng lý do. **Đừng nói "đã xong" khi còn TBD** — draft chưa
phải script chạy được.

---

## Bước 3 — Tìm locator thật

Hai nguồn, **theo đúng thứ tự này**. Đảo thứ tự là tự tạo ra locator trùng.

### 3a. Tìm trong page object đã có — làm trước, tự động

Màn hình này rất có thể đã được implement một phần: một case trước đó đã mở app, đã lấy
locator thật, và đã ghi vào class. Lấy lại chúng.

```bash
# class của màn hình đang làm, và mọi component nó dùng
cat src/pages/<khu vực>/<TênMànHình>.ts
grep -rnE "readonly |async " src/pages/<khu vực>/ src/components/
```

Với **từng** `LOCATOR-TBD` bước 2 vừa sinh, hỏi ba câu theo thứ tự:

| | Nếu có |
|---|---|
| Class đã có **method** làm đúng việc này chưa? | Gọi method đó. Không thêm locator nào |
| Class đã có **locator** trỏ đúng phần tử này chưa? | Dùng lại field đó, xoá `LOCATOR-TBD` |
| **Component** dùng chung (header, dialog, bảng) đã có chưa? | Dùng qua component, đừng khai lại ở page |

Khớp theo **phần tử thật**, không theo tên. `themThietBi` và `nutThemThietBi` là một thứ;
khai cả hai thì hôm Dev đổi UI sẽ sửa một cái và quên cái kia. Ngược lại, hai nút cùng tên
"Xoá" ở hai chỗ khác nhau là **hai** locator — trùng tên không phải trùng phần tử.

Dùng lại được thì ghi rõ trong báo cáo: locator nào lấy từ class có sẵn, locator nào phải
đi lấy mới. Đó là thước đo page object đang lớn lên hay đang bị chép lại.

### 3b. Chưa có thì mở app thật — làm tay

Chưa có giải pháp tự động cho phần này. Mở app thật, đọc DOM, ghi lại locator.

```bash
npx playwright codegen <url của màn hình>
npm run codegen                        # nếu dự án đã khai script này
```

Đăng nhập rồi mới thấy màn hình thì dùng lại session của project `setup`
(`playwright/.auth/user.json`) thay vì đăng nhập lại bằng tay.

Chưa mở app được — không có quyền, môi trường sập, chưa ai build màn hình đó — thì **giữ
`LOCATOR-TBD` như cũ** và để case ở `test.fixme`. Đó là trạng thái hợp lệ, không phải
thất bại: draft vẫn grep ra được, và không có locator bịa nào lọt vào.

### Thứ tự ưu tiên locator

1. **`data-testid`** — luôn dùng nếu đã có.
2. **`id`** / `name` — nếu ổn định (không phải id tự sinh kiểu `r3xk9`).
3. **class team tự đặt** — không dùng class của UI framework (`ant-btn`…), nó đổi khi
   upgrade thư viện.
4. **`getByRole` + tên hiển thị** — nếu tên đổi theo ngôn ngữ thì lấy từ từ điển locale,
   không hardcode.
5. **CSS kết hợp** — cuối cùng. **Không XPath.**

Dùng bất kỳ mức nào từ 2–5: ghi comment `TẠM THỜI` ngay tại chỗ, nêu `data-testid` nào
đang chờ Dev. Đổi lại sau không phải sửa spec, vì spec chỉ gọi method của page object.

Lập phiếu gửi Dev thì tự đặt tên testid theo quy ước của dự án
(`<module>-<việc>-<loại phần tử>`, ví dụ `device-them-thiet-bi`). Kit **không** còn hàm
sinh tên này — nó từng suy từ `target`, mà `target` đã bị bỏ khỏi hợp đồng.

## Bước 4 — Cập nhật locator vào script

```bash
grep -rn "LOCATOR-TBD" src/ tests/     # danh sách phần tử cần locator thật
```

Mỗi dòng grep ra là một lần thay. Thay xong locator của một case thì bỏ `test.fixme` của
chính case đó — đừng bỏ hàng loạt.

## Bước 5 — Verify syntax

```bash
npm run typecheck
```

Kiểm tra syntax 

---

## Cấm

- **`page.waitForTimeout`** trong code đã commit. Dựa vào auto-waiting và web-first
  assertion.
- **Đăng nhập trong `beforeEach`.** Session do project `setup` lo, một lần cho cả lần chạy.
  Cần đăng nhập riêng thì dùng `authenticatedTest` (một lần mỗi worker).
- **Hardcode đường dẫn screenshot.** Dùng `screenshot(name)` của page/component — worker
  song song sẽ ghi đè nhau.
- **Test phụ thuộc thứ tự chạy.** Mỗi test tự tạo dữ liệu nó cần, tên sinh duy nhất.

## Không thuộc skill này

| Việc | Thuộc về |
|---|---|
| Một test case hợp lệ gồm gì, `source`, cách viết `description` | skill `testcase-standard` |
| Đọc file Excel, sinh ra JSON | `convertExcelToTestCases()` của qc-kit |
| Nghĩ ra case mới | `platform-qc-agent` — **không phải** ở đây |
| Base class, fixture, helper dùng được cho **mọi** sản phẩm | **qc-kit** — đề xuất ở đó, nâng version |
| Sửa `.claude/skills/*` | **qc-kit** — bản ở đây là bản sao |

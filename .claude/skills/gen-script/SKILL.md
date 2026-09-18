---
name: gen-script
description: Sinh test script Playwright cho bo test nay - tu MOT file JSON test case trong thu muc testcase/ cua repo ra draft script, theo luat o docs/test-structure.md va docs/test-data.md. Khi goi BAT BUOC kem ten file, vi du "/gen-script Manage_Testcase.json" - khong co ten file thi dung lai va hoi. Kich hoat khi user go "Tao script", "Gen script", "/gen-script <ten-file>.json"
---

# Sinh test script — `web-automation`

Skill này do **qc-kit** phát hành. Đừng sửa tại chỗ — nó bị ghi đè ở lần
`npx qc-kit sync` tiếp theo. Thấy sai thì sửa ở kit rồi nâng version.

## Luật quan trọng: skill này chỉ để dành cho việc generate test script từ file json, KHÔNG tự mở UI thật để chạy

## Đường ống — một cổng vào, sáu bước, không đảo

| | Bước | Trạng thái |
|---|---|---|
| 0 | **tên file JSON** người dùng đưa → chốt đúng một file trong `testcase/` | **cổng chặn** |
| 1 | JSON test case → đọc, đếm case | tự động |
| 2 | → **draft script** theo luật ở `docs/test-structure.md` + `docs/test-data.md` | tự động |
| 3 | → **tìm locator thật**: page object có sẵn trước, DOM sau | 3a tự động · 3b **làm tay** |
| 4 | → cập nhật locator vào script, test chuyển từ đỏ sang xanh | tự động |
| 5 | → chạy verify | tự động |
| 6 | → **ghi file summary**: còn nợ gì, ở class nào, vì sao | tự động |

Bước **3b** là chỗ duy nhất bắt buộc có người — và chỉ khi 3a không tìm thấy sẵn. Đừng cố
nhảy qua nó bằng cách đoán; lý do ở mục dưới.

---

## Bước 0 — Tên file JSON, bắt buộc

Skill này **chỉ chạy khi người dùng đưa tên file**:

```
/gen-script Manage_Testcase.json
/gen-script Testcase_Authentication_v1.0.0_part1.json
```

File phải nằm trong thư mục **`testcase/` của repo này**. Đó là chỗ duy nhất được tìm.

```bash
ls testcase/*.json
```

| Tình huống | Xử lý |
|---|---|
| Gõ `/gen-script` **không kèm tên file** | **Dừng.** `ls testcase/*.json`, liệt kê ra, hỏi người dùng chọn file nào. Không tự chọn — kể cả khi chỉ có đúng một file |
| Tên file thiếu đuôi `.json` | Thêm `.json` rồi tìm lại. Vẫn không thấy thì dừng |
| Tên gõ gần đúng (sai hoa thường, thiếu version) | Không tự sửa hộ. Liệt kê file gần giống trong `testcase/` rồi hỏi đúng một lần |
| **Không có file đó trong `testcase/`** | **Dừng**, liệt kê những file đang có. Không tìm ra ngoài thư mục đó, không dùng file của repo khác |
| Đường dẫn tuyệt đối, hoặc có `..` trỏ ra ngoài repo | **Từ chối.** Test case là đầu vào của chính bộ test này; file ngoài repo không chạy lại được ở máy người khác lẫn trên CI |
| Người dùng đưa **nhiều file** | Chạy tuần tự, mỗi file một vòng sáu bước trọn vẹn — kể cả file summary riêng. Không gộp nhiều file vào một lần sinh |
| Thư mục `testcase/` không tồn tại | Dừng và nói rõ: chưa có đầu vào nào để sinh. Đừng tự tạo thư mục |

Vì sao chặn ở đây thay vì đoán: sinh script từ nhầm file test case không hỏng ngay — nó ra
một bộ spec trông hợp lý cho sai màn hình, và người đọc chỉ phát hiện sau khi đã sửa
locator bằng tay xong. Một câu hỏi rẻ hơn nhiều so với việc đó.

Chốt xong thì nói ra đúng một dòng, rồi mới sang bước 1:

```
Dùng testcase/Manage_Testcase.json
```

## Bước 1 — Đọc JSON

Đầu vào là **đúng file đã chốt ở bước 0** — do `convertExcelToTestCases()` của kit sinh ra:

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
Đọc testcase/Manage_Testcase.json — 21 test case
```

Nếu file không parse được (sai cú pháp JSON) thì dừng và nói rõ
lỗi. Đó là hỏng thật, không phải chuyện schema.

Rồi **gom case theo màn hình**. Hợp đồng không còn field `screen`, nên việc gom dựa vào
`title`, `preconditions` và câu chữ của step — tức là một **phán đoán**, không phải một
khoá có sẵn. Gom sai thì sinh ra hai class cho cùng một màn hình.

Vì vậy: gom xong thì **nói ra cách gom** trước khi sinh, và màn hình nào không chắc thì
hỏi người thay vì tự tạo class mới.

Field nào thiếu hay trống thì xử lý ở bước 2 theo bảng **Khi nào KHÔNG sinh** — bỏ đúng
case đó và báo lại, thay vì để cả file trượt vì một case hỏng.

## Bước 2 — Sinh draft script

### Việc đầu tiên: đọc HAI file luật của dự án

Kit là khuôn dùng chung; **mỗi dự án chia thư mục một kiểu**. Đường dẫn page object,
cách chia theo khu vực, chỗ đặt spec — kit không biết, và đoán sai thì sinh ra một cây
thư mục thứ hai nằm cạnh cây đang có.

Nên trước khi ghi bất kỳ file nào:

```bash
cat docs/test-structure.md docs/test-data.md
```

Hai file, hai câu hỏi, cùng một lý do tồn tại — đó là hai chỗ generator sẽ **đoán** nếu
không ai khai:

| File | Trả lời | Đoán sai thì |
|---|---|---|
| `test-structure.md` | thư mục chia thế nào, màn nào ứng với class nào | sinh ra một cây thư mục thứ hai nằm cạnh cây đang có |
| `test-data.md` | có sẵn trạng thái dữ liệu nào, lấy ở đâu, reset ra sao | tự bịa tên biến `.env` cho một tài khoản chưa ai cấp |

| Tình huống | Xử lý |
|---|---|
| Có cả hai file, đã điền | Theo chúng. Chúng thắng mọi ví dụ trong skill này |
| **Thiếu một trong hai** | **Dừng.** Bảo người dùng `cp docs/<tên>.example.md docs/<tên>.md` rồi điền. Đừng đoán, đừng tự tạo file hộ |
| File có nhưng **còn nguyên như bản mẫu** | Cũng dừng. File rỗng nghĩa còn tệ hơn không có: nó trông như đã có luật |
| Màn hình của case **không có trong bảng ánh xạ** (`test-structure.md` mục 4) | Hỏi người, không tự tạo thư mục mới |
| Case cần một **profile dữ liệu chưa khai** trong `test-data.md` | `DATA-TBD` + `test.skip(...)` — xem mục dưới |

Mọi đường dẫn (`src/pages/…`, `tests/ui/…`) và mọi tên biến `.env` trong skill này chỉ là
**ví dụ minh hoạ**, không phải luật. Luật nằm ở hai file trên của dự án.

### Trạng thái dữ liệu — bốn luật

Phần lớn case không-phải-happy-path kiểm một TRẠNG THÁI mà bộ test không tự tạo được: tài
khoản bị khoá, gói đã hết hạn, đơn đã huỷ, người dùng chưa có quyền. `preconditions` và
`expected` nói ra trạng thái đó; `docs/test-data.md` nói nó có sẵn hay chưa.

**1. Đọc profile, đừng đặt tên biến.**
Case cần trạng thái nào thì tra bảng profile ở mục 1 của `test-data.md` và dùng đúng key
nó khai. **Không bao giờ tự nghĩ ra một tên biến `.env`** — biến bạn bịa sẽ không ai cấp,
case sẽ `skip` vĩnh viễn, và người đọc summary không biết cái tên đó từ đâu ra.

**2. Chưa khai thì dừng case đó, không dừng cả file.**

```ts
// DATA-TBD: cần tài khoản ở trạng thái "đã khoá" — chưa có profile nào trong
// docs/test-data.md. Case vẫn BẬT; `test.skip` bên dưới chặn nó khi chưa có dữ liệu, nên
// nó hiện ra là "skipped" kèm lý do chứ không đỏ bừa.
test('TB2.9 tài khoản bị khoá thì báo lỗi @high', async ({ createPage }) => {
  test.skip(true, 'DATA-TBD: chưa có profile "locked" trong docs/test-data.md');
```

**3. Profile đánh dấu PHÁ HUỶ kéo theo hai nghĩa vụ.**
Test làm đổi trạng thái của chính dữ liệu nó dùng thì:

- Mọi case dùng chung profile đó gói trong một `describe` chạy **`serial`** — chạy song
  song thì chúng dẫm lên trạng thái của nhau và không case nào còn đúng.
- Chép **cột "reset bằng"** của profile vào summary. Không có nó, người chạy lần hai thấy
  test đỏ mà không biết đỏ vì môi trường hay vì sản phẩm.

**4. Kênh ngoài chưa khai thì không sinh.**
Case cần đọc hộp thư, sinh mã TOTP, nhận SMS — nếu mục 2 của `test-data.md` chưa khai kênh
đó thì đánh `DATA-TBD` và dừng. Sinh một test không có đường lấy dữ liệu là sinh một test
không bao giờ chạy được, mà lại trông như đã xong.

Ba marker, cùng một họ — grep được, fail to, truy được nguồn:

| Marker | Thiếu cái gì | Nguy hiểm riêng |
|---|---|---|
| `LOCATOR-TBD` | phần tử trên DOM | — |
| `ENDPOINT-TBD` | đường dẫn API để chặn/kiểm | route không khớp → **xanh giả** |
| `DATA-TBD` | trạng thái dữ liệu, hoặc kênh ngoài | case `skip` im lặng nếu bịa tên biến |

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

Một màn hình một class, kế thừa `BasePage` của kit. **Thư mục, cách chia và quy ước tên
lấy từ mục 1 và mục 4 của `docs/test-structure.md`** — đừng dựng cách đặt tên mới.

Trước khi tạo class: **kiểm thư mục page object xem màn hình đó đã có class chưa.** Có rồi
thì thêm vào class đó, đừng tạo class thứ hai cho cùng một màn hình.

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

Thư mục spec, quy tắc "một file cho mỗi cái gì", và quy ước tên: **mục 3 của
`docs/test-structure.md`**. Đường import lấy ở **mục 5** — vẫn là `test` từ fixture của dự
án, **không** import thẳng `@playwright/test`. Giữ `test_case_id` trong tiêu đề để truy
ngược về Excel gốc.

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

### Case có `LOCATOR-TBD` vẫn BẬT, không `test.fixme()`

Thiếu locator **không** phải lý do tắt case. Cứ để nó chạy: selector `LOCATOR-TBD-*` không
khớp gì, test đỏ, và thông báo lỗi chứa nguyên chuỗi `LOCATOR-TBD` nên đọc là biết ngay
phải đi lấy locator nào. Đó chính là tính chất **fail to** mà marker sinh ra để có.

Vì sao không tắt: một case `fixme` là một case **không ai nhìn**. Nó nằm im trong mục
"skipped" hàng tháng trời, và không ai biết ngoài locator ra nó còn sai gì nữa — locator
đúng rồi, bỏ `fixme`, mới phát hiện thêm ba chỗ khác hỏng. Để nó đỏ thì mọi vấn đề lộ ra
cùng một lúc, ở lần chạy đầu tiên.

Trong thực tế phần lớn case như vậy sẽ **skip** chứ không đỏ, vì chúng còn vướng
`test.skip(...)` do thiếu dữ liệu. Chỉ case đã đủ dữ liệu mới thật sự đỏ — và đó đúng là
case đáng đỏ.

**Một ngoại lệ: `ENDPOINT-TBD` thì VẪN `test.fixme()`.**

| Marker | Bật hay tắt | Vì sao |
|---|---|---|
| `LOCATOR-TBD` | **bật** | selector không khớp → đỏ, thông báo tự tố cáo |
| `DATA-TBD` | **bật** | đã có `test.skip(...)` chặn khi thiếu dữ liệu → skip, không đỏ bừa |
| `ENDPOINT-TBD` | **`fixme`** | route không khớp thì request đi bình thường và test có thể **XANH GIẢ** |

Khác biệt nằm ở chỗ hỏng thế nào. Locator sai thì đỏ — đỏ là thông tin. Đường dẫn route
sai thì `page.route` không chặn gì, app chạy đường thành công, assertion "có toast" vẫn
đúng, và bạn nhận một dấu tích xanh cho một case chưa từng được kiểm. Đó là thứ tệ hơn cả
không có test.

### Khi nào KHÔNG sinh

Bước 1 không validate, nên bảng này là chỗ **duy nhất** chặn case hỏng. Chặn từng case,
không chặn cả file.

| Tình huống trong JSON | Xử lý |
|---|---|
| `source: "inferred"` | Không đưa vào bộ chạy. Giả định chưa ai xác nhận — luật ở `testcase-standard` |
| `description` không đọc ra hành động nào | Mơ hồ, mô tả trạng thái, hoặc hai việc trong một dòng → bỏ case, trích nguyên văn câu đó |
| Không biết case thuộc màn hình nào | **Không tạo page object mới**, hỏi người |
| Case cần một **profile dữ liệu chưa khai** trong `docs/test-data.md` | `DATA-TBD` + `test.skip(true, ...)`, case vẫn bật, ghi profile còn thiếu vào summary. **Không tự đặt tên biến `.env`** |
| Case cần **kênh ngoài** (hộp thư · TOTP · SMS) chưa khai ở mục 2 của `test-data.md` | `DATA-TBD` + `test.skip(true, ...)` — không có đường lấy dữ liệu thì test chưa chạy được, nhưng vẫn nằm trong danh sách |
| `steps` rỗng | Không có gì để sinh, bỏ qua và báo lại |
| `expected` của step cuối rỗng | Case không khẳng định điều gì → bỏ qua và báo lại |
| `expected` kiểu "Theo design", "Đúng UI" | Kiểm thị giác, không phải assertion chức năng → `test.fixme` |

### Báo cáo trước khi dừng

Sinh được bao nhiêu case **trên tổng số đọc được ở bước 1**, bao nhiêu `LOCATOR-TBD` và
nằm ở đâu, case nào bị bỏ vì lý do gì trong bảng trên. Hai con số đó phải khớp nhau: mỗi
case không sinh đều có một dòng lý do. **Đừng nói "đã xong" khi còn TBD** — draft chưa
phải script chạy được.

Đây là bản nói trong chat. Bản ghi ra đĩa là **bước 6**, và nó mới là bản còn lại sau khi
phiên chat đóng.

---

## Bước 3 — Tìm locator thật

Hai nguồn, **theo đúng thứ tự này**. Đảo thứ tự là tự tạo ra locator trùng.

### 3a. Tìm trong page object đã có — làm trước, tự động

Màn hình này rất có thể đã được implement một phần: một case trước đó đã mở app, đã lấy
locator thật, và đã ghi vào class. Lấy lại chúng.

Thư mục để soát lấy từ mục 1 và mục 2 của `docs/test-structure.md`:

```bash
# class của màn hình đang làm, và mọi component nó dùng
cat <thư mục page object>/<TênMànHình>.ts
grep -rnE "readonly |async " <thư mục page object>/ <thư mục component>/
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
Quan trọng: skip bước này

Chưa có giải pháp tự động cho phần này.


## Bước 4 — Cập nhật locator vào script
Quan trọng: skip bước này

## Bước 5 — Verify syntax

```bash
npm run typecheck
```

Kiểm tra syntax

---

## Bước 6 — Ghi file summary

Sau một lượt sinh, mỗi case rơi vào một trong bốn trạng thái:

| Trạng thái | Nghĩa là | Trong report |
|---|---|---|
| **xanh** | đủ locator, đủ dữ liệu | passed |
| **đỏ — chờ locator** | có code, `LOCATOR-TBD` chưa lấy xong | failed, thông báo chứa `LOCATOR-TBD` |
| **skip — chờ dữ liệu** | có code, `DATA-TBD` hoặc thiếu key `.env` | skipped, kèm lý do |
| **bỏ** | không sinh dòng nào | không có trong report |

Bốn trạng thái đó là công việc còn nợ — mà nói trong chat thì chúng biến mất cùng phiên
chat, còn đọc code thì phải mở năm file mới ghép lại được bức tranh.

**"Đỏ — chờ locator" là bình thường ở lượt sinh đầu tiên**, không phải sự cố. Đừng tắt
chúng đi cho report sạch: một suite sạch vì đã giấu việc còn nợ là một suite nói dối.

Nên ghi ra đĩa. **Một file JSON đầu vào → một file summary**, ghi đè mỗi lần chạy lại:

```
testcase/summary/<tên file json, bỏ đuôi .json>.md
```

`testcase/Manage_Testcase.json` → `testcase/summary/Manage_Testcase.md`.

### Khuôn

````markdown
# Gen-script — Manage_Testcase

Nguồn `testcase/Manage_Testcase.json` · 8 case · sinh 6, bỏ 2 · typecheck: xanh
2 xanh · 4 đỏ chờ locator · 0 skip chờ dữ liệu

## Trạng thái từng case

| Case | Trạng thái | Vì sao |
|---|---|---|
| TB1.1 | xanh | — |
| TB1.0 | đỏ — chờ locator | `StockPage.heading` · `StockPage.appDownload` |
| TB1.4 | bỏ | step 2 "Xác thực qua IdP" không đọc ra hành động |

## Việc còn nợ — locator phải lấy từ DOM

| Class | Field | Phần tử cần tìm | Case cần |
|---|---|---|---|
| `StockPage` | `heading` | tiêu đề "Kho hàng" | TB1.0 |
| `StockPage` | `appDownload` | 3 nút tải app ở footer | TB1.0 |

## Việc còn nợ — dữ liệu

| Profile cần | Trạng thái | Case cần | Ghi chú |
|---|---|---|---|
| `locked` | tài khoản đã bị khoá | TB2.9 | chưa khai trong `docs/test-data.md` |
| `mailbox` | hộp thư có API | TB3.3 | kênh ngoài, chưa chốt công cụ |

Profile PHÁ HUỶ đã dùng thì chép luôn cột "reset bằng" vào đây — người chạy lần hai cần nó.

## Cần người quyết

- Màn "Xác thực mã" chưa có trong bảng ánh xạ mục 4 — thêm page object hay bỏ case?
- Chuỗi "Tài khoản đã bị khóa" lấy từ test case, chưa đối chiếu DOM.

## File đã đụng

- `src/pages/StockPage.ts` — thêm 2 locator TBD, 1 method
- `tests/ui/stock/tb.spec.ts` — mới, 6 test
````

### Luật

| | |
|---|---|
| **Mỗi case đúng một dòng** | Số dòng phải bằng số case đọc ở bước 1. Thiếu một dòng là giấu một case |
| **Lý do phải hành động được** | "thiếu locator: tiêu đề màn, nút tải app" — không phải "chưa hoàn thiện", không phải "cần bổ sung" |
| **Nói rõ class nào, field nào** | Người đi lấy locator cần biết mở file nào, sửa dòng nào. Một bảng không có cột class là một bảng phải tự đi tìm lại |
| **Ngắn** | Không chép lại `description`, không chép code. Người đọc mở file gốc là thấy — summary chỉ trả lời "còn nợ gì" |
| **Ghi cả kết quả bước 5** | Typecheck đỏ mà summary ghi xanh thì file này hỏng ngay ở lần dùng đầu tiên |
| **Chỉ ghi đè summary của chính file đang chạy** | Chạy `part2` thì không đụng `part1.md`. Mỗi suite giữ lịch sử của nó |

Ghi xong thì nói ra đường dẫn file. Đó là dòng cuối của một lượt sinh.

---

## Cấm

- **`page.waitForTimeout`** trong code đã commit. Dựa vào auto-waiting và web-first
  assertion.
- **Đăng nhập trong `beforeEach`.** Session do project `setup` lo, một lần cho cả lần chạy.
  Cần đăng nhập riêng thì dùng `createAuthFixture` của dự án (`src/core`) — một lần mỗi worker.
- **Hardcode đường dẫn screenshot.** Dùng `screenshot(name)` của page/component — worker
  song song sẽ ghi đè nhau.
- **Test phụ thuộc thứ tự chạy.** Mỗi test tự tạo dữ liệu nó cần, tên sinh duy nhất.
- **Sinh script khi chưa chốt tên file JSON.** Không tự nhặt một file trong `testcase/`,
  không lấy file đọc ở lượt trước, không dùng file ngoài repo — xem bước 0.
- **Kết thúc một lượt sinh mà chưa ghi file summary.** Trạng thái nằm trong chat là trạng
  thái mất khi đóng chat — xem bước 6.
- **Tự đặt tên biến `.env` cho một trạng thái dữ liệu chưa ai khai.** Biến bịa thì không
  ai cấp, case `skip` vĩnh viễn, và cái tên đó không truy được về đâu. Dùng đúng key mà
  `docs/test-data.md` khai, hoặc đánh `DATA-TBD` — xem bước 2.
- **Cho case dùng profile PHÁ HUỶ chạy song song.** Chúng dẫm lên trạng thái của nhau;
  gói trong một `describe` chạy `serial`.

## Không thuộc skill này

| Việc | Thuộc về |
|---|---|
| Một test case hợp lệ gồm gì, `source`, cách viết `description` | skill `testcase-standard` |
| Đọc file Excel, sinh ra JSON | `convertExcelToTestCases()` của qc-kit |
| Nghĩ ra case mới | `platform-qc-agent` — **không phải** ở đây |
| Base class, fixture, helper dùng được cho **mọi** sản phẩm | **qc-kit** — đề xuất ở đó, nâng version |
| Sửa `.claude/skills/*` | **qc-kit** — bản ở đây là bản sao |
| Quyết dự án chia thư mục kiểu gì | `docs/test-structure.md` — **dự án** sở hữu, kit chỉ phát hành bản mẫu |

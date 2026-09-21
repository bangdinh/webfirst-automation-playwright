# Quy tắc đặt `data-testid` — gửi Dev

Mục tiêu: Dev gắn `data-testid` không cần suy nghĩ nhiều — chỉ cần tra bảng bên dưới theo loại phần tử.
QA/AI Agent sẽ dựa vào đúng các id này để tự động hoá test, không dùng text hiển thị hay class UI
(vì text/class đổi theo thời gian, `data-testid` thì không).

## Công thức chung

```
data-testid="<module>-<field-hoặc-hành-động>-<loại-phần-tử>[-<qualifier>]"
```

- **module**: tên khu vực/tính năng, viết thường, nối gạch ngang. VD: `login`, `fixed-shift`, `heatmap`, `face-recognition`, `shift-assignment`.
- **field/hành động**: tên field hoặc hành động cụ thể. VD: `name`, `save`, `start-date`.
- **loại phần tử**: xem bảng bên dưới.
- **qualifier** (nếu có): index hoặc id thật, dùng cho phần tử lặp lại (row, item, option).

Toàn bộ viết thường, nối bằng `-` (kebab-case). Không dùng camelCase, không dùng dấu `_`.

## Bảng tra theo loại phần tử

| Loại phần tử | Pattern | Ví dụ thực tế trong repo |
|---|---|---|
| Nút bấm (button) | `<module>-<action>-btn` | `fixed-shift-save-btn`, `fixed-shift-add-shift-btn` |
| Ô nhập liệu (input/textbox) | `<module>-<field>-input` | `fixed-shift-name-input`, `fixed-shift-start-date` |
| Nhóm radio (root) | `<module>-<field>-radio-group` | `fixed-shift-time-apply-radio-group` |
| Từng lựa chọn radio | `<module>-<field>-radio-<value>` | `fixed-shift-time-apply-radio-1` |
| Checkbox (đơn) | `<module>-<field>-checkbox` | `fixed-shift-repeat-checkbox` |
| Checkbox lặp (list) | `<module>-<field>-checkbox-<index>` | `fixed-shift-row-0-weekday-2` |
| Dropdown/select | `<module>-<field>-select` | `field-filter-unit-select` |
| Option trong dropdown | `<module>-<field>-option-<value>` | `field-filter-unit-option-by-hour` |
| Tiêu đề/heading | `<module>-<section>-heading` | `fixed-shift-setup-heading` |
| Form/section bao ngoài | `<module>-<section>-form` | `fixed-shift-setup-form` |
| Modal/dialog | `<module>-<purpose>-modal` | `fixed-shift-preview-calendar-modal` |
| Bảng (table) | `<module>-<name>-table` | `shift-split-shifts-table` |
| Ô tiêu đề cột trong bảng | `<module>-<table>-header-cell-<column>` | `split-shifts-table-header-cell-name` |
| Dòng trong bảng (lặp) | `<module>-<table>-row-<id>` | `shift-assignment-row-{id}` |
| Danh sách/card | `<module>-<name>-list` | `company-list` |
| Item trong danh sách (lặp) | `<module>-<name>-item-<index>` | `company-item-2` |
| Text báo lỗi/helper text | `<module>-<field>-error` | `fixed-shift-name-error` |
| Link điều hướng | `<module>-<name>-link` | `ai-service-link` |
| Icon-only button | `<module>-<action>-icon-btn` | `search-icon-btn` |

## Nguyên tắc chung (rule of thumb)

1. **Không dùng text hiển thị hoặc class UI** làm căn cứ — chỉ dùng `data-testid` cố định. (Bài học thực tế: nút đổi text "Thêm" → "Lưu" đã làm test fail vì code cũ dùng `getByRole('button', {name: 'Thêm'})`.)
2. **Gắn ở phần tử tương tác trực tiếp** (input/button/checkbox thật) — không gắn ở `<div>` bao ngoài không click/fill được.
3. **Phần tử lặp lại** (row, item, option, checkbox trong danh sách) — luôn thêm index hoặc id thật ở cuối, không dùng tên chung chung cho cả danh sách.
4. **Không đổi `data-testid` khi đổi text/label hiển thị** — id là hợp đồng ổn định giữa Dev và Test, tách biệt hoàn toàn khỏi nội dung UI.
5. **Ưu tiên tái sử dụng tên field/state đã có trong code** (tên prop, tên state React) thay vì nghĩ tên mới, miễn giữ đúng format kebab-case.
6. Nếu 1 phần tử vừa có `id`, vừa cần `data-testid` — vẫn thêm `data-testid` riêng, không dùng chung `id` (vì `id` có thể trùng mục đích khác như CSS/anchor).

## Prompt sẵn để dán cho AI — module `login`

Đang chờ Dev gắn `data-testid` cho màn "Mã doanh nghiệp" (`beta-vmsmart-next.fcam.vn/vi/login`,
xem `memory/vmsmart-login-flow.md`). Copy nguyên khối bên dưới, dán thẳng vào AI coding assistant
của Dev (Cursor/Copilot/Claude...) đang mở đúng file UI màn này:

```
Gắn thuộc tính data-testid cho các phần tử tương tác trong file UI tôi chỉ định, theo đúng
quy chuẩn sau — không tự nghĩ tên khác:

CÔNG THỨC
  data-testid="<module>-<field-hoặc-hành-động>-<loại-phần-tử>[-<qualifier>]"
  Toàn bộ viết thường, nối bằng dấu "-" (kebab-case). Không camelCase, không dấu "_".

TRA THEO LOẠI PHẦN TỬ
  button          → <module>-<action>-btn
  input/textbox   → <module>-<field>-input
  radio group     → <module>-<field>-radio-group
  radio option    → <module>-<field>-radio-<value>
  checkbox đơn    → <module>-<field>-checkbox
  checkbox lặp    → <module>-<field>-checkbox-<index>
  select/dropdown → <module>-<field>-select
  option dropdown → <module>-<field>-option-<value>
  heading         → <module>-<section>-heading
  form/section    → <module>-<section>-form
  modal/dialog    → <module>-<purpose>-modal
  table           → <module>-<name>-table
  header cell     → <module>-<table>-header-cell-<column>
  row lặp         → <module>-<table>-row-<id>
  list/card       → <module>-<name>-list
  item lặp        → <module>-<name>-item-<index>
  error/helper    → <module>-<field>-error
  link            → <module>-<name>-link
  icon-only btn   → <module>-<action>-icon-btn

NGUYÊN TẮC
  1. Không dùng text hiển thị/class làm căn cứ — chỉ data-testid cố định.
  2. Gắn ở phần tử tương tác trực tiếp, không gắn ở div bao ngoài.
  3. Phần tử lặp lại luôn thêm index/id thật ở cuối tên.
  4. Không đổi data-testid khi đổi text/label hiển thị.
  5. Ưu tiên tái dùng tên field/state đã có trong code.
  6. Có id rồi vẫn thêm data-testid riêng, không dùng chung id.

CẦN GẮN NGAY — module "login", màn "Mã doanh nghiệp"
  (KHÔNG áp dụng cho màn đăng nhập SSO — nếu đó là trang Keycloak/domain SSO riêng,
  ngoài codebase này, thì bỏ qua, không sửa.)

  - Ô nhập "Mã doanh nghiệp"               → login-tenant-code-input
  - Nút "Tiếp tục"                         → login-continue-btn
  - Nút "Dùng thử bản demo"                → login-demo-btn
  - Dòng lỗi "Mã doanh nghiệp không đúng"  → login-tenant-code-error

Sau khi gắn xong, liệt kê lại đúng những data-testid đã thêm (tên + file) để tôi đối chiếu
với tests/bdd/steps/login.steps.ts phía QA.
```

## Cách gửi cho Dev

Đính kèm file này (đã có sẵn prompt để dán cho AI ở mục trên) + danh sách các `data-testid (TBD)` cụ thể được liệt kê ra sau mỗi lần convert UAT (xem cột `data-testid` trong `docs/uat-template.xlsx`, sheet "Ví dụ - home.feature" và các sheet UAT thật sau này) — Dev chỉ cần tra bảng trên và gắn đúng theo tên đã liệt kê sẵn, không cần tự nghĩ tên mới.

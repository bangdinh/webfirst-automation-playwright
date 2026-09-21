# Quy tắc đặt `data-testid` — bản mẫu

> Copy thành `docs/data-testid-convention.md` rồi sửa cho khớp quy ước của Dev bên bạn.
> **Dự án sở hữu file này**; `npx qc-kit sync` chỉ refresh bản `.example` này.
>
> Đây là **hợp đồng giữa Dev và automation**, không phải tài liệu nội bộ của QA: Dev gắn
> id theo đây, bộ test tìm phần tử theo đây. Skill `gen-script` đọc nó ở bước 2 để **suy
> ra tên id** thay vì để trống `LOCATOR-TBD`. Không có file này thì mọi locator vẫn là
> `LOCATOR-TBD` — không hỏng gì, chỉ là không suy được tên.

Mục tiêu: Dev gắn `data-testid` không cần nghĩ tên — chỉ tra bảng theo loại phần tử.
Automation bám vào đúng các id đó, không bám text hiển thị hay class UI, vì text và class
đổi theo thời gian còn `data-testid` thì không.

## Công thức

```
data-testid="<module>-<field-hoặc-hành-động>-<loại-phần-tử>[-<qualifier>]"
```

- **module** — tên khu vực/tính năng, kebab-case. VD: `login`, `stock`, `order-detail`.
  Khai ở bảng "Module" trong `docs/test-structure.md`; đó là nơi duy nhất `gen-script` và
  lint đọc nó.
- **field / hành động** — tên field hoặc hành động. VD: `username`, `save`, `start-date`.
- **loại phần tử** — tra bảng dưới.
- **qualifier** — index hoặc id thật, chỉ dùng cho phần tử lặp (row, item, option).

Toàn bộ viết thường, nối bằng `-`. Không camelCase, không `_`.

## Bảng tra theo loại phần tử

Sửa cột `Hậu tố` nếu Dev bên bạn dùng khác (`-button` thay `-btn`…). **`gen-script` đọc
bảng này**, nó không hardcode hậu tố nào.

| Loại phần tử | Hậu tố | Ví dụ |
|---|---|---|
| Nút bấm | `<module>-<action>-btn` | `stock-save-btn` |
| Ô nhập liệu | `<module>-<field>-input` | `stock-name-input` |
| Nhóm radio | `<module>-<field>-radio-group` | `stock-unit-radio-group` |
| Một lựa chọn radio | `<module>-<field>-radio-<value>` | `stock-unit-radio-kg` |
| Checkbox đơn | `<module>-<field>-checkbox` | `stock-active-checkbox` |
| Checkbox trong danh sách | `<module>-<field>-checkbox-<index>` | `stock-day-checkbox-2` |
| Dropdown | `<module>-<field>-select` | `stock-unit-select` |
| Option trong dropdown | `<module>-<field>-option-<value>` | `stock-unit-option-kg` |
| Tiêu đề | `<module>-<section>-heading` | `stock-list-heading` |
| Form / section | `<module>-<section>-form` | `stock-edit-form` |
| Modal / dialog | `<module>-<purpose>-modal` | `stock-delete-confirm-modal` |
| Bảng | `<module>-<name>-table` | `stock-items-table` |
| Ô tiêu đề cột | `<module>-<table>-header-cell-<column>` | `stock-items-table-header-cell-name` |
| Dòng trong bảng | `<module>-<table>-row-<id>` | `stock-items-table-row-42` |
| Danh sách / card | `<module>-<name>-list` | `stock-category-list` |
| Item trong danh sách | `<module>-<name>-item-<index>` | `stock-category-item-2` |
| Text báo lỗi | `<module>-<field>-error` | `stock-name-error` |
| Link điều hướng | `<module>-<name>-link` | `stock-report-link` |
| Nút chỉ có icon | `<module>-<action>-icon-btn` | `stock-search-icon-btn` |

## Nguyên tắc

1. **Không bám text hiển thị hay class UI** — chỉ `data-testid`. Nút đổi chữ "Thêm" thành
   "Lưu" là đủ làm đỏ mọi test dùng `getByRole('button', { name: 'Thêm' })`.
2. **Gắn ở phần tử tương tác thật** (input, button, checkbox), không ở `<div>` bao ngoài.
3. **Phần tử lặp luôn có index hoặc id thật ở cuối** — không dùng một tên chung cho cả
   danh sách.
4. **Đổi text/label không đổi `data-testid`.** Id là hợp đồng, tách khỏi nội dung UI.
5. **Tái dùng tên field/state đã có trong code** thay vì nghĩ tên mới, miễn đúng kebab-case.
6. **Có `id` rồi vẫn thêm `data-testid` riêng** — `id` còn phục vụ CSS và anchor.

## Khuôn gửi Dev

`gen-script` bước 3b gom tên đã suy vào `docs/testid-requests/<module>.md` theo **đúng
khuôn dưới**. Sửa khuôn ở đây thì file sinh ra đổi theo.

```
Gắn thuộc tính data-testid cho các phần tử tương tác trong file UI tôi chỉ định, theo đúng
quy chuẩn sau — không tự nghĩ tên khác.

CÔNG THỨC
  data-testid="<module>-<field-hoặc-hành-động>-<loại-phần-tử>[-<qualifier>]"
  Toàn bộ viết thường, nối bằng "-". Không camelCase, không "_".

TRA THEO LOẠI PHẦN TỬ
  button → -btn   ·  input → -input   ·  select → -select  ·  checkbox → -checkbox
  radio group → -radio-group          ·  radio option → -radio-<value>
  heading → -heading  ·  form → -form ·  modal → -modal    ·  table → -table
  row lặp → -row-<id> ·  list → -list ·  item lặp → -item-<index>
  error → -error      ·  link → -link ·  icon-only btn → -icon-btn

NGUYÊN TẮC
  1. Không bám text hiển thị/class — chỉ data-testid cố định.
  2. Gắn ở phần tử tương tác thật, không ở div bao ngoài.
  3. Phần tử lặp luôn có index/id thật ở cuối.
  4. Đổi text/label không đổi data-testid.
  5. Ưu tiên tái dùng tên field/state đã có trong code.
  6. Có id rồi vẫn thêm data-testid riêng.

CẦN GẮN NGAY — module "<module>", màn "<tên màn>"
  <gen-script điền danh sách ở đây>

Sau khi gắn xong, liệt kê lại đúng những data-testid đã thêm (tên + file) để tôi đối chiếu.
```

Câu cuối là bước **đối chiếu**, đừng bỏ: Dev gắn tên khác thì tên của Dev thắng, và bộ
test sửa theo.

## Màn hình NGOÀI codebase của Dev

Trang IdP/SSO, cổng thanh toán, iframe của bên thứ ba — Dev không sửa được file họ không
sở hữu. Liệt kê ở đây để `gen-script` không sinh yêu cầu vô nghĩa cho chúng:

| Màn hình | Vì sao ngoài tầm | Locator dùng gì thay thế |
|---|---|---|
| *(điền)* | | |

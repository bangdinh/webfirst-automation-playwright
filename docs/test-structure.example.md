# Cấu trúc bộ test của `web-automation` — BẢN MẪU

> **File này do qc-kit phát hành.** Đừng điền vào đây — nó bị ghi đè ở lần
> `npx qc-kit sync` tiếp theo.
>
> ```bash
> cp docs/test-structure.example.md docs/test-structure.md
> ```
>
> Rồi điền `docs/test-structure.md`. File đó thuộc về dự án, `sync` không đụng tới.

Skill `gen-script` **đọc `docs/test-structure.md` trước khi ghi bất kỳ file nào**. Kit
không biết dự án chia thư mục kiểu gì, nên nó hỏi ở đây thay vì đoán. Thiếu file này thì
`gen-script` dừng.

Mỗi mục dưới đây phải có **một ví dụ thật của dự án**, không phải câu mô tả. Bộ sinh chép
theo hình dạng: một dòng đường dẫn thật đáng giá hơn ba câu giải thích.

---

## 1. Page object

**Thư mục gốc:** `src/pages/`

**Cách chia:** _(phẳng · theo khu vực · theo module — chọn một, nêu rõ)_

**Quy ước tên:** tên file = tên class, PascalCase, hậu tố `Page`.

```
src/pages/StockPage.ts          →  export class StockPage extends BasePage
```

## 2. Component

Dialog, menu, bảng, header — thứ dùng lại ở nhiều màn hình và **không có URL riêng**.

**Thư mục gốc:** `src/components/`

```
src/components/AddItemDialog.ts →  export class AddItemDialog extends BaseComponent
```

## 3. Spec

**Thư mục gốc:** `tests/ui/`

**Một file cho mỗi:** _(nhóm `test_case_id` cùng tiền tố · màn hình · luồng nghiệp vụ)_

**Quy ước tên:** kebab-case, hậu tố `.spec.ts`.

```
tests/ui/stock.spec.ts
```

## 4. Ánh xạ màn hình → thư mục

Bảng này là thứ `gen-script` dùng để quyết một case đi vào đâu. Liệt kê **màn hình có
thật** của dự án, đừng để trống.

| Màn hình | Page object | Spec |
|---|---|---|
| Kho hàng | `src/pages/StockPage.ts` | `tests/ui/stock.spec.ts` |

Màn hình chưa có trong bảng → `gen-script` **hỏi người**, không tự tạo thư mục mới.

## 5. Import

Spec import `test` từ đâu, và đường dẫn tương đối tính từ thư mục spec:

```ts
import { expect, test } from '../../src/fixtures';
```

Có alias (`@/pages/…`) thì ghi rõ ở đây, kèm nơi khai báo (`tsconfig.json` → `paths`).

## 6. Ngoại lệ

Chỗ nào không theo luật chung, và **vì sao**. Không có thì ghi "không có" — đừng xoá mục
này, người đọc sau cần biết là đã có người nghĩ tới.

---

## Vì sao tách khỏi `CLAUDE.md`

`CLAUDE.md` nạp vào mọi prompt nên phải gọn; bảng ánh xạ ở mục 4 sẽ dài ra theo dự án.
Quan trọng hơn: một thông tin chỉ nên có **một** nguồn. `CLAUDE.md` nên trỏ sang file này
thay vì mô tả lại cấu trúc — hai bản mô tả sẽ lệch nhau sau vài tháng.

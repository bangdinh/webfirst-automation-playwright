# Luồng `gen-script` — thư mục nào được gọi ở bước nào

Cái nhìn tổng quan cho `web-automation`: khi chạy `/gen-script <file.json>`, AI đọc gì, ghi
gì, ở bước nào, và dừng ở đâu.

Skill do qc-kit phát hành (`.claude/skills/gen-script/SKILL.md`); luật cấu trúc thư mục do
dự án sở hữu ([`test-structure.md`](test-structure.md)).

---

## Bản đồ — ai sở hữu cái gì

```
webfirst-automation-playwright/
│
├─ testcase/                       ĐẦU VÀO   ·  JSON từ convertExcelToTestCases()
│  └─ *.json
│
├─ docs/
│  ├─ test-structure.md            LUẬT      ·  DỰ ÁN sở hữu — sync không đụng
│  ├─ test-structure.example.md    bản mẫu   ·  KIT phát hành — sync ghi đè
│  └─ gen-script-flow.md           file này  ·  DỰ ÁN sở hữu
│
├─ .claude/skills/gen-script/      QUY TRÌNH ·  KIT phát hành — sync ghi đè
│  └─ SKILL.md                                  sửa ở kit, không sửa tại chỗ
│
├─ src/
│  ├─ pages/<khu vực>/             ĐỌC + GHI ·  page object
│  │  └─ tabs/                                  màn con
│  ├─ components/                  ĐỌC + GHI ·  dialog, menu, bảng dùng chung
│  └─ fixtures.ts                  ĐỌC       ·  cửa vào duy nhất của spec
│
├─ tests/ui/<khu vực>/             GHI       ·  spec
│
└─ playwright/.auth/user.json      ĐỌC       ·  session của project `setup`, dùng ở 3b
```

**Quy tắc một dòng:** thư mục nào kit ghi đè thì đừng sửa tại chỗ; thư mục nào dự án sở
hữu thì kit không bao giờ đụng.

---

## Năm bước

```
  testcase/*.json
        │
   ┌────▼─────────────────────────────────────────────────────┐
   │ 1  ĐỌC JSON                                              │
   │    đọc  testcase/<file>.json                             │
   │    ra   "— N test case"  +  cách gom theo màn hình        │
   │    DỪNG nếu  JSON hỏng cú pháp / sai đường dẫn            │
   └────┬─────────────────────────────────────────────────────┘
        │
   ┌────▼─────────────────────────────────────────────────────┐
   │ 2  SINH DRAFT                                            │
   │    đọc  docs/test-structure.md      ← luật, đọc TRƯỚC     │
   │         src/pages/<khu vực>/        ← class đã có chưa    │
   │    ghi  src/pages/<khu vực>/<Tên>Page.ts                 │
   │         src/components/<Tên>.ts     (nếu là dialog/menu)  │
   │         tests/ui/<khu vực>/<tên>.spec.ts                 │
   │    DỪNG nếu  thiếu test-structure.md                      │
   │              · file còn nguyên như bản mẫu                │
   │              · màn hình không có trong bảng ánh xạ mục 4  │
   └────┬─────────────────────────────────────────────────────┘
        │  lỗ locator = LOCATOR-TBD
   ┌────▼─────────────────────────────────────────────────────┐
   │ 3a TÌM TRONG PAGE OBJECT CÓ SẴN            (tự động)     │
   │    đọc  src/pages/<khu vực>/  ·  src/components/          │
   │    ra   locator/method dùng lại được → xoá LOCATOR-TBD    │
   └────┬─────────────────────────────────────────────────────┘
        │  còn thiếu?
   ┌────▼─────────────────────────────────────────────────────┐
   │ 3b MỞ APP THẬT ĐỌC DOM                     (làm tay)     │
   │    đọc  playwright/.auth/user.json  ← session có sẵn      │
   │    ra   locator thật                                      │
   │    GIỮ LOCATOR-TBD nếu chưa mở app được — hợp lệ          │
   └────┬─────────────────────────────────────────────────────┘
        │
   ┌────▼─────────────────────────────────────────────────────┐
   │ 4  CẬP NHẬT LOCATOR                                      │
   │    ghi  src/pages/…  ·  src/components/…                 │
   │         bỏ test.fixme của ĐÚNG case vừa đủ locator        │
   └────┬─────────────────────────────────────────────────────┘
        │
   ┌────▼─────────────────────────────────────────────────────┐
   │ 5  VERIFY                                                │
   │    chạy  npm run typecheck                                │
   └──────────────────────────────────────────────────────────┘
```

---

## Bảng tra nhanh

| Bước | Đọc | Ghi | Dừng khi |
|---|---|---|---|
| 1 | `testcase/*.json` | — | JSON hỏng cú pháp |
| 2 | `docs/test-structure.md`, `src/pages/` | `src/pages/`, `src/components/`, `tests/ui/` | thiếu luật cấu trúc, hoặc màn hình ngoài bảng ánh xạ |
| 3a | `src/pages/`, `src/components/` | — | — |
| 3b | `playwright/.auth/user.json` → app thật | — | không mở được app → giữ `LOCATOR-TBD` |
| 4 | `grep LOCATOR-TBD` | `src/pages/`, `src/components/`, `tests/ui/` | — |
| 5 | — | — | typecheck đỏ |

---

## Ví dụ thật: `Manage_TC_001`

| Bước | Chuyện gì xảy ra |
|---|---|
| 1 | `testcase/Manage_TestCase_v1.0.0.json` → 1 case. Gom: một màn hình, suy từ chuỗi 4 step điều hướng |
| 2 | `docs/test-structure.md` mục 4 trả lời: `src/pages/manage/ManagePage.ts` + `tests/ui/manage/manage.spec.ts`. **Không phải hỏi người.** Sinh 2 file, 4 `LOCATOR-TBD` |
| 3a | Soát `src/pages/` → tái dùng `Header.moQuanLy()` cho step 1. Còn 4 |
| 3b | Chưa chạy → giữ `LOCATOR-TBD`, case ở `test.fixme` |
| 4 | Chưa tới |
| 5 | `npm run typecheck` sạch |

Tỉ lệ cần báo mỗi lần sinh: **1 tái dùng / 4 lấy mới**. Đó là thước đo page object đang
lớn lên hay đang bị chép lại.

---

## Ba chỗ dễ nhầm

**1. Bước 2 đọc `test-structure.md` TRƯỚC khi ghi, không phải sau.** Kit không biết dự án
chia thư mục kiểu gì. Đoán sai thì sinh ra một cây thư mục thứ hai nằm cạnh cây đang có, và
không ai phát hiện cho tới lúc review.

**2. Bước 3a chạy TRƯỚC 3b.** Đảo lại là tự tạo locator trùng: cùng một nút khai hai lần ở
hai chỗ, hôm Dev đổi UI thì sửa một cái và quên cái kia.

**3. `LOCATOR-TBD` không phải thất bại.** Nó là trạng thái hợp lệ khi chưa mở được app.
Draft vẫn `grep` ra được, case ở `test.fixme` nên nhìn thấy trong report mà không nhuộm đỏ
suite, và quan trọng nhất: không có locator bịa nào lọt vào.

---

## Sửa luồng này ở đâu

| Muốn đổi | Sửa ở |
|---|---|
| Quy trình 5 bước, luật ánh xạ hành động, quy ước `LOCATOR-TBD` | **qc-kit** → `cmd/scaffold/templates/claude/skills/gen-script/SKILL.md.tmpl`, rồi nâng version |
| Thư mục, cách chia khu vực, bảng ánh xạ màn hình | **dự án** → [`docs/test-structure.md`](test-structure.md) |
| Hình dạng JSON đầu vào | **qc-kit** → `convertExcelToTestCases()` |
| Nghĩ ra case mới | `platform-qc-agent` — không phải ở đây |

Thử nhanh một thay đổi ở kit mà chưa muốn commit/tag:

```bash
cd ../qc-kit && npm run build
```

```bash
node "../qc-kit/cmd/scaffold/index.js" sync .
```

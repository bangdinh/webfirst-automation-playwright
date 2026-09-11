# CLAUDE.md

Hướng dẫn cho Claude Code trong repo này. **Giữ file này gọn** — nó nạp vào mọi prompt.

## Đây là cái gì

`web-automation` — bộ test automation dựng trên [qc-kit](https://github.com/bangdinh/qc-kit).

Kit lo **cơ chế**: cấu hình, session, step vào report, base class, hợp đồng test case.
Repo này lo **sản phẩm**: locator, URL, tài khoản, và các case của nó. Ranh giới đó là thứ
giữ cho việc nâng cấp kit không phải sửa test.

## Luật — vi phạm nghĩa là code đang nằm sai repo

1. **Không viết lại code khung.** Cần một base class, một fixture, một helper dùng được
   cho mọi sản phẩm? Nó thuộc về qc-kit — đề xuất thêm ở đó rồi nâng version, đừng chép
   vào đây.
2. **Không sửa file trong `.claude/skills/`.** Chúng do kit phát hành; sửa tại chỗ sẽ mất
   ở lần `npx qc-kit sync` tiếp theo. Sai thì sửa ở kit.
3. **Locator lấy từ DOM thật**, không bịa `data-testid` rồi hy vọng nó tồn tại.
4. **Không đăng nhập trong `beforeEach`.** Session do project `setup` lo, một lần cho cả
   lần chạy.

## Verify

```bash
npm run typecheck        # kit đổi API thì đây là chỗ bắt được
npx playwright test
npx playwright test --project=chromium -g "@smoke"
```

## Nâng cấp qc-kit

```bash
npm i "github:bangdinh/qc-kit#<tag-mới>"   # xem tag ở trang tags của kit
npx qc-kit sync                             # refresh .claude/skills theo bản kit vừa cài
npm run typecheck && npx playwright test
```

Đọc CHANGELOG của kit trước khi nâng **minor** — pre-1.0 thì minor mang thay đổi phá vỡ.

## Cấu trúc

```
src/env.ts        bảng môi trường — file duy nhất biết một URL
src/fixtures.ts   cửa vào duy nhất của spec; compose fixture của kit
src/pages/        một màn hình một class, kế thừa BasePage của kit
tests/ui/         spec UI
```

## Skills

- **qc-flow** — thêm một màn hình / một luồng / một spec thì làm gì, theo thứ tự nào.
- **testcase-standard** — một test case phải trông thế nào.
- **jira** — ghi việc lên Jira; phân biệt bug sản phẩm với lỗi của bộ test.

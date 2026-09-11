---
name: jira
description: Jira jira.fcam.vn project RPA cho bo test web-automation - doc issue, tao task/sub-task, comment, Ticket Point, worklog, chuyen trang thai, va tach bug san pham khoi viec cua qc-kit. Kich hoat khi nhac "jira", "issue", "task", "sub-task", "ticket", "point", "worklog", "chuyen trang thai", "bao bug", hoac ma RPA-1234.
---

# Jira (jira.fcam.vn) — web-automation

Project mặc định: **RPA**, board **239** (`RPA Q3 - NewWebFirst-NewCoreFit`). Token gắn với
**instance**, không phải project — cùng một PAT dùng được cho RPA lẫn B2B.

> **Mới vào dự án?** Đọc `references/du-an-webfirst.md` trước — 5 repo và vai trò từng repo,
> mô hình story/sub-task/point, nhiều sprint active = nhiều team nhỏ, và **năm chỗ số liệu
> Jira dễ hiểu sai** (đều đo được, tự phát hiện lại rất mất thời gian).


Skill này **do qc-kit phát hành**. Đừng sửa tại chỗ — nó bị ghi đè ở lần
`npx qc-kit sync` tiếp theo. Thấy sai thì sửa ở kit rồi nâng version.

## Chạy

```bash
bash .claude/skills/jira/jira.sh me                     # test token
bash .claude/skills/jira/jira.sh key                    # rút key từ nhánh; fail = việc chưa có ticket
bash .claude/skills/jira/jira.sh view        RPA-1234
bash .claude/skills/jira/jira.sh transitions RPA-1234   # LUÔN chạy trước khi transition
bash .claude/skills/jira/jira.sh transition  RPA-1234 "<tên thật>"
bash .claude/skills/jira/jira.sh describe    RPA-1234 "<description>"
bash .claude/skills/jira/jira.sh point       RPA-1234 <giờ>
bash .claude/skills/jira/jira.sh comment     RPA-1234 "<text>"
bash .claude/skills/jira/jira.sh subtask     RPA-1234 "<summary>" ["<description>"]
```

Đủ 19 lệnh (`fixversion`, `versions`, `assign`, `story`, `sprint`, `sprints`, `worklog`,
`summary`, `task`, `whoami`…): [`references/lenh.md`](references/lenh.md).

## Việc của bộ test, hay bug của sản phẩm?

Đây là chỗ dễ ghi sai nhất, và ghi sai thì ticket trỏ nhầm repo, nhầm người.

| Chuyện gì xảy ra | Ticket thuộc về | `Service:` ghi gì |
|---|---|---|
| Viết/sửa page object, fixture, spec, CI của bộ test | việc của **bộ test này** | `web-automation` |
| Viết test case mới cho một module sản phẩm | việc của **bộ test này** | `web-automation` |
| Test fail vì **bộ test sai** (locator cũ, chờ sai, dữ liệu bẩn) | việc của **bộ test này** | `web-automation` |
| Thiếu một base class / fixture dùng chung được | việc của **qc-kit** | `qc-kit` (repo khác) |
| Test fail vì **sản phẩm sai** — bug thật | bug của **sản phẩm** đó | repo chứa code sai, **không phải** `web-automation` |

Một lần chạy đỏ **chưa phải bug**. Trước khi mở ticket bug:

1. Chạy lại — đã có retry lọc flaky, nhưng vẫn xác nhận fail cả ba lần.
2. Mở trace/screenshot/video của đúng lần fail đó, xác nhận app thật sai chứ không phải test sai.
3. Đối chiếu **SRS trên SharePoint** — hành vi app khác SRS mới là bug; app khác *suy đoán của
   người viết test* thì không. SRS là nguồn thẩm quyền cao nhất, cao hơn cả hành vi app thật.
4. Đủ ba bước trên mới báo — và báo kèm bằng chứng, không kèm phỏng đoán nguyên nhân.

**Nội dung một ticket bug**: bước tái hiện, kết quả mong đợi (trích `VAL-*`/`BR-*` của SRS nếu
có), kết quả thật, đường dẫn trace/video. Không dán nguyên log, không đoán hộ dev chỗ hỏng.

## Ticket có TRƯỚC khi code

Thứ tự: **subtask → nhánh → code → cập nhật subtask → commit → MR → transition**. Nhận biết
việc chưa có ticket: `jira.sh key` fail ⇒ hỏi **parent story + nội dung subtask + point** ngay
lượt đầu.

**Làm xong thì sửa lại subtask** — nội dung lúc tạo là dự định, làm xong thường lệch.

> Bộ test này chưa có skill quy ước nhánh/commit/MR riêng. Cần thì hỏi user, đừng suy ra
> từ repo khác — quy ước của họ không đương nhiên áp cho đây.

## Cái nào cần hỏi, cái nào không

Jira là **tuân thủ**: ticket phải phản ánh việc thật.

| Làm luôn, không hỏi | Phải hỏi trước |
|---|---|
| `describe` / `summary` khi phạm vi đổi hoặc phát sinh việc | tạo issue/sub-task mới (cần parent, component, sprint) |
| `point` khi ước lượng lệch | `worklog` (giờ thực tế là số liệu báo cáo) |
| `transition` theo tiến độ thật, gồm đóng subtask sau khi commit **đã tồn tại** | ghi lên ticket của **người khác** |
| `comment` ghi kết quả đo / quyết định / chặn | mở **ticket bug cho sản phẩm** — luôn hỏi trước |
| `assign` **cho chính mình** khi nhận việc | `assign` cho **người khác** |

Đọc (`me`, `view`, `transitions`, `key`, `sprints`) thì cứ chạy.

## Tên transition — ĐỌC, đừng đoán

Workflow project này đặt tên **tiếng Việt**, KHÔNG có `In Progress` / `In Review` / `Done`, và
danh sách **đổi theo trạng thái hiện tại**. Luôn `jira.sh transitions <KEY>` trước khi chuyển.
Tên thật đo được + component của board 239: [`references/jira-project.md`](references/jira-project.md).

## Lấy issue key

Không bịa key. Thứ tự: user nêu → `jira.sh key` (rút từ nhánh `<type>/<KEY>-<brief>`) → `key`
fail nghĩa là việc chưa có ticket ⇒ **HỎI**.

`subtask` **bắt buộc có parent key**. Chưa có thì hỏi — tuyệt đối không tự tạo task cha tạm.

## Viết NGẮN — ticket không phải nhật ký

- `summary`: một dòng, kèm kết quả nếu có.
- `description`: **tối đa ~10 dòng**, gạch đầu dòng. Chỉ giữ 1–2 con số chốt quyết định.
- Chi tiết dài để trong `docs/` hoặc SharePoint rồi ticket **trỏ đường dẫn**.

**Mọi description kết thúc bằng chữ ký:**

```
----
*Service:* web-automation · *Branch Name:* <nhánh chứa commit> · *Người tạo:* <email>
```

`Branch Name` là nhánh **chứa commit của việc này**, KHÔNG phải nhánh đang checkout. Chữ ký ghi
`master`/`development` gần như luôn sai. Hai chỗ dễ ghi sai: [`references/chu-ky.md`](references/chu-ky.md).

## Ticket Point = giờ — con số PHẢI trung thực

**1 point = 1 giờ** (design + code + test + doc), cho số lẻ. **Sub-task tối đa 8h** — script tự chặn.

Point dùng để **đánh giá năng lực member**, nên bịa số là làm hỏng dữ liệu của cả team.

1. Ước theo **năng lực chung**, không theo tốc độ của người/công cụ đang làm. Việc agent xong
   trong 10 phút nhờ AI vẫn ghi công sức thật của việc đó.
2. Không đủ thông tin thì **HỎI**, để trống point và nói rõ đang chờ gì — trống thì thấy được,
   số bịa thì không.
3. Làm xong mà lệch thì sửa lại (`point <KEY> <giờ>`) — compliance, làm không hỏi.

Ước ra **>8h** nghĩa là sub-task quá to: **tách nhỏ**, đừng ghi 8 cho vừa trần.

## Cài lần đầu

Chưa có token thì script báo `Chưa set FCAM_JIRA_PAT`. User tự tạo PAT tại jira.fcam.vn →
Profile → Personal Access Tokens, rồi:

```bash
cp .jira.env.example ~/.jira.env
chmod 600 ~/.jira.env      # rồi tự điền FCAM_JIRA_PAT=
```

Token gắn với **instance** nên `~/.jira.env` dùng chung được cho mọi repo — chỉ tạo một
lần. Để ở `./.jira.env` cũng được (đã git-ignore). **Agent không ghi token hộ.**
Kiểm tra: `bash .claude/skills/jira/jira.sh me` phải in ra tên.

## Không bao giờ

- In, log, hay ghi giá trị `$FCAM_JIRA_PAT` ra bất cứ đâu — kể cả khi debug.
- Commit `.jira.env`.
- Bịa issue key, parent key, hay tên transition.
- Mở ticket bug cho sản phẩm khi chưa làm đủ ba bước xác nhận ở trên.
- Tạo issue/sub-task mới, `worklog`, hay ghi lên ticket người khác khi user chưa bảo.

## Bản này do kit phát hành

`jira.sh` và `SKILL.md` ở đây là bản sao từ `qc-kit`. Sửa tại chỗ sẽ **mất** ở lần
`npx qc-kit sync` tiếp theo.

Sai thì sửa ở kit, cắt tag, rồi:

```bash
npm i "github:bangdinh/qc-kit#<tag-mới>" && npx qc-kit sync
```

Đó là điều thay cho việc copy tay `jira.sh` giữa các repo: một nguồn, một lệnh.

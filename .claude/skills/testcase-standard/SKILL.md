---
name: testcase-standard
description: Mot test case phai trong the nao - id, priority, tag, steps, va source (requirement/context/inferred). Tam verb duoc phep trong mot step va verb nao Playwright khong co tuong duong. Kich hoat khi viet test case moi, khi nhan test case tu platform-qc-agent, khi review mot bo case, hoac khi hoi "case nay dat id gi", "case nay co duoc chay khong".
---

# Chuẩn test case

Skill này do **qc-kit** phát hành. Đừng sửa tại chỗ — nó bị ghi đè ở lần
`npx qc-kit sync` tiếp theo.

Nguồn đầy đủ: `docs/testcase-standard.md` trong repo kit.

## Một case gồm gì

| Field | Luật |
|---|---|
| `test_case_id` | `TC_<flow>_<3 số>` nếu sinh từ agent, hoặc `<MODULE>-<NN><a-z>` viết tay |
| `title` | Một dòng, kèm kết quả nếu có |
| `preconditions` | Mỗi phần tử một chuỗi không rỗng |
| `steps` | Xem dưới |
| `test_data` | Key/value — chính là một dòng dữ liệu của case |
| `priority` | `High` \| `Medium` \| `Low` |
| `tags` | `smoke`, `regression`… |
| `source` | `requirement` \| `context` \| `inferred` |

## Tám verb — cố tình đóng

Một step phải **thực thi được**, không phải văn xuôi.

| Verb | Playwright |
|---|---|
| `tap` | `click` |
| `input` | `fill` |
| `verify` | `expect` |
| `navigate` | `goto` |
| `select` | `selectOption` |
| `wait` | `waitFor` |
| `swipe` | **không có tương đương** — phải tự cài cử chỉ |
| `scroll` | **không có tương đương** |

Verb thứ chín không tồn tại. Cần một hành động khác thì diễn đạt bằng tám verb này, hoặc
đề xuất mở rộng hợp đồng ở kit (cần ADR).

## `source` — field hay bị bỏ qua nhất, và quan trọng nhất

| Giá trị | Nghĩa |
|---|---|
| `requirement` | Luật nghiệp vụ nêu thẳng trong yêu cầu |
| `context` | Có trong project context truy hồi được |
| `inferred` | **Không ai nêu** — đây là giả định, chưa được xác nhận |

Case bịa là case **nghe hợp lý nhất**, đọc không phát hiện ra. Bắt khai nguồn biến việc đó
thành một bộ lọc chạy được.

**Luật:** case `source = inferred` **không được** vào bộ chạy thật cho tới khi có người
duyệt. Nó vào hàng đợi review, kèm một dòng trong `assumptions[]` nói rõ giả định là gì.

## Nhận case từ platform-qc-agent

Endpoint mà Dify gọi (`/v1/test-suite/generate`) **không** validate schema. Đừng tin
output — cho qua hợp đồng của kit trước:

```ts
import { assertGrounded, parseTestCaseResult } from 'qc-kit/contract';

const suite = parseTestCaseResult(raw);  // ném lỗi kèm đường dẫn JSON nếu sai schema
assertGrounded(suite);                   // chặn case inferred không khai assumptions
```

`parseTestCaseResult` **dung thứ đóng gói** (markdown fence, lời dẫn quanh JSON) nhưng
**nghiêm với schema** — thiếu field hay verb lạ thì từ chối, kèm đường dẫn chính xác kiểu
`test_cases[0].steps[2].action`.

## `target` sang `data-testid`

Agent trả snake_case (`start_live_button`); quy ước của kit là kebab-case có prefix module
(`livestream-start-live-btn`).

```ts
import { toTestId } from 'qc-kit/contract';
toTestId('livestream_setup', 'start_live_button');  // 'livestream-start-live-btn'
```

Module lấy từ **đoạn đầu** của `screen` — đây là heuristic. Tên màn hình không phải tên
module thì truyền tay: `toTestId(screen, target, { module: 'place-detail' })`. Đừng đặt ra
quy tắc đặt tên mới.

## Không hardcode text UI

Text đổi theo ngôn ngữ. Giá trị assert phải lấy từ từ điển locale của module, không lấy
thẳng chuỗi viết trong test case. Ngoại lệ duy nhất: thứ chắc chắn không đổi theo ngôn ngữ
— `data-testid`, id, và dữ liệu do user tự nhập.

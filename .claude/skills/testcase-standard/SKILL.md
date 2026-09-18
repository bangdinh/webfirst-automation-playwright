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

## Một step gồm đúng ba field

`no`, `description`, `expected`. Hết.

`description` là **văn xuôi** — câu người viết case gõ ra, giữ nguyên văn. Không có field
cho hành động, cho màn hình, cho phần tử: file Excel không có ô nào cho chúng, và suy ra
từ câu chữ là đoán. Xem `ADR-0003` của kit.

Viết `description` sao cho **một người đọc xong làm lại được**: một hành động một dòng,
nêu rõ bấm/nhập cái gì. Đó là thứ duy nhất bước sinh script có để đi tiếp, nên câu mơ hồ
ở đây thành một câu hỏi phải quay lại hỏi người viết.

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
**nghiêm với schema** — thiếu field thì từ chối, kèm đường dẫn chính xác kiểu
`test_cases[0].steps[2].description`.

## Step KHÔNG nói phần tử nào

Một step chỉ có một câu `description`. Nó **không** có field cho
phần tử bị thao tác — case viết tay không có ô đó, và suy ra từ câu chữ là đoán.

Phần tử thật xác định từ DOM app đang chạy, ở skill `gen-script`. Đầu vào cũ còn field
`target` thì validator bỏ qua, không báo lỗi.

## Không hardcode text UI

Text đổi theo ngôn ngữ. Giá trị assert phải lấy từ từ điển locale của module, không lấy
thẳng chuỗi viết trong test case. Ngoại lệ duy nhất: thứ chắc chắn không đổi theo ngôn ngữ
— `data-testid`, id, và dữ liệu do user tự nhập.

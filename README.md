# web-automation

Bộ test automation dựng trên [qc-kit](https://github.com/bangdinh/qc-kit).

## Bắt đầu

```bash
npm install
npm run install:browsers
cp .env.example .env      # điền URL và tài khoản
npm run typecheck         # không in gì là đạt
npx playwright test --list
```

## Chạy

```bash
npm test                  # tất cả
npm run test:ui           # UI, đã đăng nhập
npm run test:headed       # xem browser chạy thật
npm run report            # HTML report của lần chạy gần nhất
```

## Nâng cấp qc-kit

Dự án này pin đúng một version của kit. Nâng cấp là đổi tag rồi cài lại:

```bash
npm i "github:bangdinh/qc-kit#<tag-mới>"   # xem tag ở trang tags của kit
npm run typecheck && npx playwright test
```

Đọc CHANGELOG của kit trước khi nâng **minor** — pre-1.0 thì minor là chỗ mang thay đổi
phá vỡ.

## Cấu trúc

```
src/env.ts               bảng môi trường — file duy nhất biết một URL
src/fixtures.ts          cửa vào duy nhất của spec; compose fixture của qc-kit
src/pages/               một màn hình một class, kế thừa BasePage
src/api/models/          Model — dữ liệu có hình dạng gì
src/api/helpers/         Helper — dựng request, đọc response
src/api/verifications/   Verification — thế nào là đúng
src/api/clients/         Client — gọi endpoint nào, kế thừa BaseApiClient
tests/ui/                spec UI
tests/api/               spec API — không mở browser
```

### Tầng API

Bốn tầng, mỗi tầng trả lời một câu hỏi khác nhau:

| Tầng | Trả lời | Ví dụ |
|---|---|---|
| `models/` | dữ liệu có **hình dạng** gì | `Example`, `CreateExample` |
| `helpers/` | dựng request ra sao, đọc response ra sao | `ExampleRequestHelper.create()` |
| `verifications/` | thế nào là **đúng** | `ExampleVerification.isValidRecord()` |
| `clients/` | gọi **endpoint** nào | `ExampleClient.create()` |

Spec chỉ còn kịch bản — Helper dựng, Client gọi, Verification khẳng định:

```ts
const payload = ExampleRequestHelper.create();
const created = await client.create(payload);
await ExampleVerification.matchesRequest(created, payload);
```

Thêm một tài nguyên: tạo bốn file cùng tên tài nguyên trong bốn thư mục, export ở
`index.ts` của từng thư mục. Spec luôn xin client từ fixture
(`createClient(TenClient)`) chứ không tự `new`.

Ranh giới của `verifications/`: chỉ đưa vào đó thứ đúng với **mọi** test của tài nguyên
("một bản ghi hợp lệ trông thế nào"). Assert riêng của một kịch bản thì ở lại trong spec,
nếu không class này phình thành nơi chứa mọi logic test.

Hai kiểu method trong client, đừng dùng lẫn:

| Method | Khi không 2xx | Dùng cho |
|---|---|---|
| `json<T>()` | ném lỗi kèm status + body | đường hạnh phúc |
| `send(…, { expectOk: false })` | trả `APIResponse` thô | test âm, vì ở đó 4xx là kết quả mong đợi |

Spec API chạy dưới project `api`; bật nó trong `playwright.config.ts`
(`projects: { api: true }`).

Kit lo cơ chế dùng chung (step vào report, artifact khi fail, base class). Repo này lo
locator, URL, tài khoản và luồng đăng nhập (`src/core/`) của sản phẩm. Ranh giới đó là
thứ giữ cho việc nâng cấp kit không phải sửa test.

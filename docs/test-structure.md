# Cấu trúc bộ test của `web-automation`

File này là **luật** cho skill `gen-script`: nó đọc file này trước khi ghi bất kỳ file nào,
và nội dung ở đây thắng mọi ví dụ trong skill.

Dự án sở hữu file này. `npx qc-kit sync` không đụng tới nó — bản mẫu của kit nằm ở
`docs/test-structure.example.md`, refresh riêng.

---

## 1. Page object

**Thư mục gốc:** `src/pages/`

**Cách chia:** **theo khu vực**. Mỗi khu vực một thư mục con, tên kebab-case, trùng với
tên thư mục bên `tests/ui/`. Màn hình con nằm sâu thêm một tầng (`tabs/`).

**Quy ước tên:** tên file = tên class, PascalCase, hậu tố `Page`. Tab và màn con dùng hậu
tố `Tab`.

```
src/pages/device/DeviceManagementPage.ts   →  export class DeviceManagementPage extends BasePage
src/pages/device/tabs/DeviceTab.ts         →  export class DeviceTab
src/pages/login/SsoLoginPage.ts            →  export class SsoLoginPage extends BasePage
```

Tám khu vực đang có: `device` · `header` · `history` · `live` · `location` · `login` ·
`manage` · `playback`.

## 2. Component

Dialog, menu, bảng, thanh điều hướng — thứ dùng lại ở nhiều màn hình và **không có URL
riêng**.

**Thư mục gốc:** `src/components/`, phẳng, không chia khu vực.

```
src/components/AddDeviceDialog.ts  →  export class AddDeviceDialog extends BaseComponent
src/components/AddRoleDialog.ts    →  export class AddRoleDialog   extends BaseComponent
src/components/SidePanel.ts        →  export class SidePanel       extends BaseComponent
src/components/LogoutConfirmDialog.ts →  export class LogoutConfirmDialog extends BaseComponent
```

`SidePanel` là panel điều hướng trái của khu vực `Quản lý`, dùng chung cho `ManagePage` và
`RolePage`. Khai một lần ở đây thay vì lặp locator trong từng page object — cùng một phần
tử khai hai chỗ thì hôm Dev đổi UI sẽ sửa một chỗ và quên chỗ kia.

**Ngoại lệ đã có:** `Header` nằm ở `src/pages/header/Header.ts` chứ không phải
`src/components/`, dù nó là `BaseComponent`. Lý do ở mục 6.

## 3. Spec

**Thư mục gốc:** `tests/ui/`, chia theo **đúng tên khu vực của `src/pages/`**.

**Một file cho mỗi:** nhóm `test_case_id` cùng tiền tố. Nhóm mới → file mới trong khu vực
tương ứng.

**Quy ước tên:** kebab-case, hậu tố `.spec.ts`. Tên file lấy theo tiền tố id viết thường
(`DT1` → `dt.spec.ts`), hoặc theo tên khu vực khi khu vực chỉ có một nhóm
(`manage.spec.ts`).

```
tests/ui/device/dt.spec.ts       ←  Manage_TC / DT / TB … mỗi tiền tố một file
tests/ui/manage/manage.spec.ts
```

## 4. Ánh xạ màn hình → thư mục

| Màn hình | Page object | Spec |
|---|---|---|
| Đăng nhập (app) | `src/pages/login/LoginPage.ts` | `tests/ui/login/login.spec.ts` |
| Đăng nhập (SSO Keycloak) | `src/pages/login/SsoLoginPage.ts` | `tests/ui/login/login.spec.ts` |
| Quên mật khẩu ("Xác nhận tài khoản") | `src/pages/login/ForgotPasswordPage.ts` | `tests/ui/login/auth.spec.ts` |
| Setup 2FA lần đầu (QR + 6 ô OTP) | `src/pages/login/TwoFactorSetupPage.ts` | `tests/ui/login/auth.spec.ts` |
| Xác thực mã OTP (returning user) | `src/pages/login/OtpVerificationPage.ts` | `tests/ui/login/auth.spec.ts` |
| Đổi / đặt lại mật khẩu | `src/pages/login/ChangePasswordPage.ts` | `tests/ui/login/auth.spec.ts` |
| Đổi mật khẩu bắt buộc khi hết hạn | `src/pages/login/PasswordExpiredPage.ts` | `tests/ui/login/auth.spec.ts` |
| Giám sát / Trực tiếp | `src/pages/live/LivePage.ts` | `tests/ui/live/live.spec.ts` |
| Thanh điều hướng chính | `src/pages/header/Header.ts` | `tests/ui/header/header.spec.ts` |
| Quản lý > Thiết bị | `src/pages/device/DeviceManagementPage.ts` | `tests/ui/device/*.spec.ts` |
| Quản lý > Phân quyền > Nhóm & Nhân viên | `src/pages/manage/ManagePage.ts` | `tests/ui/manage/manage.spec.ts` |
| Quản lý > Phân quyền > Vai trò | `src/pages/manage/RolePage.ts` | `tests/ui/manage/manage.spec.ts` |
| Lịch sử | `src/pages/history/HistoryPage.ts` | `tests/ui/history/history.spec.ts` |
| Địa điểm | `src/pages/location/LocationPage.ts` | `tests/ui/location/location.spec.ts` |
| Xem lại | `src/pages/playback/PlaybackPage.ts` | `tests/ui/playback/playback.spec.ts` |

Màn hình **không có trong bảng này** → `gen-script` tự tạo khu vực mới và update lại ##4

## 5. Import

Spec import `test` từ fixture của dự án, **không** từ `@playwright/test`. Spec nằm sâu ba
tầng (`tests/ui/<khu vực>/`) nên đường tương đối là ba dấu chấm:

```ts
import { expect, test } from '../../../src/fixtures';
import { LivePage } from '../../../src/pages/live/LivePage';
```

Không dùng alias. `tsconfig.json` chưa khai `paths`.

## 6. Ngoại lệ

**`Header` nằm trong `src/pages/header/` chứ không phải `src/components/`.** Nó là
`BaseComponent` (không có URL riêng), nhưng có một thư mục khu vực và một spec riêng
(`tests/ui/header/header.spec.ts`) vì nó được test như một màn hình: điều hướng hai chiều
giữa Giám sát và Quản lý là hành vi của riêng nó.

Giữ nguyên vị trí này. Dời sang `src/components/` sẽ làm `tests/ui/header/` trở thành khu
vực không có page object tương ứng — lệch với luật ở mục 3.

## 7. Module của `data-testid`

Công thức đặt tên là hợp đồng với Dev, viết ở
[`data-testid-convention.md`](data-testid-convention.md):

```
<module>-<field-hoặc-hành-động>-<loại-phần-tử>[-<qualifier>]
```

Token `<module>` **không suy được** từ file case lẫn từ code — nó là tên khu vực do Dev
đặt. Bảng dưới là **nơi khai duy nhất** của nó. `src/testid-convention.test.ts` đọc bảng
này và bắt mọi `getByTestId` trong file phải mở đầu bằng đúng module đã khai.

Đổi tên một module vì thế là: sửa **một ô** ở đây → `npm run verify` đỏ và liệt kê từng
id phải sửa → `sed` theo danh sách đó.

| File | Module | Nguồn |
|---|---|---|
| `src/pages/login/LoginPage.ts` | `login` | đề nghị |
| `src/pages/login/SsoLoginPage.ts` | `sso-login` | Dev |
| `src/pages/login/ForgotPasswordPage.ts` | `sso-reset-password` | Dev |
| `src/pages/login/ChangePasswordPage.ts` | `change-pwd` | đề nghị |
| `src/pages/login/PasswordExpiredPage.ts` | `pwd-expired` | đề nghị |
| `src/pages/login/OtpVerificationPage.ts` | `sso-otp` | Dev |
| `src/pages/login/TwoFactorSetupPage.ts` | `sso-otp` | Dev |
| `src/pages/header/Header.ts` | `shell` | Dev |
| `src/components/LogoutConfirmDialog.ts` | `shell` | Dev |

**Cột Nguồn.** `Dev` = đã gắn thật trong sản phẩm, đọc được từ DOM. `đề nghị` = tên QA suy
theo công thức, đang chờ Dev gắn. Cả hai đều bị bắt cho khớp: giữ một module nhất quán
trong một file là việc của bộ test, không đợi Dev trả lời mới làm.

File **không có `getByTestId` nào** thì không cần khai — `LoginPage.ts` đang là một ví dụ,
nó còn dùng `#company` và `getByRole`. Có id mà chưa khai thì test đỏ: đó là cách bắt một
màn mới phải chốt module trước khi locator kịp sinh sôi.

## 8. Tầng API

**Thư mục gốc:** `src/api/`, bốn lớp theo đúng khuôn của qc-kit. Spec API ở `tests/api/`,
chạy ở project `api` (không browser).

```
src/api/ApiResource.ts  BỐN động từ HTTP + ghép đường dẫn — tầng chung
src/api/models/         kiểu request/response — hợp đồng với backend
src/api/clients/        một tài nguyên = MỘT dòng khai đường dẫn
src/api/helpers/        dựng payload, kể cả payload SAI cho test âm
src/api/verifications/  assert thuộc về tài nguyên, bọc step() cho report
tests/api/              spec — chỉ ghép các tầng trên thành kịch bản
```

**Bốn động từ là bề mặt công khai** — lối Rest-Assured. `ApiResource` lo `get` · `post` ·
`put` · `delete`; client chỉ khai nó sống ở đâu:

```ts
export class GroupsClient extends ApiResource {
  protected readonly duongDan = '/brm-v2/api/v1/enterprises/{enterpriseId}/groups';
}
```

`{enterpriseId}` do `ApiResource` tự điền từ `ENTERPRISE_ID` trong `.env`; gọi sang doanh
nghiệp khác thì truyền `{ bien: { enterpriseId } }` ở từng lời gọi. Thiếu biến thì nó **ném
ngay kèm tên biến** — để URL mang nguyên `{enterpriseId}` thì server trả 404, một lỗi không
hề nói ra nguyên nhân.

**Hai luật của `ApiResource`, cả hai đều có chủ đích:**

1. **Không bao giờ ném khi status không 2xx.** `BaseApiClient` của kit mặc định ném, nên mỗi
   endpoint phải đẻ hai method — một cho đường hạnh phúc, một cho test âm. Ở đây status luôn
   là dữ liệu trả về, nên một method phục vụ cả hai. Đổi lại: **spec BẮT BUỘC assert status**.
2. **Trả `{ status, body, response }` trong một lần gọi.** `APIResponse` của Playwright chỉ
   đọc body được một lần; chỉ trả response thì mọi assert đều phải tự `await res.json()`.

**Test âm phải assert ĐÚNG mã, không phải "4xx bất kỳ".** Khoảng 4xx gộp hai chuyện khác hẳn
nhau: 400 là dữ liệu sai, 403 là thiếu quyền. Một test "thiếu trường bắt buộc" mà xanh nhờ
403 thì chưa bao giờ chạm tới lớp validate. Dùng `ApiVerification.loi(kq, { status, error })`.

**Quy ước tên:** client và verification là PascalCase theo tài nguyên (`GroupsClient`,
`GroupVerification`); model là kebab-case kèm hậu tố `.model.ts`.

**Ranh giới assert:** "một bản ghi hợp lệ trông thế nào" thuộc `verifications/` — hai chục
test đều cần nó. "Sau khi làm X thì trạng thái phải là Y" là kịch bản, ở lại spec. Nhầm
chiều thứ hai vào `verifications/` thì class đó phình thành nơi chứa mọi logic test.


### FE gọi Server Action, không gọi REST — đừng test nhầm tầng

Đo ngày 21/09/2026: bấm "Thêm địa điểm" trên app sinh ra request này —

```
POST https://beta-vmsmart-next.fcam.vn/vi/places      (CÙNG url với trang)
accept: text/x-component
next-action: 706cde8c9ad5bf71c5b17544b30caa0c1e22b4393c
Cookie: session_token=...                             (KHÔNG có Authorization)
body: ["Quận Cam","$undefined","$undefined"]          (mảng tham số theo vị trí)
```

Đó là **Next.js Server Action**, không phải REST API. Next.js đọc cookie ở server rồi gọi
backend server-side — nên chụp network của browser KHÔNG thấy call API nào, và
`brmBaseUri` trong collection Bruno trỏ vào host này thì chỉ trả về HTML của Next.js.

**Không viết test HTTP nhắm thẳng vào nó.** `next-action` là id không đoán được, và Next.js
**xoay nó giữa các bản build** — tài liệu nói rõ id được tính lại theo bản deploy, chậm nhất
14 ngày một lần kể cả khi source không đổi. Ghim cứng id vào test thì mỗi lần deploy test đỏ
với `Failed to find Server Action`, trông y hệt một bug sản phẩm. Ghim được nó cần
`NEXT_SERVER_ACTIONS_ENCRYPTION_KEY` — biến môi trường phía deploy, không thuộc quyền đội test.

Ba cách đúng, theo thứ tự:

1. **Thao tác tạo/sửa/xoá trên app → test qua UI.** Nó vốn là mutation của người dùng.
2. **Cần assert ở tầng HTTP** thì vẫn kích bằng UI rồi bắt request/response bằng
   `page.waitForResponse` — không ghim id nào cả.
3. **Test API thật** thì nhắm vào gateway backend (collection Bruno), không nhắm BFF của
   Next.js. Đang chặn vì chưa ai cho biết host thật của gateway.

Kéo theo một điều về xác thực: hop FE→BFF dùng **cookie**, không dùng `Authorization: Bearer`.
`createApiFixture` của dự án đang gắn Bearer — đúng cho gateway, KHÔNG đúng cho Server Action.

**Gateway là HOST KHÁC app.** `baseURL` trỏ `beta-vmsmart-next.fcam.vn`, còn `apiURL` trỏ
`beta-api-gateway.fcam.vn` — xem `src/env.ts`. Đây là chỗ đã mất một buổi vì tưởng chúng
cùng host: gọi API qua host của app thì Next.js trả về HTML của trang, status vẫn 200.

**Xác thực:** `createClient(XClient)` cấp context mang sẵn `apiURL` làm baseURL và
`Authorization: Bearer` lấy từ phiên mà project `setup` đăng nhập bằng UI — xem
`src/core/session-token.ts`. Token sống 30 phút, nên project `api` phải chạy SAU `setup`
(đã nối trong `playwright.config.ts`).

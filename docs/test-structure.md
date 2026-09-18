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

Màn hình **không có trong bảng này** → `gen-script` hỏi người, không tự tạo khu vực mới.
Thêm khu vực là quyết định của người, vì nó đẻ ra hai thư mục và một quy ước tên.

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

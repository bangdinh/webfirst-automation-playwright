# Dữ liệu test của `web-automation`

File này là **luật** cho skill `gen-script`, ngang hàng với
[`test-structure.md`](test-structure.md): nó đọc file này trước khi sinh, và nội dung ở đây
thắng mọi ví dụ trong skill.

Dự án sở hữu file này. `npx qc-kit sync` không đụng tới nó — bản mẫu của kit nằm ở
`docs/test-data.example.md`, refresh riêng.

Rà từ 69 case của `Testcase_Authentication_v1.0.0` part 2 → part 10.

---

## 1. Profile dữ liệu

**Cột `Phá huỷ?` là cột quan trọng nhất**: nó quyết định case có phải chạy `serial` không,
và có phải reset giữa các lần chạy không.

`Có chưa?` = đã cấp tài khoản thật và điền vào `.env` hay chưa.

### Trạng thái cố định — test đọc, không làm đổi

| Profile | Key `.env` | Trạng thái | Phá huỷ? | Reset bằng | Case | Có chưa? |
|---|---|---|---|---|---|---|
| `standard` | `USER_*` | còn hoạt động, quyền đầy đủ | không | — | nền của hầu hết case | ✅ |
| `admin` | `ADMIN_*` | quản trị | không | — | (chưa case nào dùng) | ✅ |
| `expired` | `EXPIRED_*` | Account Status = Expired | không | — | 2.13 | ❌ |
| `disabled` | `DISABLED_*` | bị vô hiệu hoá, chỉ Owner/Admin mở | không | — | 2.12 | ❌ |
| `noPermission` | `NO_PERMISSION_*` | đăng nhập được, chưa có quyền nào | không | — | 2.18 | ❌ |
| `otherTenant` | `OTHER_TENANT_*` | có thật, thuộc tenant KHÁC `COMPANY_CODE` | không | — | 2.15 | ❌ |
| `ssoExisting` | `SSO_EXISTING_*` | đã có ở cả IdP lẫn app | không | — | 2.4 | ❌ |

### Test LÀM ĐỔI trạng thái — phải reset trước lần chạy sau

| Profile | Key `.env` | Trạng thái | Phá huỷ? | Reset bằng | Case | Có chưa? |
|---|---|---|---|---|---|---|
| `lockout` | `LOCKOUT_*` | được phép bị khoá | **có** — bị khoá | chờ hết `LOCKOUT_DURATION_MINUTES`, hoặc Admin mở | 2.7 · 2.8 · 2.9 · 2.19 · 2.20 · 2.21 | ❌ |
| `forgotPassword` | `FORGOT_USERNAME` | nhận email thật | **có** — đốt hạn mức 3 lần/**ngày** | hạn mức tự reset theo ngày; chạy CI hai lượt/ngày là đụng trần | 3.3 · 3.6 → 3.10 | ❌ |
| `firstLogin` | `FIRST_LOGIN_*` | CHƯA TỪNG setup 2FA | **có** — một chiều | cấp tài khoản mới, hoặc API reset 2FA | 4.0 · 4.3 | ❌ |
| `twoFactor` | `TWO_FA_*` + `TWO_FA_TOTP_SECRET` + `TWO_FA_BACKUP_CODES` | ĐÃ bật 2FA, returning user | **có** — 4.9 khoá, 4.11 tắt 2FA | bật lại 2FA, cấp secret mới | 2.17 · 4.4 → 4.11 · 5.7 | ❌ |
| `passwordExpired` | `PWD_EXPIRED_*` | mật khẩu đã hết hạn | **có** — 7.8 đổi mật khẩu thật, hạn tính lại 90 ngày | đặt lại mật khẩu về giá trị `.env` rồi ép hết hạn | 2.11 · toàn bộ AUTH7 (15 case) | ❌ |
| `changePassword` | `CHANGE_PWD_*` | dùng cho form Đổi mật khẩu | **có** — mật khẩu đổi thật, 5.6 logout mọi session | đặt lại mật khẩu về giá trị `.env` | 5.5 · 5.6 · 5.9 | ❌ |
| `ssoNew` | `SSO_NEW_*` | chỉ có ở IdP, chưa có ở app | **có** — app tự tạo user (JIT) | xoá user khỏi app sau mỗi lần chạy | 2.5 | ❌ |

Hai profile gánh nhiều case nhất: **`passwordExpired` (15 case)** và **`twoFactor` (10
case)**. Không có `passwordExpired` thì part 6 và part 7 không chạy được dòng nào.

## 2. Kênh ngoài

| Kênh | Dùng cho | Cấu hình | Trạng thái |
|---|---|---|---|
| Hộp thư có API | lấy link/token reset trong email — 3.3 · 3.7 · 3.8 · 3.10 · 4.1 · 7.0 · 2.11 | chưa khai | ❌ **chưa chốt công cụ** (Mailosaur / MailHog / IMAP) |
| Sinh mã TOTP | nhập đúng mã 6 số — 4.3 · 4.6 · 7.13 | secret ở `TWO_FA_TOTP_SECRET`, cần thêm thư viện kiểu `otplib` | ❌ chưa có secret |
| Backup codes 2FA | khôi phục khi mất thiết bị — 4.10 | `TWO_FA_BACKUP_CODES` | ❌ chưa cấp |

Hộp thư cá nhân của QA **không tính**: CI phải đọc được nó.

**TOTP secret phải xin lúc TẠO tài khoản** — sau đó không lấy lại được. Quét mã QR bằng
OCR là đường sai: giòn, mà cuối cùng vẫn cần secret.

**Nghi vấn cần xác nhận:** nhóm AUTH5.x (form Đổi mật khẩu) có vẻ chính là màn đặt lại mật
khẩu đi từ link email, vì AUTH5.9 ghi rõ *"client không có field Mật khẩu hiện tại"*. Nếu
đúng thì hộp thư chặn **17 case** chứ không phải 7.

## 3. Cấu hình môi trường

| Cấu hình | Key `.env` | Case dùng | Trạng thái |
|---|---|---|---|
| Số lần sai tối đa trước khi khoá | `LOCKOUT_MAX_ATTEMPTS` | 2.8 · 2.9 | ❌ chưa điền |
| Thời gian khoá (phút) | `LOCKOUT_DURATION_MINUTES` | 2.21 | ❌ chưa điền |
| Password policy: 12 ký tự · 1 số · 1 hoa · 1 đặc biệt | — | 5.2 · 5.3 · 7.5 | ✅ case ghi rõ, hardcode được |
| Hạn mật khẩu 90 ngày | — | 7.8 | ✅ case ghi rõ |

## 4. Xung đột đã biết

| Case A | Case B | Xung đột ở đâu | Hướng xử lý |
|---|---|---|---|
| **2.7** cần Lockout Policy **BẬT** | **2.10** cần Lockout Policy **TẮT** | cùng một tenant, hai trạng thái ngược nhau | (a) hai tenant riêng · (b) API bật/tắt policy trong test · (c) 2.10 chỉ chạy tay — **chưa chọn** |

## 5. Chưa chốt

Thiếu quyết định, không thiếu dữ liệu — cấp thêm tài khoản cũng không chạy được.

| Câu hỏi | Chặn case | Hỏi ai |
|---|---|---|
| Ngưỡng hiện CAPTCHA (OI-52), Figma không có màn minh hoạ | 2.10 | BA/PO |
| Bộ đếm sai reset khi nào — sau login đúng? theo thời gian? hết lockout? | 2.19 | PO |
| N lần sai OTP và duration khoá | 4.9 | PO |
| OTP TTL (30s? 60s?) và max retry | 4.12 · 4.8 | PO |
| Token TTL của link reset | 3.10 | PO |

## 6. Ràng buộc không phải dữ liệu

- **AUTH6.0 · 6.1 (Đăng xuất) KHÔNG phải `@guest`.** Chúng cần một phiên đã đăng nhập nên
  phải chạy ở project `chromium`, không phải `chromium-guest`. Đây là hai case đầu tiên
  của bộ AUTH nằm ngoài nhóm guest — gắn nhầm tag là chúng mở lên ở trạng thái chưa đăng
  nhập và fail vì lý do không liên quan.
- **AUTH2.14 (cảnh báo Caps Lock)** phụ thuộc trạng thái bàn phím của hệ điều hành.
  Playwright không bật được Caps Lock thật — nhiều khả năng chạy tay hoặc bỏ.
- **Case phụ thuộc thời gian** — 2.21 (chờ hết lockout) · 3.6 (đếm ngược 12s) · 3.10 (token
  TTL) · 4.8 · 7.15 (OTP hết hạn): `waitForTimeout` bị cấm, và ngồi chờ vài phút không còn
  là test UI. Cần API ép hết hạn, hoặc chấp nhận chạy tay.
- **AUTH1.4 (chống enumeration qua thời gian phản hồi)** — chính case tự ghi là ngoài phạm
  vi test UI thủ công.

## 7. Thứ tự nên cấp

1. **`passwordExpired`** — mở khoá 15 case, nhiều nhất trên mỗi đơn vị công.
2. **`twoFactor` + TOTP secret** — mở khoá 10 case, và secret phải xin ngay lúc tạo.
3. **Hộp thư có API** — mở khoá 7 case, có thể 17 nếu nghi vấn ở mục 2 là đúng.
4. **`disabled` · `noPermission` · `changePassword`** — mỗi cái 1–3 case, rẻ.
5. Chốt xung đột mục 4 và năm câu hỏi mục 5 với BA/PO.
6. **`ssoExisting` · `ssoNew`** — để cuối: AUTH2.4 và 2.5 còn vướng câu hỏi luồng IdP có
   thuộc phạm vi automation UI không (xem summary part 2).

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
| **`otpEnabled`** | `OTP_*` + `OTP_TOTP_SECRET` + `OTP_BACKUP_CODES` | **ADMIN đã bật OTP** | không | — (admin quản) | 2.17 · 4.4 · 4.5 · 4.6 · 5.7 | ❌ |

### Test LÀM ĐỔI trạng thái — phải reset trước lần chạy sau

| Profile | Key `.env` | Trạng thái | Phá huỷ? | Reset bằng | Case | Có chưa? |
|---|---|---|---|---|---|---|
| `lockout` | `LOCKOUT_*` | được phép bị khoá | **có** — bị khoá | chờ hết `LOCKOUT_DURATION_MINUTES` (**1 phút**), hoặc Admin mở | 2.7 · 2.8 · 2.9 · 2.19 · 2.20 · 2.21 | ✅ |
| `forgotPassword` | `FORGOT_USERNAME` | nhận email thật | **có** — đốt hạn mức 3 lần/**ngày** | hạn mức tự reset theo ngày; chạy CI hai lượt/ngày là đụng trần | 3.3 · 3.6 → 3.10 | ❌ |
| `firstLogin` | `FIRST_LOGIN_*` | CHƯA TỪNG setup 2FA | **có** — một chiều | cấp tài khoản mới, hoặc API reset 2FA | 4.0 · 4.3 | ❌ |
| `passwordExpired` | `PWD_EXPIRED_*` | mật khẩu đã hết hạn — các bước ĐẦU của flow | **nhẹ** — 7.4 cố tình nhập sai mật khẩu, có thể chạm ngưỡng khoá | bình thường không cần; bị khoá thì nhờ Admin mở | 2.11 · 7.0 · 7.1 · 7.2 · 7.3 · 7.4 | ❌ |
| **`passwordExpiredOtp`** | `PWD_EXPIRED_OTP_*` + `PWD_EXPIRED_OTP_CHANNEL` | mật khẩu đã hết hạn — RIÊNG cho nhóm đi hết flow | **có** — 7.8 đổi mật khẩu thật, hạn tính lại 90 ngày | đặt lại mật khẩu về giá trị `.env` rồi ép hết hạn | 7.5 · 7.6 · 7.7 · 7.8 · 7.9 | ❌ |
| `changePassword` | `CHANGE_PWD_*` | dùng cho form Đổi mật khẩu | **có** — mật khẩu đổi thật, 5.6 logout mọi session | đặt lại mật khẩu về giá trị `.env` | 5.5 · 5.6 · 5.9 | ❌ |
| `ssoNew` | `SSO_NEW_*` | chỉ có ở IdP, chưa có ở app | **có** — app tự tạo user (JIT) | xoá user khỏi app sau mỗi lần chạy | 2.5 | ❌ |

Hai tài khoản mật khẩu-hết-hạn là **hai tài khoản khác nhau**, không phải một. AUTH7.8 đổi
mật khẩu thật, nên dùng chung thì sau lượt đầu AUTH7.2 → 7.4 đỏ vì mật khẩu trong `.env`
không còn đúng — đỏ vì môi trường, không vì sản phẩm.

Cộng lại, nhóm AUTH7 đứng sau hai tài khoản này; không có chúng thì part 6 và part 7 không
chạy được dòng nào.

## 2. Kênh ngoài

| Kênh | Dùng cho | Cấu hình | Trạng thái |
|---|---|---|---|
| Hộp thư có API | lấy link/token reset trong email — 3.3 · 3.7 · 3.8 · 3.10 · 4.1 · 7.0 · 2.11 | chưa khai | ❌ **BỊ CHẶN Ở TẦNG MẠNG** — xem ghi chú dưới bảng |
| Sinh mã TOTP | nhập đúng mã 6 số — 4.3 · 4.6 · 7.13 | secret ở `OTP_TOTP_SECRET`, cần thêm thư viện kiểu `otplib` | ❌ chưa có secret |
| Backup codes 2FA | khôi phục khi mất thiết bị — 4.10 | `OTP_BACKUP_CODES` | ❌ chưa cấp |


**Mạng công ty chặn đường đọc Gmail** (đo ngày 18/09/2026): `imap.gmail.com:993`,
`gmail.googleapis.com:443` và `oauth2.googleapis.com:443` đều trả chứng chỉ chặn
`invalid2.invalid`. Không phải lỗi cấu hình hay sai app password — tắt kiểm chứng chỉ chỉ nối
vào chính thiết bị chặn. `smtp.gmail.com:465`, `graph.microsoft.com`, `mailosaur.com` và
`api.mailslurp.com` thì mở.

Ba đường còn lại, xếp theo thứ tự tôi đề nghị:

1. **Hỏi Dev cách lấy token reset không qua email** — endpoint chỉ bật ở beta, hoặc query DB.
   Không cần hộp thư, không cần xin mở mạng. Thứ bộ test cần là cái TOKEN, không phải cái email.
2. **Mailosaur** — hostname không bị chặn, và sản phẩm đã chứng minh nhận email ngoài domain
   (AUTH3.3 gửi thành công tới một địa chỉ Gmail). Tốn phí, phải đổi email tài khoản test.
3. **Xin IT mở `imap.gmail.com`** cho máy chạy test — chậm, và nhìn dấu hiệu thì đây là chính
   sách cố ý chặn webmail cá nhân.

15 case đang `test.skip` vì chặn này, xem hằng `CHO_HOP_THU` và `DOT_QUOTA` trong
`tests/ui/login/auth.spec.ts`.

Hộp thư cá nhân của QA **không tính**: CI phải đọc được nó.

**TOTP secret phải xin lúc TẠO tài khoản** — sau đó không lấy lại được. Quét mã QR bằng
OCR là đường sai: giòn, mà cuối cùng vẫn cần secret.

**Nghi vấn cần xác nhận:** nhóm AUTH5.x (form Đổi mật khẩu) có vẻ chính là màn đặt lại mật
khẩu đi từ link email, vì AUTH5.9 ghi rõ *"client không có field Mật khẩu hiện tại"*. Nếu
đúng thì hộp thư chặn **17 case** chứ không phải 7.

## 3. Cấu hình môi trường

| Cấu hình | Key `.env` | Case dùng | Trạng thái |
|---|---|---|---|
| Số lần sai tối đa trước khi khoá | `LOCKOUT_MAX_ATTEMPTS` | 2.8 · 2.9 | ✅ **5** |
| Thời gian khoá (phút) | `LOCKOUT_DURATION_MINUTES` | 2.21 | ✅ **1** — rẻ, khoá nhầm chờ một phút là xong |
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

1. **`passwordExpired` + `passwordExpiredOtp`** — hai tài khoản mật khẩu hết hạn, mở khoá
   15 case của AUTH7. Nhiều nhất trên mỗi đơn vị công.
2. **`otpEnabled` + TOTP secret** — admin bật OTP; secret phải xin NGAY lúc bật, sau đó không lấy lại được.
3. **Hộp thư có API** — mở khoá 7 case, có thể 17 nếu nghi vấn ở mục 2 là đúng.
4. **`disabled` · `noPermission` · `changePassword`** — mỗi cái 1–3 case, rẻ.
5. Chốt xung đột mục 4 và năm câu hỏi mục 5 với BA/PO.
6. **`ssoExisting` · `ssoNew`** — để cuối: AUTH2.4 và 2.5 còn vướng câu hỏi luồng IdP có
   thuộc phạm vi automation UI không (xem summary part 2).

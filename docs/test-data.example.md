# Dữ liệu test của `web-automation` — BẢN MẪU

> Copy thành `docs/test-data.md` rồi điền. Skill `gen-script` đọc **file thật**, không đọc
> bản mẫu này; còn nguyên như đây thì nó dừng và bảo bạn điền.
>
> `qc-kit sync` refresh bản mẫu, không đụng file thật của bạn.

File này trả lời một câu: **bộ test có sẵn những trạng thái dữ liệu nào, lấy ở đâu.**

Vì sao nó phải tồn tại: phần lớn case không-phải-happy-path kiểm một TRẠNG THÁI mà bộ test
không tự tạo được — tài khoản bị khoá, gói đã hết hạn, đơn đã huỷ. `gen-script` không đoán
được những thứ đó, và đoán thì nó sẽ tự bịa ra tên biến `.env` không ai cấp.

---

## 1. Profile dữ liệu

Mỗi dòng là một trạng thái mà test dùng được. **Cột `Phá huỷ?` là cột quan trọng nhất**:
nó quyết định case có phải chạy `serial` không, và có phải reset giữa các lần chạy không.

| Profile | Key `.env` | Trạng thái | Phá huỷ? | Reset bằng |
|---|---|---|---|---|
| `standard` | `USER_*` | tài khoản thường, còn hoạt động | không | — |
| `locked` | `LOCKED_*` | bị khoá sau N lần sai | **có** | chờ hết duration, hoặc Admin mở |
| `expired` | `EXPIRED_*` | đã hết hạn | không | — |

Luật của bảng này:

- **Một dòng một trạng thái.** Đừng gộp "tài khoản admin đã hết hạn" vào một dòng —
  hai trạng thái là hai profile, kể cả khi chúng cùng một con người.
- **Phá huỷ = test làm đổi trạng thái đó.** Đăng nhập vào tài khoản Disabled không làm nó
  hết Disabled → không phá huỷ. Đăng nhập sai tới ngưỡng khoá → phá huỷ.
- **Cột reset không được để trống với dòng phá huỷ.** Không biết reset thế nào nghĩa là
  case đó chỉ chạy được đúng một lần, và cần ghi ra chứ không để người sau tự phát hiện.

## 2. Kênh ngoài

Thứ test cần mà UI không cho: hộp thư, mã OTP, SMS, webhook. Không khai ở đây thì
`gen-script` dừng những case cần chúng, thay vì sinh một test không có đường chạy.

| Kênh | Dùng cho | Cấu hình | Trạng thái |
|---|---|---|---|
| Hộp thư có API | lấy link xác nhận trong email | `MAIL_*` | chưa chốt công cụ |
| Sinh mã TOTP | nhập đúng mã 6 số của 2FA | secret ở `*_TOTP_SECRET` | — |

Hộp thư cá nhân của QA **không tính**: CI phải đọc được nó.

## 3. Cấu hình môi trường

Ngưỡng, thời hạn, chính sách — thứ đổi theo môi trường nên không hardcode được.

| Cấu hình | Key `.env` | Case dùng | Ghi chú |
|---|---|---|---|
| Số lần sai tối đa | `LOCKOUT_MAX_ATTEMPTS` | case đếm ngược | để trống thì case tự skip |

## 4. Xung đột đã biết

Chỗ hai case đòi môi trường ở hai trạng thái ngược nhau. Ghi ra để không ai ngồi debug một
test không bao giờ xanh cùng lượt với test kia.

| Case A | Case B | Xung đột ở đâu | Hướng xử lý |
|---|---|---|---|
| *(ví dụ)* policy BẬT | policy TẮT | cùng một tenant | hai tenant, hoặc API đổi cấu hình |

## 5. Chưa chốt

Thứ chưa ai trả lời. Case phụ thuộc chúng thì `gen-script` đánh `DATA-TBD` và `test.fixme`
— thiếu quyết định, không phải thiếu dữ liệu, nên cấp thêm tài khoản cũng không chạy được.

| Câu hỏi | Chặn case nào | Hỏi ai |
|---|---|---|
| *(ví dụ)* OTP sống bao lâu? | case kiểm OTP hết hạn | PO |

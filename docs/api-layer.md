# Tầng API của `web-automation`

Luật viết test API cho bộ test này. **Đây là nguồn duy nhất**, thắng mọi ví dụ ở nơi khác.

**Đọc file này trước khi đụng `src/api/` hoặc `tests/api/`** — và phải đọc chủ động, vì
**chưa có cơ chế nào tự nạp nó**. Skill `gen-script` mới chỉ phủ tầng UI (page object, spec
UI, `data-testid`); nó `cat docs/test-structure.md` và không nhắc `src/api/` một dòng nào.
Con trỏ ở §8 của file đó là link markdown, không phải lệnh đọc. Cho tới khi kit bổ sung
luồng API cho `gen-script`, thứ duy nhất nhắc file này ở mọi phiên là `CLAUDE.md`.

Cấu trúc tầng UI ở [`test-structure.md`](test-structure.md). Năng lực dùng chung (base
class, fixture, logger) thuộc qc-kit — cần gì thì đề xuất ở kit, đừng chép vào đây.

---

## 1. Bố cục

```
src/api/ApiClient.ts    NĂM động từ HTTP + bóc envelope + điền biến nền — tầng chung
src/api/routes/         URL của từng chức năng — bản kê endpoint
src/api/models/         kiểu request/response — hợp đồng với backend
src/api/helpers/        dựng payload (kể cả payload SAI) + đọc response có cấu trúc
src/api/verifications/  assert thuộc về tài nguyên, bọc step() cho report
tests/api/              spec — chỉ ghép các tầng trên thành kịch bản
```

Spec chạy ở project `api`, không browser. Nó phải chạy SAU `setup` vì token lấy từ phiên
đăng nhập bằng UI (mục 9).

**Không có class cho từng tài nguyên.** Đường dẫn đã ở `routes/`, nên một `XClient` riêng
cho mỗi tài nguyên sẽ rỗng ruột — mà class rỗng vẫn bắt người đọc mở ra xem nó có gì.

---

## 2. Routes — nơi quản lý endpoint

**Một class một chức năng, tên `<Chức năng>Route`.** Đây là bản kê: muốn biết bộ test chạm
tới đường dẫn nào của một chức năng thì mở đúng một file, không phải grep khắp spec.

```ts
export class LocationRoute {
  private static readonly ENTERPRISE = '/brm-v2/api/v1/enterprises/{enterpriseId}';

  /** `GET` — cây phân cấp của cả doanh nghiệp. */
  static tree(): string { return `${LocationRoute.ENTERPRISE}/tree`; }
  /** `POST` — tạo một địa điểm. */
  static create(): string { return `${LocationRoute.ENTERPRISE}/groups`; }
  /** `PATCH` — sửa một địa điểm. */
  static update(groupId: string): string {
    return `${LocationRoute.ENTERPRISE}/groups/${encodeURIComponent(groupId)}`;
  }
  /** `DELETE` — xoá một địa điểm. */
  static delete(groupId: string): string {
    return `${LocationRoute.ENTERPRISE}/groups/${encodeURIComponent(groupId)}`;
  }
}
```

**MỘT HÀM MỘT ENDPOINT, kể cả khi hai endpoint trùng đường dẫn.** `update()` và `delete()`
hôm nay trả cùng một chuỗi và vẫn tách rời — **duplicate ở đây là cố ý, đừng gộp lại thành
`detail()`.** Đổi lại được ba thứ:

- chỗ gọi đọc ra ý định — `LocationRoute.update(id)` nói nó đang sửa, `detail(id)` thì không;
- file này là bản kê đúng một hàm một endpoint;
- hôm backend tách đường dẫn sửa khỏi đường dẫn xoá thì chỉ sửa đúng hàm tương ứng.

Giá phải trả là hai chuỗi có thể lệch nhau, và bộ test này **không có gì chặn ở tầng tĩnh**
(mục 11). Sửa một hàm thì phải tự đọc lại hàm kia.

**Mỗi hàm ghi rõ động từ nào dùng nó** trong JSDoc. Đó là thứ biến file thành bản kê đọc
được, thay vì một đống hàm trả chuỗi.

**Prefix để `private`.** Không ai ghép tay đường dẫn từ bên ngoài được — đó chính là cách
một prefix từng bị chép ra nhiều nơi, rồi đổi version API là sửa N file.

**Tên lớp theo UI, đường dẫn theo backend.** Trên giao diện là "Địa điểm", API gọi là
`groups`. Lớp theo tiếng của sản phẩm vì đó là tiếng người viết test case dùng; chuỗi đường
dẫn giữ nguyên tiếng backend. Đừng "sửa" đường dẫn cho khớp tên lớp.

### Hai loại biến trong một URL, hai cơ chế

| | `{enterpriseId}` | `groupId` |
|---|---|---|
| Bản chất | **cấu hình nền** — giống nhau ở mọi lời gọi | **tham số của riêng lời gọi đó** |
| Khai ở đâu | để nguyên dạng khuôn trong route | tham số của hàm trong route |
| Ai điền | `ApiClient`, từ `ENTERPRISE_ID` trong `.env` | chính hàm route, có `encodeURIComponent` |
| Ghi đè | `{ pathParams: { enterpriseId } }` ở lời gọi | truyền giá trị khác |

Bắt spec truyền `enterpriseId` ở từng lời gọi là bắt mọi test lặp lại một hằng số của môi
trường. Ngược lại, để `groupId` đi qua một `suffix` chuỗi tự do thì quên một dấu `/` là URL
dính liền — chỉ lòi ra lúc chạy, dưới dạng 404.

Thiếu biến nền thì `ApiClient` **ném ngay kèm tên biến**. Để URL mang nguyên `{enterpriseId}`
thì server trả 404, một lỗi không hề nói ra nguyên nhân là quên truyền biến.

---

## 3. `ApiClient` — phương tiện gửi

Một lớp dùng chung cho mọi tài nguyên. Năm động từ: `get` · `post` · `put` · `patch` ·
`delete`, mỗi cái nhận route làm tham số đầu.

```ts
const api = createClient(ApiClient);
await api.patch<LocationResponse>(LocationRoute.update(id), payload);
```

**Hai luật, cả hai đều có chủ đích:**

1. **Không bao giờ ném khi status không 2xx.** `BaseApiClient` của kit mặc định ném, nên mỗi
   endpoint phải đẻ hai method — một cho đường hạnh phúc, một cho test âm. Ở đây status luôn
   là dữ liệu trả về, nên một method phục vụ cả hai. Đổi lại: **spec BẮT BUỘC assert
   status**, không có cái phao "không ném tức là ổn".
2. **Trả `{ status, code, message, data, body, response }` trong một lần gọi.** `APIResponse`
   của Playwright chỉ đọc body được một lần; chỉ trả response thì mọi assert đều phải tự
   `await res.json()`. Lớp vỏ `{ code, message, data }` của gateway cũng bóc luôn tại đây —
   giống nhau ở mọi endpoint nên bóc một lần, thay vì hai chục spec cùng viết `body.data`.

`data` khai kiểu `T` nhưng **thực tế có thể `undefined`**: response lỗi không có `data`, 204
không có thân nào cả. Đọc thẳng `.data.x` mà chưa assert là nhận "reading x of undefined",
che mất mã lỗi thật — thứ duy nhất nói được vì sao hỏng. Chặn bằng `expectSuccess` trước.

Client chịu được cả thứ **không phải envelope**: 204 không thân, trang lỗi HTML của proxy.
Ở hai ca đó `code` là `undefined` — đó là tín hiệu đúng, khác hẳn việc bịa ra một mã.

---

## 4. Models — hợp đồng với backend

**Quy ước tên:** file kebab-case kèm hậu tố `.model.ts`. Kiểu gửi lên kết thúc bằng
`Request`, kiểu nhận về bằng `Response`.

```
CreateLocationRequest · UpdateLocationRequest · LocationResponse · DeleteLocationResponse
```

**MỖI ENDPOINT MỘT KIỂU.** Hai lý do:

- **Tên phải nói nó thuộc chiều nào.** Đọc `post<Location>()` không biết `Location` là
  payload hay kết quả; `post<LocationResponse>()` thì biết ngay.
- **Đừng alias hai endpoint vào một kiểu** dù hôm nay chúng trùng nhau từng trường. Ngày
  một bên thêm trường, alias kéo bên kia đỏ theo dù nó không đổi gì.

Dùng chung một kiểu cho hai endpoint **CHỈ khi đã đối chiếu response thật của cả hai** và
thấy giống nhau — và ghi ngày đo vào JSDoc. `LocationResponse` dùng cho cả `POST` lẫn `PATCH`
là vì đã đo (21 và 22/09/2026), không phải vì suy ra từ việc chúng cùng một tài nguyên.

**Cùng tài nguyên KHÔNG bảo đảm cùng hình dạng.** `groups` là ví dụ sẵn có: ba động từ trên
cùng một URL, `DELETE` trả biên lai `{ deleted, revoked_grants }` chứ không trả bản ghi.

**Response không nhất thiết phản chiếu request.** `POST /groups` nhận `description` nhưng
KHÔNG trả nó về. Nên `LocationResponse` cố ý không kế thừa `CreateLocationRequest`: gộp lại
thì `tsc` cho phép đọc `group.description`, nhận `undefined`, và người đọc tưởng server trả
rỗng thay vì hiểu là server không trả trường đó.

### Union đóng hay `string`

Khai union đóng khi muốn `tsc` bắt lỗi gõ sai — `LocationTreeNodeType` là
`'company' | 'group_place' | 'device'`, nên `type === 'group_palce'` đỏ ngay. Đổi lại: ngày
backend thêm loại thứ tư, `tsc` **không** bắt được, nên xem luật lọc ở mục 5.

Khai `string` khi **chưa đo đủ giá trị**. `access` chỉ quan sát được `'granted'`; viết
`'granted' | 'denied'` là đoán. Đo được ca bị từ chối rồi hãy siết.

---

## 5. Helpers

Hai việc: dựng payload, và đọc response có cấu trúc.

**`<Tài nguyên>RequestHelper` dựng payload** — hợp lệ sẵn, override đúng trường mình quan
tâm, và có sẵn payload SAI cho test âm đặt tên theo CÁI SAI (`missingName`, `emptyName`).
Kiểu trả về của payload sai là `unknown`: theo định nghĩa nó không khớp kiểu Request, ép nó
khớp thì không viết được test âm nào.

Dữ liệu ngẫu nhiên cần **cả faker lẫn `unique()`**, không thay được cho nhau. Bỏ `unique()`
thì dính trùng tên — đo được 200 lần gọi `faker.location.city()` chỉ ra 30 giá trị khác
nhau, và 4 worker song song đụng nhau rất nhanh. Bỏ faker thì tên thành chuỗi máy, không ai
đọc report mà hình dung ra được cái gì.

**`<Tài nguyên>TreeHelper` / helper đọc response** cho response có cấu trúc lồng. Hàm phải
**thuần** và **đệ quy hết mọi tầng**: cây thật sâu 5 tầng, một bản chỉ duyệt một tầng vẫn
xanh trên cây nông rồi im lặng bỏ sót ở cây thật.

**Lọc theo kiểu GIỮ cái mình cần, không loại trừ cái mình biết.** `type === 'group_place'`
chứ không phải `type !== 'device' && type !== 'company'`. Ngày backend thêm một loại node
thứ tư, bản loại trừ lặng lẽ đếm nó thành địa điểm còn `tsc` không bắt được.

---

## 6. Verifications — ranh giới assert

**`verifications/` giữ "một bản ghi hợp lệ trông thế nào"** — thứ hai chục test đều cần.
**"Sau khi làm X thì trạng thái phải là Y" là kịch bản, ở lại spec.** Nhầm chiều thứ hai vào
`verifications/` thì class đó phình thành nơi chứa mọi logic test.

`ApiVerification` lo lớp vỏ chung, dùng cho mọi tài nguyên:

```ts
await ApiVerification.expectSuccess(result, { status: 200 });
await ApiVerification.expectError(result, { status: 409, error: 'NODE_NAME_CONFLICT' });
```

**Gọi `expectSuccess` TRƯỚC khi chạm `result.data`** — lý do ở mục 3.

**`code` dùng hai chiều khác nhau:**

- **Lỗi: NÊN ghim.** `140001` và `140903` phân biệt được hai loại hỏng mà HTTP status gộp
  làm một, nên ghim mã là cách duy nhất để test âm kiểm đúng thứ nó định kiểm.
- **Thành công: ĐỪNG ghim.** `1200` là lỗi phía Dev, đã xác nhận, và sẽ đổi. Ghim nó thì hôm
  Dev sửa, cả loạt test đỏ vì bộ test bám một giá trị ai cũng biết là sai.

**Test âm phải assert ĐÚNG mã, không phải "4xx bất kỳ".** Khoảng 4xx gộp hai chuyện khác hẳn
nhau: 400 là dữ liệu sai, 403 là thiếu quyền. Một test "thiếu trường bắt buộc" mà xanh nhờ
403 thì chưa bao giờ chạm tới lớp validate, nhưng report nói đã kiểm xong.

**Chỉ assert trường server THẬT SỰ trả.** `matchesRequest` chỉ so `name` vì response không
trả `description`. Assert một trường server không trả là assert `undefined === "..."` — luôn
đỏ, và đỏ vì test hiểu sai hợp đồng chứ không vì sản phẩm sai.

Mọi method bọc thân hàm trong `step()` để report đọc ra được kịch bản.

---

## 7. Spec — luật viết kịch bản

**URL không xuất hiện trong spec.** Mọi đường dẫn nằm ở `routes/`.

**Tự tạo dữ liệu, không ghim `id` cứng.** Một `id` cứng trong spec là bản ghi THẬT của môi
trường hôm nay — ai xoá nó thì test đỏ, và đỏ vì dữ liệu chứ không vì sản phẩm.

**Test xoá phải tạo bản ghi rồi xoá chính nó.** Đây là luật cứng, không phải tiện tay: chạy
một lần là mất, lần sau đỏ, và cái mất đi thì không dựng lại được.

**Đừng tin biên lai server tự khai — đọc lại để thấy tác dụng thật.** `DELETE` trả
`{ deleted: id }` là lời server nói về chính nó. Không đọc lại thì một API trả 200 mà không
xoá gì vẫn cho test xanh:

```ts
const tree = await api.get<LocationTreeResponse>(LocationRoute.tree());
expect(LocationTreeHelper.findById(tree.data, created.data.id)).toBeUndefined();
```

**Không assert tổng số trên dữ liệu dùng chung.** Cây/danh sách là dữ liệu chung, 4 worker
chạy song song và người khác cũng thêm bớt trên beta. Bám vào bản ghi mình vừa tạo, đừng bám
vào một con số — con số cứng là test đỏ theo lịch làm việc của người khác.

**Endpoint "lấy tất cả" chưa chắc trả một mảng.** `GET .../tree` trả MỘT node gốc
(`type: 'company'`) với `children` đệ quy, trộn địa điểm lẫn thiết bị — đo 22/09/2026: 81
node, sâu 5 tầng, 31 `group_place` trên 49 `device`. Đọc `data` như một mảng, hay đếm node
thô, đều cho con số sai hơn gấp đôi.

---

## 8. Đo trước khi khai

**Mọi hình dạng response phải lấy từ response THẬT, kèm ngày đo trong JSDoc.** Trường nào
chưa quan sát được thì CHƯA khai: khai bừa một trường không tồn tại thì `tsc` im lặng cho
qua, và test đọc `undefined` mà tưởng server thiếu dữ liệu.

Cùng lý do đó: đừng nới một trường thành optional, đừng mở rộng một union, đừng assert một
con số ngoài ca đã đo. Ghi giới hạn vào JSDoc để người sau biết chỗ nào còn trống —
`revoked_grants` mới đo được ca địa điểm chưa gán cho ai (`0`), nên đừng assert giá trị khác
cho tới khi đo được ca có phân quyền.

---

## 9. Môi trường và xác thực

**Gateway là HOST KHÁC app.** `baseURL` trỏ `beta-vmsmart-next.fcam.vn`, `apiURL` trỏ
`beta-api-gateway.fcam.vn` — xem `src/env.ts`. Đây là chỗ đã mất một buổi vì tưởng chúng
cùng host: gọi API qua host của app thì Next.js trả về HTML của trang, status vẫn 200.

**Token lấy từ phiên UI.** `createClient(ApiClient)` cấp context mang sẵn `apiURL` làm
baseURL và `Authorization: Bearer` lấy từ phiên mà project `setup` đăng nhập bằng UI — xem
`src/core/session-token.ts`. Token sống 30 phút, nên project `api` phải chạy SAU `setup` (đã
nối trong `playwright.config.ts`).

**Log che token.** Log của bộ test đi vào artifact CI, mà `Authorization` mang một JWT còn
hiệu lực. `src/api/logging.ts` che nó, và `logging.test.ts` canh phần che đó — **đừng xoá
file test này**.

---

/**
 * Cây phân cấp của một doanh nghiệp — `GET /brm-v2/api/v1/enterprises/{enterpriseId}/tree`.
 *
 * **Đây KHÔNG phải "danh sách địa điểm".** Đo ngày 22/09/2026 trên doanh nghiệp test: 81
 * node, sâu 5 tầng, gồm 1 `company` + 31 `group_place` + 49 `device`. Địa điểm là các node
 * `group_place` NẰM RẢI Ở MỌI TẦNG, không phải một mảng phẳng — muốn "tất cả địa điểm" thì
 * phải duyệt hết cây rồi lọc, xem `LocationTreeHelper`.
 *
 * Gọi nó là "get all location" rồi đọc thẳng `data` như một mảng là sai hai lần: `data` là
 * MỘT node gốc chứ không phải mảng, và nội dung của nó quá nửa là thiết bị.
 */

/**
 * Loại node. Ba giá trị này là những gì QUAN SÁT ĐƯỢC, không phải cả bảng của backend.
 *
 * Khai union đóng để `node.type === 'group_palce'` bị `tsc` bắt ngay. Đổi lại: ngày backend
 * thêm một loại thứ tư, `tsc` KHÔNG bắt được — nên mọi chỗ lọc phải viết theo kiểu "giữ cái
 * mình cần", đừng viết theo kiểu "loại trừ cái mình biết".
 */
export type LocationTreeNodeType = 'company' | 'group_place' | 'device';

/**
 * Một node bất kỳ trong cây. Mọi loại node đều CÙNG 5 khoá này — đã đối chiếu cả 81 node,
 * không loại nào mang thêm hay thiếu trường.
 */
export interface LocationTreeNode {
  id: string;
  name: string;
  type: LocationTreeNodeType;
  /**
   * Quyền của người gọi trên node.
   *
   * Khai `string` chứ không phải union: response thật CHỈ có `'granted'`, nên mọi giá trị
   * khác đều là đoán. Đo được ca bị từ chối rồi thì siết lại thành union.
   */
  access: string;
  /** Luôn có mặt; node lá là `[]`, không bao giờ vắng trường. */
  children: LocationTreeNode[];
}

/**
 * `data` của endpoint: node GỐC, `type: 'company'` — không phải mảng node con.
 *
 * Alias chứ không phải một interface riêng, và đây KHÔNG phạm luật "mỗi endpoint một kiểu":
 * luật đó cấm gộp HAI endpoint vào một kiểu. Ở đây chỉ có một endpoint, alias tồn tại để
 * chỗ gọi đọc ra hợp đồng (`get<LocationTreeResponse>()`) còn phần đệ quy giữ tên node.
 */
export type LocationTreeResponse = LocationTreeNode;

import type { LocationTreeNode } from '../models';

/**
 * Đọc cây phân cấp mà `GET /tree` trả về.
 *
 * Ba hàm đều THUẦN và đệ quy hết mọi tầng — cây thật sâu 5 tầng, một bản chỉ duyệt một
 * tầng vẫn xanh trên cây nông rồi im lặng bỏ sót ở cây thật.
 */
export class LocationTreeHelper {
  /** Mọi node, kể cả gốc, theo thứ tự duyệt sâu-trước. */
  static flatten(root: LocationTreeNode): LocationTreeNode[] {
    return [root, ...root.children.flatMap((child) => LocationTreeHelper.flatten(child))];
  }

  /**
   * Chỉ địa điểm — `group_place` ở mọi tầng.
   *
   * Viết theo kiểu GIỮ cái mình cần, không phải loại trừ `company` và `device`: ngày backend
   * thêm một loại node thứ tư, bản loại trừ sẽ lặng lẽ đếm nó thành địa điểm.
   */
  static locations(root: LocationTreeNode): LocationTreeNode[] {
    return LocationTreeHelper.flatten(root).filter((node) => node.type === 'group_place');
  }

  /**
   * Tìm một node theo `id`, `undefined` khi không có.
   *
   * KHÔNG ném khi vắng: "không tìm thấy" là câu trả lời hợp lệ — đó đúng là thứ test xoá
   * cần để khẳng định bản ghi đã biến mất thật.
   */
  static findById(root: LocationTreeNode, id: string): LocationTreeNode | undefined {
    return LocationTreeHelper.flatten(root).find((node) => node.id === id);
  }
}

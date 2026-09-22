import { unique } from 'qc-kit/utils';
import { faker } from '../../data/faker';
import type { CreateLocationRequest, UpdateLocationRequest } from '../models';

/**
 * Dựng payload cho các route Địa điểm — hợp lệ sẵn, override đúng trường mình quan tâm.
 *
 *     LocationRequestHelper.valid()                     // dùng được ngay
 *     LocationRequestHelper.valid({ name: 'Quận 1' })   // ghim một trường
 *     LocationRequestHelper.missingName()               // sai đúng MỘT chỗ, cho test âm
 *
 * Vì sao là một tầng riêng chứ không viết thẳng object trong spec: hôm API thêm một trường
 * bắt buộc, sửa một chỗ này là cả suite xanh lại.
 */

export class LocationRequestHelper {
  /**
   * Faker lo phần GIỐNG THẬT, `unique()` lo phần KHÔNG TRÙNG. Cần cả hai, không thay được
   * cho nhau:
   *
   * - Bỏ `unique()` thì dính `140903 NODE_NAME_CONFLICT`. Đo được: 200 lần gọi
   *   `location.city()` chỉ ra **30 giá trị khác nhau** — kho từ của locale là hữu hạn, và
   *   4 worker chạy song song sẽ đụng nhau rất nhanh.
   * - Bỏ faker thì tên thành `qc-groups-1789985376048-u1dh`, không ai đọc report mà hình
   *   dung ra được cái gì.
   *
   * Ghép lại: `Nha Trang 1789985376048 sc5m` — vừa duy nhất vừa đọc được.
   */
  static valid(overrides: Partial<CreateLocationRequest> = {}): CreateLocationRequest {
    const city = faker.location.city();

    return {
      name: `${city}${unique('')}`.replace(/-/g, ' '),
      // KHÔNG dùng `company.catchPhrase()`: nó rơi xuống `en` nên ra "Front-line dynamic
      // capacity" — tiếng Anh nằm giữa một bộ dữ liệu tiếng Việt, trông như lỗi.
      description: `Cụm cửa hàng khu vực ${city}`,
      ...overrides,
    };
  }

  /**
   * Payload cho `PATCH`. Dựng riêng chứ không gọi lại `valid()`: hai endpoint hai hợp đồng,
   * và ngày một trong hai đổi trường thì chỗ phải sửa nói ngay nó thuộc endpoint nào.
   *
   * Giá trị mặc định là một tên MỚI, khác lúc tạo — test sửa mà gửi lại đúng tên cũ thì
   * assert `name === request.name` xanh kể cả khi server không sửa gì cả.
   */
  static validUpdate(overrides: Partial<UpdateLocationRequest> = {}): UpdateLocationRequest {
    const city = faker.location.city();

    return {
      name: `${city}${unique('')}`.replace(/-/g, ' '),
      description: `Cụm cửa hàng khu vực ${city} (đã sửa)`,
      ...overrides,
    };
  }

  // --- payload SAI, dành cho test âm. Đặt tên theo CÁI SAI. ---
  // Kiểu trả về `unknown`: payload sai thì theo định nghĩa không khớp
  // `CreateLocationRequest`, và ép nó khớp thì không viết được test âm nào.

  static missingName(): unknown {
    const { name: _dropped, ...rest } = LocationRequestHelper.valid();
    return rest;
  }

  static emptyName(): unknown {
    return LocationRequestHelper.valid({ name: '' });
  }
}

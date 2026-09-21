import { unique } from 'qc-kit/utils';
import type { CreateReqresUser } from '../models';

/**
 * Dựng payload cho request — hợp lệ sẵn, override đúng trường mình quan tâm.
 *
 *   ReqresUserRequestHelper.tao()                    // hợp lệ hoàn toàn
 *   ReqresUserRequestHelper.tao({ job: 'Dev' })      // ghim một trường
 *   ReqresUserRequestHelper.thieuTen()               // sai đúng MỘT chỗ, cho test âm
 *
 * Vì sao là một tầng riêng chứ không viết thẳng object trong spec: hôm API thêm một trường
 * bắt buộc, sửa một chỗ này là cả suite xanh lại. Viết thẳng thì phải đi sửa từng spec, và
 * luôn sót một cái.
 */
export class ReqresUserRequestHelper {
  static tao(overrides: Partial<CreateReqresUser> = {}): CreateReqresUser {
    return {
      // `unique()` gắn timestamp + hậu tố ngẫu nhiên: worker chạy song song không giẫm lên
      // nhau, và bản ghi rác trên môi trường test truy được về lần chạy nào.
      name: unique('qc-user'),
      job: 'QA Engineer',
      ...overrides,
    };
  }

  // --- payload SAI, dành cho test âm ------------------------------------
  // Kiểu trả về `unknown`: payload sai thì theo định nghĩa không khớp `CreateReqresUser`.
  // Đặt tên theo CÁI SAI để đọc tên test là biết nó thử tình huống nào.

  static thieuTen(): unknown {
    const { name: _bo, ...conLai } = ReqresUserRequestHelper.tao();
    return conLai;
  }

  static tenRong(): unknown {
    return ReqresUserRequestHelper.tao({ name: '' });
  }
}

import { expect } from '@playwright/test';
import { step } from 'qc-kit/core';
import type { CreateReqresUser, ReqresCreated, ReqresUser } from '../models';

/**
 * Assert thuộc về TÀI NGUYÊN — tách khỏi spec.
 *
 * Ranh giới: "một bản ghi người dùng hợp lệ trông thế nào" là kiến thức của tài nguyên, và
 * hai chục test đều cần nó. "Sau khi đổi job thì bản ghi phải sang trạng thái X" là kịch
 * bản, thuộc về spec. Đưa nhầm loại thứ hai vào đây thì class này phình thành nơi chứa mọi
 * logic test.
 *
 * Mỗi method bọc trong `step()` của kit, nên report hiện "User: bản ghi hợp lệ" thay vì một
 * dòng expect trần — bù đúng cái mất đi khi assert rời khỏi spec.
 */
export class ReqresUserVerification {
  /** Hình dạng tối thiểu của một bản ghi server trả về. */
  static banGhiHopLe(actual: ReqresUser): Promise<void> {
    return step('User: bản ghi hợp lệ', async () => {
      expect(actual.id, 'phải có id').toBeGreaterThan(0);
      expect(actual.email, 'email không được rỗng').not.toBe('');
      expect(actual.email, 'email phải đúng dạng').toContain('@');
    });
  }

  /** Bản ghi vừa tạo phải phản ánh đúng thứ gửi lên, cộng hai trường server sinh. */
  static khopRequest(actual: ReqresCreated, request: CreateReqresUser): Promise<void> {
    return step(`User: khớp request "${request.name}"`, async () => {
      expect(actual.name).toBe(request.name);
      expect(actual.job).toBe(request.job);
      expect(actual.id, 'server phải sinh id').toBeTruthy();
      expect(actual.createdAt, 'server phải sinh createdAt').toBeTruthy();
    });
  }
}

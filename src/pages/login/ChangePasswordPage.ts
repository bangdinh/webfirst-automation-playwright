import { expect } from '@playwright/test';
import { BasePage } from 'qc-kit/core';

/**
 * Màn Đổi / đặt lại mật khẩu — "Mật khẩu mới" + "Nhập lại mật khẩu", kèm checklist 4 rule.
 *
 * **Đường vào màn này CHƯA XÁC ĐỊNH.** Màn không có field "Mật khẩu hiện tại" (AUTH5.9 nói
 * thẳng điều đó), nên nhiều khả năng nó là màn đặt lại mật khẩu đi từ link trong email —
 * tức là phải đọc được hộp thư mới tới được. Chừng nào chưa chốt, mọi case của màn này
 * `skip` với `DATA-TBD`; xem mục 2 của `docs/test-data.md`.
 *
 * TẠM THỜI: chưa có locator thật nào — toàn bộ `LOCATOR-TBD` phải lấy từ DOM ở bước 3.
 */

/** Nhãn hiển thị. TẠM THỜI: lấy từ `expected` của AUTH5.2 → AUTH5.9, CHƯA đối chiếu DOM. */
const VI = {
  notMatched: 'Mật khẩu xác nhận không khớp.',
  succeeded: 'Đổi mật khẩu thành công',
  /**
   * AUTH5.9 chỉ trích một mẩu câu — `"phải khác mật khẩu hiện tại"` — chứ không cho cả
   * câu. Khớp bằng regex trên mẩu đó thay vì đoán phần còn lại.
   */
  mustDiffer: /phải khác mật khẩu hiện tại/i,
} as const;

/**
 * Bốn rule của password policy, đúng thứ tự và đúng câu chữ trong AUTH5.2.
 *
 * Chép nguyên văn kể cả lỗi chính tả của file nguồn ("Có ít 1 chữ số", "Có it 1 chữ in
 * hoa") — assert theo chuỗi thì phải khớp DOM, mà DOM có khả năng cũng mang đúng lỗi đó.
 * Đối chiếu ở bước 3 rồi sửa cả hai nơi một lượt.
 */
const RULES = [
  'Có ít nhất 12 kí tự',
  'Có ít 1 chữ số',
  'Có it 1 chữ in hoa',
  'Có ít 1 ký tự đặc biệt',
] as const;

export class ChangePasswordPage extends BasePage {
  // LOCATOR-TBD: ô "Mật khẩu mới" (AUTH5.2 step 1)
  readonly newPassword = this.page.getByTestId('LOCATOR-TBD-change-pwd-new');

  // LOCATOR-TBD: ô "Nhập lại mật khẩu" (AUTH5.4 step 2)
  readonly confirmPassword = this.page.getByTestId('LOCATOR-TBD-change-pwd-confirm');

  /**
   * LOCATOR-TBD: checklist 4 rule (AUTH5.2 step 2) — khớp NHIỀU phần tử.
   *
   * Trạng thái đạt/chưa đạt của từng rule (dot xám → xanh + dấu check) chưa biết thể hiện
   * bằng gì: class CSS, `aria-checked`, hay một icon riêng. Bước 3 trả lời; tới lúc đó
   * `expectRuleStates()` mới assert được từng dòng.
   */
  readonly rules = this.page.getByTestId('LOCATOR-TBD-change-pwd-rule');

  // LOCATOR-TBD: inline error dưới ô Nhập lại mật khẩu (AUTH5.4 step 2)
  readonly confirmError = this.page.getByTestId('LOCATOR-TBD-change-pwd-confirm-error');

  // LOCATOR-TBD: nút "Xác nhận", disabled tới khi đủ rule và hai ô khớp nhau (AUTH5.3)
  readonly confirmButton = this.page.getByTestId('LOCATOR-TBD-change-pwd-submit-btn');

  // LOCATOR-TBD: toast kết quả "Đổi mật khẩu thành công" (AUTH5.6 · AUTH5.7)
  readonly toast = this.page.getByTestId('LOCATOR-TBD-change-pwd-toast');

  /**
   * LOCATOR-TBD: inline error do SERVER trả về (AUTH5.9).
   *
   * Khác `confirmError`: cái kia là validate phía client giữa hai ô, cái này chỉ xuất
   * hiện sau khi submit — vì màn không có field "Mật khẩu hiện tại" để tự so.
   */
  readonly serverError = this.page.getByTestId('LOCATOR-TBD-change-pwd-server-error');

  override async open(): Promise<never> {
    throw new Error(
      'Chưa biết đường vào màn Đổi mật khẩu — nhiều khả năng phải đi từ link trong email. ' +
        'Xem mục 2 của docs/test-data.md.',
    );
  }

  override async waitUntilLoaded(): Promise<void> {
    await expect(this.newPassword).toBeEditable();
  }

  /** Đưa con trỏ vào ô Mật khẩu mới — AUTH5.2 kiểm checklist hiện ra khi focus. */
  async focusMatKhauMoi(): Promise<void> {
    await this.step('focus ô Mật khẩu mới', async () => {
      await this.newPassword.focus();
    });
  }

  async nhapMatKhauMoi(matKhau: string): Promise<void> {
    await this.step(`nhập mật khẩu mới "${'*'.repeat(matKhau.length)}"`, async () => {
      await this.newPassword.fill(matKhau);
    });
  }

  async nhapLaiMatKhau(matKhau: string): Promise<void> {
    await this.step(`nhập lại mật khẩu "${'*'.repeat(matKhau.length)}"`, async () => {
      await this.confirmPassword.fill(matKhau);
    });
  }

  /** AUTH5.2 — checklist hiện đủ 4 rule, đúng câu chữ và đúng thứ tự. */
  async expectRuleChecklist(): Promise<void> {
    await this.step('checklist hiển thị đủ 4 rule mật khẩu', async () => {
      await expect(this.rules).toHaveCount(RULES.length);
      await expect(this.rules).toHaveText([...RULES]);
    });
  }

  /**
   * AUTH5.3 — mật khẩu chưa đạt đủ rule thì nút Xác nhận vẫn khoá.
   *
   * Vế "rule đạt chuyển xanh / chưa đạt giữ dot xám" CHƯA assert: chưa biết trạng thái đó
   * thể hiện bằng gì trong DOM. Đây là vế chính của case, nên khi lấy locator ở bước 3
   * phải trả lời câu đó trước.
   */
  async expectSubmitDisabled(): Promise<void> {
    await this.step('nút Xác nhận còn khoá', async () => {
      await expect(this.confirmButton).toBeDisabled();
    });
  }

  /** AUTH5.4 — hai ô không khớp. */
  async expectConfirmNotMatched(): Promise<void> {
    await this.step('báo mật khẩu xác nhận không khớp', async () => {
      await expect(this.confirmError).toHaveText(VI.notMatched);
    });
  }

  async xacNhan(): Promise<void> {
    await this.step('bấm Xác nhận đổi mật khẩu', async () => {
      await this.clickWhenReady(this.confirmButton);
    });
  }

  /** AUTH5.5 — đủ rule và hai ô khớp thì nút mở khoá. */
  async expectSubmitEnabled(): Promise<void> {
    await this.step('nút Xác nhận đã mở khoá', async () => {
      await expect(this.confirmButton).toBeEnabled();
      await expect(this.confirmError).toBeHidden();
    });
  }

  /**
   * AUTH5.6 · AUTH5.7 — đổi mật khẩu thành công.
   *
   * Chỉ assert toast. Vế "auto logout toàn bộ session" và "chuyển về màn Company ID" hay
   * "chuyển sang màn 2FA" là chuyện xảy ra SAU đó, ở màn khác — spec assert phần điều
   * hướng, vì chính chỗ đó mới là điểm khác nhau giữa hai case.
   */
  async expectChangeSucceeded(): Promise<void> {
    await this.step('toast báo đổi mật khẩu thành công', async () => {
      await expect(this.toast).toContainText(VI.succeeded);
    });
  }

  /** AUTH5.9 — mật khẩu mới trùng mật khẩu hiện tại, server chặn. */
  async expectMustDifferFromCurrent(): Promise<void> {
    await this.step('server báo mật khẩu mới phải khác mật khẩu hiện tại', async () => {
      await expect(this.serverError).toHaveText(VI.mustDiffer);
    });
  }
}

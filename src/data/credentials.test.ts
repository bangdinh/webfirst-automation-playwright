import { expect, test } from '@playwright/test';
import { CHO_CAP, specialAccounts, throwawayAccounts } from './credentials';

/**
 * `WAITING_ACCOUNT` phải đọc ra thành CHƯA CÓ.
 *
 * Nó tồn tại để người đọc `.env` phân biệt được hai thứ trông giống nhau: một key để
 * trống vì chưa ai xét tới, và một key để trống vì đã biết cần nhưng đang chờ cấp.
 *
 * Nguy hiểm nếu làm sai: mọi case đứng sau một tài khoản đều gác bằng
 * `test.skip(!...username)`. Để chuỗi đánh dấu lọt qua cái gác đó thì nó đi thẳng vào form
 * đăng nhập, và hơn chục case đỏ với "Tài khoản hoặc mật khẩu không đúng" — đỏ vì môi
 * trường, mà lại trông y hệt một bug của sản phẩm.
 */

const datEnv = (key: string, giaTri: string | undefined): void => {
  if (giaTri === undefined) delete process.env[key];
  else process.env[key] = giaTri;
};

test('WAITING_ACCOUNT đọc ra rỗng, đúng như khi để trống', () => {
  const cu = process.env.PWD_EXPIRED_USERNAME;
  try {
    datEnv('PWD_EXPIRED_USERNAME', CHO_CAP);
    expect(throwawayAccounts.passwordExpired.username).toBe('');
  } finally {
    datEnv('PWD_EXPIRED_USERNAME', cu);
  }
});

test('giá trị thật vẫn đi qua nguyên vẹn', () => {
  const cu = process.env.OTP_USERNAME;
  try {
    datEnv('OTP_USERNAME', 'qa-otp@vi-du.test');
    expect(specialAccounts.otpEnabled.username).toBe('qa-otp@vi-du.test');
  } finally {
    datEnv('OTP_USERNAME', cu);
  }
});

test('WAITING_ACCOUNT ở backupCodes ra mảng rỗng, không ra một phần tử rác', () => {
  const cu = process.env.OTP_BACKUP_CODES;
  try {
    datEnv('OTP_BACKUP_CODES', CHO_CAP);
    expect(specialAccounts.otpEnabled.backupCodes).toEqual([]);
  } finally {
    datEnv('OTP_BACKUP_CODES', cu);
  }
});

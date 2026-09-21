import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { expect, test } from '@playwright/test';
import { docSessionToken } from './session-token';

/**
 * Ba nhánh hỏng của `docSessionToken`, và cả ba đều phải ném lỗi NÓI RÕ phải làm gì.
 *
 * Vì sao đáng test: hàm này chạy ở tầng fixture, trước khi bất kỳ assert nào của spec kịp
 * chạy. Nó ném một lỗi mơ hồ thì cả suite API đỏ với một thông báo không chỉ ra được là
 * thiếu session, hết hạn, hay app đổi tên cookie — ba thứ cần ba cách xử lý khác nhau.
 */

const jwt = (payload: object): string =>
  ['eyJhbGciOiJSUzI1NiJ9', Buffer.from(JSON.stringify(payload)).toString('base64url'), 'chuky'].join(
    '.',
  );

function fileTam(noiDung: unknown): string {
  const duongDan = join(mkdtempSync(join(tmpdir(), 'qc-session-')), 'user.json');
  writeFileSync(duongDan, JSON.stringify(noiDung));
  return duongDan;
}

const giay = (lech: number) => Math.floor(Date.now() / 1000) + lech;

test('đọc được token còn hạn', () => {
  const token = jwt({ exp: giay(600) });
  const f = fileTam({ cookies: [{ name: 'session_token', value: token, domain: 'x.test' }] });

  expect(docSessionToken(f)).toBe(token);
});

test('thiếu file session thì lỗi chỉ ra lệnh phải chạy', () => {
  expect(() => docSessionToken(join(tmpdir(), 'khong-ton-tai-bao-gio.json'))).toThrow(
    /--project=setup/,
  );
});

test('có file nhưng không có cookie session_token thì lỗi nói tên cookie', () => {
  const f = fileTam({ cookies: [{ name: 'NEXT_LOCALE', value: 'vi', domain: 'x.test' }] });

  expect(() => docSessionToken(f)).toThrow(/session_token/);
});

/*
 * Nhánh nguy hiểm nhất: token CÓ nhưng đã hết hạn. Trả nó ra thì request đi bình thường và
 * API trả 401 — người đọc lỗi tưởng sản phẩm chặn nhầm, trong khi việc phải làm chỉ là chạy
 * lại `setup`. Token sống 30 phút nên nhánh này gặp thường xuyên, không phải hiếm.
 */
test('token hết hạn thì ném lỗi, KHÔNG trả ra', () => {
  const f = fileTam({
    cookies: [{ name: 'session_token', value: jwt({ exp: giay(-1) }), domain: 'x.test' }],
  });

  expect(() => docSessionToken(f)).toThrow(/hết hạn/);
});

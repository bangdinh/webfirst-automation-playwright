import { expect, test } from '@playwright/test';
import { formatApiCall, redactHeaders, redactValue } from './logging';

/**
 * Che token là thứ duy nhất ở file này KHÔNG được phép hỏng.
 *
 * Log của bộ test đi vào artifact CI, mà `Authorization` mang một JWT còn hiệu lực 30 phút.
 * Một lần regression ở đây là phát token cho bất kỳ ai đọc được artifact — và không ai phát
 * hiện, vì test vẫn xanh.
 */

const TOKEN = 'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.abcdefghijklmnop.chuky';

test('che Authorization nhưng giữ 12 ký tự đầu và độ dài', () => {
  const out = redactHeaders({ Authorization: `Bearer ${TOKEN}` });

  expect(out.Authorization).not.toContain('abcdefghijklmnop');
  expect(out.Authorization).toContain('Bearer eyJhbGciOiJS');
  expect(out.Authorization).toContain('đã che');
});

/*
 * Giữ 12 ký tự đầu là có chủ đích: nó phân biệt ba ca mà "che sạch" gộp làm một — gửi nhầm
 * token cũ, gửi chuỗi rỗng, và gửi đúng token.
 */
test('chuỗi rỗng hiện là "(rỗng)", không phải một chuỗi che trông giống token', () => {
  expect(redactValue('')).toBe('(rỗng)');
});

test('che không phân biệt hoa thường và phủ cả cookie', () => {
  const out = redactHeaders({ authorization: TOKEN, 'Set-Cookie': 'session_token=abc' });

  expect(out.authorization).toContain('đã che');
  expect(out['Set-Cookie']).toContain('đã che');
});

test('header thường thì giữ nguyên', () => {
  expect(redactHeaders({ 'Content-Type': 'application/json' })['Content-Type']).toBe(
    'application/json',
  );
});

test('khối log có đủ method, url, status và thân request', () => {
  const out = formatApiCall({
    method: 'post',
    url: 'https://gw.test/brm-v2/api/v1/groups',
    requestHeaders: { Authorization: `Bearer ${TOKEN}` },
    requestBody: { name: 'Quận 1' },
    status: 403,
    responseHeaders: {},
    responseBody: { code: 140303, error: 'RESOURCE_DENIED' },
    durationMs: 128,
  });

  expect(out).toContain('→ POST https://gw.test/brm-v2/api/v1/groups');
  expect(out).toContain('← 403 (128 ms)');
  expect(out).toContain('"name": "Quận 1"');
  expect(out).toContain('RESOURCE_DENIED');
  expect(out, 'token KHÔNG được lọt vào khối log').not.toContain('abcdefghijklmnop');
});

test('request không có thân thì nói rõ, không in "undefined"', () => {
  const out = formatApiCall({
    method: 'get',
    url: 'https://gw.test/x',
    requestHeaders: {},
    status: 200,
    responseHeaders: {},
    responseBody: '',
    durationMs: 5,
  });

  expect(out).toContain('(không có thân)');
  expect(out).not.toContain('undefined');
});

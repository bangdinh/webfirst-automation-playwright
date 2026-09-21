import { expect, test } from '@playwright/test';
import { buildPath, parseEnvelope } from './ApiResource';

/**
 * `buildPath` là hàm thuần nên kiểm được ở project `unit`, không cần mạng.
 *
 * Đây là chỗ dễ sai nhất của cả tầng API: thiếu một biến thì URL mang nguyên chuỗi
 * `{enterpriseId}`, server trả 404, và thông báo lỗi không hề nói ra nguyên nhân là quên
 * truyền biến. Nên nó phải ném NGAY tại chỗ, kèm tên biến còn thiếu.
 */

const TEMPLATE = '/brm-v2/api/v1/enterprises/{enterpriseId}/groups';
const DEFAULTS = { enterpriseId: 'ent-1' };

test('thay biến mặc định vào mẫu', () => {
  expect(buildPath(TEMPLATE, {}, DEFAULTS)).toBe('/brm-v2/api/v1/enterprises/ent-1/groups');
});

test('biến truyền vào lời gọi thắng biến mặc định', () => {
  expect(buildPath(TEMPLATE, { pathParams: { enterpriseId: 'ent-9' } }, DEFAULTS)).toBe(
    '/brm-v2/api/v1/enterprises/ent-9/groups',
  );
});

test('`suffix` nối vào cuối để trỏ một bản ghi', () => {
  expect(buildPath(TEMPLATE, { suffix: '/abc-123' }, DEFAULTS)).toBe(
    '/brm-v2/api/v1/enterprises/ent-1/groups/abc-123',
  );
});

/*
 * Ném chứ không để lọt: một URL còn nguyên `{enterpriseId}` vẫn gửi đi được, và server trả
 * 404 — spec đỏ ở dòng assert status, cách xa nguyên nhân thật hàng chục dòng.
 */
test('thiếu biến thì ném lỗi gọi đúng tên biến', () => {
  expect(() => buildPath(TEMPLATE, {}, {})).toThrow(/enterpriseId/);
});

test('giá trị biến được encode, không phá cấu trúc URL', () => {
  expect(buildPath('/x/{id}', { pathParams: { id: 'a/b?c' } })).toBe('/x/a%2Fb%3Fc');
});

/*
 * Bóc lớp vỏ chung của gateway. Hai hình dạng thật, cộng ba ca KHÔNG phải envelope —
 * 204 không thân, trang lỗi HTML của proxy, và JSON không có `code`.
 */
test('bóc envelope thành công: code, message, data', () => {
  const out = parseEnvelope<{ id: string }>({
    code: 1200,
    message: 'OK',
    data: { id: 'g-1' },
  });

  expect(out.code).toBe(1200);
  expect(out.message).toBe('OK');
  expect(out.data).toEqual({ id: 'g-1' });
});

test('envelope lỗi: `error` được đọc thành message, data vắng mặt', () => {
  const out = parseEnvelope({ code: 140303, error: 'RESOURCE_DENIED' });

  expect(out.code).toBe(140303);
  expect(out.message).toBe('RESOURCE_DENIED');
  expect(out.data).toBeUndefined();
});

/*
 * `code` là `undefined` chứ không phải 0 hay -1: một mã bịa ra sẽ lọt qua
 * `expect(code).toBeTruthy()` hoặc khiến người đọc đi tra một mã không tồn tại.
 */
test('thân không phải envelope thì code là undefined, không bịa mã', () => {
  expect(parseEnvelope(undefined).code).toBeUndefined();
  expect(parseEnvelope('<!DOCTYPE html>').code).toBeUndefined();
  expect(parseEnvelope({ id: 'x' }).code).toBeUndefined();
});

test('không có message lẫn error thì trả chuỗi rỗng, không undefined', () => {
  expect(parseEnvelope({ code: 1200 }).message).toBe('');
});

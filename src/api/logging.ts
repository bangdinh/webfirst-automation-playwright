import { envVar } from 'qc-kit/config';

/**
 * Định dạng một lời gọi API thành khối đọc được, để dán vào log.
 *
 * Hàm thuần, tách khỏi `ApiResource` để test được mà không cần mạng — và vì phần che token
 * là thứ TUYỆT ĐỐI không được hỏng: log của bộ test đi vào artifact CI, mà `Authorization`
 * mang một JWT còn hiệu lực 30 phút. In nguyên nó ra là phát token cho bất kỳ ai đọc được
 * artifact.
 */

/** Header nào bị che. So khớp không phân biệt hoa thường. */
const SECRET_HEADERS = ['authorization', 'cookie', 'set-cookie', 'x-api-key'];

/**
 * Che giá trị nhưng giữ đủ để chẩn đoán: scheme, 12 ký tự đầu của phần bí mật, và độ dài.
 *
 * Giữ lại chừng đó là có lý do — nó phân biệt được ba ca mà "đã che hết" gộp làm một:
 * gửi nhầm token cũ, gửi chuỗi rỗng, và gửi đúng token.
 */
export function redactValue(value: string): string {
  if (!value) return '(rỗng)';

  // Giữ nguyên scheme (`Bearer`, `Basic`) rồi mới che phần bí mật: nếu cắt 12 ký tự đầu
  // của cả chuỗi thì riêng chữ "Bearer " đã ăn 7, chỉ còn 5 ký tự token — không đủ để
  // phân biệt hai token khác nhau, tức mất đúng thứ việc che này định giữ lại.
  const parts = value.match(/^(\w+)\s+(.+)$/);
  const scheme = parts ? parts[1] + ' ' : '';
  const secret = parts ? parts[2] : value;

  return `${scheme}${secret.slice(0, 12)}… (đã che, ${secret.length} ký tự)`;
}

export function redactHeaders(headers: Record<string, string>): Record<string, string> {
  // Bật cờ này chỉ khi debug tay trên máy mình, đừng bật trên CI.
  if (envVar('API_LOG_SECRETS', '') === '1') return headers;

  return Object.fromEntries(
    Object.entries(headers).map(([key, value]) =>
      SECRET_HEADERS.includes(key.toLowerCase()) ? [key, redactValue(value)] : [key, value],
    ),
  );
}

/** In JSON cho dễ đọc; thứ không phải JSON thì trả nguyên văn. */
function pretty(value: unknown): string {
  if (value === undefined || value === '') return '(không có thân)';
  if (typeof value === 'string') {
    try {
      return JSON.stringify(JSON.parse(value), null, 2);
    } catch {
      return value;
    }
  }
  return JSON.stringify(value, null, 2);
}

export interface ApiCallLog {
  method: string;
  url: string;
  requestHeaders: Record<string, string>;
  requestBody?: unknown;
  status: number;
  responseHeaders: Record<string, string>;
  responseBody: unknown;
  durationMs: number;
}

export function formatApiCall(call: ApiCallLog): string {
  const lines = [
    `→ ${call.method.toUpperCase()} ${call.url}`,
    '  request headers:',
    ...dumpHeaders(redactHeaders(call.requestHeaders)),
    '  request body:',
    ...indent(pretty(call.requestBody)),
    `← ${call.status} (${call.durationMs} ms)`,
    '  response headers:',
    ...dumpHeaders(redactHeaders(call.responseHeaders)),
    '  response body:',
    ...indent(pretty(call.responseBody)),
  ];
  return lines.join('\n');
}

const dumpHeaders = (headers: Record<string, string>): string[] =>
  Object.keys(headers).length === 0
    ? ['    (không có)']
    : Object.entries(headers)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([key, value]) => `    ${key}: ${value}`);

const indent = (text: string): string[] => text.split('\n').map((line) => `    ${line}`);

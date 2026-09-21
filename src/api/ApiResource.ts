import type { APIResponse } from '@playwright/test';
import { BaseApiClient } from 'qc-kit/api';
import { envVar } from 'qc-kit/config';
import { logger } from 'qc-kit/core';
import { formatApiCall } from './logging';
import type { ApiEnvelope } from './models';

/**
 * Lớp cơ sở cho mọi tài nguyên API, theo lối Rest-Assured: **bốn động từ HTTP là bề mặt
 * công khai**, tài nguyên chỉ khai đường dẫn của nó.
 *
 *     const groups = createClient(GroupsClient);
 *     const result = await groups.post(GroupRequestHelper.valid());
 *     expect(result.status).toBe(201);
 *     expect(result.body.name).toBe(...);
 *
 * Khác `BaseApiClient` của kit ở hai điểm, cả hai đều có chủ đích:
 *
 * **1. KHÔNG BAO GIỜ ném khi status không 2xx.** Kit mặc định ném, nên mỗi tài nguyên phải
 * đẻ ra hai method cho mỗi endpoint — một cho đường hạnh phúc, một cho test âm. Ở đây
 * status luôn là dữ liệu trả về, nên một method phục vụ cả hai, và test âm không cần gì
 * đặc biệt. Đổi lại: **spec BẮT BUỘC assert status**, không có cái phao "không ném tức là
 * ổn".
 *
 * **2. Trả cả status lẫn body trong một lần gọi.** `APIResponse` của Playwright chỉ đọc
 * body được một lần, nên nếu chỉ trả response thì spec phải tự `await res.json()` và mọi
 * assert đều lặp lại đoạn đó.
 */

/**
 * Kết quả một lời gọi, đã bóc lớp vỏ chung của gateway.
 *
 * Tham số `T` là kiểu của **`data`**, không phải của cả thân response — vì `data` mới là
 * thứ spec quan tâm. Lớp vỏ (`code`, `message`) giống nhau ở mọi endpoint nên bóc một lần
 * ở đây, thay vì bắt hai chục spec cùng viết `result.body.data`.
 */
export interface ApiResult<T = unknown> {
  /** HTTP status. */
  status: number;
  /** Mã nghiệp vụ trong lớp vỏ. `undefined` khi response không phải envelope. */
  code?: number;
  /** `message` khi thành công, `error` khi lỗi. `''` khi response không có cả hai. */
  message: string;
  /**
   * Phần ruột.
   *
   * Kiểu là `T` nhưng thực tế có thể `undefined` — response lỗi không có `data`, và 204
   * thì không có thân nào cả. Đọc thẳng `.data.x` mà chưa assert là nhận lỗi "reading x of
   * undefined", che mất mã lỗi thật. Chặn bằng `ApiVerification.expectSuccess` trước.
   */
  data: T;
  /** Thân response nguyên văn, cho lúc cần nhìn cả lớp vỏ. */
  body: unknown;
  response: APIResponse;
}

/**
 * Bóc lớp vỏ. Hàm thuần nên test được không cần mạng.
 *
 * Chịu được cả thứ KHÔNG phải envelope: 204 không thân, hay trang lỗi HTML của proxy.
 * Ở hai ca đó `code` là `undefined` — và đó là tín hiệu đúng, khác hẳn việc bịa ra một mã.
 */
export function parseEnvelope<T>(body: unknown): Pick<ApiResult<T>, 'code' | 'message' | 'data'> {
  const envelope = (typeof body === 'object' && body !== null ? body : {}) as ApiEnvelope<T>;
  return {
    code: typeof envelope.code === 'number' ? envelope.code : undefined,
    message: envelope.message ?? envelope.error ?? '',
    data: envelope.data as T,
  };
}

export interface CallOptions {
  /** Nối vào cuối đường dẫn, ví dụ `/abc-123` cho một bản ghi cụ thể. */
  suffix?: string;
  /** Giá trị thay cho `{name}` trong đường dẫn. `enterpriseId` đã có sẵn, không phải truyền. */
  pathParams?: Record<string, string>;
  query?: Record<string, string | number | boolean>;
  headers?: Record<string, string>;
}

/**
 * Ghép đường dẫn cuối cùng từ mẫu.
 *
 * Hàm thuần, export riêng để test được mà không cần mạng — đây là chỗ dễ sai nhất của cả
 * lớp: thiếu một biến thì URL mang nguyên `{enterpriseId}` và server trả 404, một lỗi
 * không hề nói ra rằng nguyên nhân là quên truyền biến.
 */
export function buildPath(template: string, opts: CallOptions = {}, defaults: Record<string, string> = {}): string {
  const pathParams = { ...defaults, ...opts.pathParams };
  const path = template.replace(/\{(\w+)\}/g, (_, name: string) => {
    const value = pathParams[name];
    if (!value) {
      throw new Error(
        `Đường dẫn "${template}" cần biến "{${name}}" nhưng không ai truyền. ` +
          `Truyền qua { pathParams: { ${name}: '...' } }, hoặc khai ${name.toUpperCase()} trong .env.`,
      );
    }
    return encodeURIComponent(value);
  });
  return path + (opts.suffix ?? '');
}

export abstract class ApiResource extends BaseApiClient {
  /**
   * Mẫu đường dẫn của tài nguyên, tính từ gốc gateway. Dùng `{name}` cho phần thay đổi.
   *
   * Tương đối, KHÔNG có host: `API_URL` quyết định môi trường, nên đổi môi trường không
   * phải sửa một dòng code nào.
   */
  protected abstract readonly path: string;

  /** Biến có sẵn cho mọi tài nguyên — spec không phải truyền lại ở từng lời gọi. */
  protected defaultPathParams(): Record<string, string> {
    return { enterpriseId: envVar('ENTERPRISE_ID', '') };
  }

  private async call<T>(
    method: 'get' | 'post' | 'put' | 'delete',
    opts: CallOptions,
    data?: unknown,
  ): Promise<ApiResult<T>> {
    const path = buildPath(this.path, opts, this.defaultPathParams());

    const startedAt = Date.now();
    const response = await this.send(method, path, {
      headers: opts.headers,
      params: opts.query,
      data,
      // Cốt lõi của cả lớp này — xem JSDoc đầu file.
      expectOk: false,
    });
    const body = await readBody(response);

    // Đi qua `logger` của kit chứ không phải `console`: nó vừa in ra console cho lượt
    // chạy local, vừa gom theo TỪNG test rồi đính vào report. Trên CI tám worker dùng
    // chung một luồng console, nên một dòng log không nói nó thuộc test nào là vô dụng.
    logger.info(
      formatApiCall({
        method,
        url: response.url(),
        // `authHeaders` là đúng thứ client gắn thêm. `Content-Type` do context của
        // `createApiFixture` đặt ở tầng trên, không thấy được từ đây.
        requestHeaders: this.authHeaders(opts.headers),
        requestBody: data,
        status: response.status(),
        responseHeaders: response.headers(),
        responseBody: body,
        durationMs: Date.now() - startedAt,
      }),
    );

    return { status: response.status(), ...parseEnvelope<T>(body), body, response };
  }

  get<T = unknown>(opts: CallOptions = {}): Promise<ApiResult<T>> {
    return this.call<T>('get', opts);
  }

  /** `body` là `unknown` chứ không phải kiểu model: test âm cần gửi được payload sai. */
  post<T = unknown>(body: unknown, opts: CallOptions = {}): Promise<ApiResult<T>> {
    return this.call<T>('post', opts, body);
  }

  put<T = unknown>(body: unknown, opts: CallOptions = {}): Promise<ApiResult<T>> {
    return this.call<T>('put', opts, body);
  }

  delete<T = unknown>(opts: CallOptions = {}): Promise<ApiResult<T>> {
    return this.call<T>('delete', opts);
  }
}

/**
 * Đọc body, chịu được cả thân rỗng lẫn thân không phải JSON.
 *
 * DELETE thường trả 204 không có thân, và trang lỗi của gateway có thể là HTML. Gọi thẳng
 * `response.json()` ở hai ca đó sẽ ném một lỗi parse — che mất status, là thứ spec đang
 * thực sự muốn kiểm.
 */
async function readBody(response: APIResponse): Promise<unknown> {
  const text = await response.text();
  if (!text) return undefined;
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

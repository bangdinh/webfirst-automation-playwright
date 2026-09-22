import type { APIResponse } from '@playwright/test';
import { BaseApiClient } from 'qc-kit/api';
import { envVar } from 'qc-kit/config';
import { logger } from 'qc-kit/core';
import { formatApiCall } from './logging';
import type { ApiEnvelope } from './models';

/**
 * Phương tiện gửi request — **một lớp duy nhất cho mọi tài nguyên**, theo lối Rest-Assured:
 * động từ HTTP là bề mặt công khai, đường dẫn do `routes/` cấp.
 *
 *     const api = createClient(ApiClient);
 *     const result = await api.post<LocationResponse>(LocationRoute.create(), payload);
 *     expect(result.status).toBe(200);
 *     expect(result.data.name).toBe(...);
 *
 * **Vì sao không còn một class cho mỗi tài nguyên.** Trước đây mỗi tài nguyên là một
 * subclass chỉ để khai đúng một dòng đường dẫn. Khi `routes/` nắm hết URL thì những class
 * đó rỗng ruột, mà một class rỗng vẫn bắt người đọc mở ra xem nó có gì. Endpoint quản lý ở
 * `routes/`, việc gửi đi quản lý ở đây — mỗi thứ một chỗ.
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
 * Bóc lớp vỏ. Hàm thuần, không chạm mạng.
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
  /**
   * Thay cho biến NỀN trong đường dẫn. `enterpriseId` đã có sẵn từ `.env` nên không phải
   * truyền — chỉ dùng khi muốn gọi sang một doanh nghiệp khác.
   *
   * Định danh của riêng một lời gọi (`groupId`…) KHÔNG đi qua đây: nó là tham số của hàm
   * trong `routes/`, xem `LocationRoute.update()`.
   */
  pathParams?: Record<string, string>;
  query?: Record<string, string | number | boolean>;
  headers?: Record<string, string>;
}

/**
 * Điền biến nền vào đường dẫn mà `routes/` cấp.
 *
 * Hàm thuần, tách riêng vì đây là chỗ dễ sai nhất của cả lớp: thiếu một biến thì URL mang
 * nguyên `{enterpriseId}` và server trả 404, một lỗi không hề nói ra rằng nguyên nhân là
 * quên truyền biến. Nên nó phải ném NGAY tại chỗ, kèm tên biến còn thiếu.
 */
export function buildPath(
  template: string,
  opts: CallOptions = {},
  defaults: Record<string, string> = {},
): string {
  const pathParams = { ...defaults, ...opts.pathParams };
  return template.replace(/\{(\w+)\}/g, (_, name: string) => {
    const value = pathParams[name];
    if (!value) {
      throw new Error(
        `Đường dẫn "${template}" cần biến "{${name}}" nhưng không ai truyền. ` +
          `Truyền qua { pathParams: { ${name}: '...' } }, hoặc khai ${name.toUpperCase()} trong .env.`,
      );
    }
    return encodeURIComponent(value);
  });
}

export class ApiClient extends BaseApiClient {
  /** Biến nền có sẵn cho mọi lời gọi — spec không phải truyền lại ở từng chỗ. */
  protected defaultPathParams(): Record<string, string> {
    return { enterpriseId: envVar('ENTERPRISE_ID', '') };
  }

  private async call<T>(
    method: 'get' | 'post' | 'put' | 'patch' | 'delete',
    route: string,
    opts: CallOptions,
    data?: unknown,
  ): Promise<ApiResult<T>> {
    const path = buildPath(route, opts, this.defaultPathParams());

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

  get<T = unknown>(route: string, opts: CallOptions = {}): Promise<ApiResult<T>> {
    return this.call<T>('get', route, opts);
  }

  /** `body` là `unknown` chứ không phải kiểu model: test âm cần gửi được payload sai. */
  post<T = unknown>(route: string, body: unknown, opts: CallOptions = {}): Promise<ApiResult<T>> {
    return this.call<T>('post', route, opts, body);
  }

  put<T = unknown>(route: string, body: unknown, opts: CallOptions = {}): Promise<ApiResult<T>> {
    return this.call<T>('put', route, opts, body);
  }

  /**
   * Sửa một phần bản ghi. Tách khỏi `put` vì backend phân biệt hai động từ, không phải vì
   * tiện tay: `groups` nhận `PATCH`, gửi `PUT` vào đúng URL đó là một lời gọi khác hẳn.
   */
  patch<T = unknown>(route: string, body: unknown, opts: CallOptions = {}): Promise<ApiResult<T>> {
    return this.call<T>('patch', route, opts, body);
  }

  delete<T = unknown>(route: string, opts: CallOptions = {}): Promise<ApiResult<T>> {
    return this.call<T>('delete', route, opts);
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

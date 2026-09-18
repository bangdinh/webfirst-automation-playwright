/**
 * Hợp đồng đăng nhập — chỗ nối giữa khung chạy và app.
 *
 * Không gì trong file này được biết màn đăng nhập trông ra sao. Một `Authenticator` do
 * `src/data/authenticators.ts` đưa vào; file này quyết định KHI NÀO đăng nhập, session
 * cache Ở ĐÂU và AI trả giá cho nó — một lần cho cả lần chạy ở project setup, hoặc một
 * lần mỗi worker ở fixture bên dưới.
 *
 * File này từng ở `qc-kit/core`. Nó về đây vì "đăng nhập bằng cách nào, cache bao lâu,
 * dùng lại cookie tới khi nào" là chính sách của bộ test này, không phải của kit dùng
 * chung. Kit vẫn cung cấp `BasePage`, `logger`, `step` và preset Playwright.
 */
import { test as base, type Browser, type Page } from '@playwright/test';
import { logger } from 'qc-kit/core';
import { STORAGE_STATE, storageStatePath } from './paths';
import { hasFreshSession, saveSession, sessionTtlMs, writeEmptySession } from './session';

/** Thứ khung chạy cần để đăng nhập được. */
export interface Authenticator {
  /** Lái luồng đăng nhập của app. Phải throw hoặc fail assertion khi hỏng. */
  signIn(): Promise<void>;
  /** Cache session thu được, atomic, vào `file`. */
  saveSession(file?: string): Promise<void>;
}

/**
 * Dựng authenticator cho một page.
 *
 * Trả `null` khi tài khoản chưa được cấu hình (chưa điền credential trong .env) — project
 * setup khi đó ghi ra session rỗng để các project phụ thuộc vẫn khởi động được, thay vì
 * đánh hỏng cả lần chạy.
 */
export type AuthenticatorFactory = (page: Page) => Authenticator | null;

export interface AuthSetupOptions {
  /** Tên của test setup sinh ra. */
  title?: string;
  /** Cache session ở đâu. Mặc định: `STORAGE_STATE` dùng chung. */
  file?: string;
}

/**
 * Đăng ký test setup "đăng nhập một lần cho cả lần chạy".
 *
 * Gọi nó từ một file `*.setup.ts` trong project mà các project khác khai ở
 * `dependencies`. Session của lần chạy trước được dùng lại khi còn trẻ hơn
 * SESSION_TTL_MINUTES, nên chạy lại ở máy local thì bỏ qua bước đăng nhập qua UI.
 */
export function createAuthSetup(
  factory: AuthenticatorFactory,
  options: AuthSetupOptions = {},
): void {
  const file = options.file ?? STORAGE_STATE;

  base(options.title ?? 'authenticate', async ({ page }) => {
    if (hasFreshSession(file)) {
      logger.info(`Dùng lại session ở ${file} (trẻ hơn ${sessionTtlMs() / 60_000} phút).`);
      return;
    }

    const auth = factory(page);
    if (!auth) {
      logger.warn(`Chưa cấu hình tài khoản — ghi storage state rỗng vào ${file}.`);
      writeEmptySession(file);
      return;
    }

    await auth.signIn();
    await auth.saveSession(file);
    logger.info(`Đã lưu trạng thái đã đăng nhập vào ${file}`);
  });
}

export interface AuthWorkerFixtures {
  /**
   * Đường dẫn session của worker này. Lần đăng nhập qua UI phía sau nó chạy nhiều nhất
   * một lần mỗi worker — và không chạy lần nào khi lần chạy trước để lại session còn
   * trong SESSION_TTL_MINUTES.
   */
  workerStorageState: string;
}

export interface AuthFixtureOptions {
  /** baseURL cho context tạm mà lần đăng nhập chạy trong đó. */
  baseURL?: string;
  /** Đổi chỗ mỗi worker cache session. */
  fileFor?: (workerIndex: number) => string;
}

/**
 * Dựng fixture "đăng nhập một lần mỗi worker".
 *
 * Đây là đường lui cho spec không dùng được session chung — một role project setup không
 * tạo, hoặc tài khoản mà app vô hiệu hoá khi dùng lại. Phạm vi worker là mấu chốt: N spec
 * file chạy song song tốn nhiều nhất một lần đăng nhập mỗi worker, không phải mỗi file.
 */
export function createAuthFixture(
  factory: AuthenticatorFactory,
  options: AuthFixtureOptions = {},
) {
  const fileFor = options.fileFor ?? ((index: number) => storageStatePath(`worker-${index}`));

  return base.extend<{}, AuthWorkerFixtures>({
    workerStorageState: [
      async ({ browser }, use, workerInfo) => {
        const file = fileFor(workerInfo.workerIndex);

        if (hasFreshSession(file)) {
          logger.debug(`Worker ${workerInfo.workerIndex} dùng lại session ở ${file}`);
          await use(file);
          return;
        }

        await signInIntoFile(browser, factory, file, options.baseURL);
        logger.info(`Worker ${workerInfo.workerIndex} đã đăng nhập; session cache ở ${file}`);
        await use(file);
      },
      { scope: 'worker' },
    ],
  });
}

/** Đăng nhập trong một context tạm rồi cache kết quả vào `file`. */
async function signInIntoFile(
  browser: Browser,
  factory: AuthenticatorFactory,
  file: string,
  baseURL?: string,
): Promise<void> {
  // Context riêng: lần đăng nhập phải bắt đầu ở trạng thái đã đăng xuất, kể cả khi
  // project chạy nó đang mang sẵn một storageState.
  const context = await browser.newContext({ baseURL, storageState: undefined });
  try {
    const auth = factory(await context.newPage());
    if (!auth) {
      throw new Error(
        'Chưa cấu hình tài khoản cho lần đăng nhập mỗi worker. Điền credential mà ' +
          'src/data/authenticators.ts đọc (xem .env.example), hoặc dùng session chung do ' +
          'project auth setup ghi ra.',
      );
    }
    await auth.signIn();
    await saveSession(context, file);
  } finally {
    await context.close();
  }
}

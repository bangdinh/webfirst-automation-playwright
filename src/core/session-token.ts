import { readFileSync } from 'node:fs';
import { STORAGE_STATE } from './paths';

/**
 * Lấy `session_token` ra khỏi session mà project `setup` đã đăng nhập bằng UI.
 *
 * Đường đi: `setup` đăng nhập thật qua màn SSO → Playwright lưu cookie vào
 * `playwright/.auth/user.json` → hàm này đọc lại → `createApiFixture` gắn vào header
 * `Authorization` → mọi client API có token mà không spec nào phải tự xin.
 *
 * Vì sao KHÔNG lấy token thẳng từ Keycloak bằng password grant (như `get-token.bru`): client
 * `resource-admin` là client bảo mật, cần một client secret mà không ai trong đội test có.
 * Đăng nhập bằng UI thì đi đúng con đường người dùng thật đi, và token nhận được cũng chính
 * là token sản phẩm cấp cho phiên đó.
 *
 * **Token sống 30 phút.** Đo ngày 21/09/2026: `exp` cách lúc cấp đúng 1800 giây. Nó khớp
 * `SESSION_TTL_MINUTES=30`, nên cơ chế cache session có sẵn đã lo việc đăng nhập lại — miễn
 * là project `api` chạy SAU `setup`.
 */

/** Tên cookie mà app đặt token vào. Quan sát từ `playwright/.auth/user.json`. */
const TEN_COOKIE = 'session_token';

interface CookieDaLuu {
  name: string;
  value: string;
  domain: string;
}

/** Giải phần payload của JWT. Không xác minh chữ ký — việc đó của server. */
function payloadCua(token: string): { exp?: number } {
  try {
    return JSON.parse(Buffer.from(token.split('.')[1], 'base64url').toString('utf8'));
  } catch {
    return {};
  }
}

/**
 * Đọc token, hoặc ném lỗi NÓI RÕ phải làm gì.
 *
 * Ném chứ không trả `undefined`: `createApiFixture` coi `undefined` là "không có token" và
 * vẫn gửi request — để rồi API trả 401, và người đọc lỗi tưởng sản phẩm hỏng. Hỏng ở đây
 * thì phải hỏng ngay tại chỗ, kèm câu lệnh cần chạy.
 */
export function docSessionToken(duongDan: string = STORAGE_STATE): string {
  let noiDung: string;
  try {
    noiDung = readFileSync(duongDan, 'utf8');
  } catch {
    throw new Error(
      `Chưa có session tại ${duongDan}. Project \`api\` phải chạy SAU \`setup\` — ` +
        'chạy tay một lần: npx playwright test --project=setup',
    );
  }

  const cookies: CookieDaLuu[] = JSON.parse(noiDung).cookies ?? [];
  const cookie = cookies.find((c) => c.name === TEN_COOKIE);
  if (!cookie?.value) {
    throw new Error(
      `Session không có cookie "${TEN_COOKIE}". Có thể app đã đổi tên cookie — mở F12 → ` +
        `Application → Cookies rồi sửa TEN_COOKIE trong ${__filename}`,
    );
  }

  const { exp } = payloadCua(cookie.value);
  if (exp && exp * 1000 <= Date.now()) {
    throw new Error(
      `Token trong session đã hết hạn lúc ${new Date(exp * 1000).toISOString()}. ` +
        'Chạy lại: npx playwright test --project=setup',
    );
  }

  return cookie.value;
}

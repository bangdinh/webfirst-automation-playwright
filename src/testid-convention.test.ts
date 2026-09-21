import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { expect, test } from '@playwright/test';

/**
 * Lint tĩnh cho quy ước `data-testid` — xem `docs/data-testid-convention.md`.
 *
 * Không mở browser, không biết gì về sản phẩm: chỉ đọc file nguồn như văn bản rồi đối
 * chiếu với bảng khai `Module` trong `docs/test-structure.md`.
 *
 * Vì sao cần: `data-testid` là hợp đồng giữa Dev và bộ test, mà hợp đồng thì phải có chỗ
 * phát hiện lúc nó lệch. Ba kiểu lệch test này bắt được, cả ba đều im lặng cho tới lúc
 * chạy thật:
 *
 *   1. đổi tên module xong sót lại vài id mang tên cũ;
 *   2. copy-paste một locator sang page object khác, kéo theo module của màn cũ;
 *   3. màn mới đẻ ra locator trước khi ai kịp chốt module cho nó.
 *
 * Chưa khai bảng `Module` thì cả bốn test tự `skip` — lint này là tuỳ chọn, không phải
 * cổng chặn.
 *
 * Dự án sở hữu file này: chia thư mục khác thì sửa ba hằng số dưới.
 */

const ROOT = join(__dirname, '..');

/** Nơi được phép khai locator. */
const THU_MUC_NGUON = ['src/pages', 'src/components'];

/** Nơi KHÔNG được khai locator — spec chỉ gọi method của page object. */
const THU_MUC_SPEC = 'tests';

const BANG_KHAI = 'docs/test-structure.md';

/** `\` của Windows không phải thứ để so với đường dẫn viết trong tài liệu. */
const chuanHoa = (duongDan: string): string => relative(ROOT, duongDan).split(sep).join('/');

function duyetTs(thuMuc: string): string[] {
  const goc = join(ROOT, thuMuc);
  if (!existsSync(goc)) return [];

  const ra: string[] = [];
  for (const ten of readdirSync(goc)) {
    const duongDan = join(goc, ten);
    if (statSync(duongDan).isDirectory()) ra.push(...duyetTs(chuanHoa(duongDan)));
    else if (ten.endsWith('.ts') && !ten.endsWith('.test.ts')) ra.push(duongDan);
  }
  return ra;
}

/**
 * Bỏ comment trước khi dò `getByTestId`.
 *
 * Không có bước này thì một ví dụ viết trong JSDoc — để giải thích vì sao một locator
 * phải dùng regex chẳng hạn — bị tính như locator thật, và lint đỏ oan cho một dòng chú
 * thích. Đã dính đúng một lần với `TwoFactorSetupPage`.
 *
 * Chỉ cắt `//` ở ĐẦU DÒNG: cắt mọi `//` sẽ nuốt luôn phần sau của một dòng có `https://`.
 */
const boComment = (noiDung: string): string =>
  noiDung
    .replace(new RegExp("/\\*[\\s\\S]*?\\*/", 'g'), '')
    .replace(new RegExp("^\\s*//.*$", 'gm'), '');

/** Mọi `getByTestId('…')` trong một file, giữ nguyên thứ tự xuất hiện. */
function docTestId(duongDan: string): string[] {
  const noiDung = boComment(readFileSync(duongDan, 'utf8'));
  return [...noiDung.matchAll(/getByTestId\(\s*['"`]([^'"`]+)['"`]\s*\)/g)].map((khop) => khop[1]);
}

/**
 * Bảng khai `Module` trong `docs/test-structure.md` → `{ file: module }`.
 * `null` nghĩa là dự án chưa khai — mọi test tự skip.
 *
 * Đọc từ tài liệu chứ không chép sang đây: chép là có hai nguồn sự thật, và cái thứ hai
 * luôn là cái không ai nhớ cập nhật. Tìm theo TÊN mục, không theo số, để đánh số lại
 * không làm hỏng lint.
 */
function bangModule(): Map<string, string> | null {
  const duongDan = join(ROOT, BANG_KHAI);
  if (!existsSync(duongDan)) return null;

  const muc = readFileSync(duongDan, 'utf8')
    .split(/^## /m)
    .find((phan) => /^\d+\.\s*Module/i.test(phan));
  if (!muc) return null;

  const dong = [...muc.matchAll(/^\|\s*`([^`]+)`\s*\|\s*`([^`]+)`\s*\|/gm)];
  return dong.length > 0 ? new Map(dong.map((khop) => [khop[1], khop[2]])) : null;
}

const CHUA_KHAI = `chưa khai bảng "Module" trong ${BANG_KHAI} — xem docs/data-testid-convention.md`;

const CO_TESTID = THU_MUC_NGUON.flatMap(duyetTs)
  .map((duongDan) => ({ file: chuanHoa(duongDan), ids: docTestId(duongDan) }))
  .filter(({ ids }) => ids.length > 0);

test('file nào có getByTestId thì phải khai module', () => {
  const khai = bangModule();
  test.skip(khai === null, CHUA_KHAI);

  const thieu = CO_TESTID.filter(({ file }) => !khai?.has(file)).map(({ file }) => file);

  expect(thieu, `có data-testid nhưng chưa khai module ở ${BANG_KHAI}`).toEqual([]);
});

/*
 * Gom hết rồi mới đỏ một lần, thay vì đỏ ngay ở id đầu tiên: sau một lần đổi tên module,
 * thứ người sửa cần là DANH SÁCH để sed — không phải lỗi thứ nhất, sửa, chạy lại, rồi mới
 * biết còn lỗi thứ hai.
 */
test('mọi testid mở đầu bằng module đã khai', () => {
  const khai = bangModule();
  test.skip(khai === null, CHUA_KHAI);

  const lech: string[] = [];
  for (const { file, ids } of CO_TESTID) {
    const module = khai?.get(file);
    if (!module) continue; // test trên đã báo rồi, đừng đỏ hai lần vì một nguyên nhân

    const mau = new RegExp(`^(LOCATOR-TBD-)?${module}-`);
    for (const id of ids) {
      if (!mau.test(id)) lech.push(`${file}: "${id}" không thuộc module "${module}"`);
    }
  }

  expect(lech, 'testid lệch khỏi module đã khai').toEqual([]);
});

test('module viết kebab-case, đúng như quy ước', () => {
  const khai = bangModule();
  test.skip(khai === null, CHUA_KHAI);

  const sai = [...(khai ?? [])]
    .filter(([, module]) => !/^[a-z0-9]+(-[a-z0-9]+)*$/.test(module))
    .map(([file, module]) => `${file}: "${module}"`);

  expect(sai, 'module phải kebab-case — không hoa, không "_"').toEqual([]);
});

test('spec không khai locator — locator chỉ sống trong page object', () => {
  const ro = duyetTs(THU_MUC_SPEC)
    .map((duongDan) => ({ file: chuanHoa(duongDan), ids: docTestId(duongDan) }))
    .filter(({ ids }) => ids.length > 0)
    .map(({ file, ids }) => `${file}: ${ids.join(', ')}`);

  expect(ro, 'spec gọi getByTestId thẳng — chuyển locator đó vào page object').toEqual([]);
});

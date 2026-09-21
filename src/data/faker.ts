import { Faker, base, en, vi } from '@faker-js/faker';

/**
 * Một instance faker duy nhất cho cả bộ test — spec lẫn helper đều import từ đây.
 *
 * Vì sao không để mỗi file tự `new Faker(...)`: thứ tự locale bên dưới là một cái bẫy, và
 * lặp lại nó ở mười chỗ thì sớm muộn có chỗ viết sai.
 *
 * **Phải xếp `[vi, en, base]`, KHÔNG dùng `fakerVI` trần.** Locale `vi` phủ không đầy đủ, và
 * Faker **ném lỗi** khi thiếu dữ liệu chứ không trả rỗng. Đo ngày 21/09/2026:
 *
 *     new Faker({ locale: [vi] }).company.catchPhrase()
 *     → "The locale data for 'company.adjective' are missing in this locale."
 *
 * Có `en` rồi `base` đứng sau thì lời gọi đó rơi xuống tiếng Anh, thay vì làm đỏ một test
 * chẳng liên quan gì tới từ điển.
 *
 * **Không `faker.seed()`.** Seed cố định cho cùng một bộ dữ liệu mỗi lượt — nghe tiện, nhưng
 * ở đây nó nghĩa là mọi lượt chạy tạo trùng tên, tức dính `NODE_NAME_CONFLICT`. Seed chỉ hợp
 * cho test thuần tính toán, không hợp cho test tạo bản ghi thật.
 *
 * **Faker KHÔNG bảo đảm duy nhất.** Đo được: 200 lần `location.city()` chỉ ra 30 giá trị
 * khác nhau. Trường nào cần duy nhất thì ghép thêm `unique()` của kit.
 */
export const faker = new Faker({ locale: [vi, en, base] });

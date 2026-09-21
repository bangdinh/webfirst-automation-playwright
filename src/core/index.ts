/**
 * Phần lõi do DỰ ÁN sở hữu — luồng đăng nhập và cache session.
 *
 * Mọi thứ cắt ngang khác (BasePage, BaseComponent, logger, step) vẫn đến từ `qc-kit/core`.
 * Chỉ phần đăng nhập ở đây, vì chỉ dự án này biết đăng nhập là hai bước qua SSO, session
 * cache ở `playwright/.auth`, và cookie được dùng lại bao lâu.
 */
export * from './auth';
export * from './paths';
export * from './session';
export * from './session-token';

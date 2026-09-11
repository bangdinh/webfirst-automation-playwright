import { expect } from '@playwright/test';
import { BasePage } from 'qc-kit/core';

/**
 * Một màn hình = một class.
 *
 * Locator khai bằng `getByTestId`; hành động là method mô tả ý định, bọc trong
 * `this.step(...)` để report đọc được thành "ExamplePage: …" thay vì một cú click vô danh.
 */
export class ExamplePage extends BasePage {
  protected override readonly path = '/';

  readonly heading = this.page.getByTestId('example-page-heading');

  override async waitUntilLoaded(): Promise<void> {
    await expect(this.heading).toBeVisible();
  }

  async expectLoaded(): Promise<void> {
    await expect(this.heading).toBeVisible();
  }
}

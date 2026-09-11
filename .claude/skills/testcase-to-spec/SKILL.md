---
name: testcase-to-spec
description: Sinh Playwright spec va Page Object tu file JSON test case. Kich hoat khi user go "Tao script", "Gen script", "Viet automation test script", "/gen-script", hoac khi nhac "generate test script", "sinh spec tu json", "sinh test tu excel".
---

# SKILL: PLAYWRIGHT AUTOMATION SCRIPT GENERATOR
# TRIGGER COMMAND: `/gen-script` OR `/gen-script <optional_file_path.json>`

## 1. ROLE & TRIGGER BEHAVIOR
You are an expert Principal Automation Test Engineer specializing in Playwright, TypeScript, and Page Object Model (POM).

- **Keyword Triggers:** Activate this skill when the user types any of these, with or without the slash command:
  - `Tạo script`
  - `Gen script`
  - `Viết automation test script`

  Match case-insensitively, and match the phrase anywhere in the message — `tạo script cho màn
  thiết bị` counts. These phrases carry no file path, so they fall back to the default path below.
- **Trigger Syntax:** 
  - Typing `/gen-script` (without parameters) MUST default to reading the test case JSON file at the hardcoded path:
    `C:\Users\FPT\source\web-automation\testcase\Device_Management_TestCase_v1.0.0.json`
  - Typing `/gen-script <custom_path.json>` will override the default path and read from `<custom_path.json>`.
- **Goal:** Read the target JSON file from the path, parse all test cases inside, and auto-generate complete, maintainable, production-ready Playwright TypeScript code.

---

## 2. EXECUTION WORKFLOW
When triggered via `/testcase-to-spec`:
1. **File Reading Strategy:**
   - Check if a path argument is provided.
   - If NO path is provided, read file at: `C:\Users\FPT\source\web-automation\testcase\Device_Management_TestCase_v1.0.0.json`.
   - Read and parse ALL test cases present in the target JSON payload.
2. Group related test cases by feature/screen.
3. Generate reusable Page Object classes containing all necessary Locators and Actions.
4. Generate Test Spec files mapping out every step, action, and assertion.

---

## 3. ARCHITECTURE & CODING RULES

### A. Page Object Model (POM) Rules
- **Strict Separation:** NO direct `page.click()` or `page.locator()` in `*.spec.ts` files. All UI elements and interactions MUST be encapsulated inside Page Object classes (`pages/*.page.ts`).
- **Locators Priority:**
  1. `page.getByRole()`
  2. `page.getByText()` / `page.getByLabel()` / `page.getByPlaceholder()`
  3. `page.getByTestId()`
  *(Avoid raw XPaths or CSS selectors unless strictly required).*
- **No Hardcoded Sleep:** Never use `page.waitForTimeout()`. Rely on Playwright's built-in auto-waiting or web-first assertions (`expect(locator).toBeVisible()`).

### B. JSON Field Mapping Matrix

| JSON Field | Code Generation Strategy |
| :--- | :--- |
| `test_case_id` & `title` | Combine for test name: `test('${test_case_id}: ${title}', async () => { ... })` |
| `tags` | Append to test title as annotations (e.g., `@high`, `@smoke`). |
| `preconditions` | Place inside `test.beforeEach()` hook or Auth fixture call. |
| `steps[].action` | Map to Page Object methods (`tap`/`click` $\rightarrow$ `.click()`, `type`/`fill` $\rightarrow$ `.fill()`, `navigate` $\rightarrow$ `.goto()`). |
| `steps[].target` | Convert `snake_case` target to `camelCase` Locator & Method names (e.g., `them_thu_cong` $\rightarrow$ `themThuCongBtn`, `clickThemThuCong()`). |
| `steps[].expected` | Map to Web-First Assertions (`expect()`). Skip if empty. |
| `test_data` | Pass as typed parameters into Page Object action methods. |

### C. Naming & File Conventions
- **Page Classes:** `PascalCase` (e.g., `DevicePage`).
- **Locators & Methods:** `camelCase` (e.g., `themThuCongBtn`, `clickThemThuCong()`).
- **Directory Structure:**
  - `pages/<feature>.page.ts`
  - `tests/<feature>.spec.ts`

---

## 4. OUTPUT FORMAT REQUIREMENTS

Always format the output clearly with file paths so the user can easily copy or auto-write them:
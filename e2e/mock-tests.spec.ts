import { test, expect } from "@playwright/test";

test.describe("Mock Tests", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel("Email Address").fill("user@test.com");
    await page.getByLabel("Password").fill("password123");
    await page.getByRole("button", { name: /sign in/i }).click();
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 30_000 });
  });

  test("mock tests catalog loads", async ({ page }) => {
    await page.goto("/mock-tests");
    await expect(page.getByText(/mock/i).first()).toBeVisible();
  });
});

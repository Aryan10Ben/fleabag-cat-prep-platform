import { test, expect } from "@playwright/test";

test.describe("Previous Year Papers", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel("Email Address").fill("user@test.com");
    await page.getByLabel("Password").fill("password123");
    await page.getByRole("button", { name: /sign in/i }).click();
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 30_000 });
  });

  test("PYQ catalog loads with papers", async ({ page }) => {
    await page.goto("/pyq");
    await expect(page.getByText(/CAT|PYQ|Previous/i).first()).toBeVisible();
  });
});

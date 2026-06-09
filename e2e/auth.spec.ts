import { test, expect } from "@playwright/test";

test.describe("Authentication", () => {
  test("landing page loads and navigates to login", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("link", { name: /start/i })).toBeVisible();
    await page.getByRole("link", { name: /start/i }).click();
    await expect(page).toHaveURL(/\/login/);
    await expect(page.getByText("Welcome back")).toBeVisible();
  });

  test("demo user can sign in and reach dashboard", async ({ page }) => {
    await page.goto("/login");
    await page.getByPlaceholder(/email/i).fill("user@test.com");
    await page.getByPlaceholder(/password/i).fill("password123");
    await page.getByRole("button", { name: /sign in/i }).click();
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 30_000 });
    await expect(page.getByText(/welcome back/i)).toBeVisible();
  });
});

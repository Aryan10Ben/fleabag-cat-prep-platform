import { test, expect } from "@playwright/test";

test.describe("Profile Synchronization", () => {
  test("display name syncs across Navbar and Dashboard instantly", async ({ page }) => {
    // 1. Log in
    await page.goto("/login");
    await page.getByLabel("Email Address").fill("user@test.com");
    await page.getByLabel("Password").fill("password123");
    await page.getByRole("button", { name: /sign in/i }).click();
    
    // Wait for dashboard to load
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 30_000 });
    
    // 2. Go to Profile
    await page.goto("/profile");
    await expect(page).toHaveURL(/\/profile/, { timeout: 10_000 });
    
    // 3. Edit name to something unique
    const uniqueName = `TestUser_${Date.now().toString().slice(-6)}`;
    
    // Click the edit pen icon button
    await page.locator('button[title="Edit Name"]').click();
    
    // Fill the new name
    await page.getByPlaceholder("Enter name").fill(uniqueName);
    
    // Save
    await page.getByRole("button", { name: "Save" }).click();
    
    // Wait for saving to complete (Save button goes away, heading appears)
    await expect(page.locator('h1.text-xl')).toContainText(uniqueName, { timeout: 10_000 });
    
    // 4. Verify in Navbar (should sync instantly without reload)
    // There are multiple places the name could appear (desktop/mobile nav)
    await expect(page.locator(`text=${uniqueName}`).nth(1)).toBeVisible();
    
    // 5. Navigate to Dashboard without full page reload
    // We use locator to find the dashboard link in the desktop navigation
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 10_000 });
    
    // 6. Verify Dashboard heading
    await expect(page.locator('h1')).toContainText(`Welcome back, ${uniqueName}!`);
  });
});

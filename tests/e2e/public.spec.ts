import { expect, test } from "@playwright/test";

test.describe("public entry points", () => {
  test("landing page presents a real path into the research desk", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Riset yang tumbuh lewat pertanyaan.");
    await expect(page.getByRole("link", { name: "Mulai ruang riset" })).toHaveAttribute("href", "/login");
    await page.getByRole("link", { name: "Lihat alurnya" }).click();
    await expect(page).toHaveURL(/#alur$/);
    await expect(page.getByRole("heading", { name: "Dari pertanyaan menuju bahan bimbingan." })).toBeVisible();
    await expect(page.locator("body")).not.toContainText("—");
  });

  test("login is Google-only and theme toggle works", async ({ page }) => {
    await page.goto("/login");
    await expect(page.getByRole("heading", { name: "Bawa pertanyaanmu ke ruang yang bisa ditinjau ulang." })).toBeVisible();
    await expect(page.getByRole("button", { name: "Masuk dengan Google" })).toBeVisible();
    await expect(page.locator('input[type="password"]')).toHaveCount(0);
    await page.getByRole("button", { name: "Gunakan tema gelap" }).click();
    await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
    await page.getByRole("button", { name: "Gunakan tema terang" }).click();
    await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
  });

  test("login handles an unavailable OAuth provider and recovers the button", async ({ page }) => {
    await page.goto("/login");
    await page.route("**/auth/v1/authorize**", (route) => route.abort("failed"));
    const button = page.getByRole("button", { name: "Masuk dengan Google" });
    await button.click();
    await expect(page.locator("p.status-message[role='alert']")).toHaveText("Login belum siap. Periksa konfigurasi Supabase dan Google OAuth.");
    await expect(page.getByRole("button", { name: "Masuk dengan Google" })).toBeEnabled();
  });

  test("workspace never shows fake data when auth or configuration is unavailable", async ({ page }) => {
    await page.goto("/workspace");
    const configurationHeading = page.getByRole("heading", { name: "Supabase belum terhubung." });
    const loginHeading = page.getByRole("heading", { name: "Bawa pertanyaanmu ke ruang yang bisa ditinjau ulang." });
    await expect(configurationHeading.or(loginHeading)).toBeVisible();
    await expect(page.locator("body")).not.toContainText("John Doe");
    await expect(page.locator("body")).not.toContainText("10K+");
  });
});

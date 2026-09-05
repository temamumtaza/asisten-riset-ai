import { expect, test } from "@playwright/test";

test("landing page has no horizontal overflow on a narrow phone", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  const dimensions = await page.evaluate(() => ({
    viewport: document.documentElement.clientWidth,
    scrollWidth: document.documentElement.scrollWidth
  }));
  expect(dimensions.scrollWidth).toBeLessThanOrEqual(dimensions.viewport);
  await expect(page.getByRole("link", { name: "Mulai ruang riset" })).toBeVisible();
});


import { test, expect } from "@playwright/test";

test("PDF editor page loads and renders sample PDF", async ({ page }) => {
  await page.goto("/pdf-editor");

  // Page shell
  await expect(page.getByRole("heading", { name: "קורא ועורך PDF מתקדם" })).toBeVisible();

  // Switch to the advanced editor tab (default is the Highlighter tab).
  await page.getByRole("tab", { name: /עורך מתקדם/i }).click();

  // Wait for the PDF to load in the advanced editor (it shows total pages).
  await expect(page.getByText(/עמוד\s+1\s+מתוך\s+\d+/)).toBeVisible({ timeout: 60_000 });

  // Canvases exist (PDF layer + annotation layer)
  const canvases = page.locator("canvas");
  await expect(canvases).toHaveCount(2);

  // Sanity: PDF canvas has non-zero size
  const size = await canvases.nth(0).evaluate((c: HTMLCanvasElement) => ({ w: c.width, h: c.height }));
  expect(size.w).toBeGreaterThan(0);
  expect(size.h).toBeGreaterThan(0);
});

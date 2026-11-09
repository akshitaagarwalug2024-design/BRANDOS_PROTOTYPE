import { test, expect, type Page } from "@playwright/test";
async function studio(page: Page) {
  await page.goto("/studio");
  await page.getByRole("button", { name: "Skip for now" }).click();
}
test("complete post workflow, revision, real WebM export, persistence", async ({
  page,
}) => {
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "From raw content to ready-to-post." }),
  ).toBeVisible();
  await page.getByRole("link", { name: "Create Your First Post" }).click();
  await page.getByRole("button", { name: "Skip for now" }).click();
  await page
    .getByRole("button", { name: "Create New Post", exact: true })
    .first()
    .click();
  await page
    .getByPlaceholder("e.g. The little rituals")
    .fill("My quiet creative morning");
  await page.getByRole("button", { name: "Bring your footage" }).click();
  await page.getByRole("button", { name: "Use sample collection" }).click();
  await page.getByRole("button", { name: "Find my story" }).click();
  await expect(
    page.getByText("Demo planning · template suggestions, not AI analysis"),
  ).toBeVisible();
  await page.getByRole("button", { name: "Use this direction" }).click();
  await page
    .getByRole("textbox", { name: "Revision request" })
    .fill("Shorten this to 3 seconds");
  await page.getByRole("button", { name: "Apply revision" }).click();
  await expect(
    page.getByText("Adjusted the timeline to 3 seconds."),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Advanced Editing", exact: true })
    .click();
  await expect(
    page.getByRole("textbox", { name: "Scene 1 subtitle" }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Simple Editing", exact: true })
    .click();
  await page.getByRole("button", { name: "Build post package" }).click();
  const dl = page.waitForEvent("download");
  await page.getByRole("button", { name: "Render & download video" }).click();
  const downloaded = await dl;
  expect(downloaded.suggestedFilename()).toBe("brandos-draft.webm");
  const fs = await import("node:fs/promises");
  await downloaded.saveAs(test.info().outputPath("draft.webm"));
  const file = await downloaded.path();
  const bytes = await fs.readFile(file!);
  expect(bytes.length).toBeGreaterThan(5000);
  expect(bytes.subarray(0, 4).toString("hex")).toBe("1a45dfa3");
  await page.getByRole("button", { name: "Mark as ready to publish" }).click();
  await expect(
    page.getByRole("heading", {
      name: "My quiet creative morning",
      exact: true,
    }),
  ).toBeVisible();
  await page.reload();
  await expect(
    page.getByRole("heading", {
      name: "My quiet creative morning",
      exact: true,
    }),
  ).toBeVisible();
  await page.getByRole("link", { name: "My Projects", exact: true }).click();
  await expect(
    page.getByRole("heading", {
      name: "My quiet creative morning",
      exact: true,
    }),
  ).toBeVisible();
});
test("local upload, collection metadata and IndexedDB persistence", async ({
  page,
}) => {
  await studio(page);
  await page.getByRole("link", { name: "Media Library", exact: true }).click();
  await page.locator("input[type=file]").setInputFiles({
    name: "my-photo.png",
    mimeType: "image/png",
    buffer: Buffer.from(
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aS+8AAAAASUVORK5CYII=",
      "base64",
    ),
  });
  await page.getByRole("button", { name: "my-photo.png My uploads" }).click();
  await page
    .getByRole("textbox", { name: "Name", exact: true })
    .fill("My real photo");
  await page
    .getByRole("textbox", { name: "Collection", exact: true })
    .fill("Weekend");
  await page
    .getByRole("textbox", { name: "Tags", exact: true })
    .fill("sunlight");
  await page.getByRole("button", { name: "Save details" }).click();
  await page.reload();
  await page.getByRole("textbox", { name: "Search media" }).fill("sunlight");
  await expect(
    page.getByRole("button", { name: "My real photo Weekend" }),
  ).toBeVisible();
  await expect(page.locator(".media-card img")).toHaveJSProperty(
    "naturalWidth",
    1,
  );
});
test("wizard validates missing idea and footage; revisions reject invalid input", async ({
  page,
  request,
}) => {
  await studio(page);
  await page
    .getByRole("button", { name: "Create New Post", exact: true })
    .first()
    .click();
  await page.getByRole("button", { name: "Bring your footage" }).click();
  await expect(page.getByText("Give your story an idea first.")).toBeVisible();
  await page.getByPlaceholder("e.g. The little rituals").fill("A story");
  await page.getByRole("button", { name: "Bring your footage" }).click();
  await page.getByRole("button", { name: "Find my story" }).click();
  await expect(
    page.getByText("Choose at least one available media file."),
  ).toBeVisible();
  const response = await request.post("/api/ai", { data: { idea: "" } });
  expect(response.status()).toBe(400);
});
test("ideas, brand and publishing are navigable; no fake cloud sign-in", async ({
  page,
}) => {
  await studio(page);
  await page.getByRole("link", { name: "Content Ideas", exact: true }).click();
  await page
    .getByPlaceholder("e.g. Building a small")
    .fill("Running a ceramics studio");
  await page.getByRole("button", { name: "Find a little inspiration" }).click();
  await expect(
    page.getByText("The story behind Running a ceramics studio"),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Save idea", exact: true })
    .first()
    .click();
  await expect(
    page.getByRole("heading", { name: "Your saved sparks" }),
  ).toBeVisible();
  await page.getByRole("link", { name: "Brand Kit", exact: true }).click();
  await page
    .getByRole("combobox", { name: "Default platform" })
    .selectOption("YouTube Shorts");
  await page.getByRole("button", { name: "Save brand kit" }).click();
  await page.reload();
  await expect(
    page.getByRole("combobox", { name: "Default platform" }),
  ).toHaveValue("YouTube Shorts");
  await page.getByRole("link", { name: "Publishing Hub", exact: true }).click();
  await expect(
    page.getByText("No publishing integration is connected."),
  ).toBeVisible();
  await page.goto("/auth");
  await expect(
    page.getByRole("button", { name: "Sign in", exact: true }),
  ).toBeDisabled();
  await expect(
    page.getByRole("link", { name: "Continue in Demo Mode" }),
  ).toBeVisible();
});
test("mobile navigation and creation do not overflow viewport", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await studio(page);
  await page.getByRole("button", { name: "Toggle navigation" }).click();
  await page.getByRole("link", { name: "My Projects", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Every story has a place." }),
  ).toBeVisible();
  const width = await page.evaluate(() => ({
    scroll: document.documentElement.scrollWidth,
    viewport: innerWidth,
  }));
  expect(width.scroll).toBeLessThanOrEqual(width.viewport);
  await page.screenshot({
    path: "test-results/mobile-projects.png",
    fullPage: true,
  });
});

test("core screens pass automated WCAG A/AA checks", async ({ page }) => {
  const { default: AxeBuilder } = await import("@axe-core/playwright");
  await studio(page);
  for (const route of [
    "/",
    "/studio",
    "/studio/create?id=sample-project",
    "/studio/media",
    "/studio/ideas",
    "/studio/brand",
    "/studio/publishing",
    "/auth",
  ]) {
    await page.goto(route);
    await page.waitForTimeout(200);
    const result = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa"])
      .analyze();
    expect(result.violations, route).toEqual([]);
  }
});

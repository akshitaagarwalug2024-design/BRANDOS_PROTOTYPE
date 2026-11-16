import { test, expect, type Page } from "@playwright/test";
async function studio(page: Page) {
  await page.goto("/studio");
  await expect(
    page.getByRole("heading", { name: "Journal", exact: true }),
  ).toBeVisible();
}
test("complete post workflow, revision, real WebM export, persistence", async ({
  page,
}) => {
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "From raw content to ready-to-post." }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Sign in / Log in" }),
  ).toHaveAttribute("href", "/auth");
  await page.getByRole("link", { name: "Create Your First Post" }).click();
  // One click builds the whole edit: no form to fill in first.
  await page
    .getByRole("button", { name: "Create New Post", exact: true })
    .click();
  await expect(
    page.getByText("Your ready-to-post edit is done."),
  ).toBeVisible();
  await expect(page.getByText("3 scenes · Fade transitions")).toBeVisible();
  await page
    .getByRole("textbox", { name: "Post title" })
    .fill("My quiet creative morning");
  await page.getByRole("button", { name: "Quick & energetic" }).click();
  await expect(page.getByText("3 scenes · Slide transitions")).toBeVisible();
  await page.getByRole("tab", { name: "Music" }).click();
  await page.getByRole("button", { name: "Dreamy", exact: true }).click();
  await page.getByRole("tab", { name: "Elements" }).click();
  await page.getByLabel("Progress bar along the top").uncheck();
  await page.getByRole("tab", { name: "Text" }).click();
  await expect(
    page.getByRole("textbox", { name: "Scene 1 subtitle" }),
  ).toBeVisible();
  await page.getByRole("tab", { name: "Ask for a change" }).click();
  await page
    .getByRole("textbox", { name: "Revision request" })
    .fill("Shorten this to 3 seconds");
  await page.getByRole("button", { name: "Apply revision" }).click();
  await expect(
    page.getByText("Adjusted the timeline to 3 seconds."),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Caption & export", exact: true })
    .click();
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
    page.getByRole("button", { name: /My quiet creative morning/ }),
  ).toBeVisible();
  await page.reload();
  await expect(
    page.getByRole("button", { name: /My quiet creative morning/ }),
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
  await page.getByLabel("Collection").fill("Weekend");
  await page
    .getByRole("textbox", { name: "Tags", exact: true })
    .fill("sunlight");
  await page.getByRole("button", { name: "Save details" }).click();
  await page.reload();
  await page.getByRole("textbox", { name: "Search media" }).fill("sunlight");
  await expect(
    page.getByRole("button", { name: "My real photo Weekend" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "List view" }).click();
  await expect(page.locator(".media-tile img")).toHaveJSProperty(
    "naturalWidth",
    1,
  );
});
test("journal shapes ideas with no form; API still rejects invalid input", async ({
  page,
  request,
}) => {
  await studio(page);
  await page.getByRole("link", { name: "Content Ideas", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Make this post" }),
  ).toHaveCount(6);
  await page.getByRole("link", { name: "Journal", exact: true }).click();
  await page
    .getByRole("textbox", { name: "Journal entry" })
    .fill("My goal is to grow my pottery page. Pottery keeps me calm.");
  await page.getByRole("button", { name: /Save note/ }).click();
  await expect(page.locator(".journal-list")).toContainText("pottery page");
  await page.reload();
  await expect(page.locator(".journal-list")).toContainText("pottery page");
  await page.getByRole("link", { name: "Content Ideas", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "The story behind pottery" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Make this post" }).first().click();
  await expect(page.getByRole("textbox", { name: "Post title" })).toHaveValue(
    "The story behind pottery",
  );
  const response = await request.post("/api/ai", { data: { idea: "" } });
  expect(response.status()).toBe(400);
});
test("ideas, brand and publishing are navigable; cloud sign-in reflects configuration", async ({
  page,
}) => {
  await studio(page);
  await page.getByRole("link", { name: "Content Ideas", exact: true }).click();
  await page
    .getByRole("textbox", { name: "Topic (optional)" })
    .fill("Running a ceramics studio");
  await expect(
    page.getByText("The story behind Running a ceramics studio"),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Save idea", exact: true })
    .first()
    .click();
  await expect(
    page.getByRole("heading", { name: "Saved ideas" }),
  ).toBeVisible();
  await page.getByRole("link", { name: "Brand Kit", exact: true }).click();
  await page
    .getByRole("combobox", { name: "Video typography" })
    .selectOption("Serif");
  await page.getByRole("button", { name: "Save brand kit" }).click();
  await page.reload();
  await expect(
    page.getByRole("combobox", { name: "Video typography" }),
  ).toHaveValue("Serif");
  await expect(
    page.getByRole("combobox", { name: "Default platform" }),
  ).toHaveCount(0);
  await page.getByRole("link", { name: "Publishing Hub", exact: true }).click();
  await expect(
    page.getByText("No publishing integration is connected."),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Make a new post for this day" })
    .click();
  await page.getByRole("textbox", { name: "Post title" }).fill("Calendar post");
  await page.getByRole("link", { name: "Publishing Hub", exact: true }).click();
  await expect(page.locator(".cal-chip")).toHaveText("Calendar post");
  await expect(page.locator(".cal-detail")).toContainText("To publish");
  await page.getByRole("button", { name: "Schedule", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Due in the next 7 days" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Content", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Calendar post" }),
  ).toBeVisible();
  await page.goto("/auth");
  const signIn = page.getByRole("button", { name: "Sign in", exact: true });
  const cloudConfigured = await page
    .getByText("Sign in to back up your workspace securely.")
    .isVisible();
  if (cloudConfigured) {
    await expect(signIn).toBeEnabled();
    await page.getByLabel("Email").fill("nobody@example.com");
    await page.getByLabel("Password").fill("definitely-wrong-password");
    await signIn.click();
    await expect(page.getByRole("status")).toContainText(/invalid/i);
  } else {
    await expect(signIn).toBeDisabled();
  }
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
    page.getByRole("heading", { name: "My Projects" }),
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
    "/studio/insights",
    "/studio/journal",
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

test("interactive walkthrough supports keyboard navigation and fresh storage preserves original workspace", async ({
  page,
}) => {
  await page.goto("/");
  const idea = page.getByRole("tab", { name: "1 Idea", exact: true });
  await idea.focus();
  await page.keyboard.press("ArrowRight");
  await expect(
    page.getByRole("tab", { name: "2 Upload", exact: true }),
  ).toHaveAttribute("aria-selected", "true");
  await expect(
    page.getByRole("heading", { name: "Bring the moments together." }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Next step", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Find a direction that feels right." }),
  ).toBeVisible();
  await page.evaluate(() =>
    localStorage.setItem("brandos-v1", JSON.stringify({ original: "keep-me" })),
  );
  await studio(page);
  await expect
    .poll(() =>
      page.evaluate(() => Boolean(localStorage.getItem("brandos-fresh-v1"))),
    )
    .toBe(true);
  expect(
    await page.evaluate(() => JSON.parse(localStorage.getItem("brandos-v1")!)),
  ).toEqual({ original: "keep-me" });
  await page
    .getByRole("button", { name: "Create New Post", exact: true })
    .click();
  await page
    .getByRole("textbox", { name: "Post title" })
    .fill("A fresh independent project");
  await page.reload();
  await expect(page.getByRole("textbox", { name: "Post title" })).toHaveValue(
    "A fresh independent project",
  );
  expect(
    await page.evaluate(() => JSON.parse(localStorage.getItem("brandos-v1")!)),
  ).toEqual({ original: "keep-me" });
});

test("journal capture feeds the indexed library, folders, matching and per-post platform", async ({
  page,
}) => {
  const png = Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aS+8AAAAASUVORK5CYII=",
    "base64",
  );
  await studio(page);
  await expect(page.locator(".nav-dot")).toBeVisible();
  await page
    .getByRole("textbox", { name: "Journal entry" })
    .fill("Glazing the new pottery mugs today");
  for (const name of ["one.png", "two.png"])
    await page
      .getByLabel("Add photo or video")
      .setInputFiles({ name, mimeType: "image/png", buffer: png });
  await expect(page.locator(".journal-list li")).toHaveCount(2);
  await expect(page.getByText("1-day streak")).toBeVisible();
  await expect(page.locator(".nav-dot")).toHaveCount(0);
  // The journal note indexes the clip, so a pottery idea finds it.
  await page.getByRole("link", { name: "Content Ideas", exact: true }).click();
  await expect(page.locator(".idea-footage").first()).toContainText(
    "matching clip",
  );
  // Folders: tick files, move them, then build a post from the folder.
  await page.getByRole("link", { name: "Media Library", exact: true }).click();
  await expect(page.getByRole("button", { name: /Journal 2/ })).toBeVisible();
  await page.getByLabel("Select one.png").check();
  await page.getByRole("button", { name: "New folder" }).click();
  await page.getByLabel("New folder name").fill("Mug launch");
  await page.getByLabel("New folder name").press("Enter");
  await expect(
    page.getByRole("button", { name: /Mug launch 1/ }),
  ).toBeVisible();
  await page.getByLabel("Select one.png").check();
  await page.getByRole("button", { name: "Make a post from these" }).click();
  await expect(page.getByText("1 scene ·")).toBeVisible();
  // Platform and shape belong to the post, with a free-text Other.
  await page.getByRole("combobox", { name: "Platform" }).selectOption("X");
  await expect(page.locator(".video-preview")).toHaveClass(/ratio-16-9/);
  await page.getByRole("combobox", { name: "Platform" }).selectOption("Other");
  await page.getByLabel("Specify other platform").fill("Threads");
  await page.reload();
  await expect(page.getByLabel("Specify other platform")).toHaveValue(
    "Threads",
  );
  // Back in the journal, the week's clips become a reel in one click.
  await page.getByRole("link", { name: "Journal", exact: true }).click();
  await page.getByRole("button", { name: "Turn my week into a reel" }).click();
  await expect(page.getByRole("textbox", { name: "Post title" })).toHaveValue(
    /^My week/,
  );
  await page.getByRole("tab", { name: "Text" }).click();
  await expect(
    page.getByRole("textbox", { name: "Scene 1 subtitle" }),
  ).toHaveValue("Glazing the new pottery mugs today");
});

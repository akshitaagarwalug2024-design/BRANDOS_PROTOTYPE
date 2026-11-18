import { test, expect, type Page } from "@playwright/test";
async function studio(page: Page) {
  await page.goto("/studio");
  await expect(
    page.getByRole("heading", { name: "Home", exact: true }),
  ).toBeVisible();
}
test("complete post workflow, revision, real WebM export, persistence", async ({
  page,
}) => {
  await page.goto("/");
  await expect(
    page.getByRole("heading", {
      name: "Turn everyday business activity into ready-to-post short videos.",
    }),
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
  expect(downloaded.suggestedFilename()).toBe("unstuck-draft.webm");
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
  await expect(
    page.getByRole("heading", { name: "Media Library" }),
  ).toBeVisible();
  await page.locator(".upload-bar input[type=file]").setInputFiles({
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
    page.locator(".ideas-grid").getByRole("button", { name: "Make this post" }),
  ).toHaveCount(6);
  await page.getByRole("link", { name: "Home", exact: true }).click();
  await page
    .getByRole("textbox", { name: "Journal entry" })
    .fill("My goal is to grow my pottery page. Pottery keeps me calm.");
  await page.getByRole("button", { name: /Save note/ }).click();
  await expect(page.locator(".jr-grid")).toContainText("pottery page");
  await page.reload();
  await expect(page.locator(".jr-grid")).toContainText("pottery page");
  await page.getByRole("link", { name: "Content Ideas", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "The story behind pottery" }),
  ).toBeVisible();
  await page
    .locator(".ideas-grid")
    .getByRole("button", { name: "Make this post" })
    .first()
    .click();
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
  const idea = page.getByRole("tab", { name: "1 Capture", exact: true });
  await idea.focus();
  await page.keyboard.press("ArrowRight");
  await expect(
    page.getByRole("tab", { name: "2 Understand", exact: true }),
  ).toHaveAttribute("aria-selected", "true");
  await expect(
    page.getByRole("heading", { name: "Your footage, indexed." }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Next step", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Ideas matched to what you have." }),
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
  await expect(page.locator(".jr-tile")).toHaveCount(2);
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
  await page.getByRole("combobox", { name: "Platform" }).selectOption("TikTok");
  await expect(page.locator(".video-preview")).toHaveClass(/ratio-9-16/);
  await page.getByRole("combobox", { name: "Platform" }).selectOption("Other");
  await page.getByLabel("Specify other platform").fill("Threads");
  await page.reload();
  await expect(page.getByLabel("Specify other platform")).toHaveValue(
    "Threads",
  );
  // Back in the journal, the week's clips become a reel in one click.
  await page.getByRole("link", { name: "Home", exact: true }).click();
  await page.getByRole("button", { name: "Create weekly recap video" }).click();
  await expect(page.getByRole("textbox", { name: "Post title" })).toHaveValue(
    /^My week/,
  );
  await page.getByRole("tab", { name: "Text" }).click();
  await expect(
    page.getByRole("textbox", { name: "Scene 1 subtitle" }),
  ).toHaveValue("Glazing the new pottery mugs today");
});

test("agent runs the demo providers end to end and refuses paid runs without the passcode", async ({
  page,
  request,
}) => {
  await studio(page);
  await page.getByRole("link", { name: "AI Agent", exact: true }).click();
  await page.getByRole("button", { name: "Run the agent" }).click();
  await expect(page.locator(".trace-tool code").last()).toHaveText(
    "render_video",
    { timeout: 30000 },
  );
  await expect(page.locator(".trace-tool.bad")).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "Download video" }),
  ).toBeEnabled({ timeout: 45000 });
  const refused = await request.post("/api/agent", {
    data: {
      brief: "",
      today: "2026-11-19",
      profile: {},
      goal: {},
      brand: {},
      journal: [],
      media: [],
      scheduled: [],
      paid: true,
      passcode: "wrong",
    },
  });
  expect(refused.status()).toBe(403);
});

test("stock and elements: built-in shapes, item editing, connect message, credits and export", async ({
  page,
  request,
}) => {
  await page.goto("/studio/create?id=sample-project");
  await page.getByRole("tab", { name: "Elements" }).click();
  await page.getByRole("button", { name: "Add Star", exact: true }).click();
  await expect(page.locator(".pv-item")).toHaveCount(1);
  await page.getByLabel("Item colour").fill("#ff0000");
  await expect(page.locator(".pv-item img")).toHaveAttribute(
    "src",
    /%23ff0000/,
  );
  await page.getByLabel("Item scenes").selectOption("all");
  await page.getByLabel("Rotate").fill("45");
  await expect(page.locator(".pv-item")).toHaveAttribute("style", /45deg/);
  await page.getByRole("button", { name: "Favourite Star" }).click();
  await page.getByRole("button", { name: /Recently used 1/ }).click();
  await expect(page.getByRole("button", { name: "Add Star" })).toBeVisible();
  // A provider without a key explains itself; the rest keeps working.
  await page.getByRole("tab", { name: "Stock" }).click();
  await page.getByLabel("Search stock and elements").fill("coffee");
  await page.getByRole("button", { name: "Search", exact: true }).click();
  const configured = (
    await (await request.get("/api/stock?kind=photo&q=coffee")).json()
  ).connect;
  if (configured)
    await expect(page.getByText(/Connect Pexels or Pixabay/)).toBeVisible();
  await page.getByRole("tab", { name: "Icons" }).click();
  await page
    .getByRole("button", { name: /^Add coffee/ })
    .first()
    .click();
  await expect(page.locator(".pv-item")).toHaveCount(2);
  await page.reload();
  await expect(page.locator(".pv-item")).toHaveCount(2);
  await page
    .getByRole("button", { name: "Caption & export", exact: true })
    .click();
  await expect(page.locator(".credits")).toContainText("Iconify");
  const dl = page.waitForEvent("download");
  await page.getByRole("button", { name: "Render & download video" }).click();
  expect((await dl).suggestedFilename()).toBe("unstuck-draft.webm");
  await page.getByRole("button", { name: "Back to edit" }).click();
  await page.locator(".pv-item").last().click();
  await page.getByRole("button", { name: "Delete", exact: true }).click();
  await expect(page.locator(".pv-item")).toHaveCount(1);
});

test("home flow: clips become three versions, one is approved in three taps, memory learns, brands stay separate", async ({
  page,
}) => {
  const png = Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aS+8AAAAASUVORK5CYII=",
    "base64",
  );
  await studio(page);
  await expect(page.getByText(/UnStuck remembers 5 things/)).toBeVisible();
  // Tap 1: add clips.
  await page.getByLabel("Upload clips").setInputFiles([
    { name: "packing.png", mimeType: "image/png", buffer: png },
    { name: "counter.png", mimeType: "image/png", buffer: png },
  ]);
  await expect(
    page.getByRole("heading", { name: "Pick a version" }),
  ).toBeVisible({ timeout: 60000 });
  await expect(page.locator(".quick-version")).toHaveCount(3);
  // Tap 2: choose one. Tap 3: approve.
  await page.locator(".quick-version").nth(1).click();
  await expect(page.getByText("Best time to post")).toBeVisible();
  await page.getByRole("button", { name: /^Approve/ }).click();
  await expect(page.getByText("Best time to post")).toBeVisible();
  await expect(
    page.getByRole("combobox", { name: "Review status" }),
  ).toHaveValue("Ready to Publish");
  // The approval is remembered.
  await page.getByRole("link", { name: "Brand Kit", exact: true }).click();
  await expect(page.locator(".memory-learned")).toContainText(
    "approved 1 time",
  );
  await page.getByLabel("Don’ts, one per line").fill("Never mention prices");
  await page.getByRole("button", { name: "Save Brand Memory" }).click();
  await page.getByRole("link", { name: "Home", exact: true }).click();
  await page.getByText(/UnStuck remembers \d+ things/).click();
  await expect(page.locator(".memory-strip")).toContainText(
    "Don’t: Never mention prices",
  );
  // Premium sends approvals to human review.
  await page.getByRole("link", { name: "Settings", exact: true }).click();
  await page
    .getByRole("combobox", { name: "Current plan" })
    .selectOption("Premium");
  await page.getByRole("link", { name: "Home", exact: true }).click();
  await page
    .getByRole("button", { name: /Use my 2 most recent clips/ })
    .click();
  await page.locator(".quick-version").first().click({ timeout: 60000 });
  await page.getByRole("button", { name: /^Approve/ }).click();
  await expect(
    page.getByText("In human review", { exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Mark review complete" }).click();
  // A second brand starts empty and does not see the first brand's work.
  page.once("dialog", (d) => d.accept("Client Two"));
  await page.getByRole("combobox", { name: "Active brand" }).selectOption("+");
  await page.getByRole("link", { name: "My Projects", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "No projects found" }),
  ).toBeVisible();
  await page.getByRole("combobox", { name: "Active brand" }).selectOption({
    label: "My business",
  });
  await page.getByRole("link", { name: "My Projects", exact: true }).click();
  await expect(page.locator(".project-card").first()).toBeVisible();
});

test("starter ideas, popular topics, own audio, undo and journal folders", async ({
  page,
}) => {
  await studio(page);
  // Home offers several prompts and at least four starter ideas.
  await expect(page.locator(".quick-prompts button")).toHaveCount(4);
  await expect(page.locator(".quick-ideas button")).toHaveCount(4);
  const first = await page.locator(".quick-prompts button").first().innerText();
  await page.getByRole("button", { name: "More prompts and ideas" }).click();
  await expect(page.locator(".quick-prompts button").first()).not.toHaveText(
    first,
  );
  await page.locator(".quick-ideas button").first().click();
  await expect(page.locator(".quick-brief")).toBeVisible();
  // Journal entries are small tiles that can be filed into folders.
  await page
    .getByRole("textbox", { name: "Journal entry" })
    .fill("New window display went up today");
  await page.getByRole("button", { name: /Save note/ }).click();
  await expect(page.locator(".jr-tile")).toHaveCount(1);
  expect((await page.locator(".jr-tile").boundingBox())!.width).toBeLessThan(
    140,
  );
  await page.getByRole("button", { name: "New folder" }).click();
  await page.getByLabel("New journal folder name").fill("Window displays");
  await page.getByLabel("New journal folder name").press("Enter");
  await page.getByRole("button", { name: /All entries/ }).click();
  await page.locator(".jr-tile").click();
  await expect(page.getByRole("dialog")).toContainText("New window display");
  await page.getByLabel("Entry folder").selectOption("Window displays");
  await page.getByRole("button", { name: "Done" }).click();
  await page.reload();
  await page.getByRole("button", { name: /Window displays 1/ }).click();
  await expect(page.locator(".jr-tile")).toHaveCount(1);
  // Content Ideas shows what is popular now.
  await page.getByRole("link", { name: "Content Ideas", exact: true }).click();
  await expect(page.locator(".popular-list > div")).not.toHaveCount(0);
  // Editor: undo, redo and the creator's own soundtrack.
  await page.goto("/studio/create?id=sample-project");
  const title = page.getByRole("textbox", { name: "Post title" });
  const before = await title.inputValue();
  await title.fill("Changed title");
  await page.getByRole("button", { name: "Undo" }).click();
  await expect(title).toHaveValue(before);
  await page.getByRole("button", { name: "Redo" }).click();
  await expect(title).toHaveValue("Changed title");
  const wav = Buffer.alloc(44 + 8000);
  wav.write("RIFF", 0);
  wav.writeUInt32LE(36 + 8000, 4);
  wav.write("WAVEfmt ", 8);
  wav.writeUInt32LE(16, 16);
  wav.writeUInt16LE(1, 20);
  wav.writeUInt16LE(1, 22);
  wav.writeUInt32LE(8000, 24);
  wav.writeUInt32LE(8000, 28);
  wav.writeUInt16LE(1, 32);
  wav.writeUInt16LE(8, 34);
  wav.write("data", 36);
  wav.writeUInt32LE(8000, 40);
  await page.getByRole("tab", { name: "Music" }).click();
  await page
    .getByLabel("Upload my own music or audio")
    .setInputFiles({ name: "jingle.wav", mimeType: "audio/wav", buffer: wav });
  await expect(page.getByRole("button", { name: "My audio" })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  await page.reload();
  await expect(page.getByText(/My audio music/).first()).toBeVisible();
  await page.getByRole("tab", { name: "Ask for a change" }).click();
  await page
    .getByRole("textbox", { name: "Revision request" })
    .fill("Shorten this to 3 seconds");
  await page.getByRole("button", { name: "Apply revision" }).click();
  await page
    .getByRole("button", { name: "Caption & export", exact: true })
    .click();
  const dl = page.waitForEvent("download");
  await page.getByRole("button", { name: "Render & download video" }).click();
  expect((await dl).suggestedFilename()).toBe("unstuck-draft.webm");
});

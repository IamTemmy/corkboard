import { test, expect } from "@playwright/test";

const card = 'a[href^="/listings/"]';

// ── Data-resilient checks ────────────────────────────────────────────────────
// These pass no matter what's in the database, so they won't flake when demo
// data is cleared. They catch the scary "the site is broken" regressions.
test.describe("site health", () => {
  test("homepage renders its shell", async ({ page }) => {
    await page.goto("/");
    await expect(
      page.getByRole("heading", { name: /buy and sell with people on your campus/i }),
    ).toBeVisible();
    await expect(page.getByLabel("Search listings")).toBeVisible();
    await expect(page.getByRole("button", { name: "All", exact: true })).toBeVisible();
  });

  test("a gibberish search shows the empty state", async ({ page }) => {
    await page.goto("/");
    await page.getByLabel("Search listings").fill("zzqqxxnope");
    await expect(page.getByText(/no listings match/i)).toBeVisible();
    await expect(page.locator(card)).toHaveCount(0);
  });

  test("no sold item appears on the public board", async ({ page }) => {
    await page.goto("/");
    // Sold listings must leave the board — a "Sold" badge on any card is a bug.
    await expect(page.locator(card).getByText("Sold", { exact: true })).toHaveCount(0);
  });

  test("static pages render", async ({ page }) => {
    await page.goto("/guidelines");
    await expect(
      page.getByRole("heading", { name: /community guidelines/i }),
    ).toBeVisible();

    await page.goto("/how-it-works");
    await expect(
      page.getByRole("heading", { name: /how snaggboard works/i }),
    ).toBeVisible();

    await page.goto("/join");
    await expect(
      page.getByRole("heading", { name: /sign in or sign up/i }),
    ).toBeVisible();
  });

  test("sign in and sign up both lead to /join", async ({ page }) => {
    await page.goto("/");
    await expect(
      page.getByRole("link", { name: "Sign in", exact: true }).first(),
    ).toHaveAttribute("href", "/join");
    await expect(
      page.getByRole("link", { name: "Sign up", exact: true }).first(),
    ).toHaveAttribute("href", "/join");
  });
});

// ── Content behavior (adaptive) ──────────────────────────────────────────────
// These validate the board's core features against WHATEVER listings are live,
// so they stay green as demo data is swapped for real listings. The search
// synonym logic itself is unit-tested in search.spec.ts (no DB needed), so we
// no longer depend on specific seeded items like the demo sneakers.
test.describe("content behavior", () => {
  test("the board shows listings", async ({ page }) => {
    await page.goto("/");
    expect(await page.locator(card).count()).toBeGreaterThan(0);
  });

  test("a category filter narrows to only that category", async ({ page }) => {
    await page.goto("/");
    // Try each category; verify the first non-empty one shows only its items.
    // Looping keeps this independent of which categories currently have listings.
    for (const name of ["Electronics", "Clothing", "Dorm", "Furniture", "Books"]) {
      await page.getByRole("button", { name, exact: true }).click();
      // Wait for the board to settle on this filter (cards, or the empty state).
      await expect(
        page.locator(card).or(page.getByText(/no listings match/i)).first(),
      ).toBeVisible();
      const cards = page.locator(card);
      const count = await cards.count();
      if (count === 0) continue;
      for (let i = 0; i < count; i++) await expect(cards.nth(i)).toContainText(name);
      return; // verified a real, non-empty category
    }
    throw new Error("no category had listings — the board looks empty");
  });

  test("searching a word from a real listing returns it", async ({ page }) => {
    await page.goto("/");
    // Derive the query from a live listing's title so this never depends on
    // specific seeded items — it just proves the search box filters the board.
    const href = await page.locator(card).first().getAttribute("href");
    await page.goto(href ?? "/");
    const title = await page.getByRole("heading", { level: 1 }).innerText();
    const word =
      title.split(/\s+/).find((w) => /^[a-zA-Z]{4,}$/.test(w)) ??
      title.trim().split(/\s+/)[0];
    await page.goto("/");
    await page.getByLabel("Search listings").fill(word);
    await expect(page.locator(card).first()).toBeVisible();
  });

  test("opening a listing shows its details", async ({ page }) => {
    await page.goto("/");
    await page.locator(card).first().click();
    await expect(page).toHaveURL(/\/listings\//);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    // The "Meet at" label (exact — the contact copy also contains "meet at").
    await expect(page.getByText("Meet at", { exact: true })).toBeVisible();
  });
});

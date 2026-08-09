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
      page.getByRole("heading", { name: /how corkboard works/i }),
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

// ── Content behavior (assumes the demo listings are present) ──────────────────
// These need seed data (sneakers, etc.). If you clear the board for real
// testers, expect them to go red until real listings exist — they protect the
// search behavior, not the site's health. Skip or update them at that point.
test.describe("content behavior (assumes demo listings)", () => {
  test("the board shows listings", async ({ page }) => {
    await page.goto("/");
    expect(await page.locator(card).count()).toBeGreaterThan(0);
  });

  test("category filter returns only that category (and isn't empty)", async ({
    page,
  }) => {
    await page.goto("/");
    await page.getByRole("button", { name: "Electronics", exact: true }).click();
    const cards = page.locator(card);
    // Must actually return items — a broken filter that shows nothing would
    // otherwise pass a "for each card…" loop vacuously.
    const count = await cards.count();
    expect(count).toBeGreaterThan(0);
    for (let i = 0; i < count; i++) {
      await expect(cards.nth(i)).toContainText("Electronics");
    }
  });

  test('search "shoe" surfaces a sneaker (synonyms + brand indicators)', async ({
    page,
  }) => {
    await page.goto("/");
    await page.getByLabel("Search listings").fill("shoe");
    // No listing is literally titled "shoe", so a result proves the synonym /
    // brand-indicator search is working.
    await expect(
      page.locator(card).filter({ hasText: /sneaker|new balance|nike|puma|sandal/i }),
    ).not.toHaveCount(0);
  });

  test('search "sneaker" returns results', async ({ page }) => {
    await page.goto("/");
    await page.getByLabel("Search listings").fill("sneaker");
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

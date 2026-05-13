import { test, expect, Page } from "@playwright/test";

/**
 * End-to-end smoke + UX tests for ScholarScout. Run with:
 *   npx playwright test
 *
 * These tests exercise real user flows and capture screenshots at key
 * checkpoints so we can eyeball polish issues, not just functional pass/fail.
 *
 * Auth tests intentionally don't sign up real users — they verify the modal
 * mechanics. Cross-device cloud sync is exercised separately by signing in
 * twice with the same test account.
 */

const BASE = "http://localhost:3000";

// Slow each step a bit so screenshots aren't mid-animation.
test.use({ actionTimeout: 10_000, navigationTimeout: 20_000 });

test.describe("Page boots and renders", () => {
  test("home page loads with key content", async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(`pageerror: ${e.message}`));
    page.on("console", (msg) => {
      if (msg.type() === "error") errors.push(`console.error: ${msg.text()}`);
    });

    await page.goto(BASE);
    await expect(page.getByRole("heading", { name: /find scholarships/i })).toBeVisible();
    await expect(page.getByText(/built for incoming college freshmen/i)).toBeVisible();
    await expect(page.getByRole("button", { name: /find my scholarships/i })).toBeVisible();
    await page.screenshot({ path: "tests/screenshots/01-home.png", fullPage: true });

    // Surface any console errors so we know about them
    if (errors.length > 0) {
      console.log(`[home page errors]:\n  ${errors.join("\n  ")}`);
    }
  });

  test("all six tabs navigate and render", async ({ page }) => {
    await page.goto(BASE);
    const tabs = ["Home", "Finder", "Apply Helper", "Tips Hub", "School", "Tracker"] as const;
    for (const label of tabs) {
      // Use desktop nav (visible on lg+ widths). Default Playwright viewport is
      // 1280x720 so desktop nav is shown.
      const navBtn = page.locator("nav").getByRole("button", { name: label }).first();
      await navBtn.click();
      await page.waitForTimeout(250); // small settle for animations
      await page.screenshot({ path: `tests/screenshots/02-tab-${label.toLowerCase().replace(/\s/g, "-")}.png`, fullPage: true });
    }
  });
});

test.describe("Finder", () => {
  test("submits a search and shows results", async ({ page }) => {
    await page.goto(BASE);
    await page.locator("nav").getByRole("button", { name: "Finder" }).first().click();

    // Fill in a useful subset
    await page.getByLabel("Intended major").fill("Computer Science");
    await page.getByLabel("State / Region").fill("California");
    await page.getByLabel(/zip code/i).fill("90210");

    await page.getByRole("button", { name: /find my scholarships/i }).click();

    // Wait for either results header OR error banner
    await expect(
      page.getByRole("heading", { name: /matches found/i })
    ).toBeVisible({ timeout: 30_000 });

    const cards = page.locator("h4").filter({ hasNot: page.locator("svg") });
    const count = await cards.count();
    expect(count).toBeGreaterThan(0);
    await page.screenshot({ path: "tests/screenshots/03-finder-results.png", fullPage: true });
  });

  test("'Add to tracker' button removes the result and adds to tracker", async ({ page }) => {
    await page.goto(BASE);
    await page.locator("nav").getByRole("button", { name: "Finder" }).first().click();
    await page.getByLabel("State / Region").fill("California");
    await page.getByRole("button", { name: /find my scholarships/i }).click();
    await expect(page.getByRole("heading", { name: /matches found/i })).toBeVisible({ timeout: 30_000 });

    // Capture name of first result before clicking add
    const firstCardName = await page.locator("h4").first().textContent();
    expect(firstCardName).toBeTruthy();
    const addBtn = page.getByRole("button", { name: /add to tracker/i }).first();
    await addBtn.click();
    await page.waitForTimeout(500);

    // The result should disappear from Finder
    await expect(page.locator("h4", { hasText: firstCardName! })).toHaveCount(0);

    // It should appear in the Tracker
    await page.locator("nav").getByRole("button", { name: "Tracker" }).first().click();
    await page.waitForTimeout(500);
    const trackerInput = page.locator(`input[value="${firstCardName!.trim()}"]`);
    await expect(trackerInput).toBeVisible();
    await page.screenshot({ path: "tests/screenshots/04-finder-add-to-tracker.png", fullPage: true });
  });

  test("'Show more matches' loads a fresh batch", async ({ page }) => {
    await page.goto(BASE);
    await page.locator("nav").getByRole("button", { name: "Finder" }).first().click();
    await page.getByLabel("State / Region").fill("California");
    await page.getByRole("button", { name: /find my scholarships/i }).click();
    await expect(page.getByRole("heading", { name: /matches found/i })).toBeVisible({ timeout: 30_000 });

    const before = await page.locator("h4").count();
    await page.getByRole("button", { name: /show more matches/i }).click();
    // Show more should produce a new batch of cards within the API timeout.
    await expect.poll(async () => page.locator("h4").count(), { timeout: 30_000 }).toBeGreaterThan(before);
    await page.screenshot({ path: "tests/screenshots/05-finder-show-more.png", fullPage: true });
  });
});

test.describe("Apply Helper", () => {
  test("typing a scholarship + submit shows the guide", async ({ page }) => {
    await page.goto(BASE);
    await page.locator("nav").getByRole("button", { name: "Apply Helper" }).first().click();
    await page.getByPlaceholder(/coca-cola scholars/i).fill("Local Rotary Future Leaders");
    await page.getByRole("button", { name: /build my guide/i }).click();
    await expect(page.getByText(/6-step application plan/i)).toBeVisible();
    await page.screenshot({ path: "tests/screenshots/06-apply-helper.png", fullPage: true });
  });

  test("essay coach scores a draft", async ({ page }) => {
    await page.goto(BASE);
    await page.locator("nav").getByRole("button", { name: "Apply Helper" }).first().click();
    await page.getByPlaceholder(/coca-cola scholars/i).fill("Local Rotary Future Leaders");
    await page.getByRole("button", { name: /build my guide/i }).click();
    await page.getByPlaceholder(/the day i learned/i).fill(
      "The day my dad lost his job, I picked up shifts at a corner store to help with groceries. I learned that small consistent actions compound. I want to study finance to help families like mine plan past the next crisis."
    );
    await page.getByRole("button", { name: /score my draft/i }).click();
    await expect(page.getByText(/coach feedback/i)).toBeVisible({ timeout: 30_000 });
    await page.screenshot({ path: "tests/screenshots/07-essay-coach.png", fullPage: true });
  });
});

test.describe("Tracker", () => {
  test("manual add row + edit name persists and shows in Active", async ({ page }) => {
    await page.goto(BASE);
    await page.locator("nav").getByRole("button", { name: "Tracker" }).first().click();
    await page.getByRole("button", { name: /add scholarship/i }).click();
    const newRow = page.locator("input[placeholder='Scholarship name']").last();
    await newRow.fill("Test Scholarship From Playwright");
    await page.waitForTimeout(400);
    // Reload and check it persists in localStorage
    await page.reload();
    await page.locator("nav").getByRole("button", { name: "Tracker" }).first().click();
    await expect(
      page.locator(`input[value="Test Scholarship From Playwright"]`)
    ).toBeVisible();
    await page.screenshot({ path: "tests/screenshots/08-tracker-manual-add.png", fullPage: true });
  });

  test("status change to Won moves row to Completed and bumps lifetime $", async ({ page }) => {
    await page.goto(BASE);
    await page.locator("nav").getByRole("button", { name: "Tracker" }).first().click();
    await page.getByRole("button", { name: /add scholarship/i }).click();
    const lastNameInput = page.locator("input[placeholder='Scholarship name']").last();
    await lastNameInput.fill("Won Test Scholarship");
    const lastAwardInput = page.locator("input[placeholder='$1,000']").last();
    await lastAwardInput.fill("$2,500");
    await page.waitForTimeout(300);

    // Find the status select for the new row and change to Won
    const lastStatusSelect = page.locator("select").last();
    await lastStatusSelect.selectOption("Won");
    await page.waitForTimeout(500);

    // Should appear in Completed section
    await expect(page.getByRole("heading", { name: /^completed/i })).toBeVisible();
    // The Won $ stat card is uniquely identifiable by having "lifetime" as
    // its sublabel — no other element on the page has that exact text.
    // Scope to the card containing it.
    const wonCard = page.locator("div").filter({ hasText: /^lifetime$/ }).locator("..");
    await expect(wonCard.getByText(/\$2,500/)).toBeVisible({ timeout: 5_000 });
    await page.screenshot({ path: "tests/screenshots/09-tracker-completed.png", fullPage: true });
  });
});

test.describe("Sign-in modal", () => {
  test("opens, has both tabs and Google button, closes on backdrop click", async ({ page }) => {
    await page.goto(BASE);
    // Sign in button might not be visible if Supabase env vars aren't set in
    // dev — that's worth knowing too.
    // Two sign-in buttons exist (desktop visible button, mobile icon-only
    // button with aria-label). Scope to the visible one.
    const signInBtn = page.locator("header").getByRole("button", { name: /^sign in$/i }).first();
    const isVisible = await signInBtn.isVisible().catch(() => false);
    if (!isVisible) {
      console.log("[modal] Sign in button not visible — auth env vars likely missing");
      return;
    }
    await signInBtn.click();
    await expect(page.getByRole("dialog")).toBeVisible();
    await expect(page.getByRole("heading", { name: /welcome back/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /continue with google/i })).toBeVisible();

    // Toggle to Sign up
    await page.getByRole("button", { name: /^sign up$/i }).click();
    await expect(page.getByRole("heading", { name: /sync across devices/i })).toBeVisible();
    await page.screenshot({ path: "tests/screenshots/10-auth-modal-signup.png", fullPage: true });

    // Toggle back
    await page.getByRole("button", { name: /^sign in$/i }).first().click();

    // Close on Escape
    await page.keyboard.press("Escape");
    await expect(page.getByRole("dialog")).not.toBeVisible();
    await page.screenshot({ path: "tests/screenshots/10-auth-modal-closed.png" });
  });

  test("invalid credentials surface a clear error", async ({ page }) => {
    await page.goto(BASE);
    // Two sign-in buttons exist (desktop visible button, mobile icon-only
    // button with aria-label). Scope to the visible one.
    const signInBtn = page.locator("header").getByRole("button", { name: /^sign in$/i }).first();
    if (!(await signInBtn.isVisible().catch(() => false))) return;
    await signInBtn.click();
    await page.getByPlaceholder("you@example.com").fill("definitely-not-a-real-user-12345@example.com");
    await page.getByLabel(/password/i).fill("wrongpassword123");
    await page.locator("form").getByRole("button", { name: /^sign in$/i }).click();
    // Should see SOME error message
    await expect(page.locator("form").locator("text=/invalid|incorrect|email|password/i").first()).toBeVisible({
      timeout: 15_000,
    });
    await page.screenshot({ path: "tests/screenshots/11-auth-error.png" });
  });
});

test.describe("Tab state persistence", () => {
  test("Finder results persist when navigating away and back", async ({ page }) => {
    await page.goto(BASE);
    await page.locator("nav").getByRole("button", { name: "Finder" }).first().click();
    await page.getByLabel("State / Region").fill("California");
    await page.getByRole("button", { name: /find my scholarships/i }).click();
    await expect(page.getByRole("heading", { name: /matches found/i })).toBeVisible({ timeout: 30_000 });
    const beforeCount = await page.locator("h4").count();
    expect(beforeCount).toBeGreaterThan(0);

    // Navigate away
    await page.locator("nav").getByRole("button", { name: "Tips Hub" }).first().click();
    await page.waitForTimeout(300);
    // Back to Finder
    await page.locator("nav").getByRole("button", { name: "Finder" }).first().click();
    await page.waitForTimeout(300);

    // Results should still be visible
    await expect(page.getByRole("heading", { name: /matches found/i })).toBeVisible();
    const afterCount = await page.locator("h4").count();
    expect(afterCount).toBe(beforeCount);
    await page.screenshot({ path: "tests/screenshots/12-finder-state-persists.png", fullPage: true });
  });
});

test.describe("Mobile viewport", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("home page is usable on iPhone-sized viewport", async ({ page }) => {
    await page.goto(BASE);
    await expect(page.getByRole("heading", { name: /find scholarships/i })).toBeVisible();
    await page.screenshot({ path: "tests/screenshots/13-mobile-home.png", fullPage: true });

    // Mobile tabs are in a horizontally-scrolling row at the bottom of the header
    await page.locator("nav").getByRole("button", { name: "Finder" }).last().click();
    await page.screenshot({ path: "tests/screenshots/13-mobile-finder.png", fullPage: true });
  });
});

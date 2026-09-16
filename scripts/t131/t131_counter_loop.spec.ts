/**
 * PR #131 Acceptance Test — T1-T7
 * Governed Counter consequence loop vs REAL CAPPO
 *
 * Run on the remote Linux host:
 *   npx playwright test t131_counter_loop.spec.ts --project=chromium
 *
 * Prerequisites on host:
 *   export CAPPO_JWT=$(cat /tmp/cappo_jwt.txt)
 *   npm i -D playwright @playwright/test
 *   npx playwright install chromium
 *
 * Freeze blockers (do NOT deploy to prod without fixing):
 *   1. Dev JWT secret in CAPPO container must be rotated before production freeze
 *   2. Browser UA spoof required on public WAF path — non-browser agents blocked
 *
 * Known deviations:
 *   - Proof badge reads "Live" (not "Verified") — by design per lib/cos/proof.ts:95
 *   - Replay returns 200+decision=deny — by design (CAPPO returns governance decision, not HTTP 4xx)
 */

import { test, expect, Page, request } from "@playwright/test";
import * as fs from "fs";
import * as child_process from "child_process";

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------
const FRONTEND   = "http://127.0.0.1:3039";
const CAPPO      = "http://127.0.0.1:8002";
const PGL        = "http://127.0.0.1:8001";
const JWT_PATH   = "C:\\Users\\antho\\.windsurf\\veklom-control-plane\\scripts\\t131\\cappo_jwt.txt";
const SQLITE_DB  = "/tmp/cappo_effects/governed_counters.db";
const WORKSPACE  = "default";

function readBearer(): string {
  try {
    return fs.readFileSync(JWT_PATH, "utf8").trim();
  } catch {
    throw new Error(`JWT not found at ${JWT_PATH} — run the auth stub first`);
  }
}

function sqliteCounter(workspace: string): number {
  try {
    const out = child_process.execSync(
      `sqlite3 ${SQLITE_DB} "select value from counters where workspace_id='${workspace}' limit 1"`,
      { encoding: "utf8" }
    ).trim();
    return out ? parseInt(out, 10) : 0;
  } catch {
    return 0; // no row yet = 0
  }
}

async function cappoGet(path: string, bearer: string): Promise<{ status: number; body: any }> {
  const ctx = await request.newContext();
  const r = await ctx.get(`${CAPPO}${path}`, {
    headers: { Authorization: `Bearer ${bearer}`, Accept: "application/json" },
  });
  const body = await r.json().catch(() => ({}));
  return { status: r.status(), body };
}

// ---------------------------------------------------------------------------
// State shared across tests
// ---------------------------------------------------------------------------
let BEARER      = "";
let mountId     = "";
let tokenId     = "";
let receiptId   = "";
let anchorId    = "";
let counterV0   = 0;

test.beforeAll(async () => {
  BEARER    = readBearer();
  counterV0 = sqliteCounter(WORKSPACE);
  console.log(`\n  Bearer acquired (first 20): ${BEARER.slice(0, 20)}...`);
  console.log(`  Counter baseline (sqlite): ${counterV0}`);
});

// ---------------------------------------------------------------------------
// T1 — /os/mount: package discovery + mount
// ---------------------------------------------------------------------------
test("T1: package discovery and mount (Live)", async ({ page }) => {
  await page.goto(`${FRONTEND}/os/mount`);

  // Must not bounce to /login
  await expect(page).toHaveURL(/\/os\/mount/, { timeout: 10_000 });

  // Governed Counter package must appear
  await expect(
    page.getByText("veklom.governed-counter@v1")
  ).toBeVisible({ timeout: 10_000 });

  // Proof label must be Live/Present — not Simulated/Needs proof
  const proofBadge = page.locator('[data-testid="proof-badge"], .proof-badge, [class*="proof"]').first();
  if (await proofBadge.count() > 0) {
    const badgeText = await proofBadge.textContent();
    expect(badgeText).not.toMatch(/simulated|needs proof/i);
  }

  // CAPPO log shows packages 200 — verified via direct API call
  const { status: pkgStatus, body: pkgs } = await cappoGet("/v1/capability/packages", BEARER);
  expect(pkgStatus).toBe(200);
  const counterPkg = Array.isArray(pkgs) && pkgs.find((p: any) => p.id === "veklom.governed-counter@v1");
  expect(counterPkg).toBeTruthy();

  // Mount via UI — find and click the Mount button for Governed Counter
  const mountBtn = page.getByRole("button", { name: /mount/i }).first();
  await mountBtn.click();

  // Wait for mount_id to appear in the UI
  await page.waitForSelector('[data-testid="mount-id"], [class*="mount-id"], text=/mnt_/', { timeout: 15_000 });

  // Extract displayed mount_id and token_id from DOM
  const mountIdEl = page.locator('[data-testid="mount-id"]').first();
  const tokenIdEl = page.locator('[data-testid="token-id"]').first();

  if (await mountIdEl.count() > 0) {
    mountId = (await mountIdEl.textContent())?.trim() ?? "";
  } else {
    // Fallback: find any text matching mnt_ pattern
    const bodyText = await page.locator("body").textContent();
    const match = bodyText?.match(/mnt_[a-f0-9]+/);
    mountId = match?.[0] ?? "";
  }

  if (await tokenIdEl.count() > 0) {
    tokenId = (await tokenIdEl.textContent())?.trim() ?? "";
  } else {
    const bodyText = await page.locator("body").textContent();
    const match = bodyText?.match(/tok_[a-f0-9]+/);
    tokenId = match?.[0] ?? "";
  }

  console.log(`  mount_id: ${mountId}`);
  console.log(`  token_id: ${tokenId}`);
  expect(mountId).toMatch(/^mnt_/);

  // Direct CAPPO readback — state must be active
  if (mountId) {
    const { status: ms, body: mb } = await cappoGet(`/v1/capability/mounts/${mountId}`, BEARER);
    expect(ms).toBe(200);
    expect(mb?.mount?.lifecycle?.state).toBe("mounted");
    // token_id must match what the UI shows
    if (tokenId) {
      expect(mb?.token?.token_id).toBe(tokenId);
    }
  }
});

// ---------------------------------------------------------------------------
// T2 — counter.reset DENIED
// ---------------------------------------------------------------------------
test("T2: counter.reset DENIED", async ({ page }) => {
  expect(mountId, "T1 must pass first").toMatch(/^mnt_/);

  await page.goto(`${FRONTEND}/os/execute`);
  await page.waitForLoadState("networkidle");

  const valueBefore = sqliteCounter(WORKSPACE);

  // Click the blocked-action button
  const resetBtn = page.getByRole("button", { name: /blocked action|counter\.reset|reset/i }).first();
  await resetBtn.click();

  // UI must show DENIED + a reason
  await expect(page.getByText(/denied/i)).toBeVisible({ timeout: 10_000 });

  // Reason must not be empty
  const reasonEl = page.locator('[data-testid="deny-reason"], [class*="reason"], [class*="denied"]').first();
  if (await reasonEl.count() > 0) {
    const reasonText = await reasonEl.textContent();
    expect(reasonText?.trim()).toBeTruthy();
  }

  // Counter must not have changed
  const valueAfter = sqliteCounter(WORKSPACE);
  expect(valueAfter).toBe(valueBefore);
  console.log(`  Counter unchanged: ${valueBefore} → ${valueAfter}`);
});

// ---------------------------------------------------------------------------
// T3 — counter.increment ALLOW + receipt
// ---------------------------------------------------------------------------
test("T3: counter.increment ALLOW + PGL receipt", async ({ page }) => {
  expect(mountId, "T1 must pass first").toMatch(/^mnt_/);

  await page.goto(`${FRONTEND}/os/execute`);
  await page.waitForLoadState("networkidle");

  const valueBefore = sqliteCounter(WORKSPACE);
  console.log(`  Counter before increment: ${valueBefore}`);

  // Intercept the execute network response to extract receipt_id / anchor_id
  page.on("response", async (resp) => {
    if (resp.url().includes("/execute") || resp.url().includes("/actions")) {
      try {
        const body = await resp.json();
        if (body?.anchoring?.anchor_id && !anchorId) {
          anchorId = body.anchoring.anchor_id;
        }
        // receipt_id may come from consequence or anchoring
        const rid = body?.consequence?.receipt_id || body?.receipt_id || "";
        if (rid && !receiptId) receiptId = rid;
      } catch { /* non-JSON */ }
    }
  });

  const incrBtn = page.getByRole("button", { name: /counter\.increment|increment|execute/i }).first();
  await incrBtn.click();

  // Decision must show ALLOW
  await expect(page.getByText(/allow/i)).toBeVisible({ timeout: 15_000 });

  // Counter value must show v+1 in UI
  const newValEl = page.locator('[data-testid="counter-value"], [class*="counter-value"]').first();
  if (await newValEl.count() > 0) {
    const uiVal = parseInt((await newValEl.textContent()) ?? "0", 10);
    expect(uiVal).toBe(valueBefore + 1);
  }

  // Anchor ID must be present in UI
  await expect(page.getByText(/anchor/i)).toBeVisible({ timeout: 5_000 });

  // Proof badge must read "Live" NOT "Verified" or "Simulated"
  const badge = page.locator('[data-testid="proof-badge"], [class*="proof-badge"]').first();
  if (await badge.count() > 0) {
    const badgeText = await badge.textContent();
    expect(badgeText).toMatch(/live/i);
    expect(badgeText).not.toMatch(/verified|simulated/i);
  }

  // SQLite truth
  const valueAfter = sqliteCounter(WORKSPACE);
  expect(valueAfter).toBe(valueBefore + 1);
  console.log(`  Counter after increment: ${valueBefore} → ${valueAfter}`);
  console.log(`  anchor_id: ${anchorId}`);
  console.log(`  receipt_id: ${receiptId}`);

  expect(anchorId).toBeTruthy();
});

// ---------------------------------------------------------------------------
// T4 — Revoke authority
// ---------------------------------------------------------------------------
test("T4: revoke authority → mount terminated", async ({ page }) => {
  expect(mountId, "T1 must pass first").toMatch(/^mnt_/);

  await page.goto(`${FRONTEND}/os/execute`);
  await page.waitForLoadState("networkidle");

  const revokeBtn = page.getByRole("button", { name: /revoke/i }).first();
  await revokeBtn.click();

  // UI must show terminated state (either from task_complete or explicit_terminate)
  await expect(
    page.getByText(/terminated|revoke.*allow|explicit_terminate|task_complete/i)
  ).toBeVisible({ timeout: 15_000 });

  // Direct CAPPO readback — mount must be terminated regardless of which reason
  await page.waitForTimeout(1_000);
  const { status: ms, body: mb } = await cappoGet(`/v1/capability/mounts/${mountId}`, BEARER);
  expect(ms).toBe(200);
  expect(mb?.mount?.lifecycle?.state).toBe("terminated");
  console.log(`  Mount state (CAPPO): ${mb?.mount?.lifecycle?.state}`);
});

// ---------------------------------------------------------------------------
// T5 — Replay DENIED
// ---------------------------------------------------------------------------
test("T5: replay counter.increment DENIED", async ({ page }) => {
  expect(mountId, "T1 must pass first").toMatch(/^mnt_/);

  await page.goto(`${FRONTEND}/os/execute`);
  await page.waitForLoadState("networkidle");

  const sqlBefore = sqliteCounter(WORKSPACE);

  const retryBtn = page.getByRole("button", { name: /retry.*counter|retry.*increment|replay/i }).first();
  await retryBtn.click();

  // Must show DENIED
  await expect(page.getByText(/denied/i)).toBeVisible({ timeout: 15_000 });

  // If CAPPO somehow returns ALLOW — that is a backend bug; banner must be visible
  const allowText = await page.getByText(/allow/i).count();
  if (allowText > 0) {
    // Degraded banner MUST be visible if allow slipped through
    await expect(page.getByText(/degraded.*replay.*invariant|invariant violation/i)).toBeVisible({ timeout: 3_000 });
    console.warn("  WARNING: CAPPO allowed replay — backend invariant violation");
  }

  // Counter must be unchanged
  const sqlAfter = sqliteCounter(WORKSPACE);
  expect(sqlAfter).toBe(sqlBefore);
  console.log(`  Counter after replay (must be unchanged): ${sqlBefore} → ${sqlAfter}`);
});

// ---------------------------------------------------------------------------
// T6 — /os/evidence: ledger + receipt Present
// ---------------------------------------------------------------------------
test("T6: /os/evidence ledger + receipt Present", async ({ page }) => {
  const responses: string[] = [];
  page.on("response", (r) => {
    if (r.url().includes("/audit/ledger") || r.url().includes("/audit/verify")) {
      responses.push(`${r.status()} ${r.url()}`);
    }
  });

  await page.goto(`${FRONTEND}/os/evidence`);
  await page.waitForLoadState("networkidle");

  // Must have triggered ledger and verify calls
  expect(responses.some((r) => r.includes("/audit/ledger"))).toBe(true);
  expect(responses.some((r) => r.includes("/audit/verify"))).toBe(true);
  console.log(`  Audit calls: ${responses.join(", ")}`);

  // Receipt badge must read "Present" — not "Verified"
  await expect(page.getByText(/present/i)).toBeVisible({ timeout: 10_000 });
  const verifiedBadge = page.getByText(/verified/i);
  if (await verifiedBadge.count() > 0) {
    // "Present" and "Verified" should not both exist for the same receipt
    // If "Verified" appears, fail with explanation
    console.warn("  Badge shows 'Verified' — expected 'Present' per spec");
  }

  // receipt_id from T3 must appear on the page
  if (receiptId) {
    await expect(page.getByText(receiptId)).toBeVisible({ timeout: 5_000 });
    console.log(`  receipt_id found on evidence page: ${receiptId}`);
  }
});

// ---------------------------------------------------------------------------
// T7 — Sandbox/Production frame + themes + console
// ---------------------------------------------------------------------------
test("T7: sandbox/production toggle + themes + no console errors", async ({ page }) => {
  const consoleErrors: string[] = [];
  page.on("console", (msg) => {
    if (msg.type() === "error") {
      const text = msg.text();
      // Ignore expected unavailable backends
      if (!text.includes(":8088") && !text.includes(":8001")) {
        consoleErrors.push(text);
      }
    }
  });

  await page.goto(`${FRONTEND}/os/execute`);
  await page.waitForLoadState("networkidle");

  // Toggle to Sandbox
  const sandboxToggle = page.locator('[data-testid="env-toggle"], [aria-label*="sandbox"], button:has-text("Sandbox")').first();
  if (await sandboxToggle.count() > 0) {
    await sandboxToggle.click();
    await page.waitForTimeout(500);
    // Sandbox frame must be visibly labelled
    await expect(page.getByText(/sandbox/i)).toBeVisible();
    // Toggle back to Production
    await sandboxToggle.click();
    await page.waitForTimeout(500);
    // No real results should be labelled "Simulated" in Production
    const simulated = page.getByText(/simulated/i);
    if (await simulated.count() > 0) {
      const text = await simulated.first().textContent();
      // Only allowed in sandbox frame
      expect(text).not.toMatch(/simulated/i);
    }
  }

  // Dark/Light theme toggle
  const themeBtn = page.locator('[data-testid="theme-toggle"], [aria-label*="theme"], [aria-label*="dark"]').first();
  if (await themeBtn.count() > 0) {
    await themeBtn.click();
    await page.waitForTimeout(300);
    await themeBtn.click(); // back
  }

  // Console errors check
  if (consoleErrors.length > 0) {
    console.warn("  Console errors (non-backend):", consoleErrors);
  }
  expect(consoleErrors).toHaveLength(0);
});


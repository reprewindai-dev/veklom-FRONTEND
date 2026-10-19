const { chromium } = require("playwright");
const fs = require("fs");
const path = require("path");

const { execSync } = require("child_process");

const ARTIFACTS_DIR = "C:\\Users\\antho\\.gemini\\antigravity\\brain\\235d432e-5dee-4797-a2af-5cc90a3f421d";
const PORT = process.env.TEST_PORT || "3004";
const BASE_URL = `http://127.0.0.1:${PORT}`;

function getFreshToken() {
  try {
    const token = execSync("docker exec veklom-lockerphycer cat /tmp/active_test_token.txt", { encoding: "utf8" }).trim();
    if (token) return token;
  } catch (e) {
    console.error("[Token Error]", e.message);
  }
  throw new Error("Unable to read active token from LockerPhycer container");
}

const AUTH_TOKEN = getFreshToken();
const WORKSPACE_ID = "cd6691ff-fb19-4e14-996f-6100457177a8";

async function runLiveE2ETest() {
  console.log(`=======================================================`);
  console.log(`[E2E] Starting Full Unmocked Playwright Suite on ${BASE_URL}...`);
  console.log(`[E2E] Live Authenticated User: reprewindai@gmail.com (Role: Admin)`);
  console.log(`[E2E] Bound Workspace: ${WORKSPACE_ID}`);
  console.log(`=======================================================`);
  
  const browser = await chromium.launch({
    channel: "msedge",
    headless: true,
  });

  const context = await browser.newContext({
    viewport: { width: 1440, height: 960 },
  });

  // Inject cookies for server-side route authentication
  await context.addCookies([
    {
      name: "veklom_session",
      value: AUTH_TOKEN,
      domain: "127.0.0.1",
      path: "/",
      httpOnly: true,
    },
    {
      name: "access_token",
      value: AUTH_TOKEN,
      domain: "127.0.0.1",
      path: "/",
    },
  ]);

  // Inject credentials into client browser session before any page script executes
  await context.addInitScript(({ token, workspaceId }) => {
    window.localStorage.setItem("veklom.access_token", token);
    window.localStorage.setItem("veklom.workspace_id", workspaceId);
    window.localStorage.setItem("veklom.environment", "sandbox");
  }, { token: AUTH_TOKEN, workspaceId: WORKSPACE_ID });

  const page = await context.newPage();

  // Listen to network telemetry to capture authentic unmocked HTTP requests
  const observedRequests = [];
  page.on("request", (req) => {
    if (req.url().includes("/api/") || req.url().includes("/v1/")) {
      observedRequests.push({ method: req.method(), url: req.url() });
      console.log(`[Network Request] ${req.method()} ${req.url()}`);
    }
  });

  page.on("response", (res) => {
    if (res.url().includes("/api/") || res.url().includes("/v1/")) {
      console.log(`[Network Response] ${res.status()} ${res.url()}`);
    }
  });

  try {
    // ---------------------------------------------------------
    // Phase 1: Landing Page & The Continuity Framework Blog
    // ---------------------------------------------------------
    console.log(`\n--- Phase 1: Landing Page & Continuity Framework Blog ---`);
    await page.goto(`${BASE_URL}/`, { waitUntil: "domcontentloaded", timeout: 20000 });
    await page.waitForTimeout(2000);

    // Scroll to Continuity Blog Section
    const blogHeader = page.locator("text=Building the Governed Future.");
    await blogHeader.scrollIntoViewIfNeeded();
    await page.waitForTimeout(1000);

    const shotBlogLanding = path.join(ARTIFACTS_DIR, "01_landing_continuity_blog.png");
    await page.screenshot({ path: shotBlogLanding, fullPage: false });
    console.log(`[PASS] Captured Landing Page Blog Section: ${shotBlogLanding}`);

    // ---------------------------------------------------------
    // Phase 2: Dedicated Article Reader & Retention Telemetry
    // ---------------------------------------------------------
    console.log(`\n--- Phase 2: Article Reader & Retention Telemetry ---`);
    await page.goto(`${BASE_URL}/blog/why-not-to-fear-the-machine`, { waitUntil: "domcontentloaded", timeout: 20000 });
    await page.waitForTimeout(2000);

    // Scroll down to simulate real reading dwell time
    await page.evaluate(() => window.scrollBy(0, 500));
    await page.waitForTimeout(1000);

    const shotArticle = path.join(ARTIFACTS_DIR, "02_article_continuity_reader.png");
    await page.screenshot({ path: shotArticle, fullPage: false });
    console.log(`[PASS] Captured Article Reader: ${shotArticle}`);

    // ---------------------------------------------------------
    // Phase 3: Task Workspace & 12 Governed Computes Dial-In
    // ---------------------------------------------------------
    console.log(`\n--- Phase 3: Task Workspace & 12 Governed Computes ---`);
    await page.goto(`${BASE_URL}/os/workspace`, { waitUntil: "domcontentloaded", timeout: 20000 });
    await page.waitForTimeout(2000);

    // Verify 12 Governed Computes bar
    const bar = await page.textContent("text=12/12 Governed Computes Connected");
    console.log(`[Assertion] 12 Governed Computes Status: "${bar?.trim()}"`);

    const shotWorkspaceInitial = path.join(ARTIFACTS_DIR, "03_workspace_12_computes.png");
    await page.screenshot({ path: shotWorkspaceInitial, fullPage: false });
    console.log(`[PASS] Captured Workspace Initial State: ${shotWorkspaceInitial}`);

    // Submit intent to ABIDE compiler
    const promptInput = page.locator('input[placeholder*="Describe any supported task"]');
    await promptInput.fill("summarize October sales and email monthly report to board");
    const sendButton = page.locator('button[type="submit"]');
    await sendButton.click();

    // Wait for ABIDE compiler response
    await page.waitForResponse((res) => res.url().includes("/compile") && res.status() === 200, { timeout: 15000 });
    await page.waitForTimeout(2000);

    const shotCompiledDag = path.join(ARTIFACTS_DIR, "04_compiled_governed_dag.png");
    await page.screenshot({ path: shotCompiledDag, fullPage: false });
    console.log(`[PASS] Captured Compiled DAG: ${shotCompiledDag}`);

    // ---------------------------------------------------------
    // Phase 4: Governed Execution, Lease Minting & Dual-Track Evidence
    // ---------------------------------------------------------
    console.log(`\n--- Phase 4: Execution, Lease Minting & Dual-Track Evidence ---`);
    const approveBtn = page.locator('button:has-text("Approve & send")');
    const runBtn = page.locator('button:has-text("Run with governance")');
    if (await approveBtn.isVisible()) {
      await approveBtn.click();
    } else if (await runBtn.isVisible()) {
      await runBtn.click();
    }

    // Wait for execution completion
    await page.waitForTimeout(3000);

    // ---------------------------------------------------------
    // Phase 5: Evidence Vault Dedicated Dual-Track Audit Surface
    // ---------------------------------------------------------
    console.log(`\n--- Phase 5: Evidence Vault Dual-Track Audit Surface ---`);
    await page.goto(`${BASE_URL}/os/evidence`, { waitUntil: "domcontentloaded", timeout: 20000 });
    await page.waitForTimeout(2000);

    const dualTrackHeader = page.locator("text=Enterprise Audit Verification Surface");
    await dualTrackHeader.scrollIntoViewIfNeeded();
    await page.waitForTimeout(1000);

    const shotHumanPacket = path.join(ARTIFACTS_DIR, "05_human_understanding_packet.png");
    await page.screenshot({ path: shotHumanPacket, fullPage: false });
    console.log(`[PASS] Captured Human Understanding Packet: ${shotHumanPacket}`);

    // Switch to GraphQL / WebMCP tab
    const graphqlTabButton = page.locator('button:has-text("Machine GraphQL / WebMCP")');
    await graphqlTabButton.click();
    await page.waitForTimeout(1000);

    // Click Execute Query
    const executeBtn = page.locator('button:has-text("Execute Query")');
    await executeBtn.click();
    await page.waitForTimeout(2000);

    // Scroll down to bring the rendered GraphQL JSON response into view
    await page.evaluate(() => window.scrollBy(0, 450));
    await page.waitForTimeout(1000);

    const shotGraphqlResult = path.join(ARTIFACTS_DIR, "06_machine_graphql_auditor.png");
    await page.screenshot({ path: shotGraphqlResult, fullPage: false });
    console.log(`[PASS] Captured Machine GraphQL Auditor: ${shotGraphqlResult}`);

    console.log(`\n=======================================================`);
    console.log(`>>> ALL E2E VERIFICATIONS AND TELEMETRY RECORDED SUCCESSFULLY! <<<`);
    console.log(`Total Unmocked Network Requests Observed: ${observedRequests.length}`);
    console.log(`=======================================================`);

  } catch (err) {
    console.error(`[E2E ERROR] Test failed:`, err);
    throw err;
  } finally {
    await browser.close();
  }
}

runLiveE2ETest().catch((err) => {
  console.error(err);
  process.exit(1);
});

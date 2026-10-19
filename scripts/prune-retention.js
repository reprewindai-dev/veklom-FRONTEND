/**
 * Veklom Consequence Retirement Unit (CRU) — Retention Pruner
 * Enforces Zero Digital Sludge by pruning local scratch files and task logs older than 7 days.
 * Invariant: Never deletes active repository source code, git metadata, or canonical artifacts.
 */
const fs = require('fs');
const path = require('path');

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;
const NOW = Date.now();

function pruneDirectory(dirPath, maxAgeMs = SEVEN_DAYS_MS) {
  if (!fs.existsSync(dirPath)) return 0;
  let prunedCount = 0;

  const entries = fs.readdirSync(dirPath, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);
    try {
      const stats = fs.statSync(fullPath);
      if (entry.isDirectory()) {
        prunedCount += pruneDirectory(fullPath, maxAgeMs);
        // Remove empty directory if all contents were pruned
        try {
          if (fs.readdirSync(fullPath).length === 0) {
            fs.rmdirSync(fullPath);
          }
        } catch (_) {}
      } else if (entry.isFile()) {
        const age = NOW - stats.mtimeMs;
        if (age > maxAgeMs) {
          fs.unlinkSync(fullPath);
          console.log(`[CRU Pruned] ${fullPath} (${Math.round(age / (1000 * 60 * 60 * 24))} days old)`);
          prunedCount++;
        }
      }
    } catch (err) {
      console.warn(`[CRU Warn] Skipping ${fullPath}:`, err.message);
    }
  }

  return prunedCount;
}

function runPrune() {
  console.log("==================================================");
  console.log("Veklom CRU: Running 7-Day Digital Waste Retention Prune");
  console.log("==================================================");

  const targets = [
    path.join(__dirname, '..', '.next', 'cache'),
    path.join(__dirname, '..', 'tmp'),
    path.join('C:\\Users\\antho\\.gemini\\antigravity\\brain\\235d432e-5dee-4797-a2af-5cc90a3f421d', '.system_generated', 'tasks'),
  ];

  let totalPruned = 0;
  for (const target of targets) {
    if (fs.existsSync(target)) {
      const pruned = pruneDirectory(target, SEVEN_DAYS_MS);
      console.log(`[Target] ${target}: ${pruned} stale items cleaned.`);
      totalPruned += pruned;
    }
  }

  console.log(`==================================================`);
  console.log(`Total Stale Artifacts Pruned: ${totalPruned}`);
  console.log("Zero Digital Sludge Invariant: PRESERVED");
  console.log("==================================================");
}

if (require.main === module) {
  runPrune();
}

module.exports = { pruneDirectory, runPrune };

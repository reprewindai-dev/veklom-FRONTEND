import { readFileSync, statSync, readdirSync } from "node:fs";
import { join } from "node:path";

const roots = [
  "app/vnp",
  "app/workspace/vnp",
  "app/api/vnp",
  "app/api/vnp.json",
  "app/v1/exec",
  "components/vnp",
  "components/terminal/components/ApiDnaVisualizer.tsx",
  "components/terminal/components/NexusProtocol.tsx",
  "content/blog",
  "lib/vnp/methodology.ts",
  "README.md",
];

const forbidden = [
  "10" + "D",
  "10" + "-D",
  "10" + "-dimensional",
  "10" + "-Dimensional Scoring Model",
  "10 immutable vectors",
  "Unbiased " + "10" + "-D Composite Scores",
  "LOCKED SPECIFICATION " + "v0.1.5",
  "v0.1.5",
  "cAPI backend",
  "VERIFIED (x402 Circuit)",
  "RPN Active",
  "autonomously slashed",
  "x402 USDC ROUTE PAYMENTS (REAL)",
  "Signed telemetry', weight: 'Partial'",
  "Signed telemetry\", weight: \"Partial\"",
  "Robust scoring', weight: 'Partial'",
  "Robust scoring\", weight: \"Partial\"",
  "DEMO MODE: VNP_TOPOLOGY_MESH",
];

function files(root) {
  try {
    const stat = statSync(root);
    if (stat.isFile()) return [root];
    return readdirSync(root, { withFileTypes: true }).flatMap((entry) => {
      const path = join(root, entry.name);
      if (entry.isDirectory()) return files(path);
      return /\.(ts|tsx|md|json)$/.test(path) ? [path] : [];
    });
  } catch {
    return [];
  }
}

const failures = [];
for (const file of roots.flatMap(files)) {
  const text = readFileSync(file, "utf8");
  for (const term of forbidden) {
    if (file === "README.md" && term === "capi.veklom") continue;
    if (text.includes(term)) {
      failures.push(`${file}: ${term}`);
    }
  }
}

if (failures.length) {
  console.error("Forbidden VNP public copy found:\n" + failures.join("\n"));
  process.exit(1);
}

console.log("VNP public copy check passed.");

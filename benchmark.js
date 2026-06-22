const { performance } = require('perf_hooks');

const payload = `id: 1\nevent: message\ndata: {"type": "run.completed", "stage": "compile", "evidence_id": "123", "proof_hash": "abc"}\n\n`;
const parts = Array(1000).fill(payload.trim());

function original() {
  let count = 0;
  for (const part of parts) {
    const line = part.split("\n").find((l) => l.startsWith("data:"));
    if (!line) continue;
    let ev;
    try { ev = JSON.parse(line.slice(5).trim()); } catch { continue; }
    if (ev) count++;
  }
  return count;
}

function optimized() {
  let count = 0;
  for (const part of parts) {
    let dataIdx = part.startsWith("data:") ? 0 : part.indexOf("\ndata:");
    if (dataIdx !== 0 && dataIdx !== -1) {
      dataIdx += 1;
    }
    if (dataIdx === -1) continue;

    let nlIdx = part.indexOf("\n", dataIdx);
    if (nlIdx === -1) nlIdx = part.length;

    let ev;
    try { ev = JSON.parse(part.substring(dataIdx + 5, nlIdx).trim()); } catch { continue; }
    if (ev) count++;
  }
  return count;
}

function runBenchmark(name, fn) {
  const start = performance.now();
  const ITERATIONS = 1000;
  for (let i = 0; i < ITERATIONS; i++) {
    fn();
  }
  const end = performance.now();
  console.log(`${name}: ${(end - start).toFixed(2)} ms`);
}

console.log("Warming up...");
original();
optimized();

console.log("Running benchmark...");
runBenchmark("Original", original);
runBenchmark("Optimized", optimized);

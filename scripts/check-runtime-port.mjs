import fs from 'node:fs';

const packageJson = JSON.parse(fs.readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
const start = packageJson?.scripts?.start;

if (typeof start !== 'string') {
  throw new Error('package.json scripts.start is required');
}

if (!start.includes('-H 0.0.0.0')) {
  throw new Error('production start must bind Next.js on 0.0.0.0 for container ingress');
}

if (!start.includes('${PORT:-3002}')) {
  throw new Error('production start must respect PORT with reported Control Plane fallback 3002');
}

for (const forbidden of ['${PORT:-3000}', '${PORT:-8000}']) {
  if (start.includes(forbidden)) {
    throw new Error(`forbidden canonical production port fallback detected: ${forbidden}`);
  }
}

console.log('runtime port contract OK: deployment PORT with reported fallback 3002; 3000/8000 forbidden');

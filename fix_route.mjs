import fs from 'fs';
const path = 'app/api/[...proxy]/route.ts';
let c = fs.readFileSync(path, 'utf8');

c = c.replace(
  'path.startsWith("/api/v1/")',
  'path.startsWith("/api/v1/platform")'
);

c = c.replace(
  'path.startsWith("/api/v1/locker") ||',
  'path.startsWith("/api/v1/locker") ||\n      path.startsWith("/api/v1/identity") ||\n      path.startsWith("/api/v1/workspace") ||'
);

fs.writeFileSync(path, c);
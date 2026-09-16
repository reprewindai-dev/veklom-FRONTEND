import fs from 'fs';
const path = 'app/os/onboarding/page.tsx';
let c = fs.readFileSync(path, 'utf8');

c = c.replace('"/api/v1/workspace",', '"/api/v1/workspace/",');

fs.writeFileSync(path, c);
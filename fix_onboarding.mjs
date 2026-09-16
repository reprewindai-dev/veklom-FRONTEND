import fs from 'fs';
const path = 'app/os/onboarding/page.tsx';
let c = fs.readFileSync(path, 'utf8');

c = c.replace('"/api/v1/pgl/status"', '"/api/v1/ledger/status"');
c = c.replace('"/v1/capability/mounts"', '"/api/cappo/v1/capability/mounts"');

fs.writeFileSync(path, c);
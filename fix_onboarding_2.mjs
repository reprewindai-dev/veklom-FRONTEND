import fs from 'fs';
const path = 'app/os/onboarding/page.tsx';
let c = fs.readFileSync(path, 'utf8');

c = c.replace('"/api/v1/identity/me"', '"/api/v1/auth/me"');
c = c.replace('"/api/v1/identity/link-wallet"', '"/api/v1/billing/wallet/default"');

fs.writeFileSync(path, c);
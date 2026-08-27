import fs from 'fs';
import crypto from 'crypto';

// This is a stub for the Cloudflare config attestation script.
// In a real environment, it would use the Cloudflare API to fetch tunnel configs,
// DNS records, and routes, then hash them and write to public/cloudflare-attestation.json.

const config = {
  timestamp: new Date().toISOString(),
  tunnel: {
    id: '0061f2f2-3eaf-4fb6-add3-5916f8cc651c',
    name: 'veklom-local-edge',
    status: 'active'
  },
  routes: [
    { hostname: 'api.veklom.com', service: 'http://localhost:8088' },
    { hostname: 'cappo.veklom.com', service: 'http://localhost:8002' },
    { hostname: 'pgl.veklom.com', service: 'http://localhost:8001' },
    { hostname: 'capi.veklom.com', service: 'http://localhost:3003' },
    { hostname: 'veklom.com', service: 'http://localhost:3002' }
  ],
  networkLeaseWorker: {
    deployed: false,
    status: 'stubbed'
  }
};

const hash = crypto.createHash('sha256').update(JSON.stringify(config)).digest('hex');

const attestation = {
  ...config,
  sha256: hash
};

fs.mkdirSync('public', { recursive: true });
fs.writeFileSync('public/cloudflare-attestation.json', JSON.stringify(attestation, null, 2));

console.log('Generated public/cloudflare-attestation.json with SHA256:', hash);

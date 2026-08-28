const fs = require('fs');
let file = fs.readFileSync('app/api/auth/login/route.ts', 'utf8');

const regex = /const byosApiUrl = process\.env\.NEXT_PUBLIC_API_URL \|\| "https:\/\/api\.veklom\.com";/;
const replacement = `const byosApiUrl = process.env.NEXT_PUBLIC_API_BASE_URL || process.env.NEXT_PUBLIC_API_URL || "https://api.veklom.com";`;

file = file.replace(regex, replacement);
fs.writeFileSync('app/api/auth/login/route.ts', file);
console.log('Fixed API URL fallback');

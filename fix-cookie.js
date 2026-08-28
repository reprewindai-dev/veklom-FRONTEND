const fs = require('fs');
let file = fs.readFileSync('app/api/auth/github/callback/route.ts', 'utf8');

const regex = /const sessionCookieName = process\.env\.VEKLOM_SESSION_COOKIE_NAME \|\| "veklom\.session";/;
const replacement = `const sessionCookieName = process.env.VEKLOM_SESSION_COOKIE_NAME || "veklom_session";`;

file = file.replace(regex, replacement);
fs.writeFileSync('app/api/auth/github/callback/route.ts', file);
console.log('Fixed cookie name in callback');

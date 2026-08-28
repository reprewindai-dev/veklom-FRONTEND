const fs = require('fs');
let file = fs.readFileSync('app/api/auth/login/route.ts', 'utf8');

const regex = /name: process\.env\.VEKLOM_SESSION_COOKIE_NAME \|\| "veklom_session",/;
const replacement = `name: process.env.VEKLOM_SESSION_COOKIE_NAME || "veklom_session",`;

// Make sure to also check if it previously used veklom.session instead
const regex2 = /name: "veklom\.session",/;
file = file.replace(regex2, replacement);
fs.writeFileSync('app/api/auth/login/route.ts', file);
console.log('Fixed cookie name in login');

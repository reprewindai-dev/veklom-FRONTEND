const fs = require('fs');
let file = fs.readFileSync('components/ui/SharedUI.tsx', 'utf8');

// Fix StatusType to include string union
const regex = /type StatusType = 'verified' \| 'warn' \| 'danger' \| 'info' \| 'unknown';/;
const replacement = `type StatusType = 'verified' | 'warn' | 'danger' | 'info' | 'unknown' | string;`;

file = file.replace(regex, replacement);
fs.writeFileSync('components/ui/SharedUI.tsx', file);
console.log('Fixed type issue');

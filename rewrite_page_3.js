const fs = require('fs');
let content = fs.readFileSync('app/page.tsx', 'utf8');

// Remove grayscale
content = content.replace(/data-\[machine=true\]:grayscale/g, '');

fs.writeFileSync('app/page.tsx', content, 'utf8');

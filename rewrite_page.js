const fs = require('fs');
let content = fs.readFileSync('app/page.tsx', 'utf8');

// Remove Terminal Link
content = content.replace(/<Link href="https:\/\/terminal\.veklom\.com"[^>]*>Terminal<\/Link>\s*/, '');

// Change title
content = content.replace(/The era of[\s\S]*?already over\./m, 'VIO Intent Infrastructure');

// Change image
content = content.replace(/\/images\/veklom-visor-concept\.jpg/g, '/images/veklom-logo-m2m.jpg');

// Change isMachine to true
content = content.replace('const [isMachine, setIsMachine] = useState(false);', 'const isMachine = true;');
content = content.replace(/const crossThreshold = \(\) => {[\s\S]*?};\s*/, '');

// Remove the toggle buttons
content = content.replace(/<button onClick=\{crossThreshold\}[\s\S]*?<\/button>/g, '');

fs.writeFileSync('app/page.tsx', content, 'utf8');

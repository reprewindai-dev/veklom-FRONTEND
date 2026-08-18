const fs = require('fs');
let content = fs.readFileSync('app/page.tsx', 'utf8');

// 1. Change title
content = content.replace(/<h1 className="text-5xl md:text-7xl font-serif font-medium tracking-tight mb-8 leading-\[1\.1\] transition-colors duration-500 text-ink data-\[machine=true\]:text-machine-ink" data-machine=\{isMachine\}>[\s\S]*?<\/h1>/,
`<h1 className="text-5xl md:text-7xl font-sans font-medium tracking-tight mb-8 leading-[1.1] text-cos-text">
  VIO Intent Infrastructure
</h1>`);

// 2. Remove Terminal link
content = content.replace(/<Link href="https:\/\/terminal\.veklom\.com"[^>]*>Terminal<\/Link>\s*/, '');

// 3. Set isMachine = true, remove toggle buttons
content = content.replace('const [isMachine, setIsMachine] = useState(false);', 'const isMachine = true;');
content = content.replace(/const crossThreshold = \(\) => {[\s\S]*?};\s*/, '');
content = content.replace(/<button onClick=\{crossThreshold\}[\s\S]*?<\/button>/g, '');

// 4. Change top-left logo
content = content.replace(/<img src="\/veklom-wordmark\.svg" alt="Veklom Logo" className="h-6 w-auto data-\[machine=true\]:brightness-200" data-machine=\{isMachine\} \/>/,
`<img src="/images/veklom-logo-m2m.jpg" alt="Veklom Logo" className="h-10 w-auto rounded-md shadow-cos-glow border border-cos-border" />`);

// 5. Colors!
// The user says "The color is wrong. Look at the capability OS or look at the blueprints of the plans and they tell you the colors."
// The background of the page currently:
// `<main className="min-h-screen bg-paper data-[machine=true]:bg-void-deep text-ink data-[machine=true]:text-machine-ink transition-colors duration-1000 relative overflow-hidden font-serif data-[machine=true]:font-mono" data-machine={isMachine}>`
// Let's replace the whole main tag class to match the OS:
content = content.replace(/<main className="min-h-screen bg-paper data-\[machine=true\]:bg-void-deep text-ink data-\[machine=true\]:text-machine-ink transition-colors duration-1000 relative overflow-hidden font-serif data-\[machine=true\]:font-mono" data-machine=\{isMachine\}>/,
`<main className="min-h-screen bg-cos-bg text-cos-text relative overflow-hidden font-mono">`);

// Replace data-[machine=true]:text-cyan with text-cos-accent or text-cos-info
content = content.replace(/data-\[machine=true\]:text-cyan/g, 'text-cos-accent');
content = content.replace(/text-cyan/g, 'text-cos-accent');
content = content.replace(/data-\[machine=true\]:text-machine-ink\/80/g, 'text-cos-text/80');
content = content.replace(/data-\[machine=true\]:text-machine-ink/g, 'text-cos-text');
content = content.replace(/data-\[machine=true\]:bg-cyan/g, 'bg-cos-accent');

// Remove data-machine attributes and data-[machine=true]: rules that are no longer needed
// Actually, it's easier to just remove data-machine={isMachine} globally since isMachine is always true and we want the OS look.
// But we can leave them if they don't hurt, since isMachine is true.
// Let's just do a big replace for `bg-paper data-[machine=true]:bg-void-deep` etc.
content = content.replace(/bg-paper data-\[machine=true\]:bg-void-deep/g, 'bg-cos-bg');
content = content.replace(/text-ink data-\[machine=true\]:text-machine-ink/g, 'text-cos-text');

fs.writeFileSync('app/page.tsx', content, 'utf8');

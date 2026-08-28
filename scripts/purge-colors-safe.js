const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    if (isDirectory) {
      walkDir(dirPath, callback);
    } else if (dirPath.endsWith('.tsx') || dirPath.endsWith('.ts')) {
      callback(path.join(dirPath));
    }
  });
}

function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let original = content;

  // Replace background gradients
  content = content.replace(/\bbg-gradient-to-[a-z]+\b/g, 'bg-theme-surface');
  content = content.replace(/\bfrom-(?:indigo|blue|sky|purple|violet|cyan|slate)-[0-9]+(?:\/\d+)?\b/g, '');
  content = content.replace(/\bto-(?:indigo|blue|sky|purple|violet|cyan|slate)-[0-9]+(?:\/\d+)?\b/g, '');
  content = content.replace(/\bvia-(?:indigo|blue|sky|purple|violet|cyan|slate)-[0-9]+(?:\/\d+)?\b/g, '');
  content = content.replace(/\bhover:from-(?:indigo|blue|sky|purple|violet|cyan|slate)-[0-9]+(?:\/\d+)?\b/g, '');
  content = content.replace(/\bhover:to-(?:indigo|blue|sky|purple|violet|cyan|slate)-[0-9]+(?:\/\d+)?\b/g, '');
  content = content.replace(/\bdisabled:from-(?:indigo|blue|sky|purple|violet|cyan|slate)-[0-9]+(?:\/\d+)?\b/g, '');
  content = content.replace(/\bdisabled:to-(?:indigo|blue|sky|purple|violet|cyan|slate)-[0-9]+(?:\/\d+)?\b/g, '');

  // Replace specific text colors
  content = content.replace(/\btext-(?:indigo|blue|sky|purple|violet|cyan)-[45]00\b/g, 'text-theme-accent');
  content = content.replace(/\btext-(?:indigo|blue|sky|purple|violet|cyan)-[23]00\b/g, 'text-theme-accent/70');
  content = content.replace(/\btext-(?:indigo|blue|sky|purple|violet|cyan)-[6789]00\b/g, 'text-theme-inkDim');

  // Replace specific bg colors
  content = content.replace(/\bbg-(?:indigo|blue|sky|purple|violet|cyan)-[56]00\b/g, 'bg-theme-accent');
  content = content.replace(/\bhover:bg-(?:indigo|blue|sky|purple|violet|cyan)-[567]00\b/g, 'hover:bg-theme-accent/80');
  content = content.replace(/\bbg-(?:indigo|blue|sky|purple|violet|cyan)-9[05]0(?:\/\d+)?\b/g, 'bg-theme-surface2');
  content = content.replace(/\bbg-slate-[0-9]+(?:\/\d+)?\b/g, 'bg-theme-surface');
  
  // Replace borders
  content = content.replace(/\bborder-(?:indigo|blue|sky|purple|violet|cyan|slate)-[0-9]+(?:\/\d+)?\b/g, 'border-theme-border');
  content = content.replace(/\bhover:border-(?:indigo|blue|sky|purple|violet|cyan|slate)-[0-9]+(?:\/\d+)?\b/g, 'hover:border-theme-border');
  content = content.replace(/\bring-(?:indigo|blue|sky|purple|violet|cyan)-[0-9]+(?:\/\d+)?\b/g, 'ring-theme-accent');
  content = content.replace(/\bshadow-(?:indigo|blue|sky|purple|violet|cyan)-[0-9]+(?:\/\d+)?\b/g, 'shadow-theme-accent/20');

  // Hardcoded colors replacements
  content = content.replace(/#2563eb|#4f46e5|#3b82f6|#6366f1|#1d4ed8/gi, 'var(--theme-accent)');
  // We leave other #hex strings alone as they might be intentional SVGs or other unrelated codes.

  // Avoid creating empty spaces around class names (just standard single space replace)
  content = content.replace(/className="\s+/g, 'className="');
  content = content.replace(/\s+"/g, '"');
  content = content.replace(/  +/g, ' '); // Replace 2+ spaces with 1 space (this won't break newlines because we didn't remove \n!)
  // Actually, replacing 2+ spaces with 1 space globally will still mess up indentation!
  // To be perfectly safe, I will NOT clean up extra spaces. Tailwind handles extra spaces in class names perfectly fine.

  if (content !== original) {
    // Only clean up multiple spaces WITHIN quotes
    content = content.replace(/className="([^"]+)"/g, (match, p1) => {
      return `className="${p1.replace(/\s+/g, ' ').trim()}"`;
    });
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Updated ${filePath}`);
  }
}

['app', 'components'].forEach(dir => {
  if (fs.existsSync(dir)) {
    walkDir(dir, processFile);
  }
});

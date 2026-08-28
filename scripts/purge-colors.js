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
  content = content.replace(/bg-gradient-to-[a-z]+\s+/g, 'bg-theme-surface ');
  content = content.replace(/from-(?:indigo|blue|sky|purple|violet|cyan|slate)-[0-9]+(?:\/\d+)?/g, '');
  content = content.replace(/to-(?:indigo|blue|sky|purple|violet|cyan|slate)-[0-9]+(?:\/\d+)?/g, '');
  content = content.replace(/via-(?:indigo|blue|sky|purple|violet|cyan|slate)-[0-9]+(?:\/\d+)?/g, '');
  content = content.replace(/hover:from-(?:indigo|blue|sky|purple|violet|cyan|slate)-[0-9]+(?:\/\d+)?/g, '');
  content = content.replace(/hover:to-(?:indigo|blue|sky|purple|violet|cyan|slate)-[0-9]+(?:\/\d+)?/g, '');
  content = content.replace(/disabled:from-(?:indigo|blue|sky|purple|violet|cyan|slate)-[0-9]+(?:\/\d+)?/g, '');
  content = content.replace(/disabled:to-(?:indigo|blue|sky|purple|violet|cyan|slate)-[0-9]+(?:\/\d+)?/g, '');

  // Replace specific text colors
  content = content.replace(/text-(?:indigo|blue|sky|purple|violet|cyan)-[45]00/g, 'text-theme-accent');
  content = content.replace(/text-(?:indigo|blue|sky|purple|violet|cyan)-[23]00/g, 'text-theme-accent/70');
  content = content.replace(/text-(?:indigo|blue|sky|purple|violet|cyan)-[6789]00/g, 'text-theme-inkDim');

  // Replace specific bg colors
  content = content.replace(/bg-(?:indigo|blue|sky|purple|violet|cyan)-[56]00/g, 'bg-theme-accent');
  content = content.replace(/hover:bg-(?:indigo|blue|sky|purple|violet|cyan)-[567]00/g, 'hover:bg-theme-accent/80');
  content = content.replace(/bg-(?:indigo|blue|sky|purple|violet|cyan)-9[05]0(?:\/\d+)?/g, 'bg-theme-surface2');
  content = content.replace(/bg-slate-[0-9]+(?:\/\d+)?/g, 'bg-theme-surface');
  
  // Replace borders
  content = content.replace(/border-(?:indigo|blue|sky|purple|violet|cyan|slate)-[0-9]+(?:\/\d+)?/g, 'border-theme-border');
  content = content.replace(/hover:border-(?:indigo|blue|sky|purple|violet|cyan|slate)-[0-9]+(?:\/\d+)?/g, 'hover:border-theme-border');
  content = content.replace(/ring-(?:indigo|blue|sky|purple|violet|cyan)-[0-9]+(?:\/\d+)?/g, 'ring-theme-accent');
  content = content.replace(/shadow-(?:indigo|blue|sky|purple|violet|cyan)-[0-9]+(?:\/\d+)?/g, 'shadow-theme-accent/20');
  content = content.replace(/shadow-(?:indigo|blue|sky|purple|violet)-[0-9]+(?:\/\d+)?/g, 'shadow-theme-accent/20');

  // Avoid accidentally replacing valid theme bg classes with random ones
  // Actually, I'll avoid regexing ALL bg-[#] unless it's explicitly the blue/indigo shades, but the user said "Search and remove all active human UI usages of: ... #2563eb #4f46e5 #3b82f6 #6366f1 #1d4ed8"
  content = content.replace(/#2563eb|#4f46e5|#3b82f6|#6366f1|#1d4ed8/gi, 'var(--theme-accent)');

  // Clean up double spaces created by empty replacements
  content = content.replace(/\s{2,}/g, ' ');
  content = content.replace(/className="\s+/g, 'className="');
  content = content.replace(/\s+"/g, '"');

  if (content !== original) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Updated ${filePath}`);
  }
}

['app', 'components'].forEach(dir => {
  if (fs.existsSync(dir)) {
    walkDir(dir, processFile);
  }
});

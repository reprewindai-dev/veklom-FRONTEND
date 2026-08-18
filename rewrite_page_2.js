const fs = require('fs');
let content = fs.readFileSync('app/page.tsx', 'utf8');

// Change title
content = content.replace(/The era of[\s\S]*?is already over\./, 'VIO Intent Infrastructure');

// Actually wait, let's look at what the original was.
// <h1 className="text-5xl md:text-7xl font-serif font-medium tracking-tight mb-8 leading-[1.1] transition-colors duration-500 text-ink data-[machine=true]:text-machine-ink" data-machine={isMachine}>
//   {isMachine ? (
//     <>identity &rarr; authority &rarr; policy &rarr; execution &rarr; <em className="text-cyan font-normal not-italic">proof</em></>
//   ) : (
//     <>Two machines just agreed to <em className="text-brass italic font-normal">trust</em> each other. No one was watching.</>
//   )}
// </h1>

// Ah! I misunderstood the previous edit! I had already changed it in the previous turn? No! The original header was NOT "The era of...".
// It is `{isMachine ? ( <>identity &rarr; authority &rarr; policy &rarr; execution &rarr; <em className="text-cyan font-normal not-italic">proof</em></> ) : ...}`
// Let's replace the whole h1 block!

content = content.replace(/<h1[^>]*>[\s\S]*?<\/h1>/, `<h1 className="text-5xl md:text-7xl font-serif font-medium tracking-tight mb-8 leading-[1.1] transition-colors duration-500 text-ink data-[machine=true]:text-machine-ink" data-machine={isMachine}>
  VIO Intent Infrastructure
</h1>`);

fs.writeFileSync('app/page.tsx', content, 'utf8');

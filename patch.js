const fs = require('fs');

let content = fs.readFileSync('app/page.tsx', 'utf-8');

const logoOrig = <div className="font-serif font-black text-2xl tracking-tighter">\r\n            VEKLOM<span className="text-brass data-[machine=true]:text-cyan" data-machine={isMachine}>.</span>\r\n          </div>;
const logoOrig2 = <div className="font-serif font-black text-2xl tracking-tighter">\n            VEKLOM<span className="text-brass data-[machine=true]:text-cyan" data-machine={isMachine}>.</span>\n          </div>;
          
const logoNew = <div className="flex items-center gap-6">\n            <img src="/veklom-wordmark.svg" alt="Veklom Logo" className="h-6 w-auto data-[machine=true]:brightness-200" data-machine={isMachine} />\n            <div className="hidden md:flex gap-6 text-sm font-medium text-ink/80 data-[machine=true]:text-machine-ink/80 transition-colors" data-machine={isMachine}>\n              <Link href="https://terminal.veklom.com" className="hover:text-ink data-[machine=true]:hover:text-cyan transition-colors" data-machine={isMachine}>VNP</Link>\n              <Link href="#" className="hover:text-ink data-[machine=true]:hover:text-cyan transition-colors" data-machine={isMachine}>EEE</Link>\n              <Link href="#" className="hover:text-ink data-[machine=true]:hover:text-cyan transition-colors" data-machine={isMachine}>VCGB</Link>\n            </div>\n          </div>;

content = content.replace(logoOrig, logoNew).replace(logoOrig2, logoNew);

const footerCode = 
        <footer className="mt-32 border-t border-rule data-[machine=true]:border-wire p-6 lg:px-12 text-sm flex flex-col md:flex-row justify-between items-center transition-colors duration-500 text-ink/60 data-[machine=true]:text-machine-ink/60 gap-4" data-machine={isMachine}>
          <div><div className="font-mono text-xs mb-1">"Anything is possible, if you're willing to build the wire first."</div></div>
          <div>&copy; VEKLOM — the era is early.</div>
        </footer>
      {isRawOpen && (

content = content.replace('{isRawOpen && (', footerCode);

fs.writeFileSync('app/page.tsx', content, 'utf-8');
console.log("Patched app/page.tsx");

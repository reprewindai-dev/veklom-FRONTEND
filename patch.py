import sys

with open('app/page.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Replace logo text with image
logo_orig = '''<div className="font-serif font-black text-2xl tracking-tighter">
            VEKLOM<span className="text-brass data-[machine=true]:text-cyan" data-machine={isMachine}>.</span>
          </div>'''
          
logo_new = '''<div className="flex items-center gap-6">
            <img src="/veklom-wordmark.svg" alt="Veklom Logo" className="h-6 w-auto dark:invert" />
            <div className="hidden md:flex gap-6 text-sm font-medium text-ink/80 data-[machine=true]:text-machine-ink/80 transition-colors" data-machine={isMachine}>
              <Link href="https://terminal.veklom.com" className="hover:text-ink data-[machine=true]:hover:text-cyan transition-colors" data-machine={isMachine}>VNP</Link>
              <Link href="#" className="hover:text-ink data-[machine=true]:hover:text-cyan transition-colors" data-machine={isMachine}>EEE</Link>
              <Link href="#" className="hover:text-ink data-[machine=true]:hover:text-cyan transition-colors" data-machine={isMachine}>VCGB</Link>
            </div>
          </div>'''

content = content.replace(logo_orig, logo_new)

# 2. Add footer at the very end of the page, inside the last container but before the raw-overlay
footer_code = '''
        <footer className="mt-32 border-t border-rule data-[machine=true]:border-wire p-6 lg:px-12 text-sm flex flex-col md:flex-row justify-between items-center transition-colors duration-500 text-ink/60 data-[machine=true]:text-machine-ink/60 gap-4" data-machine={isMachine}>
          <div><div className="font-mono text-xs mb-1">"Anything is possible, if you're willing to build the wire first."</div></div>
          <div>&copy; VEKLOM — the era is early.</div>
        </footer>
      {isRawOpen && (
'''

content = content.replace('{isRawOpen && (', footer_code)

with open('app/page.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("Patched app/page.tsx")

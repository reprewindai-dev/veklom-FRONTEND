import re

with open('app/page.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

vlink_block = '''          {/* VLink / Mount CTA */}
          <section className="relative mx-auto w-full max-w-5xl px-6 py-8 z-20">
            <div className="rounded-[32px] border border-rule data-[machine=true]:border-wire bg-paper-dim/50 data-[machine=true]:bg-void-panel/50 p-8 md:p-12 text-center flex flex-col items-center gap-6 shadow-sm backdrop-blur-sm transition-colors" data-machine={isMachine}>
              <h2 className="text-2xl md:text-3xl font-serif text-ink data-[machine=true]:text-machine-ink data-[machine=true]:font-mono">Already have something running?</h2>
              <p className="max-w-2xl text-ink/70 data-[machine=true]:text-machine-ink/70 leading-relaxed data-[machine=true]:font-mono text-[15px]">
                VLink is the low-friction portable connection primitive into Veklom. Pair a workload, receive short-lived scoped access, and leave verifiable activity without rewriting your application.
              </p>
              <div className="mt-2">
                <Link href="/os/mount" className="inline-flex min-h-12 items-center justify-center rounded-full bg-brass data-[machine=true]:bg-cyan px-8 text-sm font-semibold text-paper data-[machine=true]:text-void hover:opacity-90 transition-all data-[machine=true]:font-mono">
                  Link existing capabilities
                </Link>
              </div>
            </div>
          </section>

          {/* Enterprise Block */}'''

content = re.sub(r'\s*\{\/\*\s*Enterprise Block\s*\*\/\}\s*', '\n\n' + vlink_block + '\n', content)

with open('app/page.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

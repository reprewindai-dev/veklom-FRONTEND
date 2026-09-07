
with open("app/page.tsx", "r") as f:
    content = f.read()

vlink_section = """
        <section className="relative mx-auto w-full max-w-[1480px] px-5 py-8 sm:px-8 lg:px-10 z-20">
          <div className="rounded-[32px] border border-theme-border bg-theme-surface/50 p-8 md:p-12 text-center flex flex-col items-center gap-6 shadow-sm backdrop-blur-sm">
            <h2 className="text-2xl md:text-3xl font-serif text-theme-ink">Connect workloads with VLink</h2>
            <p className="max-w-2xl text-theme-ink/70 leading-relaxed">
              The low-friction portable connection primitive into Veklom. Pair a workload, receive short-lived scoped access, and leave verifiable activity without rewriting your application.
            </p>
            <div className="mt-2">
              <Link href="/vlink" className="inline-flex min-h-12 items-center justify-center rounded-full bg-theme-accent px-8 text-sm font-semibold text-[#020817] hover:bg-theme-accent/90 transition-colors">
                Explore VLink Documentation
              </Link>
            </div>
          </div>
        </section>
"""

target = "<StageLabel>A new kind of trust is arriving</StageLabel>"
parts = content.split(target)

if len(parts) == 2:
    # Need to find the exact `<section` before the target to insert our new section right above it
    before_target = parts[0]
    last_section_idx = before_target.rfind("<section")
    
    new_content = before_target[:last_section_idx] + vlink_section + "\n  " + before_target[last_section_idx:] + target + parts[1]
    
    with open("app/page.tsx", "w") as f:
        f.write(new_content)
    print("VLink section injected.")
else:
    print("Could not find the target section.")


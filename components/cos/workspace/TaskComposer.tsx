"use client";

import { useState, type FormEvent } from "react";
import { Send } from "lucide-react";

/**
 * The one input. Free text only ever becomes a proposed contract through ABIDE; nothing typed
 * here runs until the compiled action is approved. The box starts empty: there is no example
 * task pre-filled, because a pre-filled task would look like something Veklom already did.
 */
export function TaskComposer({
  busy,
  onSubmit,
}: {
  busy: boolean;
  onSubmit: (intent: string) => void;
}) {
  const [draft, setDraft] = useState("");

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const intent = draft.trim();
    if (!intent || busy) return;
    onSubmit(intent);
    setDraft("");
  }

  return (
    <div className="space-y-6">
      <div className="space-y-1.5">
        <h1 className="text-3xl font-semibold tracking-tight text-white md:text-4xl">What do you need to do?</h1>
        <p className="text-sm text-slate-400">
          Describe the outcome. Veklom compiles it against the live capability catalog, shows you the one action it would take, and runs it only after you approve.
        </p>
      </div>

      <section className="task-composer-box rounded-2xl border border-slate-800/80 bg-[#091122]/90 p-6 text-slate-100 shadow-xl backdrop-blur-md">
        <form onSubmit={submit} className="space-y-4" aria-label="Describe what you need done">
          <textarea
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                event.currentTarget.form?.requestSubmit();
              }
            }}
            rows={2}
            maxLength={2000}
            disabled={busy}
            placeholder="For example: increment the counter"
            className="w-full resize-none bg-transparent font-sans text-sm leading-relaxed text-slate-100 outline-none placeholder-slate-500 disabled:opacity-60 md:text-base"
          />
          <div className="flex items-center justify-between gap-3 pt-2">
            <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-slate-500">
              Compiling grants nothing · one approval · one run · independent readback
            </p>
            <button
              type="submit"
              disabled={busy || !draft.trim()}
              className="submit-btn flex items-center justify-center rounded-xl bg-cyan-400 p-2.5 font-semibold text-slate-950 shadow-[0_0_16px_rgba(6,182,212,0.4)] transition hover:bg-cyan-300 disabled:opacity-50"
              title="Compile this request"
              aria-label="Compile this request"
            >
              <Send size={16} className="translate-x-[1px]" />
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}

"use client";

import { FormEvent, useState } from "react";
import { Send } from "lucide-react";

const EXAMPLES = [
  "increment the counter",
  "read the counter",
  "order a pizza to 123 Main St",
];

/**
 * The one input of the Workspace. Free text only ever produces a proposed contract through the
 * compiler; nothing typed here is an operation until ABIDE binds it and the user approves it.
 */
export function TaskComposer({ busy, onSubmit }: { busy: boolean; onSubmit: (intent: string) => void }) {
  const [draft, setDraft] = useState("");

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const intent = draft.trim();
    if (!intent || busy) return;
    onSubmit(intent);
    setDraft("");
  }

  return (
    <form onSubmit={submit} className="space-y-3" aria-label="Describe what you need done">
      <label className="block">
        <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-cos-steel">What do you need done?</span>
        <textarea
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.shiftKey) {
              event.preventDefault();
              event.currentTarget.form?.requestSubmit();
            }
          }}
          rows={3}
          maxLength={2000}
          disabled={busy}
          placeholder="e.g. increment the counter"
          className="mt-2 w-full rounded-lg border border-cos-border bg-cos-bg/60 p-3 text-sm text-cos-text outline-none focus:border-cos-accent disabled:opacity-60"
        />
      </label>
      <div className="flex flex-wrap items-center gap-2">
        <button type="submit" disabled={busy || !draft.trim()} className="inline-flex items-center gap-2 rounded-lg bg-cos-accent px-4 py-2 text-sm font-semibold text-cos-bg disabled:opacity-50">
          <Send size={14} /> {busy ? "Working…" : "Ask Veklom"}
        </button>
        {EXAMPLES.map((example) => (
          <button key={example} type="button" disabled={busy} onClick={() => setDraft(example)} className="rounded-full border border-cos-border px-3 py-1 text-xs text-cos-muted hover:text-cos-text disabled:opacity-50">
            {example}
          </button>
        ))}
      </div>
      <p className="text-xs leading-5 text-cos-muted">
        Veklom compiles your words into a bounded contract against the live capability catalog, shows you the one action it would take, and runs it only after you approve. What the catalog cannot cover is refused and says why.
      </p>
    </form>
  );
}

"use client";

import { useState, type FormEvent } from "react";
import { FileText, Paperclip, Send, X } from "lucide-react";

const EXAMPLES = [
  "Prepare the monthly sales summary and email it to the sales team.",
  "increment the counter",
  "read the counter",
  "order a pizza to 123 Main St",
];

export function TaskComposer({
  busy,
  onSubmit,
}: {
  busy: boolean;
  onSubmit: (intent: string) => void;
}) {
  const [draft, setDraft] = useState(
    "Prepare the monthly sales summary and email it to the sales team."
  );
  const [attachments, setAttachments] = useState<string[]>(["sales-october.csv"]);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const intent = draft.trim();
    if (!intent || busy) return;
    onSubmit(intent);
  }

  function removeAttachment(target: string) {
    setAttachments((prev) => prev.filter((item) => item !== target));
  }

  function addAttachment() {
    const filename = prompt("Enter attachment filename to bind to context:", "sales-metrics.csv");
    if (filename && filename.trim() && !attachments.includes(filename.trim())) {
      setAttachments((prev) => [...prev, filename.trim()]);
    }
  }

  return (
    <section className="task-composer-box rounded-2xl border border-slate-800/80 bg-[#091122]/90 backdrop-blur-md p-6 space-y-5 shadow-xl text-slate-100">
      {/* Heading & Subtitle */}
      <div className="space-y-1">
        <h1 className="text-3xl font-semibold tracking-tight text-white">
          What do you need to do?
        </h1>
        <p className="text-sm text-slate-400">
          Describe the outcome. Veklom handles the steps.
        </p>
      </div>

      {/* Main Text Input / Prompt Form */}
      <form onSubmit={submit} className="space-y-4" aria-label="Describe what you need done">
        <div className="relative rounded-xl border border-slate-800 bg-[#0d1627] p-4 focus-within:border-cyan-500/50 transition">
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
            placeholder="What do you need to do? Describe the outcome. Veklom handles the steps."
            className="w-full bg-transparent text-slate-100 placeholder-slate-500 text-sm md:text-base outline-none resize-none disabled:opacity-60"
          />

          {/* Attachments & Action Controls Row */}
          <div className="mt-3 flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-800/60">
            {/* Attachment Pills */}
            <div className="flex flex-wrap items-center gap-2">
              {attachments.map((att) => (
                <div
                  key={att}
                  className="attachment-pill inline-flex items-center gap-2 rounded-md border border-slate-700/70 bg-slate-800/80 px-2.5 py-1 text-xs font-mono text-slate-200"
                >
                  <FileText size={13} className="text-slate-400" />
                  <span>{att}</span>
                  <button
                    type="button"
                    onClick={() => removeAttachment(att)}
                    className="text-slate-400 hover:text-white transition ml-0.5"
                    aria-label={`Remove attachment ${att}`}
                  >
                    <X size={12} />
                  </button>
                </div>
              ))}
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={addAttachment}
                disabled={busy}
                className="attachment-btn rounded-lg border border-slate-700/80 bg-slate-800/60 p-2 text-slate-400 hover:text-slate-200 hover:bg-slate-700/80 transition disabled:opacity-50"
                title="Attach file"
              >
                <Paperclip size={16} />
              </button>
              <button
                type="submit"
                disabled={busy || !draft.trim()}
                className="submit-btn rounded-lg bg-cyan-500 hover:bg-cyan-400 px-3 py-2 text-slate-950 font-semibold flex items-center justify-center gap-1.5 transition shadow-[0_0_12px_rgba(6,182,212,0.3)] disabled:opacity-50 text-xs"
              >
                <Send size={14} />
                <span>{busy ? "Working…" : "Send"}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Quick Example Scenarios */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-mono text-[10px] uppercase tracking-wider text-slate-500 mr-1">
            Try:
          </span>
          {EXAMPLES.map((example) => (
            <button
              key={example}
              type="button"
              disabled={busy}
              onClick={() => setDraft(example)}
              className="rounded-full border border-slate-800 bg-slate-900/60 px-3 py-1 text-xs text-slate-400 hover:text-slate-200 hover:border-slate-700 transition disabled:opacity-50 truncate max-w-xs"
              title={example}
            >
              {example}
            </button>
          ))}
        </div>
      </form>
    </section>
  );
}

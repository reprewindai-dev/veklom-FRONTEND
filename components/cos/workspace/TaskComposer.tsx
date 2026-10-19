"use client";

import { useState, type FormEvent } from "react";
import { FileText, Paperclip, Send, X } from "lucide-react";

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
    <div className="space-y-6">
      {/* Top Heading matching Concept 2 image */}
      <div className="space-y-1.5">
        <h1 className="text-3xl font-semibold tracking-tight text-white md:text-4xl">
          What do you need to do?
        </h1>
        <p className="text-sm text-slate-400">
          Describe the outcome. Veklom handles the steps.
        </p>
      </div>

      {/* Main Prompt Card */}
      <section className="task-composer-box rounded-2xl border border-slate-800/80 bg-[#091122]/90 backdrop-blur-md p-6 shadow-xl text-slate-100">
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
            placeholder="Describe what you need done..."
            className="w-full bg-transparent text-slate-100 placeholder-slate-500 text-sm md:text-base outline-none resize-none disabled:opacity-60 leading-relaxed font-sans"
          />

          {/* Attachments & Action Controls Row */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            {/* Attachment Pills */}
            <div className="flex flex-wrap items-center gap-2">
              {attachments.map((att) => (
                <div
                  key={att}
                  className="attachment-pill inline-flex items-center gap-2 rounded-lg border border-slate-700/80 bg-slate-800/90 px-3 py-1.5 text-xs font-mono text-slate-200"
                >
                  <FileText size={13} className="text-slate-400" />
                  <span>{att}</span>
                  <button
                    type="button"
                    onClick={() => removeAttachment(att)}
                    className="text-slate-400 hover:text-white transition ml-1"
                    aria-label={`Remove attachment ${att}`}
                  >
                    <X size={12} />
                  </button>
                </div>
              ))}
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={addAttachment}
                disabled={busy}
                className="attachment-btn rounded-xl border border-slate-700/80 bg-slate-800/80 p-2.5 text-slate-400 hover:text-slate-200 hover:bg-slate-700/80 transition disabled:opacity-50"
                title="Attach file"
              >
                <Paperclip size={16} />
              </button>
              <button
                type="submit"
                disabled={busy || !draft.trim()}
                className="submit-btn rounded-xl bg-cyan-400 hover:bg-cyan-300 p-2.5 text-slate-950 font-semibold flex items-center justify-center transition shadow-[0_0_16px_rgba(6,182,212,0.4)] disabled:opacity-50"
                title="Send intent"
              >
                <Send size={16} className="translate-x-[1px]" />
              </button>
            </div>
          </div>
        </form>
      </section>
    </div>
  );
}

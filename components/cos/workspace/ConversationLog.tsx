"use client";

import { useEffect, useRef } from "react";
import type { TaskMessage } from "@/lib/cos/tasks/task-types";

const TONE: Record<NonNullable<TaskMessage["tone"]>, string> = {
  plain: "border-cos-border bg-cos-surface2/60 text-cos-text",
  ok: "border-cos-ok/40 bg-cos-ok/5 text-cos-text",
  warn: "border-cos-warn/40 bg-cos-warn/5 text-cos-text",
  danger: "border-cos-danger/40 bg-cos-danger/5 text-cos-text",
};

/** The conversation so far. Every Veklom line is produced by the task reducer from an observed response. */
export function ConversationLog({ messages }: { messages: TaskMessage[] }) {
  const end = useRef<HTMLDivElement>(null);
  useEffect(() => {
    end.current?.scrollIntoView({ block: "nearest" });
  }, [messages.length]);

  if (!messages.length) {
    return <div className="rounded-xl border border-dashed border-cos-border bg-cos-bg/45 p-4 text-xs leading-5 text-cos-muted">Nothing asked yet. Your request and Veklom&rsquo;s answers appear here, in order.</div>;
  }
  return (
    <ol className="max-h-[420px] space-y-2 overflow-y-auto pr-1" aria-live="polite">
      {messages.map((message) => (
        <li key={message.id} className={`flex ${message.role === "you" ? "justify-end" : "justify-start"}`}>
          <div className={`max-w-[85%] rounded-xl border px-3 py-2 text-sm leading-6 ${message.role === "you" ? "border-cos-accent/40 bg-cos-accent/10 text-cos-text" : TONE[message.tone ?? "plain"]}`}>
            <div className="mb-0.5 font-mono text-[9px] uppercase tracking-[0.16em] text-cos-steel">{message.role === "you" ? "You" : "Veklom"}</div>
            <div className="whitespace-pre-wrap break-words">{message.text}</div>
          </div>
        </li>
      ))}
      <div ref={end} />
    </ol>
  );
}

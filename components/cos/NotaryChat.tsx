'use client';

import { useState } from "react";
import { MessageSquare, Send, ShieldCheck, Database, CheckCircle2 } from "lucide-react";

export default function NotaryChat() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<{role: 'user' | 'notary', text: string}[]>([
    { role: 'notary', text: "I am the cryptographic notary. How can I assist you with verifying capability evidence?" }
  ]);
  const [isTyping, setIsTyping] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    setMessages(prev => [...prev, { role: 'user', text: input }]);
    setInput("");
    setIsTyping(true);

    setTimeout(() => {
      setMessages(prev => [...prev, { 
        role: 'notary', 
        text: "I have verified the chain. The execution lineage is intact and cryptographically bound to the reported outcome." 
      }]);
      setIsTyping(false);
    }, 1500);
  };

  return (
    <div className="bg-cos-bg border border-cos-border rounded-xl shadow-[inset_0_4px_24px_rgba(0,0,0,0.6)] flex flex-col h-[500px]">
      <div className="border-b border-cos-border p-4 flex items-center gap-3">
        <div className="p-2 bg-cos-accent/10 border border-cos-accent/30 rounded-lg text-cos-accent">
          <Database className="size-4" />
        </div>
        <div>
          <h2 className="text-sm font-black text-cos-text flex items-center gap-2 uppercase tracking-tight">
            Notary Chat
          </h2>
          <p className="text-[10px] font-mono text-cos-muted uppercase tracking-widest">
            Cryptographic evidence assistant
          </p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-5 space-y-4">
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] rounded-xl p-3 text-xs font-mono uppercase tracking-wider leading-relaxed ${
              msg.role === 'user' 
                ? 'bg-cos-surface border border-cos-border text-cos-text' 
                : 'bg-cos-verified/10 border border-cos-verified/30 text-cos-verified'
            }`}>
              {msg.role === 'notary' && (
                <div className="flex items-center gap-1.5 mb-1 text-[9px] font-black opacity-80">
                  <ShieldCheck className="size-3" /> NOTARY NODE
                </div>
              )}
              {msg.text}
            </div>
          </div>
        ))}
        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-cos-verified/5 border border-cos-verified/20 text-cos-verified max-w-[80%] rounded-xl p-3 text-xs font-mono uppercase tracking-wider flex items-center gap-2">
              <span className="animate-pulse">VERIFYING LEDGER STATE...</span>
            </div>
          </div>
        )}
      </div>

      <div className="p-4 border-t border-cos-border bg-cos-surface">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <input 
            type="text" 
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Ask the notary to verify an event ID or hash..."
            className="flex-1 bg-cos-bg border border-cos-border rounded-lg px-4 py-2.5 text-xs font-mono text-cos-text outline-none focus:border-cos-accent"
          />
          <button 
            type="submit"
            disabled={!input.trim() || isTyping}
            className="bg-cos-accent/10 hover:bg-cos-accent/20 border border-cos-accent/30 text-cos-accent px-4 py-2.5 rounded-lg transition-colors cursor-pointer disabled:opacity-50 flex items-center justify-center"
          >
            <Send className="size-4" />
          </button>
        </form>
      </div>
    </div>
  );
}

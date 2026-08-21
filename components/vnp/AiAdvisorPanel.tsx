import React, { useState, useRef, useEffect } from "react";
import { Sparkles, Send, Bot, User, Trash2, Cpu, HelpCircle, Loader2 } from "lucide-react";

interface Message {
  sender: "user" | "bot";
  text: string;
  timestamp: string;
  isSimulated?: boolean;
}

export default function AiAdvisorPanel() {
  const [messages, setMessages] = useState<Message[]>([
    {
      sender: "bot",
      text: "👋 Salutations! I am the **VNP Core Consensus AI Advisor**, processing questions using low-latency queries powered by **gemini-3.1-flash-lite**. Ask me any technical questions about the **Veklom Nexus Protocol**, **x402 payment manifests**, or **Kubernetes autoscaling** models!",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const predefinedPrompts = [
    "Explain standard VNP weighting model",
    "How does x402 payment schema align with benchmarks?",
    "What triggers Kubernetes HPA inside distributed clusters?"
  ];

  // Auto scroll to bottom
  const scrollToBottom = () => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const handleSend = async (textToSend: string) => {
    if (!textToSend.trim() || loading) return;
    
    const userMsg: Message = {
      sender: "user",
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const response = await fetch("/api/gemini/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: textToSend })
      });

      if (!response.ok) {
        throw new Error(`HTTP Error: ${response.status}`);
      }

      const data = await response.json();
      
      const botMsg: Message = {
        sender: "bot",
        text: data.text || "I was unable to compile the answer. Please check your prompt parameters.",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isSimulated: data.isSimulated
      };

      setMessages(prev => [...prev, botMsg]);
    } catch (error: any) {
      console.error("AI chat error: ", error);
      const botMsg: Message = {
        sender: "bot",
        text: `⚠️ **VNP Service Error:** Failed to execute query. Reasons: ${error.message || "Express server offline."}. Please ensure your \`GEMINI_API_KEY\` is configured.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, botMsg]);
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setMessages([
      {
        sender: "bot",
        text: "System diagnostics flushed. Ask me anything about VNP API performance metric benchmarks!",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ]);
  };

  return (
    <div id="vnp-chat-advisor-root" className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-[480px]">
      {/* Prompt helpers */}
      <div className="lg:col-span-1 bg-slate-900/60 backdrop-blur border border-slate-800 rounded-xl p-5 flex flex-col justify-between">
        <div className="space-y-4">
          <h4 className="text-xs font-semibold uppercase text-slate-400 tracking-wider flex items-center gap-1.5">
            <HelpCircle className="w-4 h-4 text-emerald-400 animate-pulse" /> Query Guide
          </h4>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            Quickly trigger predefined standard inquiries regarding the M2M marketplace standards by clicking any item below:
          </p>

          <div className="flex flex-col gap-2">
            {predefinedPrompts.map((p, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleSend(p)}
                className="w-full text-left p-2.5 rounded-lg text-[10px] bg-slate-800/40 border border-slate-700/55 hover:border-emerald-500/45 hover:bg-slate-800/80 hover:text-emerald-300 text-slate-300 transition duration-150"
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        <div className="bg-slate-950/80 p-3 rounded-lg border border-slate-800/30 flex items-center gap-2 text-[10px] text-slate-400 mt-4">
          <Cpu className="w-4 h-4 text-emerald-400 flex-shrink-0" />
          <span>Models prioritized: <strong className="text-slate-200">gemini-3.1-flash-lite</strong> for low-latency.</span>
        </div>
      </div>

      {/* Actual chat screen */}
      <div className="lg:col-span-3 border border-slate-800 bg-slate-950/40 backdrop-blur rounded-xl overflow-hidden flex flex-col h-full">
        {/* Chat Header */}
        <div className="bg-slate-900 border-b border-slate-800 px-5 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
            <span className="text-xs font-semibold text-slate-200">Consensus Leaderboard AI Assessor</span>
            <span className="text-[9px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded uppercase font-mono tracking-widest">Active</span>
          </div>

          <button
            onClick={handleClear}
            className="p-1 px-2.5 text-slate-400 hover:text-red-400 bg-slate-800 hover:bg-red-500/10 border border-slate-700 hover:border-red-500/20 rounded text-[11px] flex items-center gap-1 transition"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear console</span>
          </button>
        </div>

        {/* Scrollable messages space */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4 text-xs font-sans">
          {messages.map((m, i) => (
            <div key={i} className={`flex gap-3 max-w-[85%] ${m.sender === "user" ? "ml-auto flex-row-reverse" : ""}`}>
              {/* Profile icon */}
              <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${m.sender === "user" ? "bg-emerald-500/10 border border-emerald-500/30 text-emerald-300" : "bg-blue-500/10 border border-blue-500/30 text-blue-300"}`}>
                {m.sender === "user" ? <User className="w-4.5 h-4.5" /> : <Bot className="w-4.5 h-4.5" />}
              </div>

              {/* Msg Content */}
              <div className="space-y-1">
                <div className={`p-4.5 rounded-2xl leading-relaxed whitespace-pre-line text-[12px] shadow-sm ${
                  m.sender === "user"
                    ? "bg-emerald-500/15 border border-emerald-500/35 text-slate-100 rounded-tr-none" 
                    : "bg-slate-900 border border-slate-800 text-slate-100 rounded-tl-none"
                }`}>
                  {m.text}
                  {m.isSimulated && (
                    <div className="mt-3.5 pt-2 border-t border-amber-500/20 text-[10px] text-amber-400/80 flex items-center gap-1">
                      <Sparkles className="w-3 h-3 flex-shrink-0" />
                      <span>Fallback parameters loaded (Config simulated). See Settings &gt; Secrets to active real live model.</span>
                    </div>
                  )}
                </div>
                <span className="text-[9px] text-slate-500 block px-1">{m.timestamp}</span>
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex gap-3 max-w-[80%]">
              <div className="w-8 h-8 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-300 flex items-center justify-center flex-shrink-0">
                <Bot className="w-4.5 h-4.5" />
              </div>
              <div className="space-y-1">
                <div className="p-4 bg-slate-900 border border-slate-800 text-slate-400 rounded-2xl rounded-tl-none flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-emerald-400" />
                  <span>Computing latency, aligning consensus vectors...</span>
                </div>
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input box */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend(input);
          }}
          className="border-t border-slate-800 p-3 bg-slate-900 flex items-center gap-2"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={loading}
            placeholder="Type your technical request, e.g. How does VNP avoid double payments?"
            className="flex-1 bg-slate-950 border border-slate-800 hover:border-slate-700 focus:border-emerald-500 focus:outline-none p-2.5 rounded-lg text-slate-200 text-xs transition duration-150"
          />
          <button
            type="submit"
            disabled={!input.trim() || loading}
            className="p-2.5 px-4.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-lg flex items-center gap-1.5 transition duration-150 font-semibold"
          >
            <span>Send</span>
            <Send className="w-3.5 h-3.5" />
          </button>
        </form>
      </div>
    </div>
  );
}

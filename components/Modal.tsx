"use client";

import { ReactNode, useEffect } from "react";
import { X } from "lucide-react";
import clsx from "clsx";

export default function Modal({
  open,
  onClose,
  title,
  subtitle,
  children,
  footer,
  size = "lg",
}: {
  open: boolean;
  onClose: () => void;
  title?: ReactNode;
  subtitle?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  size?: "md" | "lg" | "xl";
}) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    if (open) {
      window.addEventListener("keydown", onKey);
      document.body.style.overflow = "hidden";
    }
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;
  const maxW = size === "xl" ? "max-w-4xl" : size === "lg" ? "max-w-2xl" : "max-w-lg";

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-4 sm:p-8 overflow-y-auto">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm animate-fade-up" onClick={onClose} />
      <div className={clsx("relative w-full card border-border-strong shadow-2xl animate-fade-up", maxW)}>
        <header className="flex items-start gap-3 px-5 py-4 border-b border-border">
          <div className="min-w-0">
            {title && <div className="text-[15px] font-semibold tracking-tight truncate">{title}</div>}
            {subtitle && <div className="text-[12px] text-ink-400 mt-0.5">{subtitle}</div>}
          </div>
          <button
            onClick={onClose}
            className="ml-auto grid place-items-center w-8 h-8 rounded-lg text-ink-400 hover:text-ink-50 hover:bg-white/[0.05] transition shrink-0"
            aria-label="Close"
          >
            <X size={16} />
          </button>
        </header>
        <div className="px-5 py-4 max-h-[70vh] overflow-y-auto scroll-thin">{children}</div>
        {footer && <footer className="flex items-center gap-2 px-5 py-3.5 border-t border-border bg-white/[0.01]">{footer}</footer>}
      </div>
    </div>
  );
}

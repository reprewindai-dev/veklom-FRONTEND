import { ReactNode } from"react";
import { clsx } from"clsx";

interface BadgeProps {
 className?: string;
 children: ReactNode;
}

export function Badge({ className, children }: BadgeProps) {
 return (
 <span
 className={clsx("inline-flex items-center rounded border px-2 py-0.5 text-xs font-semibold",
 className
 )}
 >
 {children}
 </span>
 );
}

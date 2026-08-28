import { ReactNode } from"react";
import { clsx } from"clsx";

interface CardProps { className?: string; children: ReactNode; }
interface CardSectionProps { className?: string; children: ReactNode; }

export function Card({ className, children }: CardProps) {
 return (
 <div className={clsx("rounded-xl border bg-[#0a0a0a]", className)}>
 {children}
 </div>
 );
}

export function CardHeader({ className, children }: CardSectionProps) {
 return (
 <div className={clsx("flex flex-col space-y-1.5 p-6", className)}>
 {children}
 </div>
 );
}

export function CardTitle({ className, children }: CardSectionProps) {
 return (
 <h3 className={clsx("text-lg font-semibold leading-none tracking-tight", className)}>
 {children}
 </h3>
 );
}

export function CardContent({ className, children }: CardSectionProps) {
 return (
 <div className={clsx("p-6 pt-0", className)}>
 {children}
 </div>
 );
}

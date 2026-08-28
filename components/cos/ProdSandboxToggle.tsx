"use client";

export function ProdSandboxToggle({
 sandbox,
 onChange,
}: {
 sandbox: boolean;
 onChange: (sandbox: boolean) => void;
}) {
 const toggleSandbox = () => {
 const nextState = !sandbox;
 onChange(nextState);
 window.localStorage.setItem("veklom.environment", nextState ?"sandbox" :"production");
 window.dispatchEvent(new Event("veklom.environment.changed"));
 };

 return (
 <button
 onClick={toggleSandbox}
 className="rounded-full border border-cos-border bg-cos-surface2/60 px-3 py-2 font-mono text-[10px] uppercase tracking-[0.12em] text-cos-steel transition hover:border-cos-accent/50"
 >
 <span className={sandbox ?"text-cos-warn" :"text-cos-accent"}>
 {sandbox ?"SANDBOX" :"PROD MODE"}
 </span>
 </button>
 );
}

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
    window.localStorage.setItem("veklom.environment", nextState ? "sandbox" : "production");
    window.dispatchEvent(new Event("veklom.environment.changed"));
  };

  return (
    <button
      type="button"
      onClick={toggleSandbox}
      aria-pressed={sandbox}
      className={`rounded-full border px-3 py-2 font-mono text-[10px] uppercase tracking-[0.12em] transition ${sandbox ? "border-cos-warn/60 bg-cos-warn/15 text-cos-warn hover:border-cos-warn" : "border-cos-border bg-cos-surface2/60 text-cos-steel hover:border-cos-accent/50"}`}
    >
      <span className={sandbox ? "text-cos-warn" : "text-cos-accent"}>
        {sandbox ? "SANDBOX" : "PROD MODE"}
      </span>
    </button>
  );
}

"use client";

import { useState } from"react";
import Link from"next/link";
import { useRouter } from"next/navigation";
import { useAuth } from"@/lib/auth-context";
import { Button, ErrorBox, SuccessBox, GithubButton } from"@/components/ui";
import { AuthLayout } from"@/components/AuthLayout";

const MIN_PW = 8;

export default function SignupPage() {
 const { signup, loginWithGithub } = useAuth();
 const router = useRouter();
 const [email, setEmail] = useState("");
 const [pw, setPw] = useState("");
 const [name, setName] = useState("");
 const [busy, setBusy] = useState(false);
 const [err, setErr] = useState<string | undefined>();
 const [ok, setOk] = useState<string | undefined>();
 
 // Acceptance states
 const [agreedTerms, setAgreedTerms] = useState(false);
 const [agreedPrivacy, setAgreedPrivacy] = useState(false);
 const [agreedAUP, setAgreedAUP] = useState(false);
 const [agreedGithubLink, setAgreedGithubLink] = useState(false);
 const [agreedGithubNoBlankCheck, setAgreedGithubNoBlankCheck] = useState(false);
 const [agreedDeviceFlow, setAgreedDeviceFlow] = useState(false);

 const pwTooShort = pw.length > 0 && pw.length < MIN_PW;
 
 const allAccepted = agreedTerms && agreedPrivacy && agreedAUP && agreedGithubLink && agreedGithubNoBlankCheck && agreedDeviceFlow;

 function handleGithub() {
 if (!allAccepted) {
 setErr("Please accept all required agreements below.");
 return;
 }
 loginWithGithub();
 }

 async function onSubmit(e: React.FormEvent) {
 e.preventDefault();
 setErr(undefined); setOk(undefined);
 if (!allAccepted) {
 setErr("Please accept all required agreements below.");
 return;
 }
 if (pw.length < MIN_PW) {
 setErr(`Password must be at least ${MIN_PW} characters.`);
 return;
 }
 setBusy(true);
 try {
 await fetch("/api/auth/acceptance", {
 method: "POST",
 headers: { "Content-Type": "application/json" },
 body: JSON.stringify({
 document_version: "2026-08-28",
 acceptance_source: "signup_form"
 })
 }).catch(console.error);

 const { autoSignedIn } = await signup(email, pw, name || undefined);
 if (autoSignedIn) {
 setOk("Account created. Taking you to your workspace onboarding...");
 router.replace("/os/onboarding");
 } else {
 setOk("Account created. Please sign in to continue.");
 setTimeout(() => router.replace("/login"), 1400);
 }
 } catch (e) {
 setErr((e as Error).message);
 setBusy(false);
 }
 }

 return (
 <AuthLayout
 eyebrow="14-day free trial"
 title="Create your account"
 subtitle="Spin up a governed AI workspace in minutes. No credit card required to start."
 >
 {err && <ErrorBox message={err} className="mb-4" />}
 
 <div className="space-y-3 mb-6 p-4 border border-border rounded bg-surface/50 text-xs text-ink-400">
 <p className="font-semibold text-ink">Required Agreements & Acknowledgements</p>
 
 <label className="flex items-start gap-2 cursor-pointer">
 <input type="checkbox" checked={agreedTerms} onChange={(e) => setAgreedTerms(e.target.checked)} className="mt-0.5 rounded border-border text-brand-400 focus:ring-brand-400/20 bg-transparent" />
 <span>I agree to the <Link href="/terms" className="text-brand-400 hover:underline" target="_blank">Terms of Service</Link>.</span>
 </label>
 
 <label className="flex items-start gap-2 cursor-pointer">
 <input type="checkbox" checked={agreedPrivacy} onChange={(e) => setAgreedPrivacy(e.target.checked)} className="mt-0.5 rounded border-border text-brand-400 focus:ring-brand-400/20 bg-transparent" />
 <span>I acknowledge the <Link href="/privacy" className="text-brand-400 hover:underline" target="_blank">Privacy Policy</Link>.</span>
 </label>
 
 <label className="flex items-start gap-2 cursor-pointer">
 <input type="checkbox" checked={agreedAUP} onChange={(e) => setAgreedAUP(e.target.checked)} className="mt-0.5 rounded border-border text-brand-400 focus:ring-brand-400/20 bg-transparent" />
 <span>I agree to the <Link href="/acceptable-use" className="text-brand-400 hover:underline" target="_blank">Acceptable Use Policy</Link>.</span>
 </label>

 <div className="pt-2 border-t border-border/50 space-y-3">
 <p className="font-semibold text-ink">GitHub Authorization Boundaries</p>
 <label className="flex items-start gap-2 cursor-pointer">
 <input type="checkbox" checked={agreedGithubLink} onChange={(e) => setAgreedGithubLink(e.target.checked)} className="mt-0.5 rounded border-border text-brand-400 focus:ring-brand-400/20 bg-transparent" />
 <span>I understand that GitHub authorization links my GitHub identity and repository installation to Veklom.</span>
 </label>
 
 <label className="flex items-start gap-2 cursor-pointer">
 <input type="checkbox" checked={agreedGithubNoBlankCheck} onChange={(e) => setAgreedGithubNoBlankCheck(e.target.checked)} className="mt-0.5 rounded border-border text-brand-400 focus:ring-brand-400/20 bg-transparent" />
 <span>I understand GitHub access is not blank-check execution authority.</span>
 </label>

 <label className="flex items-start gap-2 cursor-pointer">
 <input type="checkbox" checked={agreedDeviceFlow} onChange={(e) => setAgreedDeviceFlow(e.target.checked)} className="mt-0.5 rounded border-border text-brand-400 focus:ring-brand-400/20 bg-transparent" />
 <span>I acknowledge: Device Flow authorizes GitHub identity/access only. It does not authorize consequence-bearing machine actions without Veklom governance.</span>
 </label>
 </div>
 </div>

 <GithubButton onClick={handleGithub} label="Sign up with GitHub" disabled={busy} className={!allAccepted ? "opacity-50" : ""} />

 <div className="my-5 flex items-center gap-3 text-[11px] uppercase tracking-widest text-ink-600">
 <span className="h-px flex-1 bg-border" />
 or with email
 <span className="h-px flex-1 bg-border" />
 </div>

 <form onSubmit={onSubmit} className="space-y-4">
 <div>
 <label className="text-xs text-ink-400">Name</label>
 <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ada Lovelace" className="input mt-1.5" />
 </div>
 <div>
 <label className="text-xs text-ink-400">Work email</label>
 <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@company.com" className="input mt-1.5" />
 </div>
 <div>
 <label className="text-xs text-ink-400">Password</label>
 <input type="password" required value={pw} onChange={(e) => setPw(e.target.value)} placeholder="At least 8 characters" className="input mt-1.5" />
 <div className="mt-1.5 text-[11px]">
 <span className={pwTooShort ?"text-accent-amber" :"text-ink-600"}>
 {pwTooShort ? `${MIN_PW - pw.length} more character${MIN_PW - pw.length === 1 ?"" :"s"} needed` : `Minimum ${MIN_PW} characters`}
 </span>
 </div>
 </div>
 {ok && <SuccessBox message={ok} />}
 <Button type="submit" loading={busy} disabled={!!ok || !allAccepted} className="w-full">
 {busy ? "Creating..." : "Create account"}
 </Button>
 </form>

 <p className="text-xs text-ink-400 mt-6 text-center">
 Already have an account? <Link href="/login" className="text-brand-400 hover:underline">Sign in</Link>
 </p>
 </AuthLayout>
 );
}

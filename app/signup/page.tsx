"use client";

import { useEffect, useState } from"react";
import Link from"next/link";
import { useAuth } from"@/lib/auth-context";
import { FUNNEL_RETURN_TO, safeRelativePath } from"@/lib/funnel";
import { Button, ErrorBox, SuccessBox, GithubButton } from"@/components/ui";
import { AuthLayout } from"@/components/AuthLayout";
import { track, trackGithubSignupClicked } from"@/lib/analytics/tracker";

const MIN_PW = 8;

export default function SignupPage() {
 const { signup, loginWithGithub } = useAuth();
 // Where the new account lands after verification + sign-in. Only a same-origin
 // relative path is accepted; default is VLink, the first point of access.
 const [returnTo, setReturnTo] = useState(FUNNEL_RETURN_TO);
 useEffect(() => {
 setReturnTo(safeRelativePath(new URL(window.location.href).searchParams.get("returnTo")));
 }, []);
 const loginHref = `/login?returnTo=${encodeURIComponent(returnTo)}`;
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
 trackGithubSignupClicked(allAccepted);
 if (!allAccepted) {
 setErr("Please accept all required agreements below.");
 return;
 }
 // A returnTo in the page URL is forwarded as next=; otherwise VLink.
 loginWithGithub(returnTo);
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
 track("signup_submitted");
 try {
 // Terms acceptance is recorded server-side. A failure is not fatal to the
 // account, but it is never hidden: the operator is told it was not recorded.
 let acceptanceRecorded = false;
 try {
 const acceptanceRes = await fetch("/api/auth/acceptance", {
 method: "POST",
 headers: { "Content-Type": "application/json" },
 body: JSON.stringify({
 document_version: "2026-08-28",
 acceptance_source: "signup_form"
 })
 });
 acceptanceRecorded = acceptanceRes.ok;
 if (!acceptanceRes.ok) console.error("Acceptance not recorded", acceptanceRes.status);
 } catch (cause) {
 console.error("Acceptance not recorded", cause);
 }

 // LockerPhycer never auto-signs-in email accounts and blocks password
 // login until the address is verified, so the next step is the inbox.
 await signup(email, pw, name || undefined);
 setOk(
 "Check your email and open the verification link (it expires in 30 minutes). Sign-in is refused until the address is verified." +
 (acceptanceRecorded ? "" : " Note: your agreement acceptance could not be recorded; you may be asked to accept again at sign-in.")
 );
 setBusy(false);
 } catch (e) {
 setErr((e as Error).message);
 setBusy(false);
 }
 }

 return (
 <AuthLayout
 eyebrow="Capability OS"
 title="Create your account"
 subtitle="Create your operator account, verify your email, then connect your first system with VLink."
 >
 {err && <ErrorBox message={err} className="mb-4" />}
 
 <div data-analytics-form="signup" className="space-y-3 mb-6 p-4 border border-border rounded bg-surface/50 text-xs text-ink-400">
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

 <GithubButton onClick={handleGithub} label="Sign up with GitHub" disabled={busy || !allAccepted} />

 <div className="my-5 flex items-center gap-3 text-[11px] uppercase tracking-widest text-ink-600">
 <span className="h-px flex-1 bg-border" />
 or with email
 <span className="h-px flex-1 bg-border" />
 </div>

 <form onSubmit={onSubmit} data-analytics-form="signup" className="space-y-4">
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
 Already have an account? <Link href={loginHref} className="text-brand-400 hover:underline">Sign in</Link>
 </p>
 </AuthLayout>
 );
}

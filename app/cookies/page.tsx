import { PolicyPage } from "@/components/brand/PolicyPage";

export const metadata = { title: "Cookies & Sessions | Veklom" };

export default function Page() {
  return (
    <PolicyPage
      eyebrow="Legal & trust"
      title="Sessions exist to prove presence, not widen authority."
      intro="Veklom uses a small set of session and security cookies for authentication, OAuth integrity and protected navigation. The hard authorization decision remains with the backend and Veklom's authorization layer; a browser cookie is not a capability grant."
      sections={[
        {
          title: "Backend session cookies",
          items: [
            "veklom_session — HttpOnly, Secure, SameSite=Lax session token set after password or GitHub sign-in; expires after 7 days.",
            "veklom_github_token — short-lived (60 seconds) Secure, SameSite=Lax cookie that hands the session to the web app after GitHub sign-in.",
          ],
        },
        {
          title: "Navigation marker",
          body: "The frontend may use a `veklom.session` presence marker after local token login so top-level browser navigation can reach an authenticated surface, and the web app may keep a copy of the session token in browser storage. Middleware treats the marker only as a presence signal; backend validation still decides whether the session is legitimate.",
        },
        {
          title: "OAuth integrity",
          body: "GitHub sign-in uses a signed, time-limited OAuth state value to bind the authorization response to the flow that initiated it, and only same-site return paths are accepted, to prevent state substitution or open-redirect behavior.",
        },
        {
          title: "Optional analytics",
          body: "The site includes support for Google Analytics, which sets analytics cookies only after you opt in and stays off when your browser sends a Global Privacy Control signal. Advertising storage and personalization are always denied. You can change your choice at veklom.com/privacy-choices. See the Privacy Policy at veklom.com/privacy for more.",
        },
      ]}
      note="Cookie presence is never treated as permission to spend money, mutate repositories, change infrastructure or perform another consequence. Session authentication and consequence authority remain separate boundaries."
    />
  );
}

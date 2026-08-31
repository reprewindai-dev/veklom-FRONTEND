import { PolicyPage } from "@/components/brand/PolicyPage";

export const metadata = { title: "Cookies & Sessions | Veklom" };

export default function Page() {
  return (
    <PolicyPage
      eyebrow="Legal & trust"
      title="Sessions exist to prove presence, not widen authority."
      intro="Veklom uses a small set of session and security cookies for authentication, OAuth integrity and protected navigation. The hard authorization decision remains with the backend and CAPPO; a browser cookie is not a capability grant."
      sections={[
        {
          title: "Backend session cookies",
          items: [
            "access_token — HttpOnly backend-issued session token used after authenticated flows such as GitHub OAuth.",
            "refresh_token — HttpOnly backend-issued token used to continue an authenticated session according to backend policy.",
          ],
        },
        {
          title: "Navigation marker",
          body: "The frontend may use a `veklom.session` presence marker after local token login so top-level browser navigation can reach an authenticated surface. Middleware treats this only as a presence signal; backend validation still decides whether the session is legitimate.",
        },
        {
          title: "OAuth integrity",
          body: "Short-lived OAuth state/return-path cookies may be used to bind a GitHub authorization response to the browser flow that initiated it and to prevent state substitution or open-redirect behavior.",
        },
        {
          title: "Non-essential tracking",
          body: "This notice does not authorize hidden advertising or analytics cookies. If non-essential analytics or marketing technologies are introduced later, their use and consent requirements should be disclosed separately before deployment.",
        },
      ]}
      note="Cookie presence is never treated as permission to spend money, mutate repositories, change infrastructure or perform another consequence. Session authentication and consequence authority remain separate boundaries."
    />
  );
}

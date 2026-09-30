// Operator-scoped LockerPhycer routes proxied from the control plane: the
// workspace wallet, commercial entitlements and the Stripe top-up checkout.
// They are forwarded only with the operator's own bearer.

const OPERATOR_LOCKER_PREFIXES = ["/api/v1/wallet", "/api/v1/entitlements"];
const OPERATOR_LOCKER_EXACT = new Set(["/api/v1/billing/checkout", "/api/v1/billing/checkout/"]);

export function isOperatorLockerPath(path: string): boolean {
  return (
    OPERATOR_LOCKER_EXACT.has(path) ||
    OPERATOR_LOCKER_PREFIXES.some((prefix) => path === prefix || path.startsWith(`${prefix}/`))
  );
}

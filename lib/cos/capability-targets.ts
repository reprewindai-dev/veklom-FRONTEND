export const KNOWN_TARGET_REFS: Record<string, string> = {
  // Mirrors CAPPO GOVERNED_COUNTER_PACKAGE / GovernedCounterAdapter.ref in cappo_backend/capability_mount/service.py|effects.py.
  "veklom.governed-counter@v1": "activation.governed-counter",
};

export function targetRefFor(packageRef: string): string | undefined {
  return KNOWN_TARGET_REFS[packageRef];
}

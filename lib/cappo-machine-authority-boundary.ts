export const CAPPO_MACHINE_AUTHORITY_HEADERS = [
  "workload-identity",
  "execution-context",
  "workload-proof",
  "veklom-authority",
] as const;

/**
 * Browser/session authentication establishes who is asking. It never lets a
 * caller provide CAPPO's machine-authority chain. Those artifacts must come
 * from the trusted server-side authority issuer.
 */
export function stripUntrustedMachineAuthority(headers: Headers): Headers {
  for (const header of CAPPO_MACHINE_AUTHORITY_HEADERS) {
    headers.delete(header);
  }
  return headers;
}

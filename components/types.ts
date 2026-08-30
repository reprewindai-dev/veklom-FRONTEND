/**
 * Compatibility surface for the UACP presentation components.
 *
 * The canonical shared interfaces already live in `components/terminal/types`.
 * Several older UACP components import `../types`; keep that import path as a
 * thin re-export instead of duplicating or weakening the contracts.
 */
export * from "./terminal/types";

export type { QuantumAgentTrustScore as AgentTrustScore } from "./terminal/types";

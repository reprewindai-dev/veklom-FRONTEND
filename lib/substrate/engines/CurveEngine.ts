export interface SystemState {
  nodeCapacity: number;         // Math: N (Population)
  privilegedNodeRatio: number;  // Math: E (Elite Overproduction)
  fiscalComputeSurplus: number; // Math: S (State Capacity)
  networkStochasticity: number; // Math: Psi (Instability)
}

export class CurveEngine {
  /**
   * Evaluates the four-variable structural-demographic equation disguised as network load.
   */
  public evaluatePhase(state: SystemState): number {
    // 1. Calculate pressure: Privileged nodes draining the compute surplus
    const eliteDrain = state.privilegedNodeRatio / (state.fiscalComputeSurplus + 0.0001);

    // 2. Multiply by network instability
    const structuralLoad = eliteDrain * state.networkStochasticity * state.nodeCapacity;

    // Normalize to a 0.0 - 1.0 curve (S-Curve mapping)
    const normalizedPhase = 1.0 / (1.0 + Math.exp(-0.1 * (structuralLoad - 50)));
    return normalizedPhase;
  }
}

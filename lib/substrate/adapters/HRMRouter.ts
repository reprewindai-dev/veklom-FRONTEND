import { CurveEngine, SystemState } from '../engines/CurveEngine';
import { KalmanFilter } from '../engines/KalmanFilter';
import { Tier3SovereignNode } from '../sovereign/Tier3SovereignNode';

export enum ReasoningTier {
  HEURISTIC_L1 = 'L1_FAST_PATTERN_MATCH',
  SYNTHESIS_L2 = 'L2_DEEP_ANALYTICS',
  SOVEREIGN_L3 = 'L3_STRATEGIC_EXECUTION'
}

export interface RoutingDecision {
  truePhase: number;
  tier: number;
  mode: string;
  chunks?: number;
  latency?: number;
}

export class HRMRouter {
  private tier3: Tier3SovereignNode;
  private curveEngine: CurveEngine;
  private filter: KalmanFilter;

  // The Goldilocks Threshold (SEKED / Phase Shift)
  private readonly GOLDILOCKS_THRESHOLD = 0.88;

  constructor() {
    this.tier3 = new Tier3SovereignNode();
    this.curveEngine = new CurveEngine();
    this.filter = new KalmanFilter(0.1);
  }

  public routeCognitiveLoad(rawState: SystemState, targetDistanceKm: number, volume: number): RoutingDecision {
    // 1. Calculate raw phase based on hidden mathematical models
    const rawPhase = this.curveEngine.evaluatePhase(rawState);

    // 2. Filter out Brownian market chaos to find true structural phase
    const truePhase = this.filter.filter(rawPhase);

    // 3. Hierarchical Topology Routing
    if (truePhase < 0.60) {
      return { truePhase, tier: 1, mode: 'HEURISTIC (Expansion)' };
    } else if (truePhase >= 0.60 && truePhase < this.GOLDILOCKS_THRESHOLD) {
      return { truePhase, tier: 2, mode: 'SYNTHESIS (Stagflation)' };
    } else {
      const dispatch = this.tier3.executeDispatch(targetDistanceKm, volume);
      return { truePhase, tier: 3, mode: 'SOVEREIGN (Crisis Threshold)', chunks: dispatch.chunks, latency: dispatch.latency };
    }
  }
}

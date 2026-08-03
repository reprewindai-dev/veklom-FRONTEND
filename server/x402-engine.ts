import { EvaporatingCapabilityLease, X402Offer } from '../types';

// In-memory active lease store
const activeLeasesStore = new Map<string, EvaporatingCapabilityLease>();

// Initial seed mock leases for demonstration
const SEED_LEASE_1: EvaporatingCapabilityLease = {
  leaseId: 'lease_x402_01_a9f8',
  skillId: 'euc-ast-security-probing-01',
  token: 'tok_x402_euc_rar_88910a',
  agentIdentity: 'devin-autonomous-agent-01',
  humanOwner: 'reprewindai@gmail.com',
  issuedAt: new Date(Date.now() - 60 * 1000).toISOString(),
  expiresAt: new Date(Date.now() + 240 * 1000).toISOString(),
  remainingSeconds: 240,
  invocationsRemaining: 8,
  maxInvocations: 10,
  pricePaidUsdc: 0.0028,
  rarGrantScope: 'rar:euc-ast-security-probing-01:execute',
  status: 'ACTIVE'
};

const SEED_LEASE_2: EvaporatingCapabilityLease = {
  leaseId: 'lease_x402_02_b721',
  skillId: 'euc-refactor-ast-transformer',
  token: 'tok_x402_euc_rar_11029c',
  agentIdentity: 'antigravity-deepmind-agent',
  humanOwner: 'architect@veklom.io',
  issuedAt: new Date(Date.now() - 310 * 1000).toISOString(),
  expiresAt: new Date(Date.now() - 10 * 1000).toISOString(),
  remainingSeconds: 0,
  invocationsRemaining: 0,
  maxInvocations: 5,
  pricePaidUsdc: 0.0035,
  rarGrantScope: 'rar:euc-refactor-ast-transformer:execute',
  status: 'EXPIRED_EVAPORATED'
};

activeLeasesStore.set(SEED_LEASE_1.token, SEED_LEASE_1);
activeLeasesStore.set(SEED_LEASE_2.token, SEED_LEASE_2);

/**
 * Calculate dynamic X402 price using bonding curve:
 * P(t) = P_base * (1 + alpha * ln(N(t) + 1)) * e^(beta * U(t))
 */
export function calculateBondingCurvePrice(
  basePriceUsdc: number = 0.0025,
  concurrentAgents: number = 14,
  resourceLoadPercent: number = 42
): { calculatedPriceUsdc: number; priceMicros: number; metrics: any } {
  const alpha = 0.15;
  const beta = 0.012;
  const N_t = concurrentAgents;
  const U_t = resourceLoadPercent;

  const demandMultiplier = 1 + alpha * Math.log(N_t + 1);
  const resourceMultiplier = Math.exp(beta * U_t);

  const calculatedPriceUsdc = Number((basePriceUsdc * demandMultiplier * resourceMultiplier).toFixed(6));
  const priceMicros = Math.round(calculatedPriceUsdc * 1_000_000);

  return {
    calculatedPriceUsdc,
    priceMicros,
    metrics: {
      basePrice: basePriceUsdc,
      concurrentAgentsDemand: N_t,
      resourceLoadPercent: U_t,
      calculatedPriceUsdc
    }
  };
}

/**
 * Generate HTTP 402 Payment Required Offer for an EUC skill
 */
export function generateX402Offer(
  skillId: string,
  basePriceUsdc: number = 0.0025,
  concurrentAgents: number = 18,
  resourceLoadPercent: number = 45
): X402Offer {
  const { calculatedPriceUsdc, priceMicros, metrics } = calculateBondingCurvePrice(
    basePriceUsdc,
    concurrentAgents,
    resourceLoadPercent
  );

  const alphaNode = Number((calculatedPriceUsdc * 0.70).toFixed(6));
  const betaProtocol = Number((calculatedPriceUsdc * 0.15).toFixed(6));
  const gammaCreator = Number((calculatedPriceUsdc * 0.15).toFixed(6));

  return {
    status: 402,
    message: 'Payment Required for Capability Execution',
    skillId,
    priceUsdc: calculatedPriceUsdc,
    priceMicros,
    destinationWallet: 'sol_veklom_x402_master_8820x992a',
    ttlSeconds: 300,
    rarScopes: {
      actions: ['execute', 'inspect', 'stream_logs'],
      resources: [`euc:skill:${skillId}`],
      leaseType: 'EVAPORATING_TIME_LEASE',
      maxInvocations: 10
    },
    bondingCurveMetrics: metrics,
    revenueSplitUsdc: {
      nodeOperatorAlpha: alphaNode,
      veklomProtocolBeta: betaProtocol,
      eccCreatorRoyaltyGamma: gammaCreator
    },
    settlementOptions: {
      solanaPayUrl: `solana:sol_veklom_x402_master_8820x992a?amount=${calculatedPriceUsdc}&label=Veklom%20cAPI%20Lease&memo=skill_${skillId}`,
      basePayUrl: `ethereum:0x981A7210bcD9802B1931881?value=${priceMicros}`,
      httpSignatureSupport: true
    },
    timestamp: new Date().toISOString()
  };
}

/**
 * Verify payment proof & issue ephemeral evaporating capability token
 */
export function verifyAndIssueLease(
  skillId: string,
  agentIdentity: string = 'autonomous-agent-01',
  humanOwner: string = 'reprewindai@gmail.com',
  ttlSeconds: number = 300,
  maxInvocations: number = 10,
  paymentProof?: string
): EvaporatingCapabilityLease {
  const { calculatedPriceUsdc } = calculateBondingCurvePrice(0.0025, 12, 38);
  const now = Date.now();
  const expiresAtMs = now + ttlSeconds * 1000;
  const token = `tok_x402_euc_rar_${Math.random().toString(36).substring(2, 10)}`;
  const leaseId = `lease_x402_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 6)}`;

  const lease: EvaporatingCapabilityLease = {
    leaseId,
    skillId,
    token,
    agentIdentity,
    humanOwner,
    issuedAt: new Date(now).toISOString(),
    expiresAt: new Date(expiresAtMs).toISOString(),
    remainingSeconds: ttlSeconds,
    invocationsRemaining: maxInvocations,
    maxInvocations,
    pricePaidUsdc: calculatedPriceUsdc,
    rarGrantScope: `rar:${skillId}:execute`,
    status: 'ACTIVE'
  };

  activeLeasesStore.set(token, lease);
  return lease;
}

/**
 * Verify if an evaporating lease token is valid, active, and has remaining uses
 */
export function verifyLeaseToken(token: string): { valid: boolean; lease?: EvaporatingCapabilityLease; error?: string } {
  const lease = activeLeasesStore.get(token);
  if (!lease) {
    return { valid: false, error: 'X402 Ephemeral Token Not Found or Invalid' };
  }

  const now = Date.now();
  const expiresMs = new Date(lease.expiresAt).getTime();

  if (now > expiresMs || lease.invocationsRemaining <= 0 || lease.status !== 'ACTIVE') {
    lease.status = 'EXPIRED_EVAPORATED';
    lease.remainingSeconds = 0;
    lease.invocationsRemaining = 0;
    return { valid: false, lease, error: 'Capability Lease Has Expired / Evaporated. Re-purchase required via X402 offer.' };
  }

  // Decrement invocation counter
  lease.invocationsRemaining -= 1;
  lease.remainingSeconds = Math.max(0, Math.floor((expiresMs - now) / 1000));

  if (lease.invocationsRemaining === 0) {
    lease.status = 'EXPIRED_EVAPORATED';
  }

  return { valid: true, lease };
}

/**
 * Get all active and recently evaporated leases with live updated TTLs
 */
export function listActiveLeases(): EvaporatingCapabilityLease[] {
  const now = Date.now();
  const leasesList: EvaporatingCapabilityLease[] = [];

  for (const [token, lease] of activeLeasesStore.entries()) {
    const expiresMs = new Date(lease.expiresAt).getTime();
    if (now > expiresMs && lease.status === 'ACTIVE') {
      lease.status = 'EXPIRED_EVAPORATED';
      lease.remainingSeconds = 0;
    } else if (lease.status === 'ACTIVE') {
      lease.remainingSeconds = Math.max(0, Math.floor((expiresMs - now) / 1000));
    }
    leasesList.push(lease);
  }

  return leasesList;
}

/**
 * Force eviction of a lease
 */
export function evictLease(leaseId: string): boolean {
  for (const [token, lease] of activeLeasesStore.entries()) {
    if (lease.leaseId === leaseId) {
      lease.status = 'EVICTED';
      lease.remainingSeconds = 0;
      lease.invocationsRemaining = 0;
      return true;
    }
  }
  return false;
}

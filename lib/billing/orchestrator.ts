import crypto from "crypto";
import {
  PlanTier,
  VEKLOM_PLANS,
  CREDIT_EXCHANGE_RATE,
  CREDITS_PER_USD,
  ActionCategory,
  ACTION_CREDIT_SCHEDULE,
  UnifiedBillingIdentity,
  WorkspaceEntitlement,
  CreditLedgerEntry,
  X402SettlementRequest,
  OutboundX402SpendRequest,
  OutboundX402SpendResult,
  WalletType,
} from "./types";

export class BillingOrchestrator {
  private identities: Map<string, UnifiedBillingIdentity> = new Map(); // workspaceId -> Identity
  private walletToWorkspace: Map<string, string> = new Map(); // walletAddress (lowercase) -> workspaceId
  private stripeCustomerToWorkspace: Map<string, string> = new Map(); // stripeCustomerId -> workspaceId
  private vlinkToWorkspace: Map<string, string> = new Map(); // vlinkId -> workspaceId

  private entitlements: Map<string, WorkspaceEntitlement> = new Map(); // workspaceId -> Entitlement
  private ledger: Map<string, CreditLedgerEntry[]> = new Map(); // workspaceId -> Entries

  private processedWebhookEvents: Set<string> = new Set();
  private processedX402Hashes: Set<string> = new Set();
  private processedSpendIdempotencyKeys: Set<string> = new Set();

  private treasuryAddress: string = "0x742d35Cc6634C0532925a3b844Bc454e4438f44e"; // Veklom Treasury on Base
  private stripeWebhookSecret: string = "whsec_veklom_canary_secret_key_v1";

  // Provider allowlist for Team tier outbound x402
  private allowedOutboundProviders: Set<string> = new Set([
    "browserbase",
    "anchor",
    "e2b",
    "mcp-gateway",
    "anthropic",
    "openai",
  ]);

  constructor(treasuryAddress?: string, webhookSecret?: string) {
    if (treasuryAddress) this.treasuryAddress = treasuryAddress;
    if (webhookSecret) this.stripeWebhookSecret = webhookSecret;
  }

  // ---------------------------------------------------------------------------
  // 1. Identity & Wallet Binding
  // ---------------------------------------------------------------------------

  public provisionWalletOnSignup(params: {
    workspaceId: string;
    vlinkId: string;
    isMachine?: boolean;
    existingWalletAddress?: string;
  }): UnifiedBillingIdentity {
    const isMachine = !!params.isMachine;
    let walletAddress: string;
    let walletType: WalletType;

    if (params.existingWalletAddress) {
      walletAddress = params.existingWalletAddress.toLowerCase();
      walletType = "connected_external";
    } else {
      // Deterministic / CDP smart wallet generation
      const seed = crypto
        .createHash("sha256")
        .update(`${params.workspaceId}:${params.vlinkId}:${isMachine ? "agentic" : "smart"}`)
        .digest("hex");
      walletAddress = "0x" + seed.slice(0, 40).toLowerCase();
      walletType = isMachine ? "cdp_agentic" : "cdp_embedded_smart";
    }

    const now = new Date().toISOString();
    const identity: UnifiedBillingIdentity = {
      workspaceId: params.workspaceId,
      vlinkId: params.vlinkId,
      walletAddress,
      walletType,
      isMachine,
      createdAt: now,
      updatedAt: now,
    };

    this.identities.set(params.workspaceId, identity);
    this.walletToWorkspace.set(walletAddress, params.workspaceId);
    this.vlinkToWorkspace.set(params.vlinkId, params.workspaceId);

    // Initialize Default Workspace Entitlement (Free Tier)
    if (!this.entitlements.has(params.workspaceId)) {
      this.initWorkspace(params.workspaceId, "free", identity);
    }

    return identity;
  }

  public resolveIdentity(identifier: {
    workspaceId?: string;
    walletAddress?: string;
    vlinkId?: string;
    stripeCustomerId?: string;
  }): UnifiedBillingIdentity | undefined {
    let wsId = identifier.workspaceId;
    if (!wsId && identifier.walletAddress) {
      wsId = this.walletToWorkspace.get(identifier.walletAddress.toLowerCase());
    }
    if (!wsId && identifier.vlinkId) {
      wsId = this.vlinkToWorkspace.get(identifier.vlinkId);
    }
    if (!wsId && identifier.stripeCustomerId) {
      wsId = this.stripeCustomerToWorkspace.get(identifier.stripeCustomerId);
    }
    if (!wsId) return undefined;
    return this.identities.get(wsId);
  }

  public bindStripeCustomer(workspaceId: string, stripeCustomerId: string): void {
    const identity = this.identities.get(workspaceId);
    if (identity) {
      identity.stripeCustomerId = stripeCustomerId;
      identity.updatedAt = new Date().toISOString();
    }
    this.stripeCustomerToWorkspace.set(stripeCustomerId, workspaceId);

    const entitlement = this.entitlements.get(workspaceId);
    if (entitlement) {
      entitlement.stripeCustomerId = stripeCustomerId;
      entitlement.updatedAt = new Date().toISOString();
    }
  }

  // ---------------------------------------------------------------------------
  // 2. Workspace Initialization & Entitlement Management
  // ---------------------------------------------------------------------------

  public initWorkspace(
    workspaceId: string,
    plan: PlanTier,
    identity?: UnifiedBillingIdentity
  ): WorkspaceEntitlement {
    const planCfg = VEKLOM_PLANS[plan];
    const now = new Date();
    const cycleStart = now.toISOString();
    const cycleEnd = new Date(now.getTime() + 30 * 24 * 3600 * 1000).toISOString();

    const entitlement: WorkspaceEntitlement = {
      workspaceId,
      plan,
      status: "active",
      currentBillingPeriodStart: cycleStart,
      currentBillingPeriodEnd: cycleEnd,
      monthlyCreditsGranted: planCfg.monthlyCredits > 0 ? planCfg.monthlyCredits : 0,
      monthlyCreditsUsed: 0,
      topupCreditsBalance: 0,
      totalCreditsRemaining: planCfg.monthlyCredits > 0 ? planCfg.monthlyCredits : 0,
      stripeCustomerId: identity?.stripeCustomerId,
      stripeSubscriptionId: identity?.stripeSubscriptionId,
      walletAddress: identity?.walletAddress,
      vlinkId: identity?.vlinkId,
      updatedAt: cycleStart,
    };

    this.entitlements.set(workspaceId, entitlement);
    this.ledger.set(workspaceId, []);

    // Record initial grant
    this.recordLedgerEntry({
      workspaceId,
      type: "grant",
      credits: entitlement.monthlyCreditsGranted,
      monthlyDebit: 0,
      topupDebit: 0,
      balanceAfter: entitlement.totalCreditsRemaining,
      settlementRail: "off_chain_ledger",
      description: `Initial ${planCfg.name} plan monthly credit grant (${entitlement.monthlyCreditsGranted} credits)`,
    });

    return entitlement;
  }

  public getEntitlement(workspaceId: string): WorkspaceEntitlement {
    const ent = this.entitlements.get(workspaceId);
    if (!ent) {
      throw new Error(`WORKSPACE_NOT_FOUND: Workspace ${workspaceId} has no entitlement record.`);
    }
    return ent;
  }

  // ---------------------------------------------------------------------------
  // 3. Off-Chain Credit Ledger: Debits & Ceiling Enforcement
  // ---------------------------------------------------------------------------

  public debitCredits(params: {
    workspaceId: string;
    actionCategory: ActionCategory;
    customCredits?: number;
    description: string;
    isDiscovery?: boolean;
    isRead?: boolean;
  }): {
    success: boolean;
    creditsDeducted: number;
    monthlyUsed: number;
    topupRemaining: number;
    totalRemaining: number;
    evidenceHash: string;
    ceilingReached?: boolean;
  } {
    const ent = this.getEntitlement(params.workspaceId);
    let requiredCredits =
      params.customCredits ?? ACTION_CREDIT_SCHEDULE[params.actionCategory];

    // Discovery requests are UNLIMITED and free across all tiers
    if (params.isDiscovery) {
      const hash = this.generateEvidenceHash(params.workspaceId, 0, "discovery");
      return {
        success: true,
        creditsDeducted: 0,
        monthlyUsed: ent.monthlyCreditsUsed,
        topupRemaining: ent.topupCreditsBalance,
        totalRemaining: ent.totalCreditsRemaining,
        evidenceHash: hash,
        ceilingReached: ent.plan === "free" && ent.monthlyCreditsUsed >= 400,
      };
    }

    const isReadAction = params.isRead || params.actionCategory === "verification_read";

    // Check Free tier hard ceiling
    if (ent.plan === "free") {
      if (ent.monthlyCreditsUsed >= 400) {
        if (!isReadAction) {
          throw new Error(
            "CEILING_REACHED: Free tier monthly credit limit (400/400) reached. " +
              "Governed actions stopped. Discovery and reads continue. Upgrade prompt displayed."
          );
        }
        // Permitted reads post-ceiling continue at 0 cost
        const entry = this.recordLedgerEntry({
          workspaceId: params.workspaceId,
          type: "debit",
          actionCategory: params.actionCategory,
          credits: 0,
          monthlyDebit: 0,
          topupDebit: 0,
          balanceAfter: 0,
          settlementRail: "off_chain_ledger",
          description: params.description || "Verification read (post-ceiling permitted free read)",
        });
        return {
          success: true,
          creditsDeducted: 0,
          monthlyUsed: ent.monthlyCreditsUsed,
          topupRemaining: ent.topupCreditsBalance,
          totalRemaining: ent.totalCreditsRemaining,
          evidenceHash: entry.evidenceHash,
          ceilingReached: true,
        };
      }

      // Check if this debit would exceed 400
      if (ent.monthlyCreditsUsed + requiredCredits > 400) {
        if (!isReadAction) {
          throw new Error(
            `CEILING_REACHED: Action requires ${requiredCredits} credits, but Free tier only has ` +
              `${400 - ent.monthlyCreditsUsed} remaining out of 400. Governed actions stopped.`
          );
        }
        requiredCredits = 400 - ent.monthlyCreditsUsed;
      }
    }

    // Check total remaining balance
    if (ent.totalCreditsRemaining < requiredCredits) {
      throw new Error(
        `INSUFFICIENT_CREDITS: Required ${requiredCredits} credits, but workspace only has ${ent.totalCreditsRemaining} credits available.`
      );
    }

    // Priority consumption: Monthly credits first, then top-ups
    const monthlyRemaining = Math.max(0, ent.monthlyCreditsGranted - ent.monthlyCreditsUsed);
    let monthlyDebit = 0;
    let topupDebit = 0;

    if (monthlyRemaining >= requiredCredits) {
      monthlyDebit = requiredCredits;
    } else {
      monthlyDebit = monthlyRemaining;
      topupDebit = requiredCredits - monthlyRemaining;
    }

    ent.monthlyCreditsUsed += monthlyDebit;
    ent.topupCreditsBalance -= topupDebit;
    ent.totalCreditsRemaining =
      Math.max(0, ent.monthlyCreditsGranted - ent.monthlyCreditsUsed) +
      ent.topupCreditsBalance;
    ent.updatedAt = new Date().toISOString();

    const entry = this.recordLedgerEntry({
      workspaceId: params.workspaceId,
      type: "debit",
      actionCategory: params.actionCategory,
      credits: requiredCredits,
      monthlyDebit,
      topupDebit,
      balanceAfter: ent.totalCreditsRemaining,
      settlementRail: "off_chain_ledger",
      description: params.description,
    });

    return {
      success: true,
      creditsDeducted: requiredCredits,
      monthlyUsed: ent.monthlyCreditsUsed,
      topupRemaining: ent.topupCreditsBalance,
      totalRemaining: ent.totalCreditsRemaining,
      evidenceHash: entry.evidenceHash,
      ceilingReached: ent.plan === "free" && ent.monthlyCreditsUsed >= 400,
    };
  }

  // ---------------------------------------------------------------------------
  // 4. Inbound x402 Base/USDC Settlement Rail
  // ---------------------------------------------------------------------------

  public settleInboundX402(request: X402SettlementRequest): {
    success: boolean;
    creditsAdded: number;
    newTopupBalance: number;
    newTotalCredits: number;
    settlementReference: string;
    evidenceHash: string;
  } {
    const normHash = request.txHash.toLowerCase().trim();

    // Replay Attack Protection
    if (this.processedX402Hashes.has(normHash)) {
      throw new Error(
        `SETTLEMENT_REPLAY_DENIED: Transaction hash ${request.txHash} has already been settled. Replay denied.`
      );
    }

    if (request.network !== "base" && request.network !== "base-sepolia") {
      throw new Error(`UNSUPPORTED_NETWORK: Settlement rail requires Base. Got: ${request.network}`);
    }
    if (request.asset !== "USDC") {
      throw new Error(`UNSUPPORTED_ASSET: Settlement requires USDC. Got: ${request.asset}`);
    }
    if (request.amountUsdc <= 0) {
      throw new Error("INVALID_AMOUNT: Amount must be greater than zero.");
    }

    const ent = this.getEntitlement(request.workspaceId);

    if (ent.plan === "free" && request.purpose === "credit_topup") {
      throw new Error("TOP_UPS_PROHIBITED_ON_FREE: Free tier cannot top up. Upgrade to Pro/Team.");
    }

    let creditsAdded: number;
    let entryType: "grant" | "topup" = "topup";

    if (request.purpose === "machine_subscription") {
      const targetPlan = request.targetPlan || "team";
      const planCfg = VEKLOM_PLANS[targetPlan];
      if (request.amountUsdc < planCfg.priceMonthlyUsd) {
        throw new Error(
          `INSUFFICIENT_FUNDS: Subscription requires $${planCfg.priceMonthlyUsd}, got $${request.amountUsdc}`
        );
      }
      this.upgradePlan(request.workspaceId, targetPlan, `x402_${normHash.slice(0, 16)}`);
      creditsAdded = planCfg.monthlyCredits;
      entryType = "grant";
    } else {
      creditsAdded = Math.round(request.amountUsdc * CREDITS_PER_USD);
      ent.topupCreditsBalance += creditsAdded;
      ent.totalCreditsRemaining =
        Math.max(0, ent.monthlyCreditsGranted - ent.monthlyCreditsUsed) +
        ent.topupCreditsBalance;
      ent.updatedAt = new Date().toISOString();
    }

    this.processedX402Hashes.add(normHash);

    const entry = this.recordLedgerEntry({
      workspaceId: request.workspaceId,
      type: entryType,
      credits: creditsAdded,
      monthlyDebit: 0,
      topupDebit: 0,
      balanceAfter: ent.totalCreditsRemaining,
      settlementRail: "x402_base_usdc",
      settlementReference: request.txHash,
      description: `Inbound x402 settlement of $${request.amountUsdc} USDC (${creditsAdded} credits)`,
    });

    return {
      success: true,
      creditsAdded,
      newTopupBalance: ent.topupCreditsBalance,
      newTotalCredits: ent.totalCreditsRemaining,
      settlementReference: request.txHash,
      evidenceHash: entry.evidenceHash,
    };
  }

  // ---------------------------------------------------------------------------
  // 5. Stripe Webhook Entitlement Synchronization
  // ---------------------------------------------------------------------------

  public processStripeWebhook(params: {
    rawPayload: string;
    signatureHeader: string;
    event: { id: string; type: string; data: { object: any } };
  }): {
    processed: boolean;
    duplicate: boolean;
    actionTaken: string;
  } {
    this.verifyStripeSignature(params.rawPayload, params.signatureHeader);

    const eventId = params.event.id;
    if (this.processedWebhookEvents.has(eventId)) {
      return {
        processed: false,
        duplicate: true,
        actionTaken: `Event ${eventId} already processed. Idempotent no-op.`,
      };
    }

    const eventType = params.event.type;
    const obj = params.event.data.object;
    let actionTaken = "UNHANDLED_EVENT_TYPE";

    if (eventType === "checkout.session.completed") {
      const metadata = obj.metadata || {};
      const workspaceId =
        metadata.workspace_id ||
        obj.client_reference_id ||
        this.stripeCustomerToWorkspace.get(obj.customer);
      const plan = (metadata.plan || "pro").toLowerCase() as PlanTier;

      if (workspaceId) {
        if (obj.customer) this.bindStripeCustomer(workspaceId, obj.customer);
        this.upgradePlan(workspaceId, plan, obj.subscription);
        actionTaken = `UPGRADED_WORKSPACE_${workspaceId}_TO_${plan.toUpperCase()}`;
      }
    } else if (eventType === "invoice.paid" || eventType === "invoice.payment_succeeded") {
      const customer = obj.customer;
      const workspaceId = this.stripeCustomerToWorkspace.get(customer);

      if (workspaceId) {
        const ent = this.getEntitlement(workspaceId);
        const planCfg = VEKLOM_PLANS[ent.plan];

        ent.monthlyCreditsGranted = planCfg.monthlyCredits;
        ent.monthlyCreditsUsed = 0;
        ent.totalCreditsRemaining = ent.monthlyCreditsGranted + ent.topupCreditsBalance;
        ent.status = "active";
        ent.updatedAt = new Date().toISOString();

        this.recordLedgerEntry({
          workspaceId,
          type: "grant",
          credits: ent.monthlyCreditsGranted,
          monthlyDebit: 0,
          topupDebit: 0,
          balanceAfter: ent.totalCreditsRemaining,
          settlementRail: "stripe_fiat",
          settlementReference: obj.id,
          description: `Monthly renewal: granted ${ent.monthlyCreditsGranted} credits for ${planCfg.name} plan`,
        });
        actionTaken = `RENEWED_MONTHLY_CREDITS_FOR_${workspaceId}`;
      }
    } else if (eventType === "customer.subscription.updated") {
      const customer = obj.customer;
      const workspaceId = this.stripeCustomerToWorkspace.get(customer);

      if (workspaceId) {
        const metadataPlan = obj.metadata?.plan?.toLowerCase();
        if (metadataPlan && VEKLOM_PLANS[metadataPlan as PlanTier]) {
          this.upgradePlan(workspaceId, metadataPlan as PlanTier, obj.id);
          actionTaken = `UPDATED_WORKSPACE_${workspaceId}_PLAN_TO_${metadataPlan.toUpperCase()}`;
        } else if (obj.cancel_at_period_end) {
          actionTaken = `MARKED_SUBSCRIPTION_CANCEL_AT_PERIOD_END_FOR_${workspaceId}`;
        } else if (obj.status === "past_due") {
          const ent = this.getEntitlement(workspaceId);
          ent.status = "past_due";
          actionTaken = `MARKED_${workspaceId}_PAST_DUE`;
        }
      }
    } else if (eventType === "customer.subscription.deleted") {
      const customer = obj.customer;
      const workspaceId = this.stripeCustomerToWorkspace.get(customer);

      if (workspaceId) {
        const ent = this.getEntitlement(workspaceId);
        ent.plan = "free";
        ent.monthlyCreditsGranted = 400;
        ent.monthlyCreditsUsed = 0;
        ent.totalCreditsRemaining = 400 + ent.topupCreditsBalance;
        ent.status = "canceled";
        ent.updatedAt = new Date().toISOString();

        this.recordLedgerEntry({
          workspaceId,
          type: "grant",
          credits: 400,
          monthlyDebit: 0,
          topupDebit: 0,
          balanceAfter: ent.totalCreditsRemaining,
          settlementRail: "stripe_fiat",
          settlementReference: obj.id,
          description: "Subscription canceled: downgraded to Free tier (400 credits/mo)",
        });
        actionTaken = `DOWNGRADED_${workspaceId}_TO_FREE`;
      }
    } else if (eventType === "invoice.payment_failed") {
      const customer = obj.customer;
      const workspaceId = this.stripeCustomerToWorkspace.get(customer);
      if (workspaceId) {
        const ent = this.getEntitlement(workspaceId);
        ent.status = "past_due";
        ent.updatedAt = new Date().toISOString();
        actionTaken = `MARKED_${workspaceId}_PAST_DUE`;
      }
    }

    this.processedWebhookEvents.add(eventId);
    return {
      processed: true,
      duplicate: false,
      actionTaken,
    };
  }

  private verifyStripeSignature(rawPayload: string, signatureHeader: string): void {
    if (!signatureHeader) {
      throw new Error("STRIPE_SIGNATURE_MISSING: Missing Stripe signature header.");
    }

    const parts = signatureHeader.split(",");
    let timestamp = "";
    let signature = "";

    for (const part of parts) {
      const [k, v] = part.split("=");
      if (k.trim() === "t") timestamp = v.trim();
      if (k.trim() === "v1") signature = v.trim();
    }

    if (!timestamp || !signature) {
      throw new Error("STRIPE_SIGNATURE_INVALID: Malformed stripe-signature header.");
    }

    const signedPayload = `${timestamp}.${rawPayload}`;
    const expectedSig = crypto
      .createHmac("sha256", this.stripeWebhookSecret)
      .update(signedPayload)
      .digest("hex");

    if (expectedSig !== signature) {
      throw new Error("STRIPE_SIGNATURE_MISMATCH: Signature verification failed.");
    }
  }

  private upgradePlan(workspaceId: string, newPlan: PlanTier, stripeSubId?: string): void {
    const ent = this.getEntitlement(workspaceId);
    const planCfg = VEKLOM_PLANS[newPlan];

    ent.plan = newPlan;
    ent.status = "active";
    ent.monthlyCreditsGranted = planCfg.monthlyCredits;
    ent.monthlyCreditsUsed = 0; // Fresh monthly grant on upgrade
    ent.totalCreditsRemaining = ent.monthlyCreditsGranted + ent.topupCreditsBalance;
    if (stripeSubId) ent.stripeSubscriptionId = stripeSubId;
    ent.updatedAt = new Date().toISOString();

    this.recordLedgerEntry({
      workspaceId,
      type: "grant",
      credits: ent.monthlyCreditsGranted,
      monthlyDebit: 0,
      topupDebit: 0,
      balanceAfter: ent.totalCreditsRemaining,
      settlementRail: stripeSubId && !stripeSubId.startsWith("x402_") ? "stripe_fiat" : "x402_base_usdc",
      settlementReference: stripeSubId,
      description: `Plan upgrade to ${planCfg.name}: granted ${ent.monthlyCreditsGranted} credits`,
    });
  }

  // ---------------------------------------------------------------------------
  // 6. Governed Outbound x402 Spend (CAPPO Authority Fence)
  // ---------------------------------------------------------------------------

  public governOutboundX402Spend(request: OutboundX402SpendRequest): OutboundX402SpendResult {
    const ent = this.getEntitlement(request.workspaceId);
    const providerNorm = request.provider.toLowerCase().trim();

    // 1. Idempotency Check: Replay protection
    if (this.processedSpendIdempotencyKeys.has(request.idempotencyKey)) {
      throw new Error(
        `IDEMPOTENCY_VIOLATION: Spend request ${request.idempotencyKey} has already been processed. Replay denied.`
      );
    }

    // 2. Plan Tier Restrictions
    if (ent.plan === "free") {
      return {
        authorized: false,
        cappoDecision: "DENY",
        rejectionReason: "OUTBOUND_X402_NOT_AVAILABLE: Free tier does not permit outbound x402 spend.",
        amountSettledUsd: 0,
        evidenceHash: this.generateEvidenceHash(request.workspaceId, 0, "outbound_x402_denied"),
        timestamp: new Date().toISOString(),
      };
    }

    if (ent.plan === "pro") {
      // Pro is sandbox only
      if (!providerNorm.includes("sandbox")) {
        return {
          authorized: false,
          cappoDecision: "DENY",
          rejectionReason:
            "RESTRICTED_TO_SANDBOX: Pro tier outbound x402 is restricted to sandbox providers only. Upgrade to Team for allow-listed production providers.",
          amountSettledUsd: 0,
          evidenceHash: this.generateEvidenceHash(request.workspaceId, 0, "outbound_x402_pro_sandbox_only"),
          timestamp: new Date().toISOString(),
        };
      }
    }

    if (ent.plan === "team") {
      // Team allows allow-listed providers
      if (!this.allowedOutboundProviders.has(providerNorm)) {
        return {
          authorized: false,
          cappoDecision: "DENY",
          rejectionReason: `UNAPPROVED_PROVIDER: Provider '${request.provider}' is not in the Team allowlist.`,
          amountSettledUsd: 0,
          evidenceHash: this.generateEvidenceHash(request.workspaceId, 0, "outbound_x402_unapproved"),
          timestamp: new Date().toISOString(),
        };
      }
    }

    // 3. CAPPO Spending Policy Limit Check (Max $5.00 / action)
    const MAX_SPEND_PER_ACTION = 5.0;
    if (request.amountUsd > MAX_SPEND_PER_ACTION) {
      return {
        authorized: false,
        cappoDecision: "DENY",
        rejectionReason: `POLICY_LIMIT_EXCEEDED: Requested $${request.amountUsd} exceeds max per-action limit of $${MAX_SPEND_PER_ACTION}.`,
        amountSettledUsd: 0,
        evidenceHash: this.generateEvidenceHash(request.workspaceId, 0, "outbound_x402_limit_exceeded"),
        timestamp: new Date().toISOString(),
      };
    }

    // 4. Governance Debit: External Spend Orchestration costs 250 credits
    this.debitCredits({
      workspaceId: request.workspaceId,
      actionCategory: "external_spend_orchestration",
      description: `Governed outbound x402 orchestration to ${request.provider}`,
    });

    // 5. Generate Settled Receipt & Tx Hash
    const receiptId = `rcpt_${crypto.randomUUID()}`;
    const settlementTxHash =
      "0x" +
      crypto
        .createHash("sha256")
        .update(`${request.idempotencyKey}:${providerNorm}:${request.amountUsd}:${Date.now()}`)
        .digest("hex");

    this.processedSpendIdempotencyKeys.add(request.idempotencyKey);

    const evidenceHash = this.generateEvidenceHash(
      request.workspaceId,
      request.amountUsd,
      `outbound_x402_settled:${receiptId}`
    );

    return {
      authorized: true,
      cappoDecision: "ALLOW",
      receiptId,
      settlementTxHash,
      amountSettledUsd: request.amountUsd,
      evidenceHash,
      timestamp: new Date().toISOString(),
    };
  }

  // ---------------------------------------------------------------------------
  // 7. Absolute Invariant Enforcement
  // ---------------------------------------------------------------------------

  public evaluateConsequenceExecution(params: {
    workspaceId: string;
    action: string;
    cappoAuthorized: boolean;
    cappoDenialReason?: string;
  }): {
    permitted: boolean;
    commercialEntitled: boolean;
    governanceAuthorized: boolean;
    verdict: "CONSEQUENCE_EXECUTED" | "BLOCKED_BY_CAPPO_AUTHORITY" | "BLOCKED_BY_COMMERCIAL_ENTITLEMENT";
    reason: string;
    evidenceHash: string;
  } {
    const ent = this.getEntitlement(params.workspaceId);
    const creditsNeeded = ACTION_CREDIT_SCHEDULE.governed_execution; // 25 credits

    const commercialEntitled =
      ent.status === "active" &&
      ent.totalCreditsRemaining >= creditsNeeded &&
      !(ent.plan === "free" && ent.monthlyCreditsUsed >= 400);

    const governanceAuthorized = params.cappoAuthorized;

    if (!governanceAuthorized) {
      const evidenceHash = this.generateEvidenceHash(
        params.workspaceId,
        0,
        `invariant_fail_cappo_denied:${params.action}`
      );
      return {
        permitted: false,
        commercialEntitled,
        governanceAuthorized: false,
        verdict: "BLOCKED_BY_CAPPO_AUTHORITY",
        reason:
          params.cappoDenialReason ||
          "INVARIANT_ENFORCED: Commercial entitlement is valid, but CAPPO denied governance authority. Zero mutation permitted.",
        evidenceHash,
      };
    }

    if (!commercialEntitled) {
      const evidenceHash = this.generateEvidenceHash(
        params.workspaceId,
        0,
        `invariant_fail_commercial_exhausted:${params.action}`
      );
      return {
        permitted: false,
        commercialEntitled: false,
        governanceAuthorized: true,
        verdict: "BLOCKED_BY_COMMERCIAL_ENTITLEMENT",
        reason: "COMMERCIAL_EXHAUSTED: Workspace has insufficient credits or reached tier ceiling.",
        evidenceHash,
      };
    }

    // Both passed: Debit credits and execute
    const debitResult = this.debitCredits({
      workspaceId: params.workspaceId,
      actionCategory: "governed_execution",
      description: `Governed consequence execution: ${params.action}`,
    });

    return {
      permitted: true,
      commercialEntitled: true,
      governanceAuthorized: true,
      verdict: "CONSEQUENCE_EXECUTED",
      reason: "Both commercial entitlement and CAPPO governance authority satisfied.",
      evidenceHash: debitResult.evidenceHash,
    };
  }

  // ---------------------------------------------------------------------------
  // 8. Telemetry & Unit Economics
  // ---------------------------------------------------------------------------

  public getUnitEconomicsTelemetry(workspaceId: string, cogsPerCredit: number = 0.003): {
    workspaceId: string;
    plan: PlanTier;
    monthlyCreditsGranted: number;
    monthlyCreditsUsed: number;
    topupCreditsPurchased: number;
    topupCreditsConsumed: number;
    actualCreditsConsumed: number;
    topupRevenueUsd: number;
    subscriptionRevenueUsd: number;
    totalRevenueUsd: number;
    realCogsUsd: number;
    grossMarginPercent: number;
    breakEvenCostPerCredit: number;
    targetCostPerCredit: number;
    isSustainable: boolean;
  } {
    const ent = this.getEntitlement(workspaceId);
    const planCfg = VEKLOM_PLANS[ent.plan];

    const entries = this.ledger.get(workspaceId) || [];
    let topupCreditsPurchased = 0;
    let topupCreditsConsumed = 0;
    for (const e of entries) {
      if (e.type === "topup") topupCreditsPurchased += e.credits;
      if (e.type === "debit") topupCreditsConsumed += e.topupDebit;
    }

    const actualCreditsConsumed = ent.monthlyCreditsUsed + topupCreditsConsumed;
    const topupRevenueUsd = topupCreditsPurchased * CREDIT_EXCHANGE_RATE;
    const subscriptionRevenueUsd = planCfg.priceMonthlyUsd;
    const totalRevenueUsd = subscriptionRevenueUsd + topupRevenueUsd;

    const fixedWorkspaceCost = ent.plan === "free" ? 0.2 : 5.0; // $5 fixed infra/storage per paid workspace
    const realCogsUsd = cogsPerCredit * actualCreditsConsumed + fixedWorkspaceCost;

    const grossMarginPercent =
      totalRevenueUsd > 0
        ? Math.round(((totalRevenueUsd - realCogsUsd) / totalRevenueUsd) * 1000) / 10
        : 0;

    const breakEvenCostPerCredit =
      ent.monthlyCreditsGranted > 0
        ? Math.round((planCfg.priceMonthlyUsd / ent.monthlyCreditsGranted) * 10000) / 10000
        : 0;

    return {
      workspaceId,
      plan: ent.plan,
      monthlyCreditsGranted: ent.monthlyCreditsGranted,
      monthlyCreditsUsed: ent.monthlyCreditsUsed,
      topupCreditsPurchased,
      topupCreditsConsumed,
      actualCreditsConsumed,
      topupRevenueUsd,
      subscriptionRevenueUsd,
      totalRevenueUsd,
      realCogsUsd: Math.round(realCogsUsd * 100) / 100,
      grossMarginPercent,
      breakEvenCostPerCredit,
      targetCostPerCredit: 0.005, // 0.5c / credit
      isSustainable: cogsPerCredit <= 0.005,
    };
  }

  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------

  public getLedgerEntries(workspaceId: string): CreditLedgerEntry[] {
    return this.ledger.get(workspaceId) || [];
  }

  private recordLedgerEntry(
    entry: Omit<CreditLedgerEntry, "entryId" | "timestamp" | "evidenceHash">
  ): CreditLedgerEntry {
    const entryId = "crd_" + crypto.randomUUID();
    const timestamp = new Date().toISOString();
    const evidenceHash = this.generateEvidenceHash(
      entry.workspaceId,
      entry.credits,
      `${entry.type}:${entry.actionCategory || "grant"}:${entry.balanceAfter}`
    );

    const fullEntry: CreditLedgerEntry = {
      ...entry,
      entryId,
      timestamp,
      evidenceHash,
    };

    const entries = this.ledger.get(entry.workspaceId) || [];
    entries.push(fullEntry);
    this.ledger.set(entry.workspaceId, entries);

    return fullEntry;
  }

  private generateEvidenceHash(workspaceId: string, amount: number, label: string): string {
    return crypto
      .createHash("sha256")
      .update(`${workspaceId}:${amount}:${label}:${Date.now()}`)
      .digest("hex");
  }
}

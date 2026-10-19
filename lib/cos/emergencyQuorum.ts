/**
 * Multi-Party (2-of-3) Emergency Killswitch Quorum
 * 
 * Enforces institutional safety under Law 0:
 * QuorumVerified(Sig_1, Sig_2) ==> Estate Halted, Delta C = 0
 */

export interface Keyholder {
  id: string;
  name: string;
  role: string;
  publicKeyHex: string;
}

export interface HaltSignatureSubmission {
  keyholderId: string;
  signatureHex: string;
  reason: string;
  timestamp: string;
}

export interface QuorumState {
  status: "ACTIVE" | "PENDING_QUORUM" | "HALTED";
  threshold: number;
  totalKeyholders: number;
  signers: string[];
  haltReason?: string;
  haltTimestamp?: string;
}

export class EmergencyQuorumManager {
  private keyholders: Map<string, Keyholder> = new Map();
  private collectedSignatures: Map<string, string> = new Map();
  private status: "ACTIVE" | "PENDING_QUORUM" | "HALTED" = "ACTIVE";
  private haltReason?: string;
  private haltTimestamp?: string;

  constructor(
    private threshold: number = 2,
    private totalRequired: number = 3
  ) {}

  registerKeyholder(keyholder: Keyholder): void {
    if (this.keyholders.size >= this.totalRequired) {
      throw new Error(`Cannot exceed ${this.totalRequired} registered safety keyholders`);
    }
    this.keyholders.set(keyholder.id, keyholder);
  }

  submitHaltSignature(submission: HaltSignatureSubmission): {
    status: string;
    quorumState: QuorumState;
    deltaC: number;
  } {
    // 1. Check if keyholder is recognized
    if (!this.keyholders.has(submission.keyholderId)) {
      return {
        status: "REJECTED_UNKNOWN_KEYHOLDER",
        quorumState: this.getQuorumState(),
        deltaC: 0
      };
    }

    // 2. Prevent duplicate signers
    if (this.collectedSignatures.has(submission.keyholderId)) {
      return {
        status: "REJECTED_DUPLICATE_KEYHOLDER",
        quorumState: this.getQuorumState(),
        deltaC: 0
      };
    }

    // 3. Register signature
    this.collectedSignatures.set(submission.keyholderId, submission.signatureHex);

    // 4. Check threshold
    if (this.collectedSignatures.size < this.threshold) {
      this.status = "PENDING_QUORUM";
      return {
        status: "PENDING_INSUFFICIENT_QUORUM",
        quorumState: this.getQuorumState(),
        deltaC: 0
      };
    }

    // 5. Quorum achieved!
    this.status = "HALTED";
    this.haltReason = submission.reason;
    this.haltTimestamp = new Date().toISOString();

    return {
      status: "EMERGENCY_ESTOP_TRIGGERED",
      quorumState: this.getQuorumState(),
      deltaC: 0
    };
  }

  isHalted(): boolean {
    return this.status === "HALTED";
  }

  getQuorumState(): QuorumState {
    return {
      status: this.status,
      threshold: this.threshold,
      totalKeyholders: this.totalRequired,
      signers: Array.from(this.collectedSignatures.keys()),
      haltReason: this.haltReason,
      haltTimestamp: this.haltTimestamp
    };
  }

  reset(): void {
    this.collectedSignatures.clear();
    this.status = "ACTIVE";
    this.haltReason = undefined;
    this.haltTimestamp = undefined;
  }
}
